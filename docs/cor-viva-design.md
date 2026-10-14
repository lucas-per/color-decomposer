# Cor viva: desenho

Status: aprovado e implementado. Data: 2026-10-14.

## Objetivo

Quando a cor base tem pouca intensidade (um off-white como `#FCFBF2`), a paleta sai acinzentada, porque cada tom herda a intensidade da cor base. A **Cor viva** é um ajuste opcional que dá intensidade aos tons, sem mudar a cor digitada.

A cor base não é necessariamente a cor de uma marca. Pode ser o fundo de um site ou de um botão. A regra do motor só supõe uma coisa: a cor digitada fica exata no nível dela.

## Fluxo

1. A pessoa digita uma cor de baixa intensidade. Se os tons ficam parecidos, o **Auto** fica disponível.
2. A pessoa aplica o Auto. A cor vai para o nível mais próximo e o Auto fica desabilitado.
3. A **Cor viva** passa a ficar disponível. Se ela aplicar, os tons ganham intensidade.
4. Ao mudar a cor (campo, seletor, slider ou preset), os dois ajustes voltam ao zero.

A Cor viva **não** é oferecida quando a paleta já funciona sem o Auto. A ferramenta não insiste em um ajuste que ninguém pediu. Quem quer mais cor nesse caso usa o slider de Intensidade, que muda a cor digitada.

## Motor

- Opção `vividChroma` (booleano, padrão `false`). É uma extensão, como `brandLevel` e `behaviorFollowsBrand`. Sem ela, o resultado é idêntico ao atual, e os testes de paridade com o Aplica não mudam.
- Para cada tom, exceto o da cor base: o alvo é `0,85 × maxChroma(L, matiz)`. A intensidade vai da atual até o alvo na proporção de um peso `w`, e o modo só aumenta a intensidade, nunca reduz.
- **Peso gradual (revisado após o primeiro teste):** `w = |nível − nível da cor base| / |100 − nível da cor base|`, limitado a 1. Ou seja, a intensidade sobe aos poucos a partir da cor base e chega ao máximo no nível 100. Com o off-white no 20, o 40 fica com 25% do alvo, o 60 com 50%, o 80 com 75% e o 100 com 100%. Se a cor base já está no 100, todos os tons têm peso 1.
- O tom da cor base continua exato no nível dele.
- Dentro do sRGB: `maxChroma` já respeita o gamut.
- Cor sem matiz (cinza puro): a opção não faz nada.
- Modo escuro: mesma regra, com o fator de intensidade do escuro que já existe.
- Estados de comportamento e exportação para o Figma acompanham os tons. Os neutros não mudam.

## Interface

- Botão **Cor viva** na linha do Auto, com estado pressionado (`aria-pressed`).
- Habilitado quando: o Auto foi aplicado **e** a opção mudaria a paleta de forma visível. Quando já está ligado, continua habilitado, para poder desligar.
- Desabilitado em todos os outros casos. O botão começa desabilitado.
- Estado na URL: `vivid=1`.
- Mesmo tamanho do Auto (altura de 1,5 rem, texto de .8125 rem).

## Textos

Seguem a skill `ux-microcopy`: pt-BR, "você", sentence case.

- Botão: `Cor viva`
- Rótulo de acessibilidade: `Cor viva: dar mais intensidade aos tons`
- Status quando ligado: `Cor viva aplicada.`

## Testes

- Motor: sem a opção, resultado idêntico; com a opção, a cor base fica exata, nenhum tom perde intensidade, todos dentro do sRGB, cinza puro sem mudança, modo escuro.
- Interface (navegador): botão começa desabilitado; habilita depois do Auto; liga e desliga; volta ao zero ao mudar a cor; URL; claro, escuro e mobile; axe.

## Decisões abertas

- **Limite de "mudaria de forma visível":** calibrado em 0,045 (ΔE OK, maior diferença entre um tom normal e o mesmo tom com cor viva, já com o peso gradual). Âmbar, rosa e azul dão 0; verde dá cerca de 0,037; bege dá cerca de 0,052; off-white, creme e cinzas azulados dão 0,06 ou mais.
- **Percentual de 85%:** valor inicial, ajustar depois de ver o resultado.

## Decisões fechadas

- **Descoberta do botão (aprovada):** quando a Cor viva fica habilitada e desligada, o status diz `Tons bem separados. Sua cor está no nível 20. Quer mais cor nos tons? Use a Cor viva.`
- **Regra de habilitação (aprovada):** só depois do Auto e só quando a opção muda a paleta de forma visível.

## Fora do escopo

- Intensidade ajustável pela pessoa: ver `docs/backlog.md`.
- Salto direto da cor base para a intensidade máxima: era a regra inicial (abordagem A). Foi trocada pelo peso gradual depois de ver o resultado, porque o 40 ficava intenso demais.
