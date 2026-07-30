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
ferramenta Agent**, um por vez, na ordem das camadas. Cada dispatch vira um subagent real —
o que também faz cada um aparecer como personagem no **Pixel Agents** (ver
`references/pixel-agents.md`).

<HARD-GATE>
NÃO comece a implementar sem: (1) estar numa branch `feature/*` (nunca `main`/`develop`/
`staging`), e (2) um arquivo de plano de implementação existente. Se qualquer um faltar, PARE
e peça ao usuário. O time é a rede de segurança do dev, não substitui o plano nem a branch.
</HARD-GATE>

## Entrada

Invocação: `/dev-team-orchestration <caminho-do-plano>` (ou o usuário aponta o plano em
linguagem natural). O plano vem da `superpowers:writing-plans`, tipicamente a partir de um
brainstorming/planejamento prévio.

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
1. Anuncie no terminal: `▶ Camada <X> — despachando <x>-intern`.
2. Despache o especialista via a ferramenta **Agent**:
   - `subagent_type`: `general-purpose`
   - `model`: conforme a tabela do roster
   - `description`: curto e legível (ex.: "backend-intern: módulo notas-quali") — o Pixel
     Agents mostra isso.
   - `prompt`: o conteúdo de `references/agents/<x>.md` + o trecho do plano daquela camada +
     o resumo do que as camadas anteriores entregaram (contratos: nomes de tabela/coluna,
     rotas, DTOs, tipos).
3. O especialista implementa e faz **commit local** da sua camada. Recebe de volta um relatório
   estruturado (o que fez, arquivos, o commit, e o que a próxima camada precisa saber).
4. **Gate de revisão:** despache `reviewer-intern` (opus, read-only) no diff daquela camada.
   - Reviewer aprova → siga pra próxima camada.
   - Reviewer aponta problemas → re-despache o MESMO especialista com o feedback; repita até
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
- `frontend-intern` → `taste-skill:taste-skill`, `ui-ux-pro-max`, `frontend-design` para UI.
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
