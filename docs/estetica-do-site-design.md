# Estética do site no Decomposer: desenho

Status: aprovado. Entregas 1, 2 e 3 feitas; medidas revistas em 2026-10-15 (ver "Ajuste de escala"). Data: 2026-10-15.

## Objetivo

O Decomposer vai morar em uma página do site pessoal (`lucas-per/portifa`). A interface passa a usar a mesma linguagem visual do site: forma, tipografia, bordas, sombras e comportamento dos botões. As cores continuam derivadas da cor escolhida (decisão do Lucas: tema derivado, forma do site).

Fonte da verdade do site: `docs/design-notes.md` e `src/styles/tokens/` do repositório `portifa`, lidos em 2026-10-15.

## Decisões

- **Tema:** continua derivado dos neutros da cor escolhida (`chromeTokens`). Só a forma muda.
- **Faixa do cabeçalho:** 5 px, na cor que a pessoa digitou (a cor da marca), e muda junto com ela. Não é o azul fixo do site.
- **Foco por teclado:** contorno de 2 px, com 2 px de distância, em `--fg` (cor de texto derivada). Garante contraste com qualquer fundo gerado. O vermelho fixo do site fica de fora.
- **Onde mora:** uma página do site. O Decomposer mantém o cabeçalho próprio (nome do produto, Ajuda e a faixa) por enquanto. A integração com o cabeçalho e o rodapé do site fica para depois.
- **Modo escuro:** fora do escopo. A forma nova (cantos retos, bordas, sombras) vale nos dois modos, mas o ajuste fino do escuro será feito depois, pelo Lucas. A sombra usa `--fg` nos dois.

## O que muda

| Item | Hoje | Depois |
|---|---|---|
| Fontes | Bricolage Grotesque | Plus Jakarta Sans (títulos), DM Sans (texto), JetBrains Mono (rótulos curtos e códigos hex) |
| Cantos | 8, 12 e 14 px | 0 em tudo, inclusive a faixa de tons |
| Bordas | 1 px, cor `--edge` | 2 px em campos, painéis, cartões e tags; 3 px em botões. Cor `--fg` |
| Sombras | nenhuma | Duras, sem blur: 3 px em botões e tags, 5 px no painel de Ajustes, nos diálogos, nos painéis de detalhe e na faixa de tons. Cor `--fg` |
| Botões | fundo muda no hover | Levanta no hover, afunda no clique, a 0,1 s (ver abaixo) |
| Cabeçalho | só o nome | Faixa de 5 px embaixo, na cor da marca |
| Foco | 3 px, `--ring` | 2 px, 2 px de distância, `--fg` |

### Tipografia

| Papel | Família e peso | Observação |
|---|---|---|
| Nome do produto, títulos de página, de seção e de diálogo | Plus Jakarta Sans 700 ou 800 | O título principal da ajuda e o do painel em 800, em caixa alta (como o `h2` do site); os demais em 700, sem caixa alta |
| Texto, campos, ajuda dos campos | DM Sans 400 a 600 | 560 e 650 viram 500 e 600, os mais próximos |
| Rótulos de botão, abas e tags | JetBrains Mono 700, caixa alta | Só por CSS (`text-transform`); o texto no código continua em sentence case |
| Códigos hex e números dos níveis | JetBrains Mono 700 | Só em trechos curtos |
| Blocos de código e prévia da exportação | Monoespaçada do sistema, 400 | A JetBrains só existe em 700, pesada demais para blocos longos |

- Sem ajuste de largura da fonte (a Bricolage tinha, as novas não).
- Os três arquivos `.woff2` são copiados do site para `app/fonts/` com a licença correspondente. A Bricolage é removida.
- Escala de tamanhos na grade de 4 px do site (0,25 rem).
- Caixa alta só em títulos e rótulos curtos, nunca em texto corrido.

### Botões

Mesmo mecanismo do site (`Button.astro`):

- A borda e a sombra ficam no mesmo elemento. O hover desloca o botão 2 px para cima e para a esquerda e aumenta o deslocamento da sombra na mesma medida, para a sombra ficar parada.
- No clique, o botão desloca 1 px para baixo e para a direita e a sombra some.
- `transition: transform .1s ease, box-shadow .1s ease`. Com `prefers-reduced-motion`, sem transição (o estado ainda muda).
- Só os botões com borda e sombra levantam (`.btn` e `.btn--solid`). O botão discreto (`.btn--quiet`, sublinhado) não.
- Altura de 44 px (`--control`) continua, com a borda de 3 px incluída.

### Faixa de tons

- Cantos retos, tons colados, e uma borda de 3 px na faixa inteira com sombra de 5 px.
- O tom selecionado mantém o contorno atual, em 3 px, na cor `--fg`.
- Os marcadores ("Sua cor", "Cor de apoio") seguem como estão, com a nova fonte.

### Painéis e diálogos

- Painel de Ajustes, painel de detalhe, diálogos e o aviso de tons parecidos: borda de 2 px e sombra de 5 px, cantos retos.
- Aviso (`--warn-*`) mantém as cores semânticas fixas.
- Perguntas da ajuda: borda de 2 px, sem sombra.
- A seta que liga o detalhe ao tom aberto continua, com a borda nova.

## Fora do escopo

- Ajuste fino do modo escuro.
- Integração com o cabeçalho e o rodapé do site.
- Fundo off-white amarelo do site (o fundo continua derivado da cor).
- Mudar a lógica, os textos ou os testes do motor.

## Restrições

- Nenhum comportamento muda. Só estilos e o cabeçalho.
- Axe sem problemas em claro, escuro e mobile.
- Todos os textos continuam legíveis nas duas direções do contraste: bordas e contornos a 3 para 1 contra o fundo (`--fg` já passa).
- Alvos de toque e altura de 44 px mantidos.

## Testes

- Navegador (scripts ad hoc existentes + novos): nenhum elemento com `border-radius` diferente de 0; as três fontes carregadas (`document.fonts`); hover, clique e foco dos botões; faixa na cor digitada e atualizando ao mudar a cor; axe em claro, escuro e mobile; capturas de tela para você aprovar.
- Os 109 testes do motor não mudam.

## Entregas

1. Fontes e tokens de forma (bordas, sombras, cantos), cabeçalho com a faixa.
2. Componentes: botões, campos, abas, faixa de tons, painéis, diálogos e ajuda.
3. Verificação, capturas de tela e atualização de `docs/principios-visuais.md` (o trecho de "hierarquia por papel" fala de arredondamento) e do README.
4. Publicação no artefato (o script que gera o arquivo único passa a embutir as três fontes).

Depois de cada entrega, mando capturas de tela claro e mobile para você aprovar antes da próxima.

## Como ficou

### Entrega 1 (2026-10-15)

- Fontes do site em `app/fonts/` (Plus Jakarta Sans, DM Sans, JetBrains Mono), com `LICENSES.md`. A Bricolage e a dependência `@fontsource-variable/bricolage-grotesque` saíram.
- Tokens em `app/app.css`: `--font`, `--font-title`, `--font-label`, `--bw` (2 px), `--bw-strong` (3 px), `--shadow-comp` (3 px), `--shadow-layout` (5 px), `--band` e `--band-w`. Os três raios (`--r-strip`, `--r-panel`, `--r-control`) valem 0.
- Famílias e pesos aplicados em toda a interface. Rótulos de botões e abas, números dos tons e códigos hex em JetBrains Mono 700; títulos em Plus Jakarta Sans; o resto em DM Sans. Sem `font-stretch`. Caixa alta só por CSS.
- Faixa de 5 px sob o cabeçalho na cor digitada (`chromeTokens` devolve `band`). O cabeçalho ganhou o contêiner `.top__inner`.
- Foco por teclado em 2 px, com 2 px de distância, em `--fg`.
- Ainda não aplicados (entrega 2): bordas de 2 e 3 px, sombras duras, levante dos botões e os cantos arredondados escritos direto no CSS (marcador de tom, sublinhado da aba).

### Entrega 2 (2026-10-15)

- **Botões:** borda de 3 px em `--fg`, sombra de 3 px, levante de 2 px no hover (a sombra vai a 5 px e fica parada), afundamento de 1 px no clique com a sombra sumindo, transição de 0,1 s. O botão discreto (sublinhado) não levanta. O botão sólido usa um aro na cor do fundo para a sombra se separar do corpo. Desabilitado: sem sombra e sem movimento. Auto e Cor viva ficaram com 36 px de altura.
- **Abas:** a aba selecionada vira um bloco preenchido (como o alternador Claro e Escuro), no lugar do sublinhado. Linha de 2 px sob as abas. Em alto contraste, `Highlight`.
- **Faixa de tons:** cada tom é uma célula com borda de 2 px (as linhas se sobrepõem, sem dobrar) e sombra de 5 px, que forma uma sombra contínua. O tom selecionado ganha um aro interno de 3 px na cor do próprio texto do tom (contraste garantido pelo motor). O foco fica por fora, em 2 px.
- **Painéis, diálogos, avisos e blocos de código:** borda de 2 px em `--fg` e sombra (5 px nos painéis e diálogos, 3 px nos avisos e blocos de código). O aviso de tons parecidos mantém as cores fixas de aviso. A seta do painel de detalhe ganhou a borda. No celular, o painel de Ajustes continua sem caixa.
- **Campos, seletor de cor, sliders (quadrados, com sombra) e alternadores:** borda de 2 ou 3 px em `--fg`, cantos retos. Campo inválido: aro interno extra.
- **Ajuda:** perguntas e seções com linha de 2 px em `--fg`; foco em 2 px.
- Verificado: nenhum elemento com canto arredondado, hover e clique dos botões, fontes, faixa, axe em claro, escuro e mobile, e os scripts de ajuda e de cor de apoio.

### Entrega 3 (2026-10-15)

- Revisão com capturas de tela: desktop e celular em claro, tom 100 aberto, diálogo de exportação, ajuda, paleta de 19 tons do Aplica e modo escuro (sem ajuste fino, como combinado).
- `docs/principios-visuais.md`: "Hierarquia por papel" deixa de falar de arredondamento e passa a falar de espessura de borda e tamanho de sombra; "Ousadia em um lugar só" cita a forma do site e a faixa do cabeçalho.
- README: seção da interface com a forma do site e as três fontes (a Bricolage saiu).

### Ajuste de escala (2026-10-15)

Decisão D5 da arquitetura de tokens da UaiUI: as medidas da forma passam a caber na escala de espaçamento (passos de 2 e 4 px).

- Bordas: todas em 2 px. O token `--bw-strong` (3 px) saiu; botões, contorno do tom selecionado, polegar dos sliders e erro de campo usam `--bw`.
- Sombras: 2 px em componentes (`--shadow-comp`), 4 px no hover do botão (`--shadow-comp-hover`, os 2 px do levante continuam) e 4 px nos blocos de layout (`--shadow-layout`).
- A faixa de 5 px do cabeçalho não muda: é um elemento do site, não uma borda nem sombra.
- O site (`portifa`) ainda usa 3 e 5 px e precisa do mesmo ajuste para os dois continuarem iguais.
