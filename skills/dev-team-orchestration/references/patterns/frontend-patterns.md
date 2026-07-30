# Padrões de Frontend — derivados do repo

> Snapshot extraído de `apps/frontend` (51 páginas, 862 componentes `.tsx`, 61 arquivos de api).
> Regenere com `references/REFRESH.md`. Estes são os padrões-premissa: siga-os; se um deles
> parecer errado pra sua tarefa, reporte ao Leader antes de divergir.

## Estrutura de rotas (App Router + route groups)
- Privado: `app/(private)/<area>/<feature>/page.tsx`. Detalhe aninhado: `<feature>/[id]/page.tsx`.
- Público: `app/(public)/...` (login, cadastro-organizacao, redefinir-senha, pedir-demo,
  link-invalido). Relatórios com acesso por token: `app/(public)/reports/<área>/<feature>/[token]/page.tsx`.
- **Componentes da página ficam co-locados** em `<feature>/components/` (padrão em 43 pastas).
  NÃO jogue componente de feature em `src/components` — lá só mora o compartilhado global.

Áreas existentes (encaixe features novas numa delas antes de criar área nova): `alocacao`,
`clientes`, `crm`, `cross-sell`, `documentos-links`, `empresa`, `estag`, `financeiro`,
`gamificacao`, `home`, `internacional`, `perfil`, `performance`, `servicos`, `tarefas`,
`uploads`.

## Proteção de rota e gating por papel (premissa central)
- Toda página privada é embrulhada pelo HOC **`withProtectedPage`** (`src/components/protected-page.tsx`)
  passando o `Page` (enum) que ela protege.
- Autenticação vem do contexto **`useAuth`** (`@/context/auth`): `user.isAdmin`,
  `user.permissions` (`{ id_pagina, papel }`), `user.firstLogin`. Enums `Page` e `PageRole`
  em `@/types/auth`.
- Redirects padrão: sem user → `/login?redirect=<path>`; `firstLogin` → `/primeiro-acesso`;
  sem permissão → `/unauthorized`.
- **Gating de UI dentro da página** (mostrar/ocultar botão, editar vs só ver) usa o hook
  **`useMe`** — é o padrão dominante (presente em ~68 arquivos). ADMIN normalmente cria/edita/
  exclui; INDIVIDUAL costuma ver e, quando aplicável, agir só sobre o que é dele. Replique a
  matriz ADMIN × INDIVIDUAL exatamente como o plano especificar.

## Dados (server state)
- **TanStack Query v5**. Config central em `src/lib/react-query.ts` (stale ~60s). Use
  `queryKey` estável por recurso+filtros e **invalide** as keys certas após mutações.
- Camada de API em **`src/lib/api/<domínio>.ts`**: importa `{ api } from "."` (Axios com
  `withCredentials: true`), define interfaces de params tipadas que estendem `Pagination`
  (`@/types/global`), e importa enums de `../enums`. Um arquivo por domínio (61 hoje).
- Erros de request: `show-toast-axios-error.tsx` + `sonner` (toast). Não invente tratamento
  novo de erro.

## Formulários e UI
- **React Hook Form + Zod** para formulário e validação. Componente `ui/form.tsx`.
- Kit de UI em `src/components/ui/` (shadcn sobre Radix + Tailwind 4). Antes de criar um
  componente, procure aqui: `accordion, alert-dialog, avatar, badge, button, calendar, card,
  carousel, chart, checkbox, collapsible, command, custom-pagination, dialog, dropdown-menu,
  form, funnel-chart, input, label, pagination, popover, progress, radio-group, scroll-area,
  segmented-progress, select, separator, sheet, sidebar, skeleton(-rows), slider, sonner,
  sortable-table-header, spinner, switch, table, tabs, textarea, tooltip`.
- Compartilhados globais úteis: `confirmation-modal(-no-trigger).tsx` (dupla confirmação),
  `pagination.tsx`, `main-header.tsx`, `breadcrumb-setter.tsx`, `nav-main/nav-user`,
  `team-switcher.tsx`, `tutorial-modal/tutorial-highlight`.

## Sidebar
- Feature com entrada de menu registra em **`src/components/app-sidebar.tsx`** (arquivo
  hotspot — 59 mudanças no histórico; edite com cuidado, é onde regressões de navegação
  acontecem). Subitem entra sob o item de área correspondente.

## Qualidade
- Sem framework de teste de front configurado. Qualidade via `pnpm lint` (Next.js) e Prettier
  (`semi: true`). NÃO introduza Jest/RTL/Playwright no front sem decidir com o Breno.

## Arquivos frágeis (mexa com cautela — alto churn histórico)
`app-sidebar.tsx`, `tarefas/page.tsx`, `tarefas/components/task-form.tsx`,
`clientes/[id]/page.tsx`, `clientes/page.tsx`, `src/lib/api/opportunities.ts`,
`src/lib/react-query.ts`.
