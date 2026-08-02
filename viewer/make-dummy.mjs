#!/usr/bin/env node
/**
 * Gera uma run dummy completa para testar o viewer sem gastar uma run real:
 *
 *   node viewer/make-dummy.mjs            # (re)escreve viewer/fixtures/dummy.ndjson
 *   node viewer/cli.mjs --replay viewer/fixtures/dummy.ndjson --open
 *
 * Cobre de proposito TODOS os casos que ja quebraram ou que estressam o layout:
 * fan-out/fan-in, aresta longa pulando colunas (rota periferica), lote paralelo
 * do MESMO papel, gates humanos (waiting -> Stop do leader -> approved),
 * papel fora do plano (infra triste na tv) e agent_type namespaced de plugin.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "fixtures", "dummy.ndjson");

let t = 1700000000000;
const ev = [];
const push = (dt, e) => { t += dt; ev.push({ t, ...e }); };
/* namespaced de proposito: e assim que os hooks entregam agente de plugin */
const NS = "dev-team-orchestration:";

const plan = {
  title: "feature dummy — cards personalizados",
  roster: [
    { id: "data-intern", model: "opus" }, { id: "backend-intern", model: "opus" },
    { id: "ai-intern", model: "opus" }, { id: "frontend-intern", model: "fable" },
    { id: "qa-intern", model: "opus" }, { id: "ux-intern", model: "opus" },
    { id: "reviewer-intern", model: "opus" }, { id: "pr-writer-intern", model: "opus" }
  ],
  steps: [
    { id: "s1", title: "1. model + migration RLS", layer: "dados", owner: "data-intern", deps: [] },
    { id: "h1", title: "revisar e aplicar a migration", layer: "humano", owner: "voce", deps: ["s1"], human: true },
    { id: "s2", title: "2. DTOs de cards", layer: "backend", owner: "backend-intern", deps: ["h1"] },
    { id: "s3", title: "3. service + controller", layer: "backend", owner: "backend-intern", deps: ["s2"] },
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
    ["Bash", "npx prisma migrate dev --create-only --name add_card"], ["Edit", "prisma/migrations/20260801_add_card/migration.sql"]],
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
function machineStart(step) {
  const role = plan.steps.find(s => s.id === step).owner, aid = "aid-" + step + "-" + (++seq);
  push(2800, { ev: "PreToolUse", tool: "Task", sub: NS + role, info: role + ": " + step });
  push(1800, { ev: "SubagentStart", agent: NS + role, aid });
  return { role, aid };
}
function machineWork({ role, aid }, n) {
  const tools = TOOLS[role];
  for (let i = 0; i < n; i++) { const [tool, info] = tools[i % tools.length]; push(3200, { ev: "PreToolUse", tool, info, agent: NS + role, aid }); }
}
function machineStop({ role, aid }) { push(2600, { ev: "SubagentStop", agent: NS + role, aid }); }
function machine(step, n) { const h = machineStart(step); machineWork(h, n); machineStop(h); }
function gate(id, msg) {
  push(2200, { ev: "gate", id, status: "waiting", msg });
  push(1200, { ev: "Stop" }); /* o leader para e espera no terminal */
  push(9000, { ev: "gate", id, status: "approved" });
}

/* ---- a run ---- */
push(0, { ev: "PreToolUse", tool: "Read", info: "docs/superpowers/plans/2026-08-02-cards.md" });
push(2400, { ev: "PreToolUse", tool: "Bash", info: "git rev-parse --abbrev-ref HEAD" });
push(2000, { ev: "plan", plan });

machine("s1", 4);
gate("h1", "revisar e aplicar a migration add_card");
machine("s2", 3);
machine("s3", 4);
machine("r1", 3);

/* a1 (ai) e f1 (frontend) em paralelo — papeis diferentes, intercalados */
const A = machineStart("a1"), F = machineStart("f1");
machineWork(A, 2); machineWork(F, 2); machineWork(A, 1); machineWork(F, 2);
machineStop(A); machineStop(F);

machine("f2", 3);

/* f3 e f4: LOTE PARALELO DO MESMO PAPEL (o caso que ja quebrou) */
const P1 = machineStart("f3"), P2 = machineStart("f4");
machineWork(P1, 2); machineWork(P2, 2); machineWork(P1, 1); machineWork(P2, 2);
machineStop(P1); machineStop(P2);

machine("r2", 3);
machine("q1", 3);   /* q1 recebe aresta LONGA de a1 (pula colunas): rota periferica */
machine("u1", 3);
machine("r3", 3);
machine("p1", 2);
gate("h2", "revisar o TLDR, dar push e abrir o PR");
push(1500, { ev: "Stop" });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, ev.map(e => JSON.stringify(e)).join("\n") + "\n");
console.log(`dummy: ${ev.length} eventos -> ${OUT}`);
console.log(`assista: node viewer/cli.mjs --replay ${path.relative(process.cwd(), OUT)} --open`);
