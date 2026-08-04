#!/usr/bin/env node
/**
 * bench do overhead do plugin — mede o que o team-view CUSTA de maquina.
 *
 *   node viewer/bench.mjs            # sintetico (500 eventos)
 *   node viewer/bench.mjs --real     # + custo de tokens medido das suas runs reais
 *
 * O que mede:
 *  - emit.mjs: tempo de parede por evento (o hook roda 1 processo Node por evento;
 *    e o que o Claude Code espera antes de seguir)
 *  - emit.mjs com mineracao de tokens (SubagentStop le o transcript)
 *  - cli.mjs: RSS e CPU do server durante tail
 *  - tamanho do log por run
 *  - --real: tokens/passo e tokens/run a partir de ~/.claude/team-view/*.ndjson
 */
import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const EMIT = path.join(ROOT, "hooks", "emit.mjs");
const DIR = path.join(os.homedir(), ".claude", "team-view");
const REAL = process.argv.includes("--real");
const N = 200;

const ms = n => n.toFixed(1) + "ms";
const kb = n => (n / 1024).toFixed(1) + " KB";
function stats(a) {
  const s = [...a].sort((x, y) => x - y);
  return { p50: s[Math.floor(s.length * .5)], p95: s[Math.floor(s.length * .95)], max: s[s.length - 1], avg: s.reduce((x, y) => x + y, 0) / s.length };
}

console.log("=== bench do team-view (overhead do plugin) ===\n");

/* ---------- 1) custo por evento do hook ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "tvbench-"));
const env = { ...process.env, HOME: TMP, USERPROFILE: TMP };

const payload = JSON.stringify({
  session_id: "bench", hook_event_name: "PreToolUse", tool_name: "Edit",
  tool_input: { file_path: "apps/frontend/app/(private)/tarefas/page.tsx" },
  agent_id: "a1", agent_type: "dev-team-orchestration:frontend-intern"
});

const t = [];
for (let i = 0; i < N; i++) {
  const t0 = performance.now();
  spawnSync(process.execPath, [EMIT], { input: payload, env, stdio: ["pipe", "ignore", "ignore"] });
  t.push(performance.now() - t0);
}
const st = stats(t);
console.log(`hook por evento (PreToolUse)  p50 ${ms(st.p50)} · p95 ${ms(st.p95)} · max ${ms(st.max)}`);

/* transcript sintetico de 400 chamadas p/ medir a mineracao de tokens */
const tr = path.join(TMP, "tr.jsonl");
fs.writeFileSync(tr, Array.from({ length: 400 }, (_, i) =>
  JSON.stringify({ message: { usage: { input_tokens: 900 + i, cache_read_input_tokens: 30000, output_tokens: 300 } } })).join("\n"));
const stopPayload = JSON.stringify({
  session_id: "bench", hook_event_name: "SubagentStop", agent_id: "a1",
  agent_type: "dev-team-orchestration:frontend-intern", agent_transcript_path: tr
});
const t2 = [];
for (let i = 0; i < 40; i++) {
  const t0 = performance.now();
  spawnSync(process.execPath, [EMIT], { input: stopPayload, env, stdio: ["pipe", "ignore", "ignore"] });
  t2.push(performance.now() - t0);
}
const st2 = stats(t2);
console.log(`hook SubagentStop (mina tokens de transcript de 400 msgs)`);
console.log(`                              p50 ${ms(st2.p50)} · p95 ${ms(st2.p95)} · max ${ms(st2.max)}`);

/* baseline: quanto custa SO subir o Node (piso do mecanismo de hook) */
const t3 = [];
for (let i = 0; i < 40; i++) {
  const t0 = performance.now();
  spawnSync(process.execPath, ["-e", "0"], { stdio: "ignore" });
  t3.push(performance.now() - t0);
}
const st3 = stats(t3);
console.log(`baseline 'node -e 0' (piso)   p50 ${ms(st3.p50)}  <- o hook custa ~o piso do Node`);
console.log(`  => custo REAL do emit.mjs:  ~${ms(Math.max(0, st.p50 - st3.p50))} de logica propria\n`);

/* ---------- 2) tamanho do log ---------- */
const logf = path.join(TMP, ".claude", "team-view", "bench.ndjson");
let sz = 0; try { sz = fs.statSync(logf).size; } catch {}
const per = sz / (N + 40);
console.log(`log NDJSON: ${kb(sz)} para ${N + 40} eventos (~${per.toFixed(0)} B/evento)`);
console.log(`  => run tipica de 2.000 eventos: ~${kb(per * 2000)}\n`);

/* ---------- 3) footprint do server ---------- */
const srv = spawn(process.execPath, [path.join(HERE, "cli.mjs"), "--port", "4899"], { env, stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
let rss = "?", cpu = "?";
try {
  const o = spawnSync("ps", ["-o", "rss=,%cpu=", "-p", String(srv.pid)], { encoding: "utf8" }).stdout.trim().split(/\s+/);
  rss = (parseInt(o[0], 10) / 1024).toFixed(1) + " MB"; cpu = o[1] + "%";
} catch {}
console.log(`viewer/cli.mjs (server)       RSS ${rss} · CPU ${cpu} (idle com tail de 300ms)`);
srv.kill();
fs.rmSync(TMP, { recursive: true, force: true });

/* ---------- 4) custo de TOKENS medido das runs reais ---------- */
if (REAL) {
  console.log("\n=== custo de tokens (medido das suas runs reais) ===");
  let files = [];
  try { files = fs.readdirSync(DIR).filter(f => f.endsWith(".ndjson")).map(f => path.join(DIR, f)); } catch {}
  if (!files.length) { console.log("(nenhum log em " + DIR + ")"); }
  else {
    const rows = [];
    for (const f of files) {
      const ev = fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean);
      if (!ev.length) continue;
      const toks = ev.filter(e => e.ev === "SubagentStop" && e.tok);
      const byRole = {};
      toks.forEach(e => { const r = String(e.agent || "?").split(":").pop(); byRole[r] = (byRole[r] || 0) + e.tok; });
      const total = toks.reduce((a, e) => a + e.tok, 0);
      const dur = (ev[ev.length - 1].t - ev[0].t) / 60000;
      rows.push({ f: path.basename(f).slice(0, 8), passos: toks.length, tools: ev.filter(e => e.ev === "PreToolUse").length, min: dur.toFixed(0), tok: total, byRole });
    }
    rows.sort((a, b) => b.tok - a.tok);
    console.log("\nsessão   passos  tools  min   tokens   tok/passo");
    rows.forEach(r => console.log(
      `${r.f}  ${String(r.passos).padStart(6)} ${String(r.tools).padStart(6)} ${String(r.min).padStart(5)}  ${String((r.tok / 1000).toFixed(1) + "k").padStart(7)}  ${r.passos ? ((r.tok / r.passos / 1000).toFixed(1) + "k") : "-"}`));
    const withTok = rows.filter(r => r.tok > 0);
    if (withTok.length) {
      const agg = {};
      withTok.forEach(r => Object.entries(r.byRole).forEach(([k, v]) => agg[k] = (agg[k] || 0) + v));
      const tot = Object.values(agg).reduce((a, b) => a + b, 0);
      console.log("\ntokens por papel (todas as runs):");
      Object.entries(agg).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
        console.log(`  ${k.padEnd(20)} ${((v / 1000).toFixed(1) + "k").padStart(8)}  ${(v / tot * 100).toFixed(0)}%`));
      console.log(`\n  NOTA: 'tok' = pico de contexto + output por subagente (soma superestima o`);
      console.log(`  custo real, porque cache read domina o input e e cobrado a fracao do preco).`);
    }
  }
}
console.log("\nfeito.");
