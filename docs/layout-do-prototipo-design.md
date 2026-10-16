# Layout do protótipo do Figma no app: desenho

Status: aprovado em conversa; aguardando revisão deste texto. Data: 2026-10-15.

## Objetivo

Levar para o app (e, por consequência, para o artefato publicado) o layout do protótipo do Decomposer no Figma (arquivo Portifa, página Decompozer, frames "Decomposer / … / Claro / 1440"). O artefato é gerado a partir do app: uma fonte só.

## Decisões

- **Escopo:** muda o app; o artefato acompanha. Não há versão separada do artefato.
- **Cabeçalho do site:** fora. No protótipo ele só mostra como o app fica dentro do site; a integração com o portifa continua para depois.
- **Cabeçalho do app:** fica como hoje (nome, "Ajuda" e a faixa de 5 px na cor digitada). O protótipo vale do cabeçalho para baixo.
- **Textos:** rótulos dos campos em mono e caixa alta (só por CSS). Ajudas e status continuam em DM Sans, sem caixa alta. Entram os textos curtos do protótipo. Sai a ajuda do contraste mínimo; a ajuda do hex fica.
- **"Limpar" do protótipo vira "Redefinir"**, com nome acessível "Redefinir todos os ajustes". O botão restaura o estado inicial; "Limpar" sugeriria campos vazios.
- **Título "Ajustes":** continua em Plus Jakarta Sans, como os demais títulos (no protótipo está em DM Sans 24).

## Painel de Ajustes, de cima para baixo

1. Linha do título: "Ajustes" à esquerda, "Redefinir" (botão discreto) à direita. O botão sai do fim do painel.
2. **Modo de cor** (Claro/Escuro), agora o primeiro campo.
3. **Cor da marca:** uma linha com seletor de cor, mini faixa (decorativa, `aria-hidden`) e campo hex. Abaixo: ajuda do hex ("Use 6 letras ou números, como #E7398A."), erro e status da separação dos tons, nessa ordem.
4. **Ajustar a cor** (`details`): claridade, intensidade e matiz; com cor de apoio, também o "Cor a ajustar".
5. **Auto** e **Cor viva**, depois dos sliders.
6. Divisor em `--edge`.
7. **Adicionar cor de apoio**, com a ajuda "Segunda cor para compor a paleta." O campo da cor de apoio aparece aqui quando adicionada.
8. **Ajustes básicos** (`details`, antes "Mais ajustes"): sistema de níveis, cor do texto sobre cada tom e contraste mínimo. Ajudas curtas; sem a ajuda do contraste.
9. **Ajustes avançados** (`details`), fechado, no fim do painel. Deixa de ficar dentro do bloco anterior.

Estados iniciais: no computador, "Ajustar a cor" e "Ajustes básicos" abertos; no celular, fechados (como hoje). "Ajustes básicos" abre e fecha em qualquer largura; o modo "estático" do computador (`more--static`) sai.

Sobre a ajuda do contraste: além de "AA é o recomendado", ela avisava que no AAA alguns tons não chegam a 7 para 1. Esse caso continua coberto pelos avisos de contraste que aparecem quando acontece (opção "Se o contraste pedido não for possível").

## Área dos tons

1. Abas como hoje (a selecionada invertida). "Exportar tokens" passa de preenchido (`btn--solid`) para contornado (`btn`). Linha sob as abas na cor de texto.
2. Marcadores "Sua cor ▼" e "Cor de apoio ▼" acima da faixa, centralizados no tom, seta para baixo. Na faixa vertical do celular, ao lado do tom, como hoje.
3. Dica "Selecione um tom…" logo abaixo da faixa; depois a nota da escala ("Modo claro: o 20 é o mais claro. Saiba mais").
4. Sem mudança: painel de detalhe, diálogos, aviso de tons parecidos, ajuda, cabeçalho e rodapé.
5. Medidas na escala atual: bordas de 2 px, sombras de 2 e 4 px.

## Código

- Reorganizar `app/index.html` e `app/app.css` mantendo os ids, para eventos e estado na URL seguirem iguais.
- `app/main.js`: o controle de abrir e fechar "Mais ajustes" só no celular passa a valer para "Ajustes básicos" em qualquer largura, com os estados iniciais acima; marcadores acima da faixa.
- Textos novos no HTML e em `app/strings.js` (o texto da ajuda que cita "Mais ajustes" passa a citar "Ajustes básicos").
- Nenhuma mudança no motor (`src/`).

## Testes

- Os 109 testes do motor não mudam.
- Navegador (scripts ad hoc): ordem do painel; "Redefinir" restaura o estado inicial e tem o nome acessível; "Ajustes básicos" abre e fecha no computador; marcadores acima da faixa no computador e ao lado no celular; ajuda do hex ligada ao campo (`aria-describedby`); axe no claro, no escuro e no celular; scripts atuais de estilo, ajuda e cor de apoio.
- Capturas para comparar com o protótipo.

## Depois

- README e ajuda do app atualizados onde citam a posição ou o nome dos controles.
- Publicar a v40 do artefato.

## Fora do escopo

- Cabeçalho e rodapé do site.
- Ajuste fino do modo escuro.
- Mudanças no Figma.
