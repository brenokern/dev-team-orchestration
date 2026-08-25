#!/usr/bin/env node
/**
 * team-view emitter — a UNICA porta de escrita do modo visual.
 *
 * Modos:
 *   (sem args)                     hook do Claude Code: le o payload no stdin e
 *                                  faz append de UMA linha NDJSON em
 *                                  ~/.claude/team-view/<session_id>.ndjson
 *   plan <arquivo.json>            publica o plan-graph (Leader chama no passo 0)
 *   gate <id> <waiting|approved> [msg]
 *                                  marca um gate humano; "waiting" dispara
 *                                  notificacao nativa do SO (melhor esforco)
 *
 * Regra de ouro: este script NUNCA falha e NUNCA bloqueia a run.
 * Qualquer erro e engolido e o exit code e sempre 0.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const DIR = path.join(os.homedir(), ".claude", "team-view");
const LATEST = path.join(DIR, "latest");
/* ponteiro POR PROJETO (cwd): 4 runs simultaneas em 4 branches/worktrees nao
   se contaminam — cada Leader/viewer resolve a sessao do SEU diretorio */
const cwdKey = c => { let h = 0; for (const ch of String(c)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h.toString(36); };
const LATEST_OF = c => path.join(DIR, "latest-" + cwdKey(c));

const ensure = () => { try { fs.mkdirSync(DIR, { recursive: true }); } catch {} };
const readLatest = () => {
  try { const s = fs.readFileSync(LATEST_OF(process.cwd()), "utf8").trim(); if (s) return s; } catch {}
  try { return fs.readFileSync(LATEST, "utf8").trim() || null; } catch { return null; }
};
const setLatest = (s, cwd) => {
  try { ensure(); fs.writeFileSync(LATEST, s); if (cwd) fs.writeFileSync(LATEST_OF(cwd), s); } catch {}
};
const append = (session, obj) => {
  try { ensure(); fs.appendFileSync(path.join(DIR, session + ".ndjson"), JSON.stringify(obj) + "\n"); } catch {}
};

/* notificacao nativa, fire-and-forget (toast Windows / osascript mac / notify-send linux) */
function toast(title, msg) {
  try {
    let cmd, args;
    if (process.platform === "win32") {
      const ps = `$null=[Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime];` +
        `$x=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);` +
        `$t=$x.GetElementsByTagName('text');` +
        `$null=$t.Item(0).AppendChild($x.CreateTextNode('${title.replace(/'/g, "")}'));` +
        `$null=$t.Item(1).AppendChild($x.CreateTextNode('${msg.replace(/'/g, "")}'));` +
        `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('team-view').Show([Windows.UI.Notifications.ToastNotification]::new($x))`;
      cmd = "powershell"; args = ["-NoProfile", "-NonInteractive", "-Command", ps];
    } else if (process.platform === "darwin") {
      cmd = "osascript"; args = ["-e", `display notification "${msg.replace(/"/g, "")}" with title "${title.replace(/"/g, "")}" sound name "Glass"`];
    } else {
      cmd = "notify-send"; args = [title, msg];
    }
    const p = spawn(cmd, args, { stdio: "ignore", detached: true });
    p.unref();
  } catch {}
}

/* rotacao: logs de team-view com mais de 30 dias sao removidos quando uma
   run nova publica o plan (ndjson, meta e ponteiros latest-* orfaos) */
function gc() {
  try {
    const cutoff = Date.now() - 30 * 24 * 3600e3;
    for (const f of fs.readdirSync(DIR)) {
      if (f === "latest") continue;
      const full = path.join(DIR, f);
      try { if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full); } catch {}
    }
  } catch {}
}

function summarize(input) {
  if (!input || typeof input !== "object") return "";
  const s = input.file_path || input.command || input.description || input.prompt || input.pattern || "";
  return String(s).replace(/\s+/g, " ").slice(0, 140);
}

async function hookMode() {
  let raw = "";
  try {
    raw = await new Promise((res) => {
      let buf = ""; const to = setTimeout(() => res(buf), 3000);
      process.stdin.on("data", d => buf += d);
      process.stdin.on("end", () => { clearTimeout(to); res(buf); });
      process.stdin.on("error", () => { clearTimeout(to); res(buf); });
    });
  } catch {}
  let p; try { p = JSON.parse(raw); } catch { return; }
  const session = p.session_id; if (!session) return;
  setLatest(session, p.cwd);
  /* ponteiro pro transcript JSONL: e a fonte da verdade que o cli.mjs usa
     na reconciliacao (fecha passos mesmo com SubagentStop perdido) */
  if (p.transcript_path) {
    try { fs.writeFileSync(path.join(DIR, session + ".meta"), JSON.stringify({ transcript: p.transcript_path, cwd: p.cwd || null })); } catch {}
  }
  const e = { t: Date.now(), ev: p.hook_event_name };
  if (p.agent_type) e.agent = p.agent_type;
  if (p.agent_id) e.aid = p.agent_id;
  /* consumo de tokens do subagente: minerado do transcript no encerramento.
     Formato do transcript e interno/instavel — parser estruturado + fallback
     por regex; qualquer falha e silenciosa. */
  if (p.hook_event_name === "SubagentStop") {
    const tp = p.agent_transcript_path || p.transcript_path;
    if (tp) try {
      const txt = fs.readFileSync(tp, "utf8");
      let out = 0, ctx = 0;
      for (const line of txt.split("\n")) {
        if (!line.includes("usage")) continue;
        let u = null;
        try {
          const o = JSON.parse(line);
          u = (o.message && o.message.usage) || o.usage ||
              (o.message && o.message.message && o.message.message.usage) || null;
        } catch {}
        if (!u) { /* fallback: extrai por regex direto da linha */
          const g = re => { const m = line.match(re); return m ? parseInt(m[1], 10) : 0; };
          u = {
            output_tokens: g(/"output_tokens"\s*:\s*(\d+)/),
            input_tokens: g(/"input_tokens"\s*:\s*(\d+)/),
            cache_read_input_tokens: g(/"cache_read_input_tokens"\s*:\s*(\d+)/),
            cache_creation_input_tokens: g(/"cache_creation_input_tokens"\s*:\s*(\d+)/)
          };
        }
        out += u.output_tokens || 0;
        const i = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
        if (i > ctx) ctx = i;
      }
      if (out || ctx) e.tok = ctx + out;
    } catch {}
  }
  if (p.tool_name) e.tool = p.tool_name;
  if (p.tool_input) {
    e.info = summarize(p.tool_input);
    if (p.tool_name === "Task" || p.tool_name === "Agent") {
      e.sub = p.tool_input.subagent_type || "";
      e.info = p.tool_input.description || e.info;
    }
  }
  append(session, e);
}

function cliMode(argv) {
  const session = readLatest();
  if (!session) return; /* nenhuma sessao registrada ainda */
  if (argv[0] === "plan") {
    try {
      const plan = JSON.parse(fs.readFileSync(argv[1], "utf8"));
      append(session, { t: Date.now(), ev: "plan", plan });
    } catch {}
    gc(); /* run nova comecando: hora de limpar logs antigos */
  } else if (argv[0] === "commit") {
    /* commit do passo (diff clicavel no viewer): emit.mjs commit <stepId> <hash> */
    const [, id, hash] = argv;
    if (id && /^[0-9a-f]{7,40}$/i.test(hash || "")) append(session, { t: Date.now(), ev: "commitref", id, hash });
  } else if (argv[0] === "gate") {
    const [, id, status, ...rest] = argv;
    const msg = rest.join(" ");
    append(session, { t: Date.now(), ev: "gate", id, status, msg });
    if (status === "waiting") toast("team-view: precisa de voce", msg || "Volte ao terminal para aprovar o proximo passo.");
  } else if (argv[0] === "skip") {
    /* passo removido na escalacao (o plan NUNCA e re-emitido): emit.mjs skip <stepId> [motivo] */
    const [, id, ...rest] = argv;
    if (id) append(session, { t: Date.now(), ev: "skip", id, msg: rest.join(" ").slice(0, 200) });
  } else if (argv[0] === "note") {
    /* veredito/resumo do Leader p/ o viewer: emit.mjs note <stepId|-> "<texto curto>" */
    const [, id, ...rest] = argv;
    const msg = rest.join(" ").slice(0, 400);
    if (msg) append(session, { t: Date.now(), ev: "note", id: id === "-" ? null : id, msg });
  }
}

try {
  const argv = process.argv.slice(2);
  if (argv.length) cliMode(argv); else await hookMode();
} catch {}
process.exit(0);
