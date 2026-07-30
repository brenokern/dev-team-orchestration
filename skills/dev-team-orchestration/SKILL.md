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

Invocação: `/dev-team-orchestration:run <caminho-do-plano>` (só existe quando instalado como
**plugin** — o Claude Code sempre prefixa comando de plugin com o nome do plugin), ou em
**linguagem natural** ("roda o time nesse plano: `<caminho>`") — a skill também dispara pela
descrição, então no modo skill-avulsa use a linguagem natural. O plano vem da
`superpowers:writing-plans`, tipicamente a partir de um brainstorming/planejamento prévio.

## Roster e modelo por papel (passe no parâmetro `model` do dispatch)

| Papel | Função | Modelo |
|---|---|---|
| Team Leader (esta sessão) | orquestra, faz gate, não edita código | opus |
| data-intern | Prisma, migration `--create-only`, RLS | opus |
| backend-intern | NestJS module/service/controller/DTO | opus |
| **frontend-intern** | Next.js page/hooks/api/sidebar | **fable** |
| infra-intern | Terraform/AWS/lambdas ETL (só se o plano toca) | opus |
| ai-intern | Agentes de IA com Strands SDK (TS), Bedrock (só se o plano toca) | opus |
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

### 1..N. Para cada camada aplicável, NA ORDEM `infra → data → backend → ai → frontend`:

**As CAMADAS são sempre sequenciais** (frontend depende de backend depende de schema). A camada
**ai** (agentes com Strands SDK, via `ai-intern`) só entra quando o plano tem trabalho de
agente de IA, e roda **depois do backend** (as tools do agente consomem os serviços do backend)
e **antes do frontend** (que pode chamar o endpoint do agente). Dentro de uma camada, o trabalho
é quebrado em **passos pequenos**.

**Princípios de execução (velocidade + dinamismo) — leia antes:**
- **Passos ATÔMICOS.** Quebre a camada nos passos do plano (10.1, 10.2, 10.3…) e despache **um
  passo por dispatch**. NUNCA empacote 10.1–10.5 num dispatch só — subagents curtos terminam
  rápido e enchem o Pixel Agents; dispatch gigante = lento e escritório vazio.
- **Não releia o mundo a cada passo.** Os docs do repo já foram lidos no passo 0. No prompt de
  cada passo passe SÓ: o slice daquele passo + a seção específica de `patterns/*` + os 1–2
  arquivos análogos a imitar. Nada de "leia o CLAUDE_GUIDELINES inteiro / a página inteira" a
  cada dispatch — isso é o que mais custa tempo.
- **Revisão no FIM da camada, não a cada micro-passo.** Deixe os passos pequenos correrem; o
  `reviewer-intern` roda **uma vez por camada** sobre o diff acumulado. Revisar passo a passo é
  o maior gargalo.
- **Velocidade > profundidade em camada mecânica:** o Leader pode rodar os implementadores em
  `sonnet` (mais rápido) e manter `opus` só no reviewer, quando a camada for repetitiva.

1. Anuncie: `▶ Camada <X>`.
2. **Liste os passos atômicos** do plano naquela camada. Marque quais são **independentes**
   (arquivos disjuntos + sem contrato entre si + mesmo papel) — esses podem ir em **lote
   paralelo** (vários `Agent` numa mensagem só); o resto vai em sequência, **um passo por
   dispatch**. Na dúvida, sequencial (colisão de arquivo é pior que lentidão).
3. **Despache cada passo** (ou lote independente) via **Agent**: `subagent_type: general-purpose`,
   `model` do roster, `description` curta e específica (ex.: "backend-intern: 10.2 DTO de
   notas"), `prompt` = `references/agents/<x>.md` + o slice DAQUELE passo + os contratos já
   entregues + a seção de `patterns/*` + o arquivo análogo. **Um passo por dispatch**; nunca
   empacote vários passos nem duas tarefas que tocam o mesmo arquivo.
4. Cada dispatch faz **commit local do seu passo** (um commit por passo) e devolve um relatório
   curto (fez / arquivos / commit / contrato pra frente).
5. **Gate de revisão (fim da camada):** despache `reviewer-intern` (opus, read-only) no diff da
   camada inteira.
   - Aprova → próxima camada.
   - Achou problema → re-despache **só o passo culpado** com o feedback; repita até aprovar. Não
     avance com pendência.

### N+1. QA (uma vez, no fim — não por camada)
Despache `qa-intern`: `pnpm lint` + `pnpm build` sempre; testes = **só os specs afetados** pela
mudança (`pnpm test -- <arquivos>`), não a suíte inteira — rode `test:cov`/`test:e2e` completos
só se a mudança for ampla ou o reviewer pedir. Falhou → volta pro dono do passo culpado com o
log; re-QA depois do fix.

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
- `ai-intern` → premissas do **Strands SDK** (strandsagents.com) + `claude-code-guide` (Claude
  Agent SDK / Claude API); o Leader pode invocar o agente `claude-code-guide` pra dúvidas.
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
- `references/agents/*.md` — o prompt de cada especialista (inclui `ux.md` e `ai.md`).
