# Backlog

Ideias avaliadas e adiadas. Cada item diz de onde veio e por que ficou de fora.

## Intensidade ajustável na cor viva

- **O que é:** um controle extra para o usuário escolher quanto de intensidade os tons ganham no modo "Cor viva" (hoje fixo em 85% do máximo do matiz).
- **De onde veio:** avaliado em 2026-10-14 como abordagem C do desenho da cor viva.
- **Por que adiou:** acrescenta uma peça de interface que ninguém pediu ainda. Primeiro ver como a regra fixa se comporta.
- **Quando retomar:** se o percentual fixo não servir para vários matizes ou projetos.

## Preset com escala por contraste (estilo Spectrum)

- **O que é:** um terceiro preset em que o índice de cada tom corresponde a um contraste fixo com o branco, igual em todas as famílias (no Spectrum: 1,06 no 100 até cerca de 19,5 no 1600, 16 tons). Quem usa o número já sabe o contraste.
- **De onde veio:** análise do Spectrum (Adobe) em 2026-10-14. Os valores estão em `spectrum-paleta-de-cores.xlsx`.
- **Por que adiou:** é uma entrega grande (a claridade de cada tom passa a vir do contraste, não de uma rampa linear) e não é urgente.
- **Quando retomar:** quando houver necessidade de garantir contraste por índice.

## Segunda cor do tema na interface

- **O que é:** a interface passa a aceitar uma segunda cor, decomposta à parte, com paleta e behavior próprios (o `secondary` do Aplica). Não é a "cor de apoio" atual, que é uma âncora dentro da mesma paleta.
- **De onde veio:** decisão D1 da arquitetura de tokens da UaiUI (2026-10-15). Exemplo usado: #51475C, o roxo do botão primary atual do site.
- **Estado do motor:** o `decomposeTheme` já aceita várias cores (`colors: { marca, apoio }`) e o export para o Figma já inclui todas. Falta só a interface: campo, estado na URL, abas e exportação com as duas cores.
- **Quando retomar:** ao montar as coleções da UaiUI, que precisam de `interface/function/secondary/*`.

## Coleção Interface no export, por contraste

- **O que é:** o export para o Figma passa a gerar também a coleção Interface (`ui/bg/page`, `ui/bg/panel`, `ui/fg/default`, `ui/fg/muted`, `ui/border/field` e os demais), com o nível de cada papel escolhido por contraste para a cor exportada, como o `chromeTokens` já faz no app (texto secundário com 5 para 1, contorno de campo com 3 para 1).
- **De onde veio:** decisão D6 da arquitetura de tokens da UaiUI (2026-10-15). O Figma não calcula contraste, então o nível precisa vir pronto do export.
- **Quando retomar:** junto com a segunda cor, antes de montar as coleções no Figma.

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

- **Deriva de matiz nos tons escuros:** no Spectrum, o amarelo vai de 100° nos tons claros para 72° nos escuros (dourado, não oliva); o laranja vai de 81° para 42°; o azul quase não muda. Poderia resolver o oliva de uma cor só, sem segunda cor.
- **Intensidade da Cor viva por matiz:** o Spectrum usa de 95% a 100% da intensidade máxima em amarelo e laranja. Os 85% atuais da Cor viva são mais conservadores.

## Pendências técnicas

- **Rigidez dos estados de comportamento no preset Padrão:** o recurso `behaviorFollowsBrand` espalha os estados proporcionalmente, e com 9 tons sobra pouco espaço.
- **Plugin do Figma:** a interface do plugin ainda não foi executada dentro do Figma.
