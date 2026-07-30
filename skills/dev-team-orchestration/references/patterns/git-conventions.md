# Convenções de Git — mineradas de 3.533 commits (~16 devs)

> Extraído do `git log`. Regenere com `references/REFRESH.md`. Serve para o `pr-writer-intern`
> e o `reviewer-intern` casarem o estilo do time — e para PADRONIZAR onde a realidade divergiu.

## Realidade do histórico (tipos mais usados)
`feat` 779 · `refactor` 362 · `fix` 357 · **`bug` 285** · **`wip` 182** · `chore` 174 ·
`trigger` 85 · `test` 82 · `debug` 23 · e ruído (`add`, `merge`, `conflits`, `tentative`...).

## Escopos mais usados
`infra` (143) domina, seguido de `documentos-links`, `etl`, `api`, `jenkins`, `frontend`/`front`,
`performance`, `notifications`, `backend`, `international`/`internacional`, `auth`, `chat`, `seed`.

## Divergências reais a NÃO repetir (padronize)
- **`bug(...)` não existe no GIT.md** — o time usa muito, mas o padrão é `fix`. Use `fix`.
- **`wip`, `trigger`, `debug`** não são tipos válidos do GIT.md. Não emita commits assim numa
  entrega de feature; se precisar de ponto intermediário, esse commit local não deve sobrar na
  narrativa do PR.
- **Escopo inconsistente:** `front` vs `frontend` (13 vs 32) e `international` vs `internacional`.
  Padronize em **`frontend`** e **`internacional`**.
- Typos históricos de escopo (`jekins`, `jenkinsfilr`, `bootsrap`, `conflits`) — ignore, não
  copie.

## Regra para o time (o que emitir)
- Tipos válidos: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`.
- Escopos do time: `backend`, `frontend`, `infra`, `data`, `etl`, `deps`, `ci`.
- Um commit conventional-commit por camada entregue; escopo consistente; sem `wip`/`bug`.
- **Nunca push** (rail do time) — os commits ficam locais até o dev enviar.

## Hotspots do repo (arquivos mais mexidos — o reviewer redobra atenção aqui)
`infrastructure/environments/{staging,production}/main.tf`, `prisma/models/company.prisma`,
`modules/crm/opportunity/opportunity.service.ts`, `src/components/app-sidebar.tsx`,
`modules/btg/clients/client.service.ts`, `app.module.ts`, `modules/task/task.service.ts`,
`prisma/models/user.prisma`, `tarefas/page.tsx` + `task-form.tsx`, `clientes/[id]/page.tsx`,
`src/lib/api/opportunities.ts`. Mudança nesses arquivos = risco de regressão histórico alto.
