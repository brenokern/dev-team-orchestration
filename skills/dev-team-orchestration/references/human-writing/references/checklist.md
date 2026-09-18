# Checklist do Portão 4: auditoria binária

Cada item é **sim ou não**, e todo "não" aponta um trecho específico. Não responda de
memória: procure no texto. Não substitua isto por uma avaliação geral de qualidade,
porque avaliação geral gerada pelo próprio modelo não melhora o texto.

Formato de resposta interna, um item por linha:

```
A3  NÃO  §2 par.4 "A implementação da revisão resultou..."  -> "Revisamos o repasse e o SLA caiu de 9 para 4 dias"
```

---

## A. Argumento

- **A1.** O ABT dos três movimentos está escrito e o MAS é uma tensão real, não uma
  dificuldade decorativa?
- **A2.** Existe pelo menos uma objeção séria escrita *antes* de qualquer
  recomendação?
- **A3.** Toda recomendação tem um mecanismo antes dela: o texto diz *por que*
  funciona, não só que funciona?
- **A4.** Cada seção tem uma proposição única, e o título a enuncia em vez de rotular?
- **A5.** Alguma afirmação central ficaria de pé se um leitor hostil a atacasse? Se
  não, ela é qualificada honestamente ou cortada?
- **A6.** O número de sub-argumentos é o número real, e não três por hábito?

## B. Fluxo (dado antes de novo)

- **B1.** Cada frase abre com material já presente na frase anterior, num termo já
  definido, ou em conhecimento seguramente compartilhado?
- **B2.** Algum termo aparece com artigo definido ("o problema de X") antes de X
  existir no texto?
- **B3.** Alguma frase exige que o leitor construa uma ponte inferencial que o texto
  poderia ter dito explicitamente?
- **B4.** A informação que você quer que fique aparece no **fim** da frase, e não
  enterrada no meio nem seguida de uma ressalva burocrática?
- **B5.** As relações entre parágrafos estão nomeadas ("porque", "mas", "portanto"),
  em vez de justapostas?
- **B6.** Alguma seção tem três frases-tópico dizendo a mesma coisa com sinônimos
  diferentes?

## C. Forma

- **C1.** Toda lista contém itens genuinamente paralelos e independentes? Se há
  relação causal, temporal, condicional ou de importância desigual, virou prosa?
- **C2.** A lista está fazendo o trabalho de um argumento? (Se a lista *é* o
  argumento, o argumento não foi escrito.)
- **C3.** Existe bullet aninhado além de um nível? (Não pode.)
- **C4.** Os sujeitos gramaticais são os personagens reais da história, e os verbos
  são as ações?
- **C5.** Existe nominalização carregando a ação principal de alguma frase?
- **C6.** Um conceito, uma palavra, sempre a mesma? Alguma rotação de sinônimo
  (*terminology drift*)?
- **C7.** Há variação real de comprimento de frase, ou tudo tem o mesmo tamanho médio?

## D. Leitor

- **D1.** Cada termo técnico, sigla e referência interna passou pelo teste "um leitor
  competente mas de fora saberia disso?"
- **D2.** O primeiro uso de cada conceito abstrato vem com um exemplo concreto?
- **D3.** O nível de sinalização está calibrado para o leitor real? (Interno e
  especialista tolera menos costura; externo precisa de coesão máxima. Na dúvida,
  externo.)
- **D4.** Há metadiscurso sobre o próprio texto ("neste documento, argumentaremos
  que")? Cortar.

## E. Lastro

- **E1.** Toda afirmação tem número, fonte, ou a admissão explícita de que é
  estimativa?
- **E2.** O texto contém algum nome, número, data, citação ou específico que **não**
  estava na fonte nem foi fornecido pelo usuário? (Zero tolerância.)
- **E3.** Alguma atribuição vaga sobrevive ("especialistas apontam", "relatórios do
  setor")? Nomear ou cortar.

## F. Portão 5 (só depois de A a E fecharem)

- **F1.** O passe de `humanize-vendored.md` rodou em modo embutido?
- **F2.** Alguma correção lexical mexeu em ordem, escopo ou existência de seção? (Se
  sim, um portão anterior falhou. Volte a ele.)
- **F3.** `grep -n '[—–]\|--'` foi executado de fato e voltou vazio?
