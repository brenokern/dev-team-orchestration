# Protocolo de eval

Construa os evals **antes** de confiar na skill, estabeleça o baseline **sem** ela, e
só então compare. É o método do guia de autoria de skills da Anthropic, e é
justamente o passo que quase nenhuma skill pública de escrita executou.

## Como rodar

Para cada cenário: gere a saída **sem** a skill, depois **com** a skill, em sessões
limpas e separadas. Avalie as assertions como binárias, por inspeção, sem pedir nota
ao modelo. Registre a contagem dos dois lados.

Repita em Haiku, Sonnet e Opus. A eficácia de uma skill varia por modelo, e uma
instrução que o Opus segue sozinho pode ser exatamente a que o Haiku precisa escrita.

## Cenário 1: Relatório de decisão

*Prompt:* "Escreva um relatório de 800 palavras recomendando se devemos internalizar
o time de suporte que hoje é terceirizado. Dados: custo atual R$ 180 mil/mês, SLA
médio de 9 dias, 34% dos chamados reabertos, equipe de 12 pessoas no fornecedor."

Assertions:

1. Existe uma complicação explícita, e não só exposição do estado atual.
2. A recomendação aparece antes da metade do texto.
3. Existe pelo menos uma objeção séria à recomendação, escrita antes dela.
4. Todos os quatro números fornecidos aparecem, e nenhum número novo foi inventado.
5. Nenhum título é rótulo genérico ("Contexto", "Análise", "Desafios", "Conclusão").
6. Nenhuma lista contém itens com relação causal ou de importância desigual entre si.
7. Nenhum travessão ou meia-risca no texto.

## Cenário 2: Documento de processo

*Prompt:* "Escreva o SOP do fechamento mensal de faturamento: conferência de notas,
aprovação do gestor, envio ao financeiro, arquivamento."

Assertions:

1. O documento declara na primeira linha quando é usado.
2. Pré-condições aparecem antes dos passos.
3. Existe seção de exceção ou falha, com o que fazer quando quebra.
4. Existe um dono nomeado, ou um pedido explícito por essa informação.
5. Cada conceito usa sempre a mesma palavra (sem *terminology drift*).
6. O documento é de um tipo Diátaxis só, sem misturar tutorial com referência.
7. Nenhum travessão ou meia-risca.

## Cenário 3: Reescrita de texto ruim

*Input:* cole um texto de LLM já existente, plano, cheio de bullets e sem argumento.
*Prompt:* "Reescreva isto."

Assertions:

1. A resposta extrai e mostra as frases-tópico do original antes de reescrever.
2. A resposta nomeia qual portão o texto original falhou.
3. A estrutura da reescrita difere da estrutura do original (não é só troca de
   palavras).
4. Nenhuma informação do original se perdeu.
5. Nenhum fato novo foi inventado.
6. A contagem de bullets caiu, ou os bullets que sobraram são genuinamente paralelos.
7. Nenhum travessão ou meia-risca.

## Como ler o resultado

O sinal que importa não é "passou tudo". É a **diferença** entre com e sem a skill.
Se a diferença for pequena, o problema é a skill, não o modelo: ela está descrevendo
o que o modelo já faz em vez de fechar um gap. Corte o que não move a agulha, porque
instrução que não muda comportamento só ocupa contexto.

Os itens que historicamente mais separam os dois lados são o 3 do Cenário 1
(objeção antes da recomendação) e o 1 do Cenário 3 (frases-tópico antes de reescrever).
