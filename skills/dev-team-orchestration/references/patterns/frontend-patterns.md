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

## Páginas de referência (PADRÃO-OURO — estude antes de construir tela)
NÃO entregue layout genérico. Antes de codar, ABRA e replique a densidade e a estrutura destas
duas páginas reais, que são o padrão de qualidade do projeto:

### `app/(private)/performance/escritorio/` — dashboard denso
- Raiz da página: `<div className="flex-1 p-4 sm:p-6 space-y-6">`; seções empilhadas com ritmo
  vertical e **`<Separator />`** entre blocos. Header no topo (título + descrição + filtros +
  tutorial), depois faixa de identidade, KPIs, gráficos, tabelas.
- **Cada bloco é um componente próprio** que recebe `data`, `isLoading` e `dataUpdatedAt`. A
  página só orquestra hooks (`useOfficeKpis`, `useOffice...`) e monta o layout.
- **Grids responsivos reais** (não uma coluna só): KPIs em
  `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4` com `lg:col-span-2` no card de
  destaque; pares em `grid grid-cols-1 md:grid-cols-2 gap-6`; 1/3+2/3 em
  `grid grid-cols-1 lg:grid-cols-3 gap-6` com `lg:col-span-1` / `lg:col-span-2`.
- **Card de KPI** (shadcn `Card`): título `text-xs font-medium text-muted-foreground uppercase
  tracking-wide`, ícone lucide `h-4 w-4 text-muted-foreground` no canto, valor `text-2xl
  font-bold tracking-tight`, sub-rótulos `text-[11px] text-muted-foreground`, barra de meta com
  `SegmentedProgress` colorida por token (`[&_.bg-primary]:bg-[hsl(var(--chart-1))]`),
  `LastUpdatedTooltip` pra frescor do dado.
- **Skeleton por componente é OBRIGATÓRIO**: todo bloco de dados tem seu próprio
  `XSkeleton()` que espelha o layout (`bg-muted animate-pulse`) e é retornado quando
  `isLoading`. Nunca deixe loading genérico/spinner solto.
- Filtros: estado local é a fonte de verdade + `useFilterState`/`useSetFilterParams` pra
  espelhar na URL (links compartilháveis). Comente cada seção em PT como no original.

### `app/(private)/clientes/[id]/` — detalhe com abas
- **Abas** `Tabs/TabsList/TabsTrigger/TabsContent` com a aba ativa persistida na URL via
  `useFilterState("tab", ...)`. `BreadcrumbSetter` pro breadcrumb. `Select` pra sub-escopo.
- Header exportado JUNTO com seu skeleton (`ClientDetailHeader` + `ClientDetailHeaderSkeleton`).
- Componentes de feature aninhados em subpastas por domínio (`kyc/`, `investments/`,
  `opportunities/`, `rebalanceamento/`, `extrato/`) — não jogue tudo numa pasta só.
- **Formatação sempre pt-BR/BRL**: `Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"})`
  e `toLocaleDateString("pt-BR", …)`. Erros via `useShowToastError`.

## Cores (OBRIGATÓRIO — nunca hardcode cor crua sem seguir isto)
1. **Tokens semânticos primeiro.** Use as classes do design system, que saem das CSS vars em
   `app/globals.css`: `bg-primary`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `border`,
   `text-white`. É o que dá consistência e suporte a dark mode.
2. **Séries de gráfico usam `--chart-1..5`** (`hsl(var(--chart-N))`) — nunca invente hex por
   série. `--chart-1` é o azul primário do projeto (`217 91% 60%`).
3. **Cores globais da empresa (marca por tenant):** `company.gradiente_top` e
   `company.gradiente_bottom` (hex, em `@/types/company`) — SEMPRE leve-as em conta em qualquer
   elemento de marca (capas de relatório, seções de identidade/hero, gradientes). Consuma como
   em `empresa/perfil/components/gradient-section.tsx` (linear-gradient com `mixColors`); não
   fixe cor de marca no código.
4. **Prefira paleta PASTEL / suave.** O vocabulário real do projeto é suave: azuis
   `#60a5fa #93c5fd #3b82f6`, slate/neutros `#94a3b8 #cbd5e1 #e2e8f0 #f1f5f9 #64748b`, e acentos
   suaves `#10b981 #22c55e #eab308 #f97316 #a855f7 #fca5a5` (faixa 300–500 do Tailwind). Evite
   cores saturadas/berrantes fora desse registro.
5. Cor de marca fixa de terceiro (ex.: custodiante) fica num mapa explícito, com fallback
   ciclando neutros — ver o `CUSTODIAN_COLORS`/`FALLBACK_COLORS` em `clientes/[id]/components/
   escopo-tabs.tsx`.

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
