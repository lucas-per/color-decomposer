# Princípios visuais

Um guia curto para decidir espaçamento, agrupamento e destaque na interface. A forma (fontes, cantos, bordas, sombras) vem do site pessoal: ver `docs/estetica-do-site-design.md`. Os princípios de gestalt abaixo são nossos: a skill `frontend-design` não os cita. Dela vem só a regra de **colocar a ousadia em um lugar e manter o resto discreto**, que aparece no último item.

Cada princípio traz a decisão que ele já explica na interface e uma pergunta para fazer antes de criar algo novo.

## Proximidade

O que está perto parece ser do mesmo grupo.

- O rótulo fica a 6 px do campo, e os campos ficam a 20 px um do outro. Assim, cada rótulo se lê como parte do seu campo.
- A dica "Selecione um tom..." fica a 8 px da faixa, porque fala dela.
- O botão "Exportar tokens" fica na linha das abas, porque age sobre o que as abas mostram.

**Pergunta:** este elemento está mais perto do que ele descreve do que do vizinho?

## Similaridade

O que parece igual é lido como a mesma coisa.

- Botões, campos, abas, seletor de cor e o alternador Claro/Escuro têm 44 px de altura.
- Os textos de apoio (ajuda dos campos, descrição da paleta, dica) usam o mesmo tamanho e a mesma cor.
- As exceções são de propósito: só as paletas têm outra altura, porque são o conteúdo, e não um controle.

**Pergunta:** dois elementos com a mesma função têm a mesma aparência? Dois com funções diferentes se distinguem?

## Continuidade e alinhamento

O olho segue linhas e arestas.

- No celular, marca, títulos, campos, abas, texto e faixa começam na mesma margem de 16 px.
- O sublinhado da aba selecionada acompanha o texto, e não o botão.
- A faixa de tons é uma linha contínua, do 10 ao 190, e a ordem dos números continua nos dois modos.

**Pergunta:** quantas arestas esquerdas diferentes esta tela tem? O ideal é uma.

## Fechamento e região comum

Um conjunto sem vãos é lido como uma única forma. Uma área com fundo ou borda é lida como um grupo.

- Os tons ficam colados, sem espaço entre eles, e a faixa inteira tem uma só borda e uma só sombra. Ela se lê como uma escala, não como 19 cartões.
- O painel de Ajustes é um cartão no desktop, onde ele é uma coluna à parte. No celular, o cartão some, porque o recuo interno desalinhava os campos do resto da página.
- O painel de detalhes tem uma seta que aponta para o tom aberto e liga os dois.

**Pergunta:** preciso mesmo de uma caixa em volta, ou o espaçamento já agrupa?

## Figura e fundo

O que se destaca vira figura, e o resto vira fundo.

- A paleta é a figura: é a única área saturada da tela.
- O fundo é neutro, com o tom da cor escolhida, e some atrás da paleta.
- O tom selecionado ganha um contorno, e o "Sua cor" tem um marcador abaixo da faixa.

**Pergunta:** o que é a figura desta tela? Todo o resto está mais discreto que ela?

## Hierarquia por papel

A espessura da borda e o tamanho da sombra mostram o nível de cada elemento, no lugar do arredondamento (a interface tem cantos retos, como o site).

- Blocos de layout (painel de Ajustes, faixa de tons, painel de detalhe, diálogos): borda de 2 px e sombra de 5 px.
- Componentes pequenos (botões, avisos, blocos de código): sombra de 3 px. A borda do botão tem 3 px.
- Campos e linhas divisórias: borda de 2 px, sem sombra. Texto não tem borda nem sombra.
- Só o que se aciona levanta no hover e afunda no clique. Um só tamanho de sombra em tudo achataria essa hierarquia.

**Pergunta:** este elemento é mais importante ou menos importante que o que está ao lado? A forma diz isso?

## Ousadia em um lugar só

Vem da skill `frontend-design`: "Spend your boldness in one place."

- O destaque da interface são as cores da paleta.
- O resto segue a forma do site (cantos retos, bordas e sombras duras, sempre na cor do texto), mas sem cor própria: tipografia, ícones e divisores ficam disciplinados.
- A única outra cor fixa é a faixa do cabeçalho, que repete a cor digitada.
- Se algo é só decoração, saiu.

**Pergunta:** o que eu posso tirar sem perder informação?

## Checklist antes de fechar uma tela

1. Cada texto está perto do que descreve (proximidade)?
2. Controles iguais têm a mesma altura e o mesmo tamanho de texto (similaridade)?
3. Há uma margem esquerda só (continuidade)?
4. Cada caixa agrupa algo que o espaço sozinho não agrupa (região comum)?
5. Dá para dizer qual é a figura da tela em um segundo (figura e fundo)?
6. Verifiquei no celular, no modo escuro e com o teclado?
