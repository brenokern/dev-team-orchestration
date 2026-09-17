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

## 4. Personagens — implementado na branch (v3, estilo pixel-agents)

A primeira rodada (v2, `sprites-v2.json`, pernas grossas e proporção "de frente") foi
descartada depois da sua revisão. A referência passou a ser o **Pixel Agents** que você já roda
no VS Code: personagens do pack *JIK-A-4 Metro City* (MIT no repo do pixel-agents; aqui o
estilo é reproduzido, não copiado), 16×32 em vista 3/4 top-down.

O que define o estilo, e foi reproduzido em `sprites-v3/`:
- **sem contorno preto** — a borda é o tom mais escuro do próprio material;
- **3 tons por material** (cabelo com brilho, pele com sombra, camisa com luz);
- cabeça redonda grande (~10 linhas), corpo curto, pernas de 3px com vão de 2px — é a proporção
  do pack, não a "adulta" da v2; o que faz parecer adulto é o acabamento, não a anatomia;
- guarda-roupa real: marinho, carvão, off-white, oxblood, oliva; jeans, cáqui, calça escura;
- 4 variantes de cabelo (curto, bob, cacheado, raspado) × 5 cores; 3 tons de pele. Os 9 papéis
  + leader estão na tabela `V3ROLES`; papel novo no roster sorteia variantes por hash do nome;
- o papel aparece **só no cordão do crachá** (3px pelo peito, cor dessaturada).

Poses e animação — mesma lógica do viewer, mais cuidado com o sentar:
- `stand` (frente) · `walk0/1/2` (lateral; ciclo 0-1-2-1 a 150ms, como o pack) ·
  `type0/type1` (de costas, teclando). `sit` e `sitback` do código antigo mapeiam para `type`.
- **Sentar deriva da mesa, não do card.** `SEAT(s)` e `CHAIR(s)` são calculados a partir de
  `DESK(s)` com deslocamentos fixos em pixels de sprite (`SIT_DX/SIT_DY`, `CHAIR_DX/CHAIR_DY`).
  Geometria, como no pixel-agents: topo do personagem = topo da mesa + 14 linhas — a cabeça fica
  sobre a metade de baixo da mesa (em frente ao monitor), o tronco já abaixo dela, e o **encosto
  da cadeira (z-index 7) cobre o quadril**. É o encosto na frente que faz "sentado" ler como
  sentado. Ao sentar, `gsap.set(y:0)` zera qualquer resto do `bob()` — era isso que abria um vão
  entre tronco e encosto.
- Teclar: trabalhando = quadros a 300ms; **AFK** = rajadas de ~500ms com pausas aleatórias de
  3–7s. Um único timer por personagem (`startType/stopType`), zerado em qualquer outra pose.

**Sofá e TV saíram. Entraram baias.** Um bloco 3×3 de mesas à esquerda; cada papel tem baia fixa
(ordem do roster). Todo mundo começa na sua baia teclando meio AFK; quem é despachado caminha
até a mesa do passo; ao terminar, volta para a mesma baia. O status do roster `na tv` virou
`na baia`. O `sitCouch` continua existindo como nome (aliás `sitBay`) para não tocar nos
chamadores.

Verificado em chromium headless: chegada exata em `SEAT(s3)` depois de uma caminhada de
1.240px; AFK alternando quadros nas baias; teclado a 300ms na mesa; F5 preserva assentos.
As 150 checagens do `viewer/test.mjs` continuam passando — a máquina de estados não foi tocada.

Screenshots: `v3-palco-*.png`, `v3-sentado-*.png`, `v3-sprites-*.png`. Para regerar o patch:
`python3 docs/viewer-v2/sprites-v3/patch_v3.py viewer/index.html` (parte do `index.html` da main).

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

1. ~~A ou B~~ — decidido: estilo pixel-agents (v3), já na branch.
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
