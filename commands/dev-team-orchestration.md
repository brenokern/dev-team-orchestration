---
description: Orquestra o time de subagents estagiários para executar um plano de implementação, camada por camada, com revisão, testes e UX.
argument-hint: <caminho-do-plano>
---

Invoque a skill **dev-team-orchestration** e siga o `SKILL.md` dela como playbook do Team Leader.

Plano de implementação a executar: $ARGUMENTS

Antes de qualquer coisa, aplique o HARD-GATE: confirme que a sessão está numa branch `feature/*`
e que o arquivo de plano existe. Se faltar algum, PARE e peça ao usuário.
