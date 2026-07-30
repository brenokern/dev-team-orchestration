# Ver o time trabalhando — terminal e Pixel Agents

Duas camadas de visibilidade, uma nativa e uma visual.

## 1. Nativa (sempre) — TaskList ao vivo
O Team Leader cria uma TaskList com uma tarefa por camada e atualiza `in_progress`/`completed`
em tempo real, e imprime um cabeçalho antes de cada dispatch (`▶ Camada backend — despachando
backend-intern`). Isso funciona em qualquer terminal, sem extensão.

## 2. Visual (VS Code) — Pixel Agents
[Pixel Agents](https://github.com/pablodelucca/pixel-agents) mapeia cada sessão do Claude Code
a um personagem pixel num escritório virtual e — o que interessa aqui — mostra **subagents da
ferramenta Agent como personagens próprios ligados ao pai**, reagindo aos hooks do Claude Code
(`SubagentStart`, `PreToolUse`, `PostToolUse`, `Stop`, `Notification`).

Para o time "conversar bem" com o Pixel Agents, esta skill já segue as três condições:

1. **Um subagent real por papel.** O Leader despacha cada especialista via a ferramenta Agent
   (nunca simula o trabalho inline). Cada dispatch dispara `SubagentStart` → aparece um
   personagem novo ligado ao Leader.
2. **Rode num terminal integrado do VS Code.** O Pixel Agents observa `vscode.Terminal`; rode
   o `/dev-team-orchestration` a partir do terminal integrado para o personagem da sessão aparecer.
   (Sessões do painel nativo da extensão do Claude Code ainda não são mapeadas — use o
   terminal.)
3. **Descrição legível por dispatch.** O Leader passa um `description` curto
   (`frontend-intern: página notas-quali`) para você identificar cada personagem no escritório.

### Como fica a execução
As **camadas** rodam em turnos (data → backend → frontend, com o reviewer-intern entre elas):
enquanto uma camada trabalha, o Leader fica ocioso (em pé) esperando o subagent — isso é normal,
o dispatch é síncrono.

Quando o plano tem **tarefas independentes na mesma camada**, o Leader dispara o lote em
paralelo (vários `Agent` numa mensagem só) — aí você vê **vários personagens digitando ao mesmo
tempo**. Sem tarefas independentes, é um personagem por vez.

Pro escritório cheio de forma mais agressiva (várias camadas simultâneas), o caminho é git
worktrees isolados (uma sessão por worktree) — fica como upgrade; não é o padrão porque as
camadas dependem umas das outras.

## Setup do Pixel Agents (uma vez)
Instale a extensão "Pixel Agents" (pablodelucca) pelo Marketplace do VS Code ou Open VSX. Ela
lê os transcripts JSONL do Claude Code e registra os hooks automaticamente — a skill não
precisa definir hook nenhum.
