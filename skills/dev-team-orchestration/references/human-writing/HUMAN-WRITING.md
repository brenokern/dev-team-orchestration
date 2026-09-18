> **Vendorizado da skill `human-writing` v1.0.0 (MIT) para o plugin dev-team-orchestration.**
> Não é uma skill autônoma: é referência do `frontend-intern` (texto de interface) e de
> quem mais escrever prosa na run. Texto integral preservado; só o frontmatter virou esta
> nota. Atribuição em `ATTRIBUTION.md`; o Portão 5 usa `references/humanize-vendored.md`
> (MIT, `LICENSE-humanize`).


# human-writing

Texto de LLM não cansa por causa das palavras. Cansa porque o argumento não existe
antes da prosa começar, e a prosa então preenche o vazio com estrutura genérica. Esta
skill inverte a ordem: **a estrutura tem que existir e ser inspecionável antes de
qualquer parágrafo ser escrito**, e a limpeza de vocabulário é a última coisa que
acontece, nunca a primeira.

## O que sustenta cada regra

Três achados definem o desenho. Não são opinião de estilo.

Detectores lexicais de texto de máquina ficam em ~50% de acurácia (chute) em texto
longo; detectores de **relações de discurso** sobem para 70%. A assinatura é
estrutural. Segundo, *instruction tuning* melhora diversidade lexical e **reduz** a
sintática, ou seja, otimizar palavras trata a camada que já não é o gargalo.
Terceiro, LLMs saltam de "apoio" direto para "proposta" em 29,4% dos parágrafos
contra 12,3% dos humanos: o modelo pula o contra-argumento, que é onde o raciocínio
aparece. As fontes estão em `references/evidencia.md`.

Uma consequência prática que contraria a prática comum: **loops genéricos de
auto-crítica não funcionam**. Pedir "revise e melhore" ao mesmo modelo não melhora
nada em condições justas. O que funciona é decompor a revisão em checagens binárias.
Por isso o Portão 4 é um checklist de sim/não, e não um pedido de melhoria.

---

## O pipeline: cinco portões

Cada portão tem uma saída verificável. **Não avance com o portão anterior aberto.**
Se o usuário pediu pressa, você pode fundir os Portões 1 e 2, mas nunca pular o 3.

### Portão 0: Calibrar pelo gênero (30 segundos, obrigatório)

O colapso estrutural é fenômeno de **texto longo, argumentativo ou autoral**. Em
prosa expositiva curta o modelo já escreve bem, e rigor extra piora. Classifique
antes de tudo:

| Gênero | Pipeline |
|---|---|
| E-mail, mensagem, update curto (< 300 palavras) | Portão 1 mínimo (um ABT em uma linha) + Portão 5. Nada mais. |
| Relatório, análise, documento de decisão | Pipeline completo. |
| Spec, SOP, doc de processo | Pipeline completo, com Diátaxis no Portão 2. |
| Artigo, post, texto autoral longo | Pipeline completo, com nut graf obrigatório. |
| Referência, tabela, changelog, dados | Só Portão 5. Estrutura já é dada pelo formato. |

Registre também **quem lê**: leitor interno que já conhece o assunto tolera menos
sinalização; leitor externo precisa de coesão máxima. Existe efeito medido de coesão
reversa (especialista aprende mais com texto menos costurado), então não é uma
questão de gosto. Na dúvida, assuma leitor externo: o custo do erro é assimétrico.

### Portão 1: O ABT: existe um argumento?

Antes de qualquer outra coisa, escreva o documento inteiro em **três frases**:

- **E** (situação estável, o que o leitor já aceita)
- **MAS** (a complicação, a tensão, o que quebrou ou contradiz)
- **PORTANTO** (a consequência, a tese, o que muda)

**Se você não consegue escrever o MAS, você não tem um documento, tem uma lista.**
Pare e diga isso ao usuário em vez de escrever mil palavras de exposição plana. Um
texto sem "mas" é o padrão AAA: fatos ligados por "e", que é exatamente o que não
gruda.

Cheque também: o MAS é uma tensão real ou uma dificuldade decorativa ("apesar dos
desafios...")? Complicação genérica é o mesmo que nenhuma.

Saída do portão: três frases escritas, mostradas ao usuário se ele estiver presente.

### Portão 2: Arquitetura: os movimentos, não os títulos

Escolha a sequência de **movimentos retóricos** da estrutura, não uma lista de
seções genéricas. "Contexto / Análise / Conclusão" não é arquitetura, é um formulário
em branco. As sequências por gênero estão em `references/movimentos.md`.

Duas regras que valem para todos os gêneros:

**Contra-argumento antes de recomendação.** Este é o alvo direto do salto
apoio→proposta. Nenhuma seção pode propor uma ação sem que a objeção mais forte
tenha sido escrita e respondida antes. Se a objeção não existe, diga que a decisão é
óbvia e encurte o documento.

**Cada seção tem uma proposição única, enunciável em uma frase.** Se você não
consegue escrevê-la, a seção não existe ainda. Títulos enunciam a proposição
("O gargalo é o repasse, não a capacidade"), nunca rótulos ("Análise operacional").
Isso tem base empírica: sinalização estrutural produz g = 0,38 em recordação e
g = 0,58 em sumarização.

Saída do portão: lista de seções, cada uma com sua proposição em uma frase.

### Portão 3: Frases-tópico primeiro (o portão que não se pula)

**Escreva apenas a primeira frase de cada parágrafo do documento inteiro. Nenhum
parágrafo. Só as frases-tópico, em sequência.**

Depois leia essa sequência sozinha, do começo ao fim, e responda:

1. Ela se lê como um argumento completo, sem os parágrafos?
2. Cada frase se liga à anterior por algo já dito, e não por um salto?
3. Alguma frase-tópico é vazia ("Além disso, há outros fatores a considerar")?
4. Alguma seção tem três frases-tópico dizendo a mesma coisa com sinônimos?

Conserte aqui. Consertar a estrutura em frases-tópico custa vinte linhas; consertar
depois custa o documento inteiro, e na prática ninguém conserta, só maquia.

Só depois de a sequência fechar, expanda cada frase-tópico em parágrafo.

### Portão 4: Auditoria binária (nunca "melhore isso")

Rode `references/checklist.md` item a item. Cada item é sim/não e cada "não" aponta
o trecho específico. **Não peça a si mesmo uma avaliação geral de qualidade**, porque isso
é justamente o que a literatura mostra não funcionar.

Os cinco itens que mais pegam, em ordem de frequência:

1. **Dado antes de novo.** Toda frase abre com material que o leitor já tem
   (mencionado na frase anterior, termo já definido) e termina com o que é novo.
   Violação sistemática é o que se lê como "não flui". Custo medido: 181 ms por
   frase quando o antecedente é só indireto.
2. **Lista disfarçando raciocínio.** Bullet só para itens genuinamente paralelos e
   independentes (inventário, opções, checklist). Havendo relação causal, temporal,
   condicional ou de importância desigual, **vira prosa**, porque a prosa obriga a
   nomear a relação e o bullet permite não se comprometer. Se a lista *é* o
   argumento, o argumento não foi escrito.
3. **Sujeito é personagem, verbo é ação.** Caçar nominalização: "a implementação da
   revisão resultou numa redução" apaga quem fez o quê. Vira "revisamos X e o custo
   caiu Y".
4. **Maldição do conhecimento.** Cada termo técnico, sigla e referência interna
   passa pelo teste "um leitor competente mas de fora saberia disso?". Releitura
   própria não corrige esse viés; só a checagem item a item corrige.
5. **Toda afirmação tem lastro.** Número, fonte, ou a admissão explícita de que é
   estimativa. Sem inventar nada.

Saída do portão: a lista de "não" com o trecho, e a correção aplicada.

### Portão 5: Vocabulário (o último passo, sempre)

Só agora. Aplique `references/humanize-vendored.md` integralmente sobre o texto já
estruturado, em **modo embutido**: rode o loop internamente e produza só o texto
final, sem cerimônia, sem audit colado na resposta.

Duas restrições que esta skill impõe sobre o vendorizado:

- **Nada no Portão 5 reabre decisão estrutural.** Se a limpeza lexical quiser fundir
  parágrafos, cortar seção ou mudar a ordem, isso é sinal de que um portão anterior
  falhou. Volte ao portão certo, não conserte por baixo.
- **O banimento de travessão e meia-risca continua absoluto**, inclusive em títulos e
  tabelas. Antes de entregar, procure de fato pelos caracteres:

```bash
grep -n '[—–]\|--' arquivo.md
```

---

## O que NÃO fazer

- **Não rode "escreva → critique → revise" genérico.** Não melhora o texto, e boa
  parte da melhora aparente vem de o primeiro rascunho ter sido fraco de propósito.
- **Não regenere para escapar da fórmula.** Os padrões repetidos são ecoados entre
  gerações e atravessam modelos diferentes. Só restrição quebra o atrator.
- **Não use Flesch-Kincaid, nível de série, nem auto-nota de legibilidade.** Medidas
  desse tipo têm correlação baixa e frequentemente não significativa com facilidade
  real de leitura medida por rastreamento ocular.
- **Não verbalize por que uma frase é bonita antes de escrevê-la.** Raciocínio
  explícito ajuda em tarefa combinatória (estrutura) e atrapalha em julgamento
  holístico (estética da frase).
- **Não force o número de sub-argumentos.** Se há duas razões, apresente duas. A
  pirâmide aplicada mecanicamente vira gerador de três razões por afirmação.
- **Não trate MECE como exigência.** É teste diagnóstico de sobreposição. Forçar
  exaustividade produz taxonomia artificial ou uma categoria "outros" que esconde o
  que importa.

---

## Modos de invocação

**Texto novo.** Rode os cinco portões na ordem. Mostre ao usuário a saída do Portão 1
e do Portão 3 antes de expandir, se ele estiver presente; em execução autônoma,
registre as duas no início do arquivo de trabalho e siga.

**Revisão de texto existente.** Faça engenharia reversa: extraia as frases-tópico do
texto atual e leia a sequência isolada (Portão 3 aplicado ao que já existe). É aí que
o problema aparece, quase sempre como uma sequência que não fecha. Diagnostique
primeiro, reescreva depois, e diga ao usuário qual portão o texto original falhou.

**Modo arquivo.** Reescreva no lugar, deixando só a versão final. Não toque em bloco
de código, frontmatter, dados ou link. Reporte um resumo curto, não cole o texto
inteiro de volta.

**Modo embutido.** Outra tarefa usa isto como uma etapa. Rode tudo internamente e
devolva só a prosa.

---

## Antes de acreditar que esta skill funciona

O guia de autoria de skills da Anthropic pede baseline antes de documentação, e a
maior parte das skills de escrita públicas nunca fez isso. `references/eval.md` traz
o protocolo mínimo: três cenários, execução com e sem a skill, e as assertions
binárias. Rode antes de adotar em produção, e de novo depois de qualquer edição no
SKILL.md.

## Referências

- `references/movimentos.md`: sequências de movimentos retóricos por gênero
- `references/checklist.md`: auditoria binária completa do Portão 4
- `references/humanize-vendored.md`: limpeza lexical, Portão 5 (MIT, ver LICENSE-humanize)
- `references/eval.md`: protocolo de baseline
- `references/evidencia.md`: fontes de cada regra, por força de evidência
