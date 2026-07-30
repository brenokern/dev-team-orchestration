# Atualizar os padrões (refresh)

Os arquivos em `references/patterns/` são um snapshot do repo. Depois de mudanças grandes
(muitos módulos/páginas novos), regenere. Peça: **"atualiza os padrões da dev-team-orchestration"** —
o Leader roda a sondagem abaixo no repo atual e reescreve `references/patterns/*` com os
números e exemplos novos. NÃO precisa reler os 3.533 diffs; é sondagem estrutural + mineração
de log.

## Sondagem (rode a partir da raiz do repo)
```bash
# Git — convenções e hotspots
git rev-list --count HEAD
git shortlog -sn --all | head -20
git log --pretty=%s | grep -oE '^[a-z]+' | sort | uniq -c | sort -rn        # tipos
git log --pretty=%s | grep -oE '\(([a-z-]+)\)' | sort | uniq -c | sort -rn   # escopos
git log --pretty=format: --name-only | grep -E '\.(ts|tsx|prisma|tf)$' \
  | sort | uniq -c | sort -rn | head -30                                     # hotspots

# Frontend — páginas, componentes, kit de UI, gating
find apps/frontend/app -name page.tsx | sed 's|/page.tsx||' | sort
find apps/frontend/app -type d -name components | wc -l
ls apps/frontend/src/components apps/frontend/src/components/ui
grep -roE "useMe|useAuth|PageRole" apps/frontend | wc -l

# Backend — módulos, skeleton, uso de tenancy/permissão
find apps/backend/src/modules -maxdepth 2 -name '*.module.ts' | wc -l
find apps/backend/src/modules/task -type f | sort     # módulo de referência
grep -ro "prisma\.tenancy\." apps/backend/src | wc -l
grep -ro "prisma\.bypassRls\." apps/backend/src | wc -l
grep -ro "@PagePermission" apps/backend/src | wc -l

# Dados — models e convenções
ls apps/backend/prisma/models | head
sed -n '1,80p' apps/backend/prisma/models/task.prisma   # exemplo de referência
```

## Ao reescrever
- Mantenha o formato de cada `patterns/*.md` (premissas + exemplos reais + lista de hotspots).
- Atualize contagens e a lista de áreas/módulos.
- Reveja as divergências de git em `git-conventions.md` (novos tipos/escopos fora do padrão?).
