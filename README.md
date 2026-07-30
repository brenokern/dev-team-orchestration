# dev-team-orchestration

Skill de Claude Code que orquestra um **time de subagents estagiários** para executar um
**plano de implementação já escrito** no monorepo (NestJS + Next.js + Prisma
multi-tenant), camada por camada, com revisão, testes e teste de UI/UX.

A sessão principal do Claude Code vira **Team Leader** e despacha, na ordem
`infra → dados → backend → frontend`, um estagiário por camada — com um **reviewer** entre cada
camada, **QA** (lint/test/build), **ux** (Playwright + acessibilidade) e um **pr-writer** que
gera o TLDR do PR. Tudo com commit local, **sem push** e **sem aplicar migration**.

## Instalação

### Opção A — marketplace de plugin (traz skill + agentes)

No Claude Code:

```
/plugin marketplace add brenokern/dev-team-orchestration
/plugin install dev-team-orchestration@breno
```

- `brenokern/dev-team-orchestration` é este repositório no GitHub.
- `breno` é o nome do marketplace (campo `name` em `.claude-plugin/marketplace.json`).
- Atualizar depois de mudanças: `/plugin marketplace update breno`.
- Repo privado? Adicione por caminho local: `/plugin marketplace add ~/Desktop/dev-team-orchestration`.

### Opção B — CLI de skills (instala só a skill)

Usa o CLI da comunidade `skills` (o mesmo `npx skills add ...` que outras skills usam pra
instalar a partir de um repo):

```
npx skills add https://github.com/brenokern/dev-team-orchestration --skill dev-team-orchestration --agent claude-code
```

Baixa `skills/dev-team-orchestration/SKILL.md` (+ `references/`) para o seu `.claude/skills`.
Requer o repo acessível (público, ou git autenticado se privado).

## Como usar

Numa branch `feature/*`, com um plano de implementação já escrito:

```
/dev-team-orchestration:run caminho/do/plano.md
```

ou em linguagem natural: "roda o time nesse plano: `caminho/do/plano.md`". O Leader confirma
branch + plano e conduz o fluxo até entregar a feature com commits locais e o TLDR do PR pronto
pra você abrir.

> **Sobre o `:run`:** o Claude Code **sempre** prefixa comando de plugin com o nome do plugin
> (`/plugin:comando`), então não dá pra ter um `/dev-team-orchestration` puro — o comando é
> `/dev-team-orchestration:run`. Se preferir, ignore o slash e use linguagem natural.

## Skills companheiras (instale para o time render 100%)

Os estagiários reutilizam skills abertas; sem elas alguns papéis rodam degradados (mas rodam):

- **superpowers** — upstream que gera o plano (brainstorming → writing-plans).
  `github.com/obra/superpowers-marketplace` →
  `/plugin marketplace add obra/superpowers-marketplace` · `/plugin install superpowers@superpowers-marketplace`
- **ponytail** — diff mínimo / anti over-engineering (global).
  `github.com/DietrichGebert/ponytail` →
  `/plugin marketplace add DietrichGebert/ponytail` · `/plugin install ponytail@ponytail`
- **taste-skill** — taste de frontend (usada pelo `frontend-intern`).
  `github.com/Leonxlnx/taste-skill` →
  `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`
- **ui-ux-pro-max** — inteligência de UI/UX (frontend-intern e ux-intern).
  `github.com/nextlevelbuilder/ui-ux-pro-max-skill` →
  `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` · `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`
- **code review / design critique / acessibilidade** — usadas pelo `reviewer-intern` e
  `ux-intern`. Se você tiver os pacotes **Engineering** e **Design** do Claude Code
  (`engineering:code-review`, `design:design-critique`, `design:accessibility-review`), o time
  os usa; senão, esses agentes fazem review/UX sem skill dedicada.

Para o `ux-intern`: Playwright é adicionado como devDependency do front na primeira execução, e
o teste precisa de usuário de seed por papel (ADMIN/INDIVIDUAL) — ver
`skills/dev-team-orchestration/references/agents/ux.md`.

## Ver o time trabalhando

Rode num terminal integrado do VS Code com a extensão [Pixel
Agents](https://github.com/pablodelucca/pixel-agents): cada estagiário aparece como um
personagem. Detalhes em `references/pixel-agents.md`.

## Manutenção

Os padrões em `references/patterns/*` são um snapshot do código do projeto. Depois de mudanças
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
      patterns/*.md       # premissas derivadas do repo
      safety-and-git.md · pixel-agents.md · REFRESH.md
```
