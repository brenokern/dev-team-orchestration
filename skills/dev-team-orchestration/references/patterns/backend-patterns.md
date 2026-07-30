# Padrões de Backend — derivados do repo

> Snapshot de `apps/backend/src` (34 módulos de feature, 74 `.module.ts` contando submódulos,
> 157 specs). Regenere com `references/REFRESH.md`.

## Esqueleto de módulo (siga um análogo, ex.: `modules/task`)
```
modules/<feature>/
  <feature>.module.ts
  <feature>.controller.ts        + <feature>.controller.spec.ts
  <feature>.service.ts           + <feature>.service.spec.ts
  dto/request/<acao>.dto.ts      (create.dto.ts, update.dto.ts, find-all.dto.ts, ...)
  dto/response/...               (quando há shape de resposta próprio)
```
- Submódulos aninhados são padrão quando a área é grande (ex.: `modules/crm/opportunity`,
  `modules/btg/clients`). Registre o módulo no `AppModule` (`app.module.ts` — hotspot).

## Controller
```ts
@Controller({ path: 'tasks' })
@UseGuards(AuthGuard)
export class TaskController {
  @Post()
  @PagePermission([Page.TAREFAS, Page.CLIENTES], [PageRole.ADMIN, PageRole.INDIVIDUAL])
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) { ... }
}
```
- `@PagePermission([páginas], [papéis])` protege a rota (347 usos no código). `@CurrentUser()`
  injeta o usuário (312 usos). `@CurrentPageRole()` quando a lógica muda por papel.
- Enums `Page`/`PageRole` em `src/common/constants/pages`.
- Guards: `AuthGuard` + `PagePermissionGuard`.

## Service e tenancy (premissa inegociável)
- **`prisma.tenancy.*` é o padrão** (1261 usos) — sempre para query tenant-scoped.
  `prisma.bypassRls.*` é exceção (74 usos), só operação admin/sistema explícita.
- IDs gerados com **`nanoid32`** (`src/shared/utils/nanoid.util.ts`), colunas `VarChar(32)`.
- Update/delete localizam por chave composta `id` + `id_empresa`.
- Erro: logar e re-lançar exceção Nest apropriada (`NotFoundException` quando a entidade não
  existe no tenant, `BadRequestException` em payload inválido).
- Assíncrono (email/notificação): `SqsService.addEmailToQueue` / `addNotificationToQueue`,
  com resposta imediata ao cliente. Upload de arquivo: `S3Service`.

## DTOs
- `class-validator` (`@IsString`, `@IsOptional`, `@IsEnum`, `@IsNumber`, `@IsDate`...). Enums
  importados de `@prisma/generated`.
- Convenção observada: listas de ids chegam como **string separada por vírgula**
  (`ids_responsaveis`, `ids_seguidores`, `ids_tags`) e o service faz o split. Siga o padrão do
  módulo análogo em vez de inventar array.

## Testes (obrigatório em módulo novo)
- `*.spec.ts` de service e de controller ao lado do arquivo (Jest + `@nestjs/testing`).
- Cobrir: caminho feliz (create com `nanoid32`, update/delete por `id_id_empresa`),
  `NotFoundException` fora do tenant, regras de negócio, comportamento de erro.

## Arquivos frágeis (alto churn — cautela)
`app.module.ts`, `modules/crm/opportunity/opportunity.service.ts`,
`modules/btg/clients/client.service.ts`, `modules/task/task.service.ts`,
`modules/employee/employee.service.ts`, `common/constants.ts`.
