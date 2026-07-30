# Padrões de Dados / Prisma — derivados do repo

> Snapshot de `apps/backend/prisma/models`. Regenere com `references/REFRESH.md`.
> O FLUXO de migration (gerar via `--create-only`, RLS à mão, nunca aplicar) está em
> `references/agents/data.md` — aqui ficam as convenções de MODELAGEM.

## Um model por arquivo
`prisma/models/<entidade>.prisma`, com os enums da entidade no topo do mesmo arquivo.

## Convenções de campo (exemplo real: model `Task` → `fato_tarefa`)
```prisma
model Task {
  id              String   @db.VarChar(32)
  // ...campos de negócio...
  id_criado_por   String   @db.VarChar(32)
  id_editado_por  String?  @db.VarChar(32)
  id_empresa      String   @db.VarChar(32)
  criado_em       DateTime @default(now())
  editado_em      DateTime @updatedAt

  // Relationships
  empresa   Company  @relation(fields: [id_empresa], references: [id], onDelete: Cascade)
  projeto   Project  @relation(fields: [id_projeto, id_empresa], references: [id, id_empresa], onDelete: Cascade)
  criador   User     @relation("CriadorDaTarefa", fields: [id_criado_por], references: [id])

  @@id([id, id_empresa])
  @@index([id_empresa, status, criado_em])
  @@map("fato_tarefa")
}
```
Premissas:
- IDs `@db.VarChar(32)` (gerados por `nanoid32` no service).
- **PK composta `@@id([id, id_empresa])`** — multi-tenancy no nível do schema.
- Auditoria padrão: `id_criado_por`, `id_editado_por?`, `criado_em @default(now())`,
  `editado_em @updatedAt`.
- Relação com `Company` via `id_empresa` (`onDelete: Cascade`). Relações a entidades
  tenant-scoped usam **chave composta**: `references: [id, id_empresa]`.
- Índices começam por `id_empresa` (tenant-first): `@@index([id_empresa, ...])`.

## Nomenclatura física (`@@map`) — estilo data-warehouse
- `fato_*` para tabelas transacionais/fato (`fato_tarefa`, `fato_nota_quali`).
- `dim_*` para dimensões/cadastros (`dim_empresa`, `dim_perfil_investimento`).
- Sempre mapeie o nome físico com `@@map`; o nome do model fica em PascalCase inglês.

## RLS
- NÃO vai no schema — é adicionada à mão no `.sql` da migration (ENABLE + FORCE + policy de
  tenant + policy de bypass), para CADA tabela nova. Ver `references/agents/data.md`.

## Models frágeis (alto churn — cautela ao alterar)
`company.prisma`, `user.prisma`, `client.prisma`.
