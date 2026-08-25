# team-view — pesquisa de mercado, arquitetura e roadmap

Pesquisa feita em 2026-08 sobre viewers/dashboards embutidos em ferramentas de agentes de
código, para responder três perguntas: (1) HTML é a solução certa? (2) como os outros resolvem
o problema de estado dessincronizado (card que não conclui)? (3) o que falta no nosso viewer?

## 1. O cenário — quem embute viewer e com quê

| Projeto | Stack do viewer | Fonte de eventos |
|---|---|---|
| disler/multi-agent-observability | Vue 3 + WebSocket + Bun/SQLite | hooks (12 eventos) |
| claude-code-templates (analytics) | web UI servida por CLI Node | parsing de `~/.claude` (polling) |
| claude-flow (ruvnet) | TUI + dashboard React separado | eventos do próprio orquestrador |
| opcode (ex-Claudia) | app Tauri (Rust+React) | wrapper de processo + JSONL |
| vibe-kanban | Rust/Axum + React | wrapper de processo (executors) |
| crystal | Electron + React | wrapper de processo (stream-JSON) |
| ccusage / Usage-Monitor / sniffly / claude-devtools | TUI / web local | parsing offline do JSONL |
| pipeline OTel | Grafana | telemetria oficial (batch) |

**Conclusão sobre HTML:** HTML único + SSE + Node zero-deps é um padrão legítimo e é o mais
leve do ecossistema. Os projetos que migraram para app desktop/servidor Rust não migraram por
causa do transporte — migraram porque viraram *orquestradores* (precisam spawnar e possuir os
processos dos agentes). Nosso viewer é um *observador read-only* por design; ficar em
HTML+SSE é a escolha certa. WebSocket só compensaria se o viewer mandasse comandos de volta —
o que contraria o princípio "quem comanda é o terminal".

## 2. O problema central: estado que dessincroniza

O sintoma clássico: um passo termina de verdade mas o card nunca ganha o check. A causa é
estrutural e documentada em issues do próprio Claude Code: `SubagentStop` se perde/atrasa, e o
`SubagentStop` não identifica de forma confiável QUAL subagente terminou. Todo viewer baseado
só em deltas de hooks sofre disso; o disler convive com a perda porque é um *feed* de eventos,
não uma máquina de estados — o nosso dói exatamente porque é uma máquina de estados do plano.

Como o ecossistema resolve, do mais leve ao mais pesado:

1. **Inferência por invariantes do orquestrador** — usar regras do próprio fluxo para fechar
   buracos. *Já implementado no nosso viewer:* um papel é UMA pessoa e roda em ordem, então
   quando o passo N+1 do papel começa, o passo N aberto é fechado por inferência
   ("concluído — inferido"); gates "waiting" se auto-resolvem quando a run volta a andar;
   watchdog fecha órfãos por silêncio.
2. **Transcript JSONL como fonte da verdade** (ccusage, sniffly, claude-devtools,
   claude-code-templates) — o JSONL de `~/.claude/projects` registra todo Task/subagente com
   resultado; reler do zero reconstrói o estado exato. **É o próximo passo recomendado para
   nós:** o `cli.mjs` faz tail também do transcript da sessão (o hook entrega
   `transcript_path`) e emite periodicamente um evento SSE `snapshot` com o estado completo do
   plano; o viewer converge para o snapshot e os deltas dos hooks viram só animação otimista
   entre snapshots. Resolve QUALQUER perda de evento sem depender de fix da Anthropic.
3. **Wrapper de processo** (crystal, opcode, vibe-kanban) — mudar a arquitetura inteira para o
   viewer lançar os agentes. Não vale para nós: mataria a simplicidade e o read-only.
4. **OTel** — bom para custo/hierarquia pós-hoc e métricas de time; ruim para UI reativa
   (export em batch). Não substitui o viewer; pode complementar no futuro.

## 3. O que já temos (estado 2026-08)

Plan-graph visual com gates humanos, gates dinâmicos criados em runtime (append-only, sem
re-plan), auto-cura de gate órfão, fechamento por inferência de passo do mesmo papel,
watchdog de silêncio, subfluxos dinâmicos (passos extras como badge no card de origem),
vereditos do Leader ancorados no card, replay de qualquer run, isolamento por projeto (4+ runs
simultâneas), colunas colapsáveis reativas, tokens por passo (minerados no SubagentStop),
GSAP embutido (offline), i18n PT/EN, tema claro/escuro. Nenhum projeto pesquisado combina
plan-graph + gates humanos dinâmicos + replay num plugin de Claude Code — o diferencial é real.

## 4. O que falta — roadmap priorizado

> **Status 2026-08-25: itens 1–8 implementados** (recon via transcript, Last-Event-ID,
> Σ tokens da run, histórico `/runs`, scrubber de replay, gantt com wait-time, diff por passo
> via `emit.mjs commit` + `/show/<hash>`, GC de 30 dias), além do `model:` no frontmatter dos
> 9 agentes. Mantido abaixo como registro da priorização.

1. **Snapshot/reconciliação via transcript JSONL** (item 2.2 acima) — elimina de vez a classe
   de bug "card não conclui". Esforço médio, maior retorno.
2. **`id:` nos eventos SSE + `Last-Event-ID`** — reconexão do EventSource retoma de onde
   parou em vez de recarregar a página (hoje: `location.reload()` no hello). Barato.
3. **Custo da run** — já mineramos tokens por passo; falta o total da run no strip e um
   custo estimado em $ por modelo (padrão ccusage/claude-devtools). Barato.
4. **Histórico de runs navegável** — um índice dos `.ndjson` existentes (data, projeto,
   título do plan, resultado) com um clique para abrir em replay. O event log já existe;
   é só listar. Esforço baixo/médio.
5. **Replay com scrubber** — barra de progresso arrastável no modo replay (hoje só velocidade
   fixa via `--speed`). Médio.
6. **Timeline/gantt por papel** — visão alternativa ao escritório: barras de duração por
   passo, wait-time entre passos (onde a run perde tempo). Médio.
7. **Diff/artefatos clicáveis por passo** — o relatório de cada passo lista arquivos/commit;
   linkar o card ao `git show` do commit (servido pelo cli.mjs, ainda read-only). É o grande
   diferencial de vibe-kanban/conductor. Esforço alto — fazer por último.
8. **Rotação/limpeza dos logs** — `~/.claude/team-view/*.ndjson` cresce sem limite e captura
   tool calls de qualquer sessão com o plugin ativo. TTL de 30 dias ou `--gc`. Barato.

Pendências herdadas da auditoria (fora do viewer): `model:` no frontmatter dos `agents/*.md`
(hoje a distinção de modelo por papel é decorativa), caminhos `references/*` com
`${CLAUDE_PLUGIN_ROOT}` nos prompts, e a instrução de `model` no dispatch do SKILL.md.

## Fontes

disler/claude-code-hooks-multi-agent-observability · claude-code-templates (analytics) ·
claude-flow/ruflo · opcode · vibe-kanban · crystal · conductor.build · ccusage ·
Claude-Code-Usage-Monitor · sniffly · claude-devtools · docs de monitoring/OTel do Claude
Code · issues anthropics/claude-code #27755, #33049, #7881 (confiabilidade de
SubagentStart/Stop).
