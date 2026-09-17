/* screenshots do viewer: sobe o cli com a fixture real em modo live (sessao copiada, tempos
   deslocados para "agora", cortada em N eventos para ter passos rodando), abre chromium headless e
   captura light/dark, gantt e um close do card. uso: node shots.mjs <viewer dir> <fixture> <out dir> */
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
import { spawn } from "node:child_process";
const [VIEWER, FIX, OUT] = process.argv.slice(2);
const PORT = 4611, CDP = 9344, DIR = path.join(os.homedir(), ".claude", "team-view"), SESS = "viewer-shots";
fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const ev = fs.readFileSync(FIX, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
/* corta a run onde ha um passo em execucao: depois do 3o SubagentStart, antes do stop dele */
let cut = ev.length; { let starts = 0; for (let i = 0; i < ev.length; i++) { if (ev[i].ev === "SubagentStart") starts++; if (starts === 4) { cut = i + 25; break; } } }
const part = ev.slice(0, Math.min(cut, ev.length)); const fim = part[part.length - 1].t, agora = Date.now() - 20000;
fs.writeFileSync(path.join(DIR, SESS + ".ndjson"), part.map(e => JSON.stringify({ ...e, t: agora - (fim - e.t) })).join("\n") + "\n");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = u => new Promise((res, rej) => http.get(u, r => { let s = ""; r.on("data", d => s += d); r.on("end", () => { try { res(JSON.parse(s)); } catch (e) { rej(e); } }); }).on("error", rej));
class Cdp { constructor(ws) { this.ws = ws; this.id = 0; this.w = new Map(); ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && this.w.has(m.id)) { this.w.get(m.id)(m); this.w.delete(m.id); } }); }
  send(method, params = {}) { const id = ++this.id; return new Promise(r => { this.w.set(id, r); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async ev(expression) { const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); return r.result?.result?.value; } }
const srv = spawn(process.execPath, [path.join(VIEWER, "cli.mjs"), "--port", String(PORT), "--session", SESS], { stdio: "ignore", detached: true });
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "tv-shots-"));
const chrome = process.env.CHROME || "/opt/pw-browsers/chromium";
const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--window-size=1600,940", "--remote-debugging-port=" + CDP, "--user-data-dir=" + perfil, "about:blank"], { stdio: "ignore", detached: true });
process.on("exit", () => { try { process.kill(-srv.pid); } catch {} try { process.kill(-br.pid); } catch {} try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} });
let alvo = null; for (let i = 0; i < 40 && !alvo; i++) { await sleep(250); try { alvo = ((await getJSON("http://localhost:" + CDP + "/json/list")) || []).find(t => t.type === "page"); } catch {} }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
const cdp = new Cdp(ws); await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 940, deviceScaleFactor: 2, mobile: false });
const shot = async name => { const r = await cdp.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.result.data, "base64")); console.log("→", name); };
await cdp.send("Page.navigate", { url: "http://localhost:" + PORT }); await sleep(7000);
await cdp.ev(`document.body.dataset.theme="light"`); await sleep(400); await shot("ui2-light.png");
await cdp.ev(`document.body.dataset.theme="dark"`); await sleep(400); await shot("ui2-dark.png");
await cdp.ev(`document.body.dataset.theme="light";document.querySelector("#z-focus").click()`); await sleep(1200); await shot("ui2-foco.png");
await cdp.ev(`document.querySelector("#c-gantt").click()`); await sleep(600); await shot("ui2-gantt.png");
await cdp.ev(`document.querySelector("#c-flow").click();document.querySelector("#c-more").click()`); await sleep(300); await shot("ui2-menu.png");
/* close no card: zoom 2x centrado no passo ativo */
await cdp.ev(`(()=>{document.querySelector("#menu").classList.remove("on");const s=(window.tv.steps||[]).find(q=>q.status==="running")||window.tv.steps[1];window.tv.focus&&window.tv.focus(s.x,s.y+60,2.2,true);return s.id})()`); await sleep(1300); await shot("ui2-close.png");
process.exit(0);
