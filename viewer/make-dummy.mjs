#!/usr/bin/env node
/**
 * Gera uma run dummy completa para testar o viewer sem gastar uma run real:
 *
 *   node viewer/make-dummy.mjs            # (re)escreve viewer/fixtures/dummy.ndjson
 *   node viewer/cli.mjs --replay viewer/fixtures/dummy.ndjson --open
 *
 * Cobre TODOS os comportamentos atuais:
 *  - h0 (aprovacao da escalacao) como raiz humana do grafo + fagulha ao aprovar
 *  - plan IMUTAVEL: ajuste da escalacao via skip (opt1 removido)
 *  - extra com PAI RODANDO (drift no meio do s1 -> pendura no s1)
 *  - extra pos-review (fix do frontend pendurado no r2)
 *  - lote paralelo do MESMO papel (f3/f4), papeis paralelos (a1/f1)
 *  - aresta longa a1->q1 (desvio local), notas com badge no card,
 *    tokens nos stops, gates com Stop do leader no meio, infra triste na tv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "fixtures", "dummy.ndjson");

let t = 1700000000000;
const ev = [];
const push = (dt, e) => { t += dt; ev.push({ t, ...e }); };
const NS = "dev-team-orchestration:"; /* agent_type namespaced, como nos hooks reais */

const plan = {
  title: "feature dummy — cards personalizados",
  roster: [
    { id: "data-intern", model: "opus" }, { id: "backend-intern", model: "opus" },
    { id: "ai-intern", model: "opus" }, { id: "frontend-intern", model: "fable" },
    { id: "qa-intern", model: "opus" }, { id: "ux-intern", model: "opus" },
    { id: "reviewer-intern", model: "opus" }, { id: "pr-writer-intern", model: "opus" }
  ],
  steps: [
    { id: "h0", title: "aprovar a escalação do time", layer: "humano", owner: "voce", deps: [], human: true },
    { id: "s1", title: "1. model + migration RLS", layer: "dados", owner: "data-intern", deps: ["h0"] },
    { id: "h1", title: "revisar e aplicar a migration", layer: "humano", owner: "voce", deps: ["s1"], human: true },
    { id: "s2", title: "2. DTOs de cards", layer: "backend", owner: "backend-intern", deps: ["h1"] },
    { id: "s3", title: "3. service + controller", layer: "backend", owner: "backend-intern", deps: ["s2"] },
    { id: "opt1", title: "3b. doc extra do modulo (opcional)", layer: "backend", owner: "backend-intern", deps: ["s3"] },
    { id: "r1", title: "review da camada backend", layer: "review", owner: "reviewer-intern", deps: ["s3"] },
    { id: "a1", title: "4. tool do agente Estag", layer: "ai", owner: "ai-intern", deps: ["r1"] },
    { id: "f1", title: "5. pagina cards", layer: "frontend", owner: "frontend-intern", deps: ["r1"] },
    { id: "f2", title: "6. camada de api + hooks", layer: "frontend", owner: "frontend-intern", deps: ["f1"] },
    { id: "f3", title: "7a. cards-grid (paralelo)", layer: "frontend", owner: "frontend-intern", deps: ["f2"] },
    { id: "f4", title: "7b. cards-editor (paralelo)", layer: "frontend", owner: "frontend-intern", deps: ["f2"] },
    { id: "r2", title: "review da camada frontend", layer: "review", owner: "reviewer-intern", deps: ["f3", "f4"] },
    { id: "q1", title: "QA: lint + build + specs", layer: "qa", owner: "qa-intern", deps: ["r2", "a1"] },
    { id: "u1", title: "UX: Playwright + axe", layer: "ux", owner: "ux-intern", deps: ["q1"] },
    { id: "r3", title: "review final da branch", layer: "review", owner: "reviewer-intern", deps: ["u1"] },
    { id: "p1", title: "TLDR do PR", layer: "pr", owner: "pr-writer-intern", deps: ["r3"] },
    { id: "h2", title: "revisar TLDR, push e abrir o PR", layer: "humano", owner: "voce", deps: ["p1"], human: true }
  ]
};

const TOOLS = {
  "data-intern": [["Read", "apps/backend/prisma/models/task.prisma"], ["Write", "apps/backend/prisma/models/card.prisma"],
    ["Bash", "npx prisma migrate dev --create-only --name add_card"], ["Edit", "prisma/migrations/20260803_add_card/migration.sql"]],
  "backend-intern": [["Read", "apps/backend/src/modules/task/dto/create.dto.ts"], ["Write", "apps/backend/src/modules/card/card.service.ts"],
    ["Edit", "apps/backend/src/app.module.ts"], ["Bash", "pnpm test -- card.service.spec.ts"]],
  "ai-intern": [["Read", "apps/backend/src/modules/estag-agent/tools"], ["Write", "tools/cards.tool.ts"], ["Edit", "estag-agent/agent.ts"]],
  "frontend-intern": [["Read", "apps/frontend/app/(private)/performance/escritorio/page.tsx"], ["Write", "apps/frontend/app/(private)/servicos/cards/page.tsx"],
    ["Write", "cards/components/card-grid.tsx"], ["Bash", "pnpm lint"]],
  "qa-intern": [["Bash", "pnpm lint"], ["Bash", "pnpm build"], ["Bash", "pnpm test — 218 passed"]],
  "ux-intern": [["Bash", "playwright test e2e/cards.spec.ts — admin"], ["Bash", "playwright test e2e/cards.spec.ts — individual"], ["Read", "axe report — 0 criticos"]],
  "reviewer-intern": [["Bash", "git diff develop...HEAD --stat"], ["Read", "apps/backend/src/modules/card/card.service.ts"], ["Read", "cards/components/card-grid.tsx"]],
  "pr-writer-intern": [["Bash", "git log develop..HEAD --oneline --stat"], ["Write", "TLDR do PR"]]
};

let seq = 0;
const owner = id => plan.steps.find(s => s.id === id).owner;
function dispatch(role, desc) {
  push(2400, { ev: "PreToolUse", tool: "Task", sub: NS + role, info: role + ": " + desc });
}
function start(role) {
  const aid = "aid-" + (++seq);
  push(1700, { ev: "SubagentStart", agent: NS + role, aid });
  return { role, aid };
}
function work(h, n) {
  const tools = TOOLS[h.role];
  for (let i = 0; i < n; i++) { const [tool, info] = tools[(seq + i) % tools.length]; push(3100, { ev: "PreToolUse", tool, info, agent: NS + h.role, aid: h.aid }); }
}
function stop(h) { push(2500, { ev: "SubagentStop", agent: NS + h.role, aid: h.aid, tok: 3800 + (seq * 1723) % 14000 }); }
function machine(step, n, desc) {
  const role = owner(step);
  dispatch(role, desc || (step + " " + plan.steps.find(s => s.id === step).title));
  const h = start(role); work(h, n); stop(h);
}
function gate(id, msg) {
  push(2000, { ev: "gate", id, status: "waiting", msg });
  push(1100, { ev: "Stop" });
  push(8500, { ev: "gate", id, status: "approved" });
}

/* ================= a run ================= */
push(0, { ev: "PreToolUse", tool: "Read", info: "docs/superpowers/plans/2026-08-03-cards.md" });
push(2200, { ev: "PreToolUse", tool: "Bash", info: "git rev-parse --abbrev-ref HEAD" });
push(1800, { ev: "plan", plan });

/* h0: aprovacao da escalacao — com um ajuste: opt1 removido (plan e imutavel) */
gate("h0", "aprovar a escalação do time no terminal");
push(1200, { ev: "skip", id: "opt1", msg: "removido na escalação — doc extra fica pra depois" });

/* s1 com EXTRA DE PAI RODANDO: drift de migration no meio do passo */
dispatch("data-intern", "s1 model + migration RLS");
const S1 = start("data-intern"); work(S1, 2);
dispatch("data-intern", "investigar drift das migrations no banco de dev");
const FX0 = start("data-intern"); work(FX0, 2); stop(FX0);
work(S1, 2); stop(S1);

gate("h1", "revisar e aplicar a migration add_card");

machine("s2", 3);
machine("s3", 4);
machine("r1", 3);
push(1300, { ev: "note", id: "r1", msg: "reviewer: APROVADO — tenancy e permissões ok nos 2 endpoints novos" });

/* a1 (ai) e f1 (frontend) em paralelo — papeis diferentes, intercalados */
dispatch("ai-intern", "a1 tool do agente Estag");
dispatch("frontend-intern", "f1 pagina cards");
const A = start("ai-intern"), F = start("frontend-intern");
work(A, 2); work(F, 2); work(A, 1); work(F, 2);
stop(A); stop(F);

machine("f2", 3);

/* f3 e f4: lote paralelo do MESMO papel */
dispatch("frontend-intern", "f3 cards-grid");
dispatch("frontend-intern", "f4 cards-editor");
const P1 = start("frontend-intern"), P2 = start("frontend-intern");
work(P1, 2); work(P2, 2); work(P1, 1); work(P2, 2);
stop(P1); stop(P2);

machine("r2", 3);
push(1400, { ev: "note", id: "r2", msg: "reviewer: MUDANCAS NECESSARIAS — draft nao re-sincroniza pos-upload (cards-editor.tsx:65); correcao despachada como passo extra" });

/* correcao pos-review: extra pendurado no r2 (frontend sem passo rodando) */
dispatch("frontend-intern", "corrigir bug do draft + a11y dos cards");
const FX1 = start("frontend-intern"); work(FX1, 3); stop(FX1);

machine("q1", 3);
push(1300, { ev: "note", id: "q1", msg: "QA verde: lint, build e 218 specs. Nenhum teste afetado fora da feature" });
machine("u1", 3);
machine("r3", 3);
machine("p1", 2);
gate("h2", "revisar o TLDR, dar push e abrir o PR");
push(1400, { ev: "Stop" });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, ev.map(e => JSON.stringify(e)).join("\n") + "\n");
console.log(`dummy: ${ev.length} eventos -> ${OUT}`);
console.log(`assista: node viewer/cli.mjs --replay ${path.relative(process.cwd(), OUT)} --open`);
