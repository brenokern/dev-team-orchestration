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
ferramenta Agent**. As camadas rodam em ordem (sequenciais entre si). **Um papel é UMA pessoa:
passos do mesmo papel são SEMPRE sequenciais** — paralelismo só existe entre PAPÉIS DIFERENTES
com trabalho genuinamente independente (ver o passo 2 do fluxo). Cada dispatch vira um subagent
real — o que também faz cada um aparecer como
personagem no **Pixel Agents** (ver `references/pixel-agents.md`).

<HARD-GATE>
NÃO comece a implementar sem: (1) estar numa branch de trabalho — QUALQUER nome serve,
EXCETO `main`, `develop` e `staging` —, e (2) um arquivo de plano de implementação existente.
Se qualquer um faltar, PARE e peça ao usuário. O time é a rede de segurança do dev, não substitui o plano nem a branch.
</HARD-GATE>

## Entrada

Invocação: `/dev-team-orchestration:run <caminho-do-plano>` (só existe quando instalado como
**plugin** — o Claude Code sempre prefixa comando de plugin com o nome do plugin), ou em
**linguagem natural** ("roda o time nesse plano: `<caminho>`") — a skill também dispara pela
descrição, então no modo skill-avulsa use a linguagem natural. O plano vem da
`superpowers:writing-plans`, tipicamente a partir de um brainstorming/planejamento prévio.

## Roster e modelo por papel

O modelo de cada papel está **garantido no frontmatter** de `agents/<papel>-intern.md`
(`model: opus` / `model: fable`) — é o que vale quando o plugin está instalado. Passe `model`
no dispatch apenas como reforço quando a ferramenta Agent suportar o parâmetro (no modo
skill-avulsa é o único jeito).

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

- **Git: SÓ COMMIT LOCAL é autorizado — NUNCA `git push`, NUNCA `git pull`.** Commits locais
  são parte do fluxo (um por passo, conventional-commit com escopo, GIT.md); sincronizar com o
  remoto, em qualquer direção, é decisão exclusiva do dev.
- **Mensagem de commit sem co-autoria.** NUNCA `Co-Authored-By: Claude ...`, nunca
  "Generated with Claude Code", nunca emoji/link de ferramenta — a mensagem termina no conteúdo
  técnico.
- **NUNCA aplicar migration.** O data-intern para no `.sql` gerado e entrega pra revisão humana.
- **Fica na lane.** Cada agente só toca os paths do seu papel. Reviewer/QA/UX não editam código
  de feature (o ux-intern só escreve seus próprios testes e2e).

## Fluxo do Team Leader

Crie uma TaskList com uma tarefa por camada/estágio aplicável (isso é a visão "ao vivo" no
terminal). Marque `in_progress`/`completed` a cada passo — é o que o usuário acompanha.

### 0. Pré-checagem (gate duro)
- `git rev-parse --abbrev-ref HEAD` → qualquer branch serve, EXCETO `main`, `develop` e
  `staging`. Se estiver numa dessas três, PARE.
- Confirme que o arquivo de plano existe e leia-o inteiro.
- Leia `CLAUDE.md`, `CLAUDE_GUIDELINES.md`, `GIT.md` do repo para ancorar o time.
- **Cheque conflito de política de commit.** A memória/`CLAUDE.md` do usuário (global ou do
  repo) pode proibir commits ("nunca commite", "não commite sem eu pedir"). Instrução do
  usuário **vence a skill** — então NÃO assuma que pode commitar. Se houver conflito com o
  "um commit local por passo" desta skill, leve-o para a pergunta do 0.5 (abaixo) e resolva
  ANTES do primeiro dispatch; descobrir isso no meio da run deixa o histórico misto (parte dos
  passos commitados, parte no working tree).
- A partir do plano, decida QUAIS camadas entram (nem todo plano tem infra ou frontend).

### 0.5 Escalação do time + confirmação humana (UMA rodada, eficiente)
Antes de despachar qualquer passo, apresente a escalação que você montou, num bloco único e
compacto — um passo por linha (`s3 · backend · backend-intern — service + controller`), os
gates humanos previstos (migration/infra/PR), os estágios opcionais com o default marcado
(revisão por camada [on] · QA [enxuto] · UX [enxuto|completo|off] ·
**ux-browser [visível|headless]** — default **visível**: o ux-intern roda o Playwright com
`--headed` pro dev assistir o browser em tempo real; "headless" desliga · limpeza [on]) e o que
as observações da run já alteraram. Faça **UMA pergunta**: "Aprovo essa escalação ou ajusta algo?"
e ESPERE.
- Ajustes ("tira s7", "UX completo", "sem revisão por camada") são aplicados SEM nova rodada —
  reapresente só as linhas alteradas e siga.
- Volte a perguntar apenas se o ajuste quebrar dependência ou contradisser o plano (ex.:
  remover passo do qual outro depende) — aponte o problema e ofereça a alternativa.
- **Política de commit no bloco da escalação:** informe a linha
  `commits: [por passo | só no fim | nenhum — eu commito]`. Default = **por passo**; se a
  memória do usuário proibir commits, o default vira **nenhum** e você DIZ isso na pergunta
  ("sua memória proíbe commits — sigo sem commitar, ou autoriza commit por passo nesta run?").
  A escolha vale para TODOS os dispatches: passe-a explicitamente no prompt de cada agente
  ("NÃO commite; deixe as mudanças no working tree e liste os arquivos no relatório" quando
  for sem commit). Nunca deixe o subagente descobrir isso sozinho no meio do passo.
- O usuário pula este gate dizendo "vai direto"/"sem confirmação" nas observações da run.
No modo visual: publique o plan-graph ANTES da pergunta (aprova-se vendo o fluxo desenhado no
viewer) e modele a aprovação como o PRIMEIRO passo humano do grafo — `h0 · humano ·
"aprovar a escalação do time"`, dependência de todos os passos-raiz — sinalizado com
`emit.mjs gate h0 waiting/approved` como qualquer gate. Se a aprovação vier com ajustes,
**não republique o plan** (é imutável): remoções viram `emit.mjs skip <id>` e adições viram
dispatches normais, que o viewer desenha como cards extras pendurados na origem.

### 1..N. Para cada camada aplicável, NA ORDEM `infra → data → backend → ai → frontend`:

**As CAMADAS são sempre sequenciais** (frontend depende de backend depende de schema). A camada
**ai** (agentes com Strands SDK, via `ai-intern`) só entra quando o plano tem trabalho de
agente de IA, e roda **depois do backend** (as tools do agente consomem os serviços do backend)
e **antes do frontend** (que pode chamar o endpoint do agente). Dentro de uma camada, o trabalho
é quebrado em **passos pequenos**.

**Passo `@AgentTool` (quando o plano expõe rotas como tools de agente):** é um passo da camada
**ai**, feito EM CONJUNTO — o `backend-intern` entrega a rota pronta + contrato (path, DTOs,
permissões) no relatório dele, e o `ai-intern` aplica o decorator `@AgentTool` nos controllers
(única escrita dele fora da lane, cirúrgica: decorator + imports, nunca a lógica da rota). O
backend-intern NÃO decora; o ai-intern NÃO altera a rota. O Leader anexa o contrato do backend
no dispatch desse passo.

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
2. **Liste os passos atômicos** do plano naquela camada e despache-os **em sequência, um por
   dispatch**. REGRA DURA: **NUNCA duas tarefas do MESMO papel em paralelo** — um subagente é
   uma pessoa, não uma fábrica; o mesmo `*-intern` com dois dispatches simultâneos não faz
   sentido e embaralha contratos e commits. Lote paralelo (vários `Agent` numa mensagem) é
   permitido APENAS entre **papéis diferentes**, com trabalho genuinamente independente
   (arquivos disjuntos + sem contrato entre si) — situação rara, já que as camadas são
   sequenciais por natureza. Na dúvida, sequencial.
3. **Despache cada passo** (ou lote independente) via **Agent**. Se o plugin estiver instalado,
   os papéis existem como **subagents nomeados** — use `subagent_type: "<papel>-intern"` (ex.:
   `backend-intern`); o prompt do papel + rails já vivem no agente, então o `prompt` do dispatch
   leva SÓ o slice DAQUELE passo + os contratos já entregues + a seção de `patterns/*` + o
   arquivo análogo. No modo skill-avulsa (sem os agentes nomeados), caia no comportamento
   antigo: `subagent_type: general-purpose` com `references/agents/<x>.md` colado no prompt.
   Em ambos: `model` do roster, `description` no formato `"<papel>: <passo>"` (ex.:
   "backend-intern: 10.2 DTO de notas"). **Um passo por dispatch**; nunca empacote vários
   passos nem duas tarefas que tocam o mesmo arquivo.
4. Cada dispatch faz **commit local do seu passo** (um commit por passo) e devolve um relatório
   curto (fez / arquivos / commit / contrato pra frente).
5. **Gate de revisão (fim da camada):** despache `reviewer-intern` (opus, read-only) no diff da
   camada inteira.
   - Aprova → próxima camada.
   - Achou problema → re-despache **só o passo culpado** com o feedback; repita até aprovar. Não
     avance com pendência.

### N+1. QA (uma vez, no fim — não por camada; MODO ENXUTO por padrão)
Despache `qa-intern`: `pnpm lint` + `pnpm build` sempre; testes = **só os specs afetados** pela
mudança (`pnpm test -- <arquivos>`), não a suíte inteira — `test:cov`/`test:e2e` completos SÓ
por ordem explícita sua (mudança ampla ou pedido do reviewer). O qa-intern trabalha em dieta de
tokens (saída via arquivo + tail/grep, sem ler código, ~8 tool calls); se ele estourar isso,
o problema é do dono do passo, não dele. Falhou → volta pro dono do passo culpado com o trecho
do log; re-QA depois do fix.

### N+2. UI/UX (só se a feature tem frontend; MODO ENXUTO por padrão)
**Pre-flight ANTES do dispatch (barato, evita run perdida):** rode
`pnpm --filter frontend exec playwright --version` e cheque se existe
`apps/frontend/playwright.config.*`. Faltando qualquer um, PARE e apresente ao dev o setup
pendente (devDependency `@playwright/test` + `@axe-core/playwright`,
`playwright install chromium` e, em WSL2, `playwright install-deps chromium` com sudo — ação
humana) em vez de despachar o ux-intern para falhar. Branch onde o dev já instalou passa direto.
Despache `ux-intern` (opus): sobe o front e usa **Playwright** num ÚNICO spec com os fluxos DA
FEATURE como **ADMIN e como INDIVIDUAL** (caminho feliz + isolamento), valida o gating de UI do
plano e roda axe só nas páginas novas/alteradas (serious/critical). **Passe a opção
`ux-browser` da escalação no prompt do dispatch** (default `visível` = `--headed`, o dev
assiste o browser ao vivo; `headless` quando o usuário desligar na aprovação — o ux-intern cai
para headless sozinho se não houver display). 1 screenshot por papel + 1
por falha; ~12 tool calls. Estados de loading/vazio/erro e o UX heurístico
(design-critique/ui-ux-pro-max) são o **modo completo** — só quando VOCÊ pedir "UX completo" no
dispatch. Achados de bug/UX → voltam pro `frontend-intern`; a11y séria idem. Pré-requisitos de
ambiente em `references/agents/ux.md`; ambiente que não sobe em ~2 min → o ux-intern reporta o
setup pendente em vez de insistir.

### N+3. Revisão final
Despache `reviewer-intern` no diff **inteiro** da branch (integração entre camadas, não só cada
parte isolada).

### N+4. Limpeza dos artefatos de teste
Com a revisão final aprovada, despache o `reviewer-intern` mais uma vez (única exceção de
escrita dele, no espírito `ponytail`: zero lixo na branch) para **deletar os artefatos de teste
da run**: specs e2e do ux-intern (`apps/frontend/e2e/**`), storageState, screenshots/trace/
report. Specs de service/controller do backend são ENTREGÁVEL e ficam. `playwright.config.ts` e
a devDependency do Playwright não são removidos pela automação — o reviewer lista e o dev
decide. Commit: `chore(frontend): remove artefatos de teste e2e da run`. No modo visual,
inclua este passo no plan-graph (owner `reviewer-intern`, layer `limpeza`).

### N+5. TLDR do PR
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

## Modo visual (team-view)

Quando a invocação vier de `/dev-team-orchestration:run-visual`, ou o usuário pedir "com
visualização"/"com o team-view", o Leader adiciona 4 obrigações ao fluxo (nada mais muda):

1. **Suba o viewer em background** antes do passo 0:
   `node "${CLAUDE_PLUGIN_ROOT}/viewer/cli.mjs" --open &` (Bash com `run_in_background`).
   O viewer é **read-only** — quem inicia, aprova e encerra a run é sempre o terminal.
2. **Publique o plan-graph UMA ÚNICA VEZ** no fim do passo 0: escreva um JSON com
   `{title, roster:[{id,model}], steps:[{id,title,layer,owner,deps[],human?}]}` — um step por
   dispatch previsto, `deps` refletindo a ordem real, e um step `human:true` para CADA
   intervenção humana prevista (aprovação da escalação h0, aplicar migration, aplicar infra,
   abrir o PR). Depois: `node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" plan <arquivo.json>`.
   **NUNCA re-emita `plan`** — o grafo é imutável depois de publicado. Ajustes vindos do gate
   0.5 (ou de qualquer momento da run) entram como EVENTOS:
   - passo removido → `emit.mjs skip <id> "removido na escalação"` (o card apaga no viewer);
   - passo adicionado → nenhum evento: apenas despache; o viewer o pendura como card extra
     (subfluxo) no passo de origem.
3. **Dispatch nomeado** (item 3 acima) — é o que faz cada personagem aparecer certo no viewer.
4. **Gates humanos**: ao chegar num step `human:true`, rode
   `node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" gate <id> waiting "<o que fazer>"` ANTES de
   parar e perguntar no terminal (acende o card âmbar + notificação nativa do SO). Quando o
   usuário resolver: `... gate <id> approved` — **SEMPRE emita o `approved` antes do próximo
   dispatch**; sem ele o aviso âmbar fica aceso no viewer (o viewer se auto-cura no próximo
   dispatch, mas o `approved` é o sinal correto).
   **Aprovação IMPREVISTA no meio da run** (um sub-passo que surgiu e precisa de validação
   humana): NÃO re-emita o plan. Emita `gate <id-novo> waiting "<o que aprovar>"` com um id
   NOVO (ex.: `hx1`) — o viewer cria o card humano em runtime, pendurado no passo atual do
   fluxo, como um novo ponto de partida. Ao resolver: `gate <id-novo> approved`.

5. **Vereditos no viewer**: nos MARCOS da run — fim de cada camada (veredito do reviewer),
   QA, UX, revisão final e encerramento — emita um resumo de 1-2 linhas (≤300 caracteres, o
   essencial: APROVADO/reprovado + o achado principal):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" note <stepId|-> "reviewer: 1 achado importante — draft não re-sincroniza pós-upload (cards-editor.tsx); re-dispatch batelado com achados do UX"
   ```
   Use o `stepId` do plan-graph quando o veredito é de um passo (a nota ancora e foca o card);
   `-` para notas gerais. NÃO emita note por passo atômico — só nos marcos (é o narrador da
   run, não um segundo log de tools).

6. **Commit do passo (diff clicável)**: quando o relatório de um passo trouxer o hash do
   commit local, emita `node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" commit <stepId> <hash>` —
   o card ganha a seção "commit" no dialog e o dev abre o diff (`git show` read-only servido
   pelo próprio viewer). Um por passo commitado; custo de uma linha.

Os hooks do plugin (`hooks/hooks.json`) capturam `SubagentStart/Stop` e `Pre/PostToolUse`
sozinhos — fora os marcos acima, o Leader não emite nada por evento. O comando `emit.mjs`
NUNCA falha nem bloqueia; se o viewer não estiver aberto, a run segue normal e o log fica
disponível pra `viewer/cli.mjs --replay`.

## Referências
- `references/patterns/*.md` — padrões-premissa por camada (fonte primária dos especialistas).
- `references/REFRESH.md` — rotina para regenerar os padrões a partir do repo.
- `references/safety-and-git.md` — rails de segurança e formato de commit (todo agente lê).
- `references/pixel-agents.md` — como ver o time trabalhando no terminal / VS Code.
- `references/agents/*.md` — o prompt de cada especialista (inclui `ux.md` e `ai.md`); no
  plugin, os mesmos prompts viram os subagents nomeados em `agents/` (gerados a partir daqui).
