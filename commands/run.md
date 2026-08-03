---
description: Orquestra o time de subagents estagiários para executar um plano de implementação, camada por camada, com revisão, testes e UX.
argument-hint: <caminho-do-plano> [observações extras da run]
---

Invoque a skill **dev-team-orchestration** e siga o `SKILL.md` dela como playbook do Team Leader.

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
