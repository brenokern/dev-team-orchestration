# dev-team-orchestration

Skill de Claude Code que orquestra um **time de subagents estagiários** para executar um
**plano de implementação já escrito** no monorepo **Intra** (NestJS + Next.js + Prisma
multi-tenant), camada por camada, com revisão, testes e teste de UI/UX.

A sessão principal do Claude Code vira **Team Leader** e despacha, na ordem
`infra → dados → backend → frontend`, um estagiário por camada — com um **reviewer** entre cada
camada, **QA** (lint/test/build), **ux** (Playwright + acessibilidade) e um **pr-writer** que
gera o TLDR do PR. Tudo com commit local, **sem push** e **sem aplicar migration**.

## Instalação (marketplace de plugin)

No Claude Code:

```
/plugin marketplace add brenokern/<nome-do-repo>
/plugin install dev-team-orchestration@breno-dev-team
```

- `brenokern/<nome-do-repo>` é este repositório no GitHub.
- `breno-dev-team` é o nome do marketplace (campo `name` em `.claude-plugin/marketplace.json`).
- Atualizar depois de mudanças: `/plugin marketplace update breno-dev-team`.

Alternativa sem marketplace (uso pessoal rápido): copie `skills/dev-team-orchestration/` para
`~/.claude/skills/` (vale em todo projeto) ou para `.claude/skills/` do projeto.

## Como usar

Numa branch `feature/*`, com um plano de implementação já escrito:

```
/dev-team-orchestration caminho/do/plano.md
```

ou em linguagem natural: "roda o time nesse plano". O Leader confirma branch + plano e conduz
o fluxo até entregar a feature com commits locais e o TLDR do PR pronto pra você abrir.

## Pré-requisitos (skills que os estagiários reutilizam)

Instale também, senão alguns papéis rodam degradados:

- `ponytail` — diff mínimo / anti over-engineering (global)
- `taste-skill`, `ui-ux-pro-max`, `frontend-design` — usadas pelo `frontend-intern`
- `design:design-critique`, `design:accessibility-review` — usadas pelo `ux-intern`
- `engineering:code-review` — usada pelo `reviewer-intern`
- `intra-brainstorming` — upstream: gera o plano que esta skill executa

Para o `ux-intern`: Playwright é adicionado como devDependency do front na primeira execução, e
o teste precisa de usuário de seed por papel (ADMIN/INDIVIDUAL) — ver
`skills/dev-team-orchestration/references/agents/ux.md`.

## Ver o time trabalhando

Rode num terminal integrado do VS Code com a extensão [Pixel
Agents](https://github.com/pablodelucca/pixel-agents): cada estagiário aparece como um
personagem. Detalhes em `references/pixel-agents.md`.

## Manutenção

Os padrões em `references/patterns/*` são um snapshot do código do Intra. Depois de mudanças
grandes, peça "atualiza os padrões da dev-team-orchestration" (rotina em `references/REFRESH.md`).

## Estrutura

```
.claude-plugin/
  marketplace.json        # catálogo (1 plugin, source ".")
  plugin.json             # manifesto do plugin
skills/
  dev-team-orchestration/
    SKILL.md              # playbook do Team Leader
    references/
      agents/*.md         # os 8 estagiários
      patterns/*.md       # premissas derivadas do repo Intra
      safety-and-git.md · pixel-agents.md · REFRESH.md
```
