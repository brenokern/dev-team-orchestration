# Evidência por trás de cada regra

Três camadas. Tratá-las como equivalentes é o que enfraquece uma skill: a primeira
pode ser afirmativa e não negociável, a segunda é default ajustável, a terceira vem
com o raciocínio para o modelo julgar quando se aplica.

---

## Camada 1: Achado experimental (regra não negociável)

**A assinatura é estrutural, não lexical.** Detectores de superfície ficam em 50 a 52%
de acurácia em texto longo parafraseado (chute aleatório); features de relação de
discurso levam a 70%. → *Discourse Features Enhance Detection of Document-Level
Machine-Generated Content*, https://arxiv.org/html/2412.12679

**Vocabulário e sintaxe se movem em direções opostas.** Instruction tuning melhora
diversidade lexical e reduz a sintática e a semântica; precisão sintática > 99% mas
recall de 35 a 75%. → *Benchmarking Linguistic Diversity of LLMs*, TACL 2025,
https://arxiv.org/abs/2412.10271

**O salto apoio→proposta.** LLMs 29,4% contra 12,3% dos humanos; 3,4% de argumentos
únicos contra 65,3%; prompting diversificado recupera só metade dos clusters humanos.
→ *Argument Collapse: LLMs Flatten Long-Form Public Debate*,
https://arxiv.org/html/2606.01736

**Dado antes de novo.** 835 ms com antecedente direto contra 1016 ms com antecedente
indireto, e o efeito persiste repetindo o substantivo. → Haviland & Clark, 1974,
*Journal of Verbal Learning and Verbal Behavior* 13, 512-521.

**Sinalização estrutural funciona.** Meta-análise de 44 estudos: g = 0,25 em
compreensão, g = 0,38 em recordação, g = 0,58 em sumarização. Efeitos retardados
próximos de zero, com pós-testes de mediana 7 dias. → Bogaerds-Hazenberg et al.,
*Reading Research Quarterly* 2021, https://ila.onlinelibrary.wiley.com/doi/10.1002/rrq.311
Revisão de referência sobre o mecanismo: Lorch 1989,
https://link.springer.com/article/10.1007/BF01320135

**Efeito de coesão reversa (a ressalva).** Leitores de alto conhecimento prévio às
vezes aprendem mais com texto de baixa coesão; leitores de baixo conhecimento sempre
se beneficiam de alta coesão. → McNamara & Kintsch 1996, https://eric.ed.gov/?id=EJ538963

**Maldição do conhecimento.** Quem batuca uma melodia estima 50% de reconhecimento; a
taxa real é 2,5%. Releitura própria não corrige. → Newton 1990; Camerer, Loewenstein
& Weber 1989.

**Auto-crítica genérica não funciona.** "Nenhum trabalho anterior demonstra
auto-correção bem-sucedida usando feedback gerado pelo próprio modelo, em condições
justas, em tarefas gerais." Resultados positivos anteriores usavam ground truth
oracular e primeiros rascunhos deliberadamente fracos. Funciona só com verificação
decomposta em checagens independentes. → *When Can LLMs Actually Correct Their Own
Mistakes?*, TACL 2024, https://arxiv.org/html/2406.01297v3

**Regenerar não diversifica.** Elementos idiossincráticos são ecoados entre gerações
e atravessam modelos diferentes. → *Echoes in AI*, PNAS 2025,
https://www.pnas.org/doi/10.1073/pnas.2504966122

**Métricas de legibilidade não medem legibilidade.** Fórmulas tradicionais, ML moderno
e LLMs de fronteira têm correlação baixa e frequentemente não significativa com
eye-tracking real. → https://arxiv.org/html/2502.11150v3

---

## Camada 2: Convenção de ofício, plausível, sem teste controlado (default ajustável)

**Posição de tópico e de estresse.** Gopen & Swan, *The Science of Scientific
Writing*, https://www.usenix.org/sites/default/files/gopen_and_swan_science_of_scientific_writing.pdf
Canônico e influente, mas argumentação retórica apoiada indiretamente na literatura
dado-novo, não experimento próprio.

**Sujeito = personagem, verbo = ação; coesão ≠ coerência.** Joseph Williams, *Style:
Lessons in Clarity and Grace*. A parte de nominalização tem apoio em processamento
sintático; a distinção coesão/coerência tem apoio na pesquisa de discurso.

**SCQA e pensamento governante.** Minto, *The Pyramid Principle*. Estrutura top-down
tem apoio indireto via advance organizers. Críticas que a skill incorpora: MECE
raramente atingível em problema real; conclusão-primeiro serve a quem decide, não a
quem quer entender; aplicada mecanicamente vira gerador de três razões; hierarquia
bem formatada disfarça elo indutivo frágil.

**ABT.** Randy Olson, *Houston, We Have a Narrative*. Heurística prática, apresentada
pelo próprio autor como tal. O achado empírico mais próximo é correlacional e
contestado: Hillier, Kelly & Klinger, PLOS ONE 2016, narrativa e frequência de
citação: mede influência, não compreensão.

**Nut graf.** Convenção de ofício jornalística, sem estudo controlado.
https://www.poynter.org/archive/2003/the-nut-graf-part-i/

**Estilo clássico e prosa como janela.** Pinker, *The Sense of Style*. O viés que ele
diagnostica é robusto; a alegação de que o estilo clássico produz mais compreensão
que outros estilos é preceito, não achado.

---

## Camada 3: Argumento crítico apoiado em caso

**Bullets destroem relações entre ideias.** Tufte, *The Cognitive Style of
PowerPoint*, https://www.fceia.unr.edu.ar/~mcristia/tufte-powerpoint.pdf
O caso central é o slide da NASA no acidente do Columbia, com a extrapolação de 400x
enterrada num bullet de quarto nível; o Columbia Accident Investigation Board endossou
a crítica ao formato. É estudo de caso, não experimento. A contra-crítica de Doumont
(*Slides Are Not All Evil*) é forte: o problema seria uso incompetente e confusão
entre slide de apresentação e documento de leitura. A literatura experimental
comparando bullets a prosa é escassa e inconsistente. Por isso a regra da skill é
condicional (paralelo e independente = lista; qualquer relação = prosa) e não uma
proibição.

---

## Calibragem honesta

Em prosa expositiva curta e controlada, texto de LLM foi **lido mais rápido, com
melhor compreensão e melhor nota** que o humano. O colapso estrutural é fenômeno de
texto longo, argumentativo ou autoral.
→ https://journals.sagepub.com/doi/10.1177/10711813241261689

E "estrutura é tudo, vocabulário é irrelevante" é forte demais: a dificuldade momento
a momento é dominada por propriedades de palavra. As duas camadas operam em escalas
diferentes, o que é exatamente por que o Portão 5 existe em vez de ter sido cortado.

## Skills que inspiraram o desenho

- https://github.com/SNL-UCSB/paper-writing-skill: movimentos retóricos por seção e
  drafting por topic sentences. Base observacional real (6 papers, 7.600+ edições).
- https://github.com/JuanMarchetto/doc-standards-skill: a única com A/B publicado
  (6/6 contra 3/6 assertions); Diátaxis e detecção de *terminology drift*.
- https://github.com/nadiem99/claude-writing-skills: princípio de feedback
  estrutural antes de feedback de prosa. Sem evidência, arquitetura correta.
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices:
  método de eval usado em `eval.md`.
