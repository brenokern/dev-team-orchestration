# team-view v2 — proposta de direção visual

> Branch `design/viewer-v2`. Nada aqui altera a estrutura do viewer (HTML único, GSAP embutido,
> hooks → NDJSON → SSE, plan-graph em colunas, motor de sprite por linhas de texto). Muda o que a
> cor **significa**, a anatomia do card, a proporção dos personagens e a hierarquia do cabeçalho.
> Abra `mockup.html` no browser para ver tudo em dark e light, lado a lado.

## 1. O que o viewer é, e para quem

Um COO e alguns devs assistindo um time de agentes executar um plano. O trabalho da tela é
**consciência situacional**: o que está rodando agora, o que está travado em mim, quanto custou.
Tudo o que não serve a essas três perguntas é decoração — e o viewer de hoje tem bastante.

Restrições do brief, respeitadas: minimalismo, **mesma paleta** (nenhuma cor nova; só dois
neutros a mais para o contorno dos sprites, ver §4), personagens mais sóbrios mantendo a lógica
de animação (andar → sentar → pensar → sofá).

## 2. O que está errado hoje

Cada ponto tem uma evidência nos screenshots (`atual-*.png`) ou no código.

1. **Hierarquia plana.** Card concluído, rodando e pendente têm o mesmo tamanho, a mesma moldura
   dupla (`n-shell` + `n-core`, 3px + 5px de padding) e o mesmo peso. O único diferenciador de
   estado é a cor da borda. No `fit` padrão (45%) nenhum título é legível — a tela abre num
   estado em que nada pode ser lido.
2. **O verde não significa nada.** Ele é: borda do card, rótulo da camada, check, aresta acesa,
   número da métrica, chip "som on", badge sob o personagem, ponto de status. Quando uma cor
   marca oito coisas, ela deixa de marcar "vivo".
3. **A métrica é a menor coisa do card.** Ações, duração e token — o dado que justifica o viewer
   existir — ficam em 11px, alinhados à direita, na base, depois de uma linha vazia. O título
   ocupa 60% da altura.
4. **Três vozes tipográficas por card.** Mono em caps espaçado (camada), sans 14.5 (título), mono
   verde (métrica). Nenhuma delas carrega informação que a outra não carregue.
5. **Palco 90% vazio.** Passo de coluna 240px, gap de linha 232px, lounge estacionado 620px à
   esquerda. O dev passa o tempo dando zoom.
6. **Cabeçalho sem hierarquia.** `gantt`, `runs` (vistas) e `som`, `tema`, `PT-BR` (ajustes) são
   sete pílulas idênticas. Sete decisões por linha, todas com o mesmo peso.
7. **Personagens de jogo.** Grade 12×17: a cabeça é metade do corpo (~2 cabeças). O papel é a cor
   do cabelo (roxo, rosa, laranja saturados). Sofá rosa, TV, badge verde-limão sob quem trabalha.
   É simpático e é jovem — exatamente o que o brief pede para mudar.
8. **Stream sem agrupamento.** Cada tool call é uma linha igual; o papel em caps verde; nada
   diz a qual passo a linha pertence. Gantt com pílulas de 8px sem rótulo.
9. **Decoração que compete:** orbs desfocados, grain, glow, anel pulsante na cadeira. Cada um é
   sutil; somados, dão a textura "gerado" que o brief quer evitar.

## 3. Direção: sala de controle

O mundo do assunto é engenharia: plan-graph, commits, diffs, cronômetro. O vocabulário visual vem
daí — painel de instrumentos, quadro de horários, prancheta — não de jogo.

### 3.1 Tokens

**Os mesmos.** `--bg`, `--core`, `--txt/--dim/--faint`, `--live` (verde), `--hold` (âmbar),
`--edge`, `--body/--body2`. O que muda é a regra de uso:

| token | hoje | proposta |
|---|---|---|
| `--live` | borda, rótulo, check, aresta, métrica, chip, badge | **só o que está rodando agora**: ponto, cronômetro e rail do card ativo, aresta que leva a ele |
| `--txt` (tinta) | título | título, id, **rail do concluído**, check |
| `--hold` | gate humano | gate humano, badge "+1" de correção |
| `--faint` | rótulos | tudo o que é pendente |

Dois neutros novos, só para sprite (`--sp-out`, `--sp-shirt`, `--sp-pants`): o contorno
`#16161c` de hoje some no fundo `#050505` — por isso os personagens atuais dependem do cabelo
saturado para existir. São cinzas derivados dos que já há; não são cor.

### 3.2 Tipografia

Mesmas fontes (Geist + Geist Mono), redistribuídas. **Mono é a voz do instrumento** — id, camada,
cronômetro, métricas. Sans só no título. Uma escala:

- id `10.2` — mono 10.5 / 500 / `--txt`
- camada `backend` — mono 10.5 / 400 / `--dim` (sem caps, sem letter-spacing)
- título — sans 13 / 400 / `--txt`, 2 linhas no máximo
- métricas — mono 10 / `--dim`, número em `--txt`

### 3.3 Card v2 (a assinatura: o rail)

```
┌──────────────────────────────┐
│ 10.3  backend         ● 0m31 │  id · camada · ponto de estado + cronômetro
│ regra de badge (teto 3,      │  título
│ 10 dias)                     │
│ ▮▮▮▮▮▮▮░░░░░░░░░░░░░░░░░░░░  │  RAIL — o tempo do passo, vivo
│ 2 ações · —      backend-int │  métricas · quem
└──────────────────────────────┘
```

- Uma borda de 1px, raio 6. Sem moldura dupla.
- **O rail** é uma faixa de 3px que preenche com o tempo do passo. Rodando: verde com tracejado
  animado. Concluído: tinta, cheio. Pendente: hairline. Humano: tracejado âmbar. É **o mesmo
  desenho do Gantt** — o Gantt v2 são esses rails deitados na linha do tempo, e o card é um rail
  com contexto. Uma ideia, duas vistas.
- Altura cai de ~150px para ~88px. Isso permite `COLW` 208 e `ROWGAP` 150 sem mexer no algoritmo
  de layout (só nas constantes).
- Correção pós-revisão: badge `+1` âmbar no cabeçalho e métrica "✓ 2 rodadas" — em vez de um
  "1/1 EXTRA" que hoje parece um erro.

### 3.4 Cabeçalho

Esquerda: o que se **lê** — `● 22f17ceb · 1.3M tok · 4 / 17`. Centro-direita: o que se
**escolhe ver** — segmentado `fluxo | gantt | runs`. Um menu `⋯` para o que raramente muda
(som, tema, idioma, colunas). `zen / fit / foco` continuam na barra de zoom.

### 3.5 Stream e Gantt

- Stream **agrupado por passo**: uma linha-cabeçalho por passo (`10.2 service e controller ·
  backend · 6 ações`) e os tool calls indentados abaixo, em `--dim`. Papel em mono cinza, não
  verde. Verde só no cabeçalho do passo que está rodando. Vereditos do Leader continuam como
  callouts.
- Gantt = rails, com o id dentro da barra quando cabe e a duração à direita. Sem pílulas de 8px.

### 3.6 Palco

- Grade pontilhada discreta (`--hair-soft`, 18px) como referência de escala. Sem orbs, sem grain,
  sem glow.
- Lounge vira um **banco** em tinta no canto inferior esquerdo, com quem espera sentado. Sem TV,
  sem sofá rosa. O status `na tv` do roster vira `em espera`.
- Mesa: um tampo, dois pés, um monitor — em tinta, 4 retângulos.
- Anel pulsante na cadeira sai; o rail do card já diz "vivo".

### 3.7 Movimento

Mantido: andar (dois quadros alternados), sentar de costas, bob na espera, balão de pensamento,
fagulha na aresta ao concluir. Acrescentado: o rail animado. Retirado: pulso na cadeira, glow.
**`prefers-reduced-motion` passa a ser respeitado** (hoje não é): rail estático, sem walk
interpolado — o personagem simplesmente aparece na mesa.

## 4. Personagens — os do pixel-agents, idênticos (v4, na branch)

Duas rodadas foram descartadas na sua revisão: a v2 (pernas grossas, contorno preto) e a v3
(estilo "inspirado", ainda com diferenças). A v4 usa **os mesmos assets do pixel-agents**: os
PNGs de `webview-ui/public/assets` (personagens `char_0..5`, `DESK_FRONT`, `PC_FRONT_ON_1..3`,
`PC_FRONT_OFF`, `CUSHIONED_CHAIR_BACK`) convertidos pixel a pixel para linhas de texto + paleta —
verificado igual ao original em cada pixel. Crédito: pack *JIK-A-4 Metro City* (itch.io), via
pixel-agents (MIT). Nada foi redesenhado; `sprites-v4/pa-assets.json` é a fonte.

- 6 personagens para 10 papéis: `backend`→char_0, `frontend`→char_1, `data`→char_2,
  `leader`→char_3, `reviewer`→char_4, `qa`→char_5; `ai`, `infra`, `ux` e `pr-writer` reusam um
  sheet com a **roupa** deslocada em matiz (pele e cabelo preservados), como o próprio
  pixel-agents faz para variar agentes. Papel novo no roster: sheet e matiz por hash do nome.
- Quadros: `stand` (frente, quadro neutro da caminhada), `walk0-2` (lateral, ciclo 0-1-2-1 a
  150ms — `WALK_FRAME_DURATION_SEC` deles), `type0-1` e `read0-1` (de costas). **Read/Grep/Glob/
  WebFetch mostram o quadro de leitura; Edit/Write/Bash, o de digitar** — a mesma regra do
  pixel-agents (`typing` × `reading`).
- A cor do papel no roster e nas arestas passa a ser a cor da camisa do boneco.

**Estação de trabalho — a geometria do pixel-agents, em pixels de sprite:** mesa `(0,0)` 48×32;
PC `(16,0)` em cima da mesa (top-anchored na mesma linha, como no layout deles); cadeira
`(16,32)` 16×16; personagem sentado em `(16, 22)` = `32 + 16 + CHARACTER_SITTING_OFFSET_PX(6) −
32`. A cabeça fica sobre a borda de baixo da mesa, o tronco atrás do encosto verde (z acima do
personagem — `Back-facing chairs render IN FRONT of the seated character`, do
`layoutSerializer.ts` deles). `SEAT`/`CHAIR`/`PC` derivam todos de `DESK(s)`.

**Telas dos PCs:** acesas e animadas (3 quadros a 420ms) onde há alguém sentado — mesa do passo
ou baia —, apagadas onde não há. Um único ticker cuida de todas.

**Baias:** bloco 3×3 de estações à esquerda, uma fixa por papel. Todo mundo começa na sua baia
teclando meio AFK (rajadas com pausas de 3–7s); despachado, caminha até a mesa do passo; ao
terminar, volta. `na tv` → `na baia`.

Verificado em chromium headless: chegada exata em `SEAT`, quadros alternando, PCs acendendo
com a ocupação, 150 checagens do `viewer/test.mjs` passando. Para reaplicar em outra base:
`python3 docs/viewer-v2/sprites-v4/patch_v4.py viewer/index.html` (parte do `index.html` da
main + `fix/viewer-varredura`). Screenshots: `v4-*.png`.

## 5. Ferramentas de animação avaliadas

| ferramenta | veredito | por quê |
|---|---|---|
| **GSAP skills** (oficial, greensock) | **usar** | O viewer já embute GSAP. As skills `gsap-core`, `gsap-timeline`, `gsap-performance` ensinam o agente a sequenciar e a evitar os erros clássicos (tweens concorrentes no mesmo alvo — que é exatamente o que `chain()` gerencia à mão hoje). `/plugin marketplace add greensock/gsap-skills`. |
| **motion-design-skill** (LottieFiles) | **usar** | Princípios, não biblioteca: timing, easing, coreografia, personalidade de movimento. Serve para o passe de motion da v2 (o rail, a chegada na mesa). `npx skills add LottieFiles/motion-design-skill`. |
| **Remotion** (+ Remotion Agent Skills) | **não** | Remotion é React renderizando **vídeo/stills** offline. O viewer é HTML único, sem React, dirigido por eventos ao vivo — não há onde encaixar. O único uso plausível seria como pipeline offline para renderizar sprite sheets, mas nossos sprites são linhas de texto de 16 colunas; um toolchain React para isso é desproporcional. |
| **Rive** | **não** | Rig vetorial com state machine — ótimo para mascotes, mas exige o editor Rive e um runtime WASM em tempo de execução. Quebra o princípio zero-deps/arquivo único que dá ao viewer a robustez que ele tem. Fica como caminho se um dia a opção B virar desejo. |
| **Lottie** | **não** | Mesmo argumento do Rive, com menos controle de estado. |

Fontes: [Remotion — Agent Skills](https://www.remotion.dev/docs/ai/skills) ·
[greensock/gsap-skills](https://github.com/greensock/gsap-skills) ·
[LottieFiles/motion-design-skill](https://github.com/lottiefiles/motion-design-skill) ·
[Rive — Web (JS)](https://help.rive.app/runtimes/overview/web-js) ·
[Slynyrd — Pixelblog 17: Human Anatomy](https://www.slynyrd.com/blog/2019/5/21/pixelblog-17-human-anatomy) ·
[Tella — Remotion skills com Claude Code](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code)

## 6. Plano de implementação (sem mudar a estrutura)

Cada fase é um PR pequeno, verificável com `node viewer/test.mjs` (as 150 checagens continuam
valendo — nenhuma depende de CSS) e com screenshots dark/light.

1. **Tokens + card + cabeçalho.** CSS do card v2, regra de uso do verde, `COLW/ROWGAP` novos,
   segmentado + menu. Zero mudança de JS de estado. *Risco: baixo.*
2. **Sprites A.** Trocar as linhas de `HEAD/FACE/BODY/SITBACK` pelas de `sprites-v2.json`,
   `px` 3 → 2, paleta `colorOf` dessaturada, tokens `--sp-*`. Banco no lugar do sofá/TV; mesa em
   tinta. *Risco: baixo — mesmo contrato.*
3. **Stream agrupado + Gantt em rails.** Mudança de render, não de estado (o `stepId` de cada
   evento já existe via `aidStep`). *Risco: médio — é a maior mudança de DOM.*
4. **Passe de motion.** Rail animado, retirar pulso/glow, `prefers-reduced-motion`. Com as skills
   GSAP + motion-design instaladas. *Risco: baixo.*

## 7. Decisões que são suas

1. ~~A ou B~~ — decidido: assets do pixel-agents, idênticos (v4), já na branch.
2. ~~Banco sem TV~~ — decidido: baias 3×3 com AFK.
3. **Grade pontilhada** no palco ou fundo liso?
4. O segmentado `fluxo | gantt | runs` substitui os chips — ou você quer o Gantt como painel
   lateral inferior permanente, já que agora ele é o mesmo desenho dos cards?

## 8. Varredura de bugs (branch `fix/viewer-varredura`)

Quatro bugs latentes, cada um reproduzido antes de corrigir, todos cobertos por fixture:

1. **recon fechava o re-despacho** — lista acumulada do transcript fechava a 2ª rodada de um
   passo pelo `tool_result` da 1ª. Agora cada conclusão é consumida uma vez e recon não fecha
   passo vivo (< 45s de silêncio).
2. **HTML de tool call executava no stream** — `grep '<Button>'` sumia; `<img onerror>` rodava.
   Tudo que vem de evento agora é escapado.
3. **5 min de silêncio "encerrava a sessão"** com build rodando. Silêncio só informa.
4. **Hook de outra sessão no mesmo projeto roubava o viewer** (reload a cada hook alheio). O
   Leader agora se identifica (`run-<cwd>`) e o cli nunca troca de sessão com plano para uma sem.

Dois **riscos de desenho** (não bugs) que a v2 deve considerar:
- `resolveWaitingGates()` aprova **todos** os gates em espera ao primeiro dispatch. Se um gate
  de migration ficou aberto e o Leader despacha algo não relacionado, o card âmbar apaga sem
  ninguém aprovar. Vale restringir a auto-cura ao gate cujo dependente começou.
- `bindStep` cai no "primeiro pendente do papel" quando a description não traz o id. Com a
  regra nova da SKILL (id obrigatório) isso some; sem id, um passo fora de ordem cola no card
  errado.

E o pedido de pt-BR: as strings visíveis do viewer já estavam acentuadas; faltavam o toast do
`emit.mjs`, as mensagens de console do `cli.mjs`, duas strings minhas e — o principal — as
**notas e gates que o Leader escreve** em ASCII por medo de aspas no Bash. A SKILL agora exige
pt-BR correto nesses textos.
