#!/usr/bin/env node
/**
 * team-view cli — serve o viewer e faz tail do log de eventos da sessao.
 *
 *   node cli.mjs [--session <id>] [--port 4517] [--open] [--replay <arquivo>] [--speed 25]
 *
 * Sem --session usa o ponteiro ~/.claude/team-view/latest (a sessao mais recente).
 * O viewer e READ-ONLY: nada aqui inicia, aprova ou reinicia uma run — isso e do terminal.
 * Zero dependencias; Node 18+.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(os.homedir(), ".claude", "team-view");
/* ponteiro por projeto (mesma hash do emit.mjs): o viewer lancado de dentro
   de um repo/worktree segue a run DAQUELE diretorio, nao a mais nova global —
   4 viewers de 4 branches convivem sem roubar a sessao um do outro */
const cwdKey = c => { let h = 0; for (const ch of String(c)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h.toString(36); };
const readPointer = () => {
  try { const s = fs.readFileSync(path.join(DIR, "latest-" + cwdKey(process.cwd())), "utf8").trim(); if (s) return s; } catch {}
  try { return fs.readFileSync(path.join(DIR, "latest"), "utf8").trim() || null; } catch { return null; }
};

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : def;
};
/* flag sem valor ("--port --open") viraria NaN e mataria o server: cai no default */
const num = (v, def) => { const n = parseFloat(v); return Number.isFinite(n) ? n : def; };
const PORT = num(opt("port", "4517"), 4517);
const OPEN = args.includes("--open");
const PINNED = args.includes("--session"); /* sessao fixada a mao: nao re-aponta */
const REPLAY = opt("replay", null);
const SPEED = num(opt("speed", "6"), 6); /* 6x o tempo real: assistivel; suba p/ resumo */

function resolveFile() {
  if (REPLAY) return { file: path.resolve(String(REPLAY)), mode: "replay" };
  let session = opt("session", null);
  if (!session || session === true) session = readPointer();
  if (!session) {
    console.error("team-view: nenhuma sessao encontrada em " + DIR + " (rode o time primeiro, ou use --replay <arquivo>)");
    /* ainda sobe o server: a pagina mostra 'aguardando sessao' e conecta quando o arquivo nascer */
  }
  return { file: session ? path.join(DIR, session + ".ndjson") : null, mode: "live", session };
}
const src = resolveFile();

/* ------- SSE ------- */
const clients = new Set();
function sse(res) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.write(`data: ${JSON.stringify({ type: "hello", mode: src.mode, session: src.session || null })}\n\n`);
  clients.add(res);
  res.on("close", () => clients.delete(res));
  if (src.mode === "replay") { replayTo(res); return; }
  /* catch-up: tudo que ja existe vai num batch (o viewer aplica sem animacao) */
  const lines = readLines();
  res.write(`data: ${JSON.stringify({ type: "batch", events: lines })}\n\n`);
}
const broadcast = obj => { const d = `data: ${JSON.stringify(obj)}\n\n`; for (const c of clients) c.write(d); };
/* keepalive: sem isso o browser derruba o SSE ocioso e o EventSource
   reconecta sozinho — re-tocando o replay/batch por cima do estado */
setInterval(() => { for (const c of clients) { try { c.write(":ping\n\n"); } catch {} } }, 25000);

function readLines() {
  if (!src.file) return [];
  try {
    return fs.readFileSync(src.file, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

async function replayTo(res) {
  const lines = readLines();
  let prev = null;
  for (const e of lines) {
    if (res.destroyed) return;
    const wait = prev ? Math.min(2500, Math.max(60, (e.t - prev) / SPEED)) : 300;
    await new Promise(r => setTimeout(r, wait));
    prev = e.t;
    res.write(`data: ${JSON.stringify({ type: "event", event: e })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
}

/* ------- tail (watch + polling fallback, cobre editores/OS diferentes) ------- */
let offset = 0;
function startTail() {
  if (src.mode !== "live") return;
  const tick = () => {
    if (!src.file) { retarget(); return; }
    /* sessao nova nasceu depois do viewer subir (fluxo run-visual: viewer
       antes do passo 0): re-aponta em vez de ficar preso na run antiga */
    if (!PINNED) {
      const latest = readPointer();
      if (latest && latest !== src.session) {
        src.session = latest; src.file = path.join(DIR, latest + ".ndjson"); offset = 0;
        broadcast({ type: "hello", mode: "live", session: latest });
      }
    }
    let st; try { st = fs.statSync(src.file); } catch { return; }
    if (st.size < offset) offset = 0; /* arquivo truncado/rotacionado */
    if (st.size > offset) {
      const fd = fs.openSync(src.file, "r");
      const buf = Buffer.alloc(st.size - offset);
      fs.readSync(fd, buf, 0, buf.length, offset);
      fs.closeSync(fd);
      offset = st.size;
      for (const l of buf.toString("utf8").split("\n")) {
        if (!l.trim()) continue;
        try { broadcast({ type: "event", event: JSON.parse(l) }); } catch {}
      }
    }
  };
  try { offset = fs.statSync(src.file).size; } catch { offset = 0; }
  setInterval(tick, 300);
}
function retarget() { /* sessao ainda nao existe: adota a do projeto quando nascer */
  const latest = readPointer();
  if (latest) { src.file = path.join(DIR, latest + ".ndjson"); src.session = latest; offset = 0; broadcast({ type: "hello", mode: "live", session: latest }); }
}

/* ------- http ------- */
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/events")) return sse(res);
  const file = path.join(HERE, "index.html");
  try {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(file));
  } catch (e) { res.writeHead(500); res.end("viewer/index.html nao encontrado"); }
});
/* porta ocupada (outro viewer vivo)? tenta as proximas em vez de morrer */
let port = PORT;
server.on("error", e => {
  if (e.code === "EADDRINUSE" && port < PORT + 20) {
    console.log(`team-view: porta ${port} ocupada, tentando ${port + 1}…`);
    port++; setTimeout(() => server.listen(port), 120);
  } else { console.error("team-view: " + e.message); process.exit(1); }
});
server.listen(port, () => {
  const url = `http://localhost:${server.address().port}`;
  console.log(`team-view ${src.mode} em ${url}` + (src.session ? ` (sessao ${src.session.slice(0, 8)})` : ""));
  startTail();
  if (OPEN) {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
    try { spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref(); } catch {}
  }
});
