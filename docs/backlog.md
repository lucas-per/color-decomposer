# Backlog

Ideias avaliadas e adiadas. Cada item diz de onde veio e por que ficou de fora.

## Intensidade ajustável na cor viva

- **O que é:** um controle extra para o usuário escolher quanto de intensidade os tons ganham no modo "Cor viva" (hoje fixo em 85% do máximo do matiz).
- **De onde veio:** avaliado em 2026-10-14 como abordagem C do desenho da cor viva.
- **Por que adiou:** acrescenta uma peça de interface que ninguém pediu ainda. Primeiro ver como a regra fixa se comporta.
- **Quando retomar:** se o percentual fixo não servir para vários matizes ou projetos.

## Adiados por decisão

- **Requisitos do UaiUI para o preset Padrão:** ficaram para depois. Hoje o preset segue as mesmas regras do Aplica em escala menor.
- **Camada `mapping` (marca, interface, produto):** fora do escopo da ferramenta por enquanto.
- **Publicação no GitHub Pages:** o repositório é privado. O fluxo de publicação entra quando ele for aberto.

## Ideias oferecidas, ainda sem resposta

- **Servidor de desenvolvimento com recarga automática:** hoje o `npm run dev` gera a interface uma vez e é preciso reiniciar depois de cada mudança.
- **Verificação de alinhamento no repositório:** o script que confere a borda esquerda do painel de ajustes (desktop e mobile) existe só no ambiente de testes.
- **Aviso de cor com pouca intensidade:** avisar que a paleta vai sair acinzentada quando a cor base é quase neutra. Depende do desenho da cor viva.
- **Aviso de contraste no estilo de warning:** aplicar o visual âmbar também ao aviso de contraste do texto ("Ver quais"), para os avisos ficarem consistentes.
- **Nome "Cor base" no lugar de "Cor da marca":** a cor pode ser de fundo de site ou de botão, não só de marca. Precisa passar pelos textos da interface.

## Pendências técnicas

- **Rigidez dos estados de comportamento no preset Padrão:** o recurso `behaviorFollowsBrand` espalha os estados proporcionalmente, e com 9 tons sobra pouco espaço.
- **Plugin do Figma:** a interface do plugin ainda não foi executada dentro do Figma.
