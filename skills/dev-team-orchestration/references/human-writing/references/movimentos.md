# Movimentos retóricos por gênero

Usado no **Portão 2**. Estas são sequências de *movimentos*, não títulos de seção. Um
movimento é uma coisa que o texto faz com o leitor. Um título é só um rótulo.

A regra transversal: **nenhum movimento de proposta pode vir antes de um movimento de
objeção.** É o alvo direto do salto apoio→proposta que separa texto de LLM de texto
humano.

---

## Relatório, análise, documento de decisão

Abertura em SCQA, corpo em evidência, fechamento em decisão.

1. **Situação**: o que é estável e todo mundo aceita. Duas ou três frases, não uma
   página. Se o leitor já sabe, encurte para uma linha.
2. **Complicação**: o que mudou, quebrou ou contradiz o esperado. É o MAS do ABT.
3. **Pergunta**: a decisão que a complicação obriga. Explícita, em forma de pergunta.
4. **Resposta / tese**: a recomendação, já aqui. Quem lê para decidir não espera.
5. **Mecanismo**: *por que* é assim. É o movimento que o texto de LLM mais pula, e é
   o que o leitor chama de "explicação". Números, cadeia causal, o que causa o quê.
6. **Objeção mais forte**: a melhor razão para não fazer o que você recomendou,
   escrita com honestidade e não como espantalho.
7. **Resposta à objeção**: ou a admissão de que ela procede e o que isso muda.
8. **Consequência**: o que acontece se seguir, o que acontece se não seguir, e o
   primeiro passo concreto com dono e prazo.

Anti-padrão a evitar: "Contexto / Análise / Desafios / Próximos passos". Isso é
formulário. A seção "Desafios" em particular é um tell clássico e quase sempre vira
lista de dificuldades genéricas em vez de uma objeção real.

---

## Spec, SOP, documento de processo

Antes dos movimentos, decida o **tipo Diátaxis** e não misture, porque misturar é a
razão número um de doc ilegível:

- **Tutorial**: aprendizado guiado, o leitor não sabe nada, você conduz.
- **How-to**: resolver uma tarefa específica, o leitor já sabe o contexto.
- **Referência**: consulta, estrutura previsível, nada de narrativa.
- **Explicação**: entendimento, é onde o "porquê" mora.

Um documento, um tipo. Se você precisa dos quatro, são quatro documentos com links.

Movimentos para spec e SOP:

1. **Gatilho**: quando esta coisa é usada. Primeira linha, sempre.
2. **Resultado**: o que existe no mundo quando isto termina.
3. **Pré-condições**: o que precisa ser verdade antes. Inclui permissões e acessos.
4. **Passos**: imperativos, um por linha, com o comando ou clique exato.
5. **Exceções e casos de borda**: o que o autor sabe e não escreveu é onde o
   processo quebra na prática.
6. **Falha e reversão**: o que fazer quando dá errado, e como voltar.
7. **Dono**: quem responde quando isto quebra.

Regra de terminologia: **um conceito, uma palavra, sempre a mesma.** Rotação de
sinônimos (*terminology drift*) faz o leitor achar que está lendo três coisas
diferentes. É um dos tells mais fortes de texto de LLM em documentação.

---

## Artigo, post, texto autoral longo

1. **Abertura concreta**: uma cena, um número estranho, um caso específico. Nunca
   "no cenário atual" nem "em um mundo cada vez mais".
2. **Nut graf**: o parágrafo logo depois da abertura que diz por que este texto
   existe e por que agora. Sem ele, o leitor engaja mas não sabe para onde está
   sendo levado.
3. **Tese**: a afirmação que você defende, em uma frase, e que alguém razoável
   poderia contestar. Se ninguém pode discordar, não é tese.
4. **Evidência em blocos**, cada bloco com sua própria proposição enunciada no
   título. Blocos ordenados por força, não por ordem cronológica de como você
   descobriu.
5. **A objeção que o leitor inteligente está fazendo**: enderece antes que ele
   pare de ler.
6. **Fechamento no específico.** Corte o parágrafo que diz que o futuro é promissor.
   Termine no último fato concreto, ou numa consequência que o leitor pode agir.

---

## E-mail e comunicação curta (< 300 palavras)

Pipeline reduzido, e isso é deliberado: em prosa expositiva curta o modelo já escreve
bem, e rigor estrutural extra só piora.

1. **O pedido ou a notícia, na primeira frase.** Nada de rampa de aquecimento.
2. **O mínimo de contexto que torna o pedido respondível.**
3. **A ação, com dono e prazo.**

Um ABT mental antes de escrever, um passe de Portão 5 depois. Só isso.
