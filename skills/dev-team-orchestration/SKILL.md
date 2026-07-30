---
name: dev-team-orchestration
description: >
  Orquestra um time de subagents especializados no monorepo (NestJS + Next.js + Prisma
  multi-tenant) para EXECUTAR um plano de implementação já escrito. A sessão principal vira
  Team Leader e roda o time camada por camada — infra → dados → backend → frontend — com revisão
  entre cada camada, testes, teste de UI/UX com Playwright, commits locais (sem push) e um TLDR
  de PR no final. Use SEMPRE que o Breno pedir para "rodar o time", "orquestrar o time",
  "executar/tocar o plano com o time", "chamar os agentes", "/dev-team-orchestration", ou apontar
  um plano de implementação numa branch feature/ para o time desenvolver. NÃO use para desenhar a
  feature (isso é um passo de brainstorming/planejamento anterior) — esta skill assume que o
  plano já existe.
---

# dev-team-orchestration — executa um plano com um time de subagents

Esta skill faz a sessão principal do Claude Code assumir o papel de **Team Leader** e conduzir
um time de especialistas (subagents) para transformar um **plano de implementação já escrito**
em uma feature entregue, testada, revisada e commitada localmente — pronta pra você abrir o PR.

O Leader é a sessão principal (seu único login). Os especialistas são despachados **via a
ferramenta Agent**. As camadas rodam em ordem (sequenciais entre si), mas tarefas
**independentes dentro de uma mesma camada** podem ser despachadas em paralelo (ver o passo 3
do fluxo). Cada dispatch vira um subagent real — o que também faz cada um aparecer como
personagem no **Pixel Agents** (ver `references/pixel-agents.md`).

<HARD-GATE>
NÃO comece a implementar sem: (1) estar numa branch `feature/*` (nunca `main`/`develop`/
`staging`), e (2) um arquivo de plano de implementação existente. Se qualquer um faltar, PARE
e peça ao usuário. O time é a rede de segurança do dev, não substitui o plano nem a branch.
</HARD-GATE>

## Entrada

Invocação: `/dev-team-orchestration:run <caminho-do-plano>` (o Claude Code sempre prefixa
comando de plugin com o nome do plugin), ou em **linguagem natural** ("roda o time nesse plano:
`<caminho>`") — a skill também dispara pela descrição. O plano vem da
`superpowers:writing-plans`, tipicamente a partir de um brainstorming/planejamento prévio.

## Roster e modelo por papel (passe no parâmetro `model` do dispatch)

| Papel | Função | Modelo |
|---|---|---|
| Team Leader (esta sessão) | orquestra, faz gate, não edita código | opus |
| data-intern | Prisma, migration `--create-only`, RLS | opus |
| backend-intern | NestJS module/service/controller/DTO | opus |
| **frontend-intern** | Next.js page/hooks/api/sidebar | **fable** |
| infra-intern | Terraform/AWS/lambdas ETL (só se o plano toca) | opus |
| qa-intern | lint/test/build (read-only) | opus |
| **ux-intern** | teste de UI/UX com Playwright + a11y (read-only no código) | opus |
| reviewer-intern | code-review do diff (read-only) | opus |
| pr-writer-intern | TLDR do PR dos commits locais | opus |

## Rails inegociáveis (valem pra TODO subagent — ver `references/safety-and-git.md`)

- **NUNCA `git push`.** Só commit local, formato conventional-commit com escopo (GIT.md).
- **NUNCA aplicar migration.** O data-intern para no `.sql` gerado e entrega pra revisão humana.
- **Fica na lane.** Cada agente só toca os paths do seu papel. Reviewer/QA/UX não editam código
  de feature (o ux-intern só escreve seus próprios testes e2e).

## Fluxo do Team Leader

Crie uma TaskList com uma tarefa por camada/estágio aplicável (isso é a visão "ao vivo" no
terminal). Marque `in_progress`/`completed` a cada passo — é o que o usuário acompanha.

### 0. Pré-checagem (gate duro)
- `git rev-parse --abbrev-ref HEAD` → precisa ser `feature/*`. Se não, PARE.
- Confirme que o arquivo de plano existe e leia-o inteiro.
- Leia `CLAUDE.md`, `CLAUDE_GUIDELINES.md`, `GIT.md` do repo para ancorar o time.
- A partir do plano, decida QUAIS camadas entram (nem todo plano tem infra ou frontend).

### 1..N. Para cada camada aplicável, NA ORDEM `infra → data → backend → frontend`:

**As CAMADAS são sempre sequenciais** (frontend depende de backend depende de schema). O que
pode ser paralelo é o trabalho DENTRO de uma camada, quando o plano tem tarefas independentes.

1. Anuncie no terminal: `▶ Camada <X>`.
2. **Decomponha a camada em tarefas** a partir do plano e classifique se são **independentes**.
   Duas tarefas da mesma camada são independentes SOMENTE se TODAS forem verdade:
   - **arquivos disjuntos** — nenhum arquivo em comum (nem `app.module.ts`, `app-sidebar.tsx`,
     um mesmo model, um mesmo arquivo de api compartilhado, etc.);
   - **sem dependência de contrato entre elas** — uma não consome DTO/rota/tabela que a outra
     ainda vai criar;
   - **mesmo papel/agente** (ex.: dois módulos de backend distintos = dois `backend-intern`).
   Na menor dúvida, trate como **dependentes** (sequencial). Colisão de arquivo é pior que
   lentidão.
3. **Despache:**
   - **Independentes (2+):** dispare todos os `Agent` do lote **numa única mensagem** (é o que
     faz o Claude Code rodar em paralelo — e o que enche o escritório do Pixel Agents). Cada um:
     `subagent_type: general-purpose`, `model` conforme o roster, `description` curto/legível
     (ex.: "backend-intern: módulo tarefas"), `prompt` = `references/agents/<x>.md` + o trecho
     do plano DAQUELA tarefa + os contratos das camadas anteriores. Nunca coloque duas tarefas
     que tocam o mesmo arquivo no mesmo lote.
   - **Dependentes ou tarefa única:** despache uma de cada vez, na ordem que o contrato exige.
4. Cada especialista implementa e faz **commit local** da sua parte, e devolve o relatório
   estruturado (o que fez, arquivos, o commit, contrato pra próxima camada). Um commit por
   tarefa (não misture duas tarefas paralelas no mesmo commit).
5. **Gate de revisão:** quando a camada inteira terminou (todo o lote paralelo + as
   sequenciais), despache `reviewer-intern` (opus, read-only) no diff da camada.
   - Reviewer aprova → siga pra próxima camada.
   - Reviewer aponta problemas → re-despache o dono da tarefa culpada com o feedback; repita até
     aprovar. Não avance com pendência.

### N+1. QA
Despache `qa-intern` (opus): roda `pnpm lint` + `pnpm test:cov` + `pnpm test:e2e` (backend) +
`pnpm build`. Falhou → volta pro dono da camada culpada com o log; re-QA depois do fix.

### N+2. UI/UX (só se a feature tem frontend)
Despache `ux-intern` (opus): sobe o front e usa **Playwright** para navegar os fluxos da feature
como **ADMIN e como INDIVIDUAL**, valida o gating de UI, tira screenshots por estado, roda
checagem de acessibilidade (axe) e produz um relatório de UX. Achados de bug/UX → voltam pro
`frontend-intern`; achados de a11y sérios idem. Pré-requisitos de ambiente estão em
`references/agents/ux.md` (usuário de teste no seed, app rodando). Se o ambiente não estiver
pronto, o ux-intern reporta o setup necessário em vez de falhar silenciosamente.

### N+3. Revisão final
Despache `reviewer-intern` no diff **inteiro** da branch (integração entre camadas, não só cada
parte isolada).

### N+4. TLDR do PR
Despache `pr-writer-intern` (opus): lê os commits locais da branch e escreve o TLDR de descrição
do PR. Entregue esse texto ao usuário — ele abre o PR (o time nunca dá push nem abre PR).

## Encerramento
Reporte ao usuário: camadas entregues, commits locais na branch, resultado do QA e do teste de
UX, e o TLDR do PR. Lembre que **nada foi enviado ao remoto** e que a **migration (se houver)
aguarda ele revisar e aplicar**.

## Reuso de skills pelos especialistas
- `frontend-intern` → `taste-skill`, `ui-ux-pro-max` para UI (se instaladas).
- `ux-intern` → `design:design-critique`, `design:accessibility-review`, `ui-ux-pro-max`.
- `reviewer-intern` → `engineering:code-review`.
- `ponytail` está ativo globalmente → todos priorizam reuso e diff mínimo.

## Padrões do repo (o que torna o time excelente)
`references/patterns/*` são as **premissas derivadas do código real** do projeto (51 páginas,
34 módulos, 3.533 commits minerados). Cada especialista lê o seu como fonte primária:
- `patterns/frontend-patterns.md` · `patterns/backend-patterns.md` ·
  `patterns/data-patterns.md` · `patterns/git-conventions.md`

São um snapshot. Depois de mudanças grandes no repo, o usuário pede **"atualiza os padrões da
dev-team-orchestration"** e o Leader regenera seguindo `references/REFRESH.md` (sondagem
estrutural + mineração de log; não relê todos os diffs).

## Referências
- `references/patterns/*.md` — padrões-premissa por camada (fonte primária dos especialistas).
- `references/REFRESH.md` — rotina para regenerar os padrões a partir do repo.
- `references/safety-and-git.md` — rails de segurança e formato de commit (todo agente lê).
- `references/pixel-agents.md` — como ver o time trabalhando no terminal / VS Code.
- `references/agents/*.md` — o prompt de cada especialista (inclui `ux.md`).
