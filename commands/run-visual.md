---
description: Igual ao /run, mas com o team-view — o escritório visual do time abrindo no browser, ao vivo, via hooks.
argument-hint: <caminho-do-plano> [observações extras da run]
---

Invoque a skill **dev-team-orchestration** e siga o `SKILL.md` dela como playbook do Team Leader,
com o **modo visual (team-view)** ligado — a seção "Modo visual" do SKILL.md detalha o protocolo.

Argumentos recebidos: $ARGUMENTS

O PRIMEIRO token é o caminho do plano de implementação. TUDO que vier depois são
**observações da run** — instruções do usuário que se somam ao plano. Trate-as como ordens do
dono do projeto, com precedência sobre os defaults da skill. Exemplos do que podem conter:
ajustes de escopo ("além do plano, adicione X"; "pule o passo Y"), modos ("UX completo",
"rode test:e2e"), ou restrições ("não toque na sidebar"). Se uma observação CONTRADIZ o plano,
aponte a contradição e confirme com o usuário antes de despachar o passo afetado — observação
muda execução, não substitui planejamento. Ajustes de escopo entram como passos no plan-graph
(modo visual) e na TaskList, atribuídos ao papel certo.

Antes de qualquer coisa, aplique o HARD-GATE: confirme que a sessão está numa branch `feature/*`
e que o arquivo de plano existe. Se faltar algum, PARE e peça ao usuário.

Com o gate aprovado, adicione ao fluxo normal da skill estas obrigações do modo visual:

1. **Suba o viewer** (uma vez, em background, antes do passo 0):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/viewer/cli.mjs" --open &
   ```
   Use o Bash com `run_in_background: true`. Se `${CLAUDE_PLUGIN_ROOT}` não expandir no seu
   ambiente, localize a raiz do plugin (o diretório que contém `viewer/cli.mjs`) em
   `~/.claude/plugins/`. O viewer é read-only: ele nunca inicia, aprova ou reinicia nada.

2. **Publique o plan-graph** logo depois de ler o plano (fim do passo 0):
   - Escreva um JSON temporário (ex.: `/tmp/team-view-plan.json`) no schema:
     ```json
     {
       "title": "<nome da feature>",
       "roster": [{"id": "backend-intern", "model": "opus"}, ...os papeis que entram...],
       "steps": [
         {"id": "s1", "title": "10.1 model + migration RLS", "layer": "dados",
          "owner": "data-intern", "deps": []},
         {"id": "h1", "title": "revisar e aplicar a migration", "layer": "humano",
          "owner": "voce", "deps": ["s1"], "human": true},
         {"id": "s2", "title": "10.2 ...", "layer": "backend", "owner": "backend-intern",
          "deps": ["h1"]}
       ]
     }
     ```
   - `steps` = os passos atômicos do plano, um por dispatch previsto, com `deps` refletindo a
     ordem real (camadas sequenciais; passos paralelos da mesma camada compartilham as deps).
   - **Inclua um passo `human: true`** para cada intervenção humana já prevista: a aprovação
     da escalação (`h0`, PRIMEIRO passo do grafo, dependência de todos os passos-raiz — ver
     seção 0.5 do SKILL.md), aplicar a migration (depois da camada de dados), aplicar plan de
     infra (se houver) e abrir o PR (último passo, depois do pr-writer).
   - Publique: `node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" plan /tmp/team-view-plan.json`

3. **Despache com subagent nomeado**: use `subagent_type: "<papel>"` (ex.: `backend-intern`) em
   vez de `general-purpose`. O prompt do dispatch fica só com o slice do passo + contratos +
   seção de patterns — o papel e os rails já vivem no agente. Mantenha o `model` do roster e a
   `description` no formato `"<papel>: <passo>"`.

4. **Sinalize os gates humanos**: ao chegar num passo `human: true`, antes de parar e perguntar
   ao usuário no terminal, rode:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" gate <id> waiting "<o que o humano precisa fazer>"
   ```
   (isso acende o card âmbar no viewer e dispara a notificação nativa do SO). Quando o usuário
   resolver e mandar seguir:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/hooks/emit.mjs" gate <id> approved
   ```

Todo o resto — camadas, revisão por camada, QA, UX, TLDR — segue o SKILL.md sem mudança.
A aprovação humana acontece SEMPRE no terminal; o viewer apenas avisa e mostra.
