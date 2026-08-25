#!/usr/bin/env node
/**
 * team-view cli — serve o viewer e faz tail do log de eventos da sessao.
 *
 *   node cli.mjs [--session <id>] [--port 4517] [--open] [--replay <arquivo>] [--speed 25]
 *
 * Sem --session usa o ponteiro por projeto (~/.claude/team-view/latest-<hash do cwd>),
 * caindo para o global (latest). O viewer e READ-ONLY: nada aqui inicia, aprova ou
 * reinicia uma run — isso e do terminal.
 *
 * Endpoints:
 *   /events[?session=<id>&replay=1]  SSE — live com resume via Last-Event-ID, ou
 *                                    replay-batch (o cliente controla o scrubber)
 *   /runs                            indice das runs gravadas (JSON)
 *   /show/<hash>                     git show read-only do commit (diff por passo)
 *
 * Reconciliacao: alem dos hooks (deltas), o server faz poll do TRANSCRIPT JSONL da
 * sessao (ponteiro <session>.meta gravado pelo emit.mjs) e emite eventos "recon" com
 * os Task/Agent ja CONCLUIDOS segundo o transcript — a fonte da verdade. O viewer
 * converge: SubagentStop perdido deixa de travar o plan-graph.
 *
 * Zero dependencias; Node 18+.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(os.homedir(), ".claude", "team-view");
/* ponteiro por projeto (mesma hash do emit.mjs): o viewer lancado de dentro
   de um repo/worktree segue a run DAQUELE diretorio, nao a mais nova global */
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
const SPEED = num(opt("speed", "6"), 6);

function resolveFile() {
  if (REPLAY && REPLAY !== true) return { file: path.resolve(String(REPLAY)), mode: "replay" };
  let session = opt("session", null);
  if (!session || session === true) session = readPointer();
  if (!session) {
    console.error("team-view: nenhuma sessao encontrada em " + DIR + " (rode o time primeiro, ou use --replay <arquivo>)");
    /* ainda sobe o server: a pagina mostra 'aguardando sessao' e conecta quando o arquivo nascer */
  }
  return { file: session ? path.join(DIR, session + ".ndjson") : null, mode: "live", session };
}
const src = resolveFile();

const readLinesOf = file => {
  try {
    return fs.readFileSync(file, "utf8").split("\n").filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
};
const readLines = () => (src.file ? readLinesOf(src.file) : []);

/* ------- SSE ------- */
const clients = new Set();
function frame(res, obj, id) {
  try { res.write((id != null ? "id: " + id + "\n" : "") + "data: " + JSON.stringify(obj) + "\n\n"); } catch {}
}
function sse(req, res) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const q = new URL(req.url, "http://x").searchParams;
  const qSession = q.get("session");
  const qReplay = q.get("replay") === "1";

  /* replay de uma run especifica (historico) ou do arquivo --replay:
     manda TUDO num batch unico — o CLIENTE controla ritmo e scrubber */
  if (qReplay || src.mode === "replay") {
    const file = qSession ? path.join(DIR, qSession + ".ndjson") : src.file;
    frame(res, { type: "hello", mode: "replay", session: qSession || src.session || null, speed: SPEED });
    frame(res, { type: "replay-batch", events: file ? readLinesOf(file) : [] });
    return; /* conexao fica aberta mas inerte; o cliente fecha */
  }

  frame(res, { type: "hello", mode: "live", session: src.session || null, resumable: true });
  clients.add(res);
  res.on("close", () => clients.delete(res));
  /* resume: EventSource reconecta mandando Last-Event-ID (= indice da ultima
     linha aplicada). Se a sessao e a mesma, manda so o que falta — o viewer
     mantem o estado em vez de recarregar a pagina. */
  const lines = readLines();
  const leid = parseInt(req.headers["last-event-id"], 10);
  if (Number.isFinite(leid) && leid >= 0 && leid < lines.length) {
    frame(res, { type: "resume", session: src.session || null });
    for (let i = leid + 1; i < lines.length; i++) frame(res, { type: "event", event: lines[i] }, i);
  } else {
    frame(res, { type: "batch", events: lines }, lines.length - 1);
  }
}
let lineCount = 0; /* linhas ja transmitidas (= proximo id) */
const broadcast = (obj, id) => { for (const c of clients) frame(c, obj, id); };
setInterval(() => { for (const c of clients) { try { c.write(":ping\n\n"); } catch {} } }, 25000);

/* ------- tail (polling, cobre editores/OS diferentes) ------- */
let offset = 0;
function startTail() {
  if (src.mode !== "live") return;
  const sync = () => { const l = readLines(); lineCount = l.length; };
  const tick = () => {
    if (!src.file) { retarget(); return; }
    if (!PINNED) {
      const latest = readPointer();
      if (latest && latest !== src.session) {
        src.session = latest; src.file = path.join(DIR, latest + ".ndjson"); offset = 0; lineCount = 0;
        broadcast({ type: "hello", mode: "live", session: latest, resumable: true });
      }
    }
    let st; try { st = fs.statSync(src.file); } catch { return; }
    if (st.size < offset) { offset = 0; lineCount = 0; } /* truncado/rotacionado */
    if (st.size > offset) {
      const fd = fs.openSync(src.file, "r");
      const buf = Buffer.alloc(st.size - offset);
      fs.readSync(fd, buf, 0, buf.length, offset);
      fs.closeSync(fd);
      offset = st.size;
      for (const l of buf.toString("utf8").split("\n")) {
        if (!l.trim()) continue;
        try { broadcast({ type: "event", event: JSON.parse(l) }, lineCount++); } catch {}
      }
    }
  };
  try { offset = fs.statSync(src.file).size; } catch { offset = 0; }
  sync();
  setInterval(tick, 300);
}
function retarget() { /* sessao ainda nao existe: adota a do projeto quando nascer */
  const latest = readPointer();
  if (latest) { src.file = path.join(DIR, latest + ".ndjson"); src.session = latest; offset = 0; lineCount = 0; broadcast({ type: "hello", mode: "live", session: latest, resumable: true }); }
}

/* ------- reconciliacao via transcript JSONL (a fonte da verdade) -------
   O emit.mjs grava <session>.meta com o transcript_path. A cada 5s, se o
   transcript mudou, extraimos os Task/Agent (tool_use) e quais ja tem
   tool_result (= subagente CONCLUIDO de verdade). O viewer fecha os cards
   correspondentes mesmo que o hook SubagentStop tenha se perdido. */
let tsSize = -1;
function reconTick() {
  if (src.mode !== "live" || !src.session || !clients.size) return;
  let meta; try { meta = JSON.parse(fs.readFileSync(path.join(DIR, src.session + ".meta"), "utf8")); } catch { return; }
  const tp = meta && meta.transcript; if (!tp) return;
  let st; try { st = fs.statSync(tp); } catch { return; }
  if (st.size === tsSize) return;
  tsSize = st.size;
  try {
    const dispatch = {}; /* tool_use_id -> {sub,desc} */
    const done = [];
    for (const line of fs.readFileSync(tp, "utf8").split("\n")) {
      if (!line.includes("tool_use") && !line.includes("toolUseResult")) continue;
      let o; try { o = JSON.parse(line); } catch { continue; }
      const content = o && o.message && o.message.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (c.type === "tool_use" && (c.name === "Task" || c.name === "Agent") && c.input)
          dispatch[c.id] = { sub: c.input.subagent_type || "", desc: c.input.description || "" };
        if (c.type === "tool_result" && dispatch[c.tool_use_id])
          done.push(dispatch[c.tool_use_id]);
      }
    }
    if (done.length) broadcast({ type: "event", event: { t: Date.now(), ev: "recon", done } });
  } catch {}
}
setInterval(reconTick, 5000);

/* ------- http ------- */
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/events")) return sse(req, res);
  if (req.url.startsWith("/runs")) { /* indice das runs gravadas */
    const out = [];
    try {
      for (const f of fs.readdirSync(DIR)) {
        if (!f.endsWith(".ndjson")) continue;
        const full = path.join(DIR, f);
        let st; try { st = fs.statSync(full); } catch { continue; }
        const entry = { session: f.slice(0, -7), mtime: st.mtimeMs, size: st.size, title: null, steps: 0 };
        try { /* primeiro plan do arquivo: titulo + n de passos (le so o inicio) */
          const fd = fs.openSync(full, "r");
          const buf = Buffer.alloc(Math.min(st.size, 262144));
          fs.readSync(fd, buf, 0, buf.length, 0); fs.closeSync(fd);
          for (const l of buf.toString("utf8").split("\n")) {
            if (!l.includes('"ev":"plan"')) continue;
            const o = JSON.parse(l);
            if (o.ev === "plan" && o.plan) { entry.title = o.plan.title || null; entry.steps = (o.plan.steps || []).length; break; }
          }
        } catch {}
        out.push(entry);
      }
    } catch {}
    out.sort((a, b) => b.mtime - a.mtime);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ live: src.session || null, runs: out.slice(0, 50) }));
  }
  if (req.url.startsWith("/show/")) { /* git show read-only: diff por passo */
    const hash = req.url.slice(6).split("?")[0];
    if (!/^[0-9a-f]{7,40}$/i.test(hash)) { res.writeHead(400); return res.end("hash invalido"); }
    return execFile("git", ["show", "--stat", "--patch", "--no-color", hash],
      { cwd: process.cwd(), maxBuffer: 2 * 1024 * 1024, timeout: 8000 }, (err, stdout) => {
        res.writeHead(err ? 404 : 200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(err ? "commit nao encontrado neste repositorio (o viewer roda em " + process.cwd() + ")" : stdout);
      });
  }
  try {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(path.join(HERE, "index.html")));
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
