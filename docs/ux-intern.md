# ux-intern — teste de UI/UX com Playwright

O `ux-intern` é o testador de interface do time. Ele valida a feature **usando o app de
verdade**: sobe o front, navega os fluxos como cada papel de usuário, checa acessibilidade e
avalia UX. A distinção importante é que ele **não controla o browser diretamente** — ele
escreve e executa **testes Playwright**, e o Playwright é quem dirige o browser. O agente é o
autor e o intérprete do teste; o browser é dirigido pela ferramenta.

Ele entra no fluxo do Team Leader no estágio **N+2**, depois do QA, e só quando a feature tem
frontend. A lane dele é estreita por design: só cria/edita `apps/frontend/e2e/**` e o
`playwright.config.ts` — **nunca código de feature**. Bug encontrado volta para o
`frontend-intern` via Leader.

## O ciclo de uma execução

### 1. Pre-flight (obrigatório, antes de qualquer spec)

O ux-intern verifica a instalação de verdade, sem assumir nada:

```bash
pnpm --filter frontend exec playwright --version   # Playwright instalado?
ls apps/frontend/playwright.config.*               # setup já foi feito?
pnpm --filter frontend exec playwright install --dry-run chromium   # browser baixado?
```

Se qualquer item falhar, ele **não improvisa**: reporta ao Leader o checklist do que falta.
O Leader também faz uma versão barata dessa checagem ANTES do dispatch, para não queimar uma
run inteira num ambiente sem Playwright. O setup completo, quando falta:

```bash
pnpm --filter frontend add -D @playwright/test @axe-core/playwright
pnpm --filter frontend exec playwright install chromium
# WSL2: libs nativas do Chromium — exige sudo, portanto é AÇÃO HUMANA (gate):
sudo pnpm --filter frontend exec playwright install-deps chromium
```

Numa branch onde o dev já instalou tudo, o pre-flight passa direto e custa ~2 tool calls.

### 2. Ambiente

Ele precisa do app real no ar — backend + frontend rodando e banco com seed — e de **dois
usuários de teste do mesmo tenant**, um por papel, com credenciais em env:

- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
- `E2E_INDIVIDUAL_EMAIL` / `E2E_INDIVIDUAL_PASSWORD`

Ele não cria esses usuários (isso é do seed/data-intern ou do dev). Ambiente que não sobe em
~2 minutos de tentativas = ele para e reporta o setup pendente, em vez de insistir.

Detalhe do auth: como a sessão é better-auth e o cookie é emitido para o domínio autorizado
nos `ORIGINS` do backend, o baseURL do teste usa `lvh.me` e não `localhost` — com `localhost`
o login falha silenciosamente no teste.

### 3. Login reutilizável (storageState)

Logar a cada teste é lento e frágil. Ele usa o padrão de **global setup** do Playwright: um
script loga UMA vez como cada papel pela própria tela de `/login`, espera o redirect e salva o
estado da sessão (cookies) em `admin.storageState.json` e `individual.storageState.json`. Cada
spec só carrega o arquivo do papel que está testando.

### 4. O spec — modo enxuto por padrão

**Um único arquivo** em `apps/frontend/e2e/<feature>.spec.ts`, só com os fluxos DA feature:

1. caminho feliz como ADMIN e como INDIVIDUAL (a matriz de papéis do plano);
2. o assert central de isolamento — INDIVIDUAL não vê/edita o que não é dele;
3. os asserts de gating de UI que o plano define, e só esses;
4. axe (`@axe-core/playwright`) apenas nas páginas novas/alteradas (máx. 2-3), reportando
   violações serious/critical.

Os seletores saem do plano e dos `data-testid` — ele é **proibido** de ler componentes do
frontend para "entender a tela". Seletor que não existe É um achado, não um obstáculo.

Estados de loading/vazio/erro e o UX heurístico (design-critique + ui-ux-pro-max sobre
screenshots) são o **modo completo**, que só roda quando o Leader pede "UX completo".

### 5. Execução — browser visível por padrão (`ux-browser`)

A escalação do time (gate 0.5) tem a opção **`ux-browser: [visível | headless]`**, default
**visível**: o ux-intern roda `playwright test --headed`, abrindo a janela real do Chromium
para o dev acompanhar os cliques em tempo real. Na aprovação da escalação, diga "headless"
para desligar.

Antes de abrir janela ele checa se há display (`$DISPLAY`/`$WAYLAND_DISPLAY`): vazio (WSL2 sem
WSLg, CI, ssh) = cai para headless **sozinho** e registra "headed indisponível (sem display)"
no relatório. A run nunca trava esperando uma janela que não pode abrir.

Para inspecionar uma execução DEPOIS que acabou, o mais informativo não é assistir ao vivo, e
sim o trace viewer: `pnpm exec playwright show-trace test-results/<pasta>/trace.zip` —
screenshot de cada ação, DOM inspecionável, o que foi clicado. Alternativa interativa:
`pnpm exec playwright test --ui` (timeline com play/pause por passo).

### 6. Relatório e descarte

O relatório de volta ao Leader traz: PASS/FAIL por fluxo e papel (com o passo que falhou),
divergências de gating vs. a matriz do plano, violações de a11y por severidade e página,
achados de UX priorizados (bloqueante / recomendado / nit) e os caminhos de screenshots/trace.

Os artefatos dele são **descartáveis por design**: no fim da run, o `reviewer-intern` remove
da branch os specs e2e, storageState, screenshots e reports (`chore(frontend): remove
artefatos de teste e2e da run`). O `playwright.config.ts` e a devDependency não são removidos
pela automação — o reviewer lista e o dev decide. O valor do ux-intern é o RELATÓRIO, não o
código de teste.

## Restrições que amarram tudo

- **Dieta de tokens**: reporter `line`, saída via arquivo + `tail -40`, trecho do erro com
  `grep` em falha; ~12 tool calls no modo enxuto. Estourou, fecha o relatório com o que tem.
- **Read-only no código de feature**: nunca edita frontend/backend/prisma; nunca aplica
  migration, nunca dá push, roda só contra ambiente local.
- **Não aprova quebrado**: fluxo quebrado, a11y bloqueante ou gating de papel furado nunca
  saem como "aprovado".
- **Commit local**: `test(frontend): e2e e a11y de <feature>` (respeitando a política de
  commit da run, que o Leader passa no dispatch).

## Onde isso vive no plugin

- `agents/ux-intern.md` — o subagent nomeado (prompt + rails de safety-and-git).
- `skills/dev-team-orchestration/references/agents/ux.md` — a fonte do prompt (editou aqui,
  regenera o agent).
- `skills/dev-team-orchestration/SKILL.md` — estágio N+2 do fluxo do Leader: pre-flight antes
  do dispatch e a opção `ux-browser` na escalação.
