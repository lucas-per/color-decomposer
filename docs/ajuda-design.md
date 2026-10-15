# Ajuda (guia rápido e FAQ): desenho

Status: aprovado e entregue. Data: 2026-10-15.

## Objetivo

Dar a quem usa o Color Decomposer um lugar dentro do app para aprender o fluxo básico e tirar dúvidas, sem sair da ferramenta. Dois públicos, em seções separadas: designers que usam a interface e devs que usam o motor.

## Decisões

- **Onde:** dentro do app, em pt-BR.
- **Formato:** página própria dentro do app, na mesma página HTML (abordagem A). Não há `ajuda.html` separado.
- **Quem lê:** designers e devs, em seções separadas.

## Navegação

- Link "Ajuda" no cabeçalho, à direita do nome do produto.
- A ajuda é uma visão do app: a chave `view=ajuda` entra no estado que já fica na URL (`app/state.js`). Sem ela, o app abre como hoje.
- Na visão de ajuda, o conteúdo principal (ajustes e tons) fica oculto e o conteúdo da ajuda aparece. O tema continua o da cor atual.
- O primeiro elemento é o botão "Voltar para a paleta", que restaura a visão normal com o estado anterior (cor, preset, aba, modo).
- Abrir a ajuda leva o foco para o título (`h2` da ajuda). Voltar leva o foco para o link "Ajuda" no cabeçalho.
- O botão Voltar do navegador também fecha a ajuda (a visão entra no histórico).
- Um índice com atalhos no topo (não mexem no endereço, que guarda o estado): Guia rápido, Perguntas frequentes, Para devs.

## Conteúdo

### 1. Guia rápido para designers

Cinco passos curtos, cada um com título e uma ou duas frases:

1. Escolha a cor.
2. Escolha o preset: Aplica (19 níveis) ou Padrão (9 níveis).
3. Leia as abas Paleta, Neutros, Comportamento e Cinzas, nos modos claro e escuro.
4. Ajuste: Auto, Cor viva e cor de apoio.
5. Copie um hex ou exporte os tokens.

### 2. Perguntas frequentes para designers

Cerca de dez perguntas:

- O que é um nível?
- Aplica ou Padrão: qual escolher?
- Por que minha cor não caiu no nível 100?
- O que a Cor viva faz?
- Para que serve a cor de apoio?
- Por que o texto no Padrão não é preto nem branco?
- O que o aviso de tons parecidos quer dizer?
- Como o modo escuro é gerado?
- O contraste mínimo é AA?
- Como compartilho a paleta que montei? (a URL guarda o estado)
- Por que o estado do nível 120 se chama Hover no Padrão e Ação no Aplica?

Cada resposta é conferida contra o motor, o README e os textos do app. Não entram afirmações sem teste ou sem fonte no repositório.

### 3. Para devs

- **Guia rápido:** instalar, chamar `decompose` em poucas linhas, onde estão as opções. Aponta para o README para a tabela completa.
- **FAQ técnica:**
  - Como o Aplica sem extensões bate com o oficial 3.23.4.
  - Quais extensões são opt-in.
  - Como criar um preset.
  - Quais formatos de exportação existem.
  - O plugin do Figma.

## Texto

- pt-BR, "você", sentence case, seguindo o `ux-microcopy`; depois, o stop-slop.
- O texto fica em `app/strings.js` (`T.help`). O código só monta a estrutura.

## Interface e acessibilidade

- Perguntas em `<details>` nativos, fechados por padrão. Botão "Abrir todas" e "Fechar todas" por seção de FAQ.
- O `h1` continua sendo o nome do produto, no cabeçalho. A ajuda usa `h2` no título, `h3` nas seções, `h4` nas subseções de devs e `summary` nas perguntas.
- Largura de leitura limitada (cerca de 70 caracteres), mesma tipografia e tokens do app (`frontend-design`).
- Funciona no tema claro e no escuro, no celular e com `forced-colors`; respeita `prefers-reduced-motion`.
- Exemplos de código em blocos com botão de copiar, como nos tons.

## Testes

- Navegador (script ad hoc, como os atuais): abrir pela barra, voltar mantendo o estado, foco ao abrir e ao voltar, teclado, Abrir todas, `view=ajuda` na URL, axe nos temas claro e escuro, mobile.
- Texto: verificação de que os valores citados (níveis, claridades, nomes) vêm dos presets, para não ficarem desatualizados.
- Os 109 testes do motor não mudam.

## Entregas

1. Desenho aprovado.
2. Interface: visão, navegação, estilos, textos e testes.
3. README: link para a ajuda.

## Fora do escopo

- Busca dentro da FAQ.
- Capturas de tela.
- Tradução para inglês.

## Como ficou

- Código: `app/help.js` monta a estrutura, `helpText` em `app/strings.js` guarda os textos (números e cores citados vêm dos presets) e `view` entra no estado (`app/state.js`).
- Abrir cria uma entrada no histórico. Abrir direto por `#view=ajuda` também funciona; nesse caso, "Voltar para a paleta" fecha sem histórico anterior.
- 10 perguntas para designers e 6 para devs. O guia de devs tem os comandos e um exemplo de código, cada um com botão de copiar.
- Verificado em navegador (claro, escuro e 390 px) com axe, teclado e foco.
