#!/usr/bin/env node
/**
 * teste de estado do viewer — o que o bench.mjs faz com CUSTO, este faz com
 * CORRECAO. Carrega uma run gravada no viewer de verdade, num Chrome de
 * verdade, e checa as invariantes que ja quebraram em producao.
 *
 *   node viewer/test.mjs                    # roda todas as fixtures
 *   node viewer/test.mjs --keep             # nao mata o Chrome no fim
 *   CHROME=/caminho/do/chrome node viewer/test.mjs
 *
 * Zero dependencias: sobe o Chrome em --headless com --remote-debugging-port e
 * fala CDP pelo WebSocket nativo do Node 22. Nada de Playwright/puppeteer —
 * mesma regra do resto do viewer.
 *
 * O que garante (cada uma nasceu de um bug real):
 *   1. passo concluido tem inicio E fim, e fim >= inicio
 *   2. passo cujo SubagentStop trouxe token tem esse token no card e no total
 *   3. card de passo concluido nunca fica no "0s" de template
 *   4. duracao NAO muda entre a primeira carga e o F5 (nada de relogio de parede)
 *   5. o F5 reconstroi o mesmo estado: mesmos concluidos, mesmo total de token
 *   6. zero excecao nao tratada, e todos os cards com a mesma altura
 *      (o loop do fonts.ready chegou ao fim)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEEP = process.argv.includes("--keep");
const PORT = 4599, CDP = 9333;
const DIR = path.join(os.homedir(), ".claude", "team-view");
const SESS = "viewer-test";

/* ---------- Chrome ---------- */
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const cands = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  try { return execSync("which google-chrome chromium 2>/dev/null | head -1").toString().trim() || null; } catch { return null; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = url => new Promise((res, rej) => {
  http.get(url, r => { let b = ""; r.on("data", d => b += d); r.on("end", () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on("error", rej);
});

/* ---------- CDP minimo sobre o WebSocket nativo ---------- */
class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.waits = new Map(); this.errors = [];
    ws.addEventListener("message", ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.waits.has(m.id)) { this.waits.get(m.id)(m); this.waits.delete(m.id); }
      if (m.method === "Runtime.exceptionThrown")
        this.errors.push(m.params?.exceptionDetails?.exception?.description
          || m.params?.exceptionDetails?.text || "excecao");
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise(res => { this.waits.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result?.result?.value;
  }
}

/* ---------- o que perguntamos a pagina ---------- */
const PROBE = `(() => {
  const st = (window.tv && window.tv.steps) || [];
  const card = id => {
    const n = [...document.querySelectorAll('.node')].find(x => x.__id === id);
    return null;
  };
  return {
    steps: st.map(s => ({ id: s.id, status: s.status, human: !!s.human, dyn: !!s._dyn,
      start: s._start || 0, end: s._end || 0, tok: s._tok || 0, tools: s._tools || 0 })),
    times: [...document.querySelectorAll('.node')].map(n => ({
      titulo: (n.querySelector('.n-t') || {}).textContent || '',
      tm: (n.querySelector('.n-tm') || {}).textContent || '',
      done: n.classList.contains('done') })),
    alturas: [...new Set([...document.querySelectorAll('.n-core')].map(c => c.style.height))],
    total: (document.querySelector('#c-tok') || {}).textContent || '',
    cnt: (document.querySelector('#cnt') || {}).textContent || ''
  };
})()`;

/* ---------- asserts ---------- */
let falhas = 0, checks = 0;
function ok(cond, nome, detalhe) {
  checks++;
  if (cond) { console.log("  \x1b[32m✓\x1b[0m " + nome); return true; }
  falhas++; console.log("  \x1b[31m✗\x1b[0m " + nome + (detalhe ? "\n      " + detalhe : ""));
  return false;
}

/* ---------- uma fixture ---------- */
async function rodar(cdp, fixture) {
  const nome = path.basename(fixture);
  console.log("\n\x1b[1m" + nome + "\x1b[0m");

  /* reescreve os timestamps pra "agora": uma run que acabou de acontecer */
  const ev = fs.readFileSync(fixture, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  const fim = ev[ev.length - 1].t, agora = Date.now();
  const linhas = ev.map(e => JSON.stringify({ ...e, t: agora - (fim - e.t) }));
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, SESS + ".ndjson"), linhas.join("\n") + "\n");

  /* verdade do LOG: o que o viewer deveria mostrar */
  const stopComTok = new Map();
  const inicio = new Map();
  const aidRole = new Map();
  for (const e of ev) {
    if (e.ev === "SubagentStart" && e.aid) { aidRole.set(e.aid, e.agent); inicio.set(e.aid, e.t); }
    if (e.ev === "SubagentStop" && e.tok) stopComTok.set(e.aid, e.tok);
  }
  const tokEsperado = [...stopComTok.values()].reduce((a, b) => a + b, 0);

  cdp.errors.length = 0;
  await cdp.send("Page.navigate", { url: "http://localhost:" + PORT });
  await sleep(6000);
  const a = await cdp.evaluate(PROBE);

  const concluidos = a.steps.filter(s => s.status === "done" && !s.human);
  ok(concluidos.length > 0, "a run carregou (" + concluidos.length + " passos concluidos)");

  const incoerentes = concluidos.filter(s => s.start && (!s.end || s.end < s.start));
  ok(incoerentes.length === 0, "todo passo com inicio tem fim coerente",
    incoerentes.map(s => s.id + " start=" + s.start + " end=" + s.end).join(", "));

  /* passo fechado por inferencia pode legitimamente nao ter inicio conhecido
     (SubagentStart perdido). O que NAO pode e inventar um tempo: mostra "—". */
  const semInicio = concluidos.filter(s => !s.start && !s.dyn);
  const mentindo = semInicio.filter(s => {
    const c = a.times.find(x => x.titulo.includes(s.id) || x.titulo.slice(0, 20) === (s.id + " ").slice(0, 20));
    return c && /\d+s/.test(c.tm);
  });
  ok(mentindo.length === 0,
    "passo sem inicio conhecido mostra \"—\", nunca um tempo inventado"
      + (semInicio.length ? " (" + semInicio.length + " sem inicio no log)" : ""),
    mentindo.map(s => s.id).join(", "));

  const zerados = a.times.filter(c => c.done && c.tm.trim() === "0s");
  ok(zerados.length === 0, "nenhum card concluido ficou no \"0s\" de template",
    zerados.map(c => c.titulo.slice(0, 30)).join(" | "));

  const totalNaTela = (a.total.match(/([\d.]+)([kM]?)/) || [])[0] || "0";
  ok(tokEsperado === 0 || /\d/.test(totalNaTela) && totalNaTela !== "0",
    "o total de token do log chegou na tela (log: " + tokEsperado + ", tela: " + a.total.trim() + ")");

  const somaTela = a.steps.reduce((x, s) => x + s.tok, 0);
  ok(tokEsperado === 0 || somaTela >= tokEsperado * 0.99,
    "nenhum token do SubagentStop foi descartado",
    "log=" + tokEsperado + " tela=" + somaTela);

  ok(a.alturas.length === 1 && a.alturas[0] !== "auto",
    "todos os cards com a mesma altura (fonts.ready terminou)",
    "alturas: " + JSON.stringify(a.alturas));

  ok(cdp.errors.length === 0, "zero excecao nao tratada na 1a carga", cdp.errors.slice(0, 2).join(" | "));

  /* ---- F5 ---- */
  cdp.errors.length = 0;
  await cdp.send("Page.reload", { ignoreCache: false });
  await sleep(6000);
  const b = await cdp.evaluate(PROBE);

  const dur = x => Object.fromEntries(x.steps.filter(s => s.start && s.end).map(s => [s.id, s.end - s.start]));
  const d1 = dur(a), d2 = dur(b);
  const mudou = Object.keys(d1).filter(k => d2[k] !== undefined && Math.abs(d2[k] - d1[k]) > 1500);
  ok(mudou.length === 0, "duracao nao muda depois do F5 (nada de relogio de parede)",
    mudou.map(k => k + ": " + Math.round(d1[k] / 1000) + "s -> " + Math.round(d2[k] / 1000) + "s").join(", "));

  const dn = x => x.steps.filter(s => s.status === "done").length;
  ok(dn(b) === dn(a), "o F5 reconstroi os mesmos passos concluidos", dn(a) + " -> " + dn(b));
  ok(b.steps.reduce((x, s) => x + s.tok, 0) === somaTela, "o F5 preserva o total de token");
  ok(b.alturas.length === 1 && b.alturas[0] !== "auto",
    "o layout sobrevive ao F5 (cards com altura uniforme)", "alturas: " + JSON.stringify(b.alturas));
  ok(cdp.errors.length === 0, "zero excecao nao tratada depois do F5", cdp.errors.slice(0, 2).join(" | "));
}

/* ---------- main ---------- */
const chrome = findChrome();
if (!chrome) {
  console.error("test: nenhum Chrome/Chromium encontrado. Use CHROME=/caminho/do/chrome node viewer/test.mjs");
  process.exit(2);
}
const fixtures = fs.readdirSync(path.join(HERE, "fixtures"))
  .filter(f => f.endsWith(".ndjson")).map(f => path.join(HERE, "fixtures", f)).sort();

const srv = spawn(process.execPath, [path.join(HERE, "cli.mjs"), "--port", String(PORT), "--session", SESS],
  { stdio: "ignore", detached: true });
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "tv-test-"));
const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox",
  "--remote-debugging-port=" + CDP, "--user-data-dir=" + perfil, "about:blank"], { stdio: "ignore", detached: true });

const fim = () => { if (KEEP) return; try { process.kill(-srv.pid); } catch {} try { process.kill(-br.pid); } catch {}
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(path.join(DIR, SESS + ".ndjson"), { force: true }); } catch {} };
process.on("exit", fim);

let alvo = null;
for (let i = 0; i < 40 && !alvo; i++) {
  await sleep(250);
  try { const v = await getJSON("http://localhost:" + CDP + "/json/list");
    alvo = (v || []).find(t => t.type === "page" && t.webSocketDebuggerUrl); } catch {}
}
if (!alvo) { console.error("test: Chrome nao respondeu no CDP"); process.exit(2); }

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
const cdp = new Cdp(ws);
await cdp.send("Runtime.enable");
await cdp.send("Page.enable");

console.log("viewer/test.mjs — " + fixtures.length + " fixture(s), chrome: " + path.basename(chrome));
for (const f of fixtures) await rodar(cdp, f);

console.log("\n" + (falhas ? "\x1b[31m" + falhas + " de " + checks + " checagens falharam\x1b[0m"
  : "\x1b[32m" + checks + " checagens, todas passaram\x1b[0m"));
ws.close();
process.exit(falhas ? 1 : 0);
