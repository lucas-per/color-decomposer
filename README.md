# color-decomposer

Gerador de paletas em OKLCh que decompõe uma cor de marca em níveis, neutros e behavior, para light e dark. Base: Aplica DS.

A partir de **uma cor**, o projeto gera:

| Grupo | Níveis (preset `aplica`) | O que é |
|---|---|---|
| Paleta | 19 (10 a 190) | Tons da cor. O nível 100 é a cor informada, sem alteração. |
| Neutros | 15 (5 a 140) | Cinzas com um toque da cor, para fundos, textos e bordas. |
| Behavior | 6 | Apelidos de níveis da paleta para estados: `lightest` 10, `active` 50, `normal` 100, `action` 120, `pressed` 140, `darkest` 170. |
| Cinzas | 15 | Escala fixa do Aplica, igual para qualquer cor. |

Cada nível tem `surface` (fundo), `txtOn` (texto sobre o fundo) e `border`, em **light** e **dark**.

> Projeto independente. Segue as regras de cor do [Aplica Design System](https://aplica.me) (engine 3.23.4) e não tem vínculo com a Aplica.

## Começar

```bash
npm install
npm test         # testes de paridade com o Aplica e de invariantes
npm run dev      # interface em http://localhost:3000
npm run build    # gera a interface em dist/
```

Requer Node 18 ou mais novo. O motor (`src/`) não tem dependências.

## Usar o motor

```js
import { decompose, decomposeTheme, auditResult } from './src/index.js';

// Uma cor
const r = decompose({ base: '#E7398A' });
r.light.palette.surface[100];   // '#e7398a'
r.dark.behavior.surface.action; // tom do nível 120 no modo escuro
r.warnings;                     // avisos de contraste, se houver

// Um tema: várias cores + cinzas, no formato de tokens do Aplica
const theme = decomposeTheme({
  colors: { brand: '#E7398A', info: '#38C2D0' },
  options: { txtOnStrategy: 'brand-tint', accessibilityLevel: 'AAA' }
});
```

`toPrimitiveTheme`, `toGrayscaleTheme`, `toCssVariables`, `toPlainJson` e `toFigmaJson` exportam o resultado.
`auditResult` lista o contraste de cada par superfície/texto.

### Opções

Os nomes seguem os do Aplica sempre que existem lá.

| Opção | Valores (padrão em negrito) | Efeito |
|---|---|---|
| `preset` | **`aplica`**, `standard` ou um objeto | Escala de níveis (ver abaixo). |
| `vividChroma` | `false` (padrão) ou `true` | Extensão: dá intensidade aos tons de uma cor com pouca intensidade (até 85% do máximo do matiz, de forma gradual: a intensidade sobe a partir da cor base e chega ao máximo no nível 100). A cor base fica exata e nenhum tom perde intensidade. Ver `docs/cor-viva-design.md`. |
| `anchors` | lista de `{ hex, level? }` (padrão: vazia) | Extensão: cores de apoio. A cor principal fica no `brandLevel`; cada cor de apoio fica no nível informado ou, sem `level`, no de claridade mais próxima, do lado certo da principal (`supportLevel`). Entre as cores, a claridade segue linhas retas entre as cores e nunca sobe (passos iguais), e o matiz e a intensidade se interpolam; todos os tons são mapeados para dentro do sRGB mantendo o matiz. Dois níveis iguais ou uma cor que faria a claridade subir viram aviso (`type: 'anchors'`, `reason: 'same-level'` ou `'order'`) e a cor é ignorada. Neutros e estados de comportamento vêm da cor principal; a Cor viva não se aplica com cor de apoio. Na interface: botão "Adicionar cor de apoio" (URL `support=<hex>`). Ver `docs/duas-cores-design.md`. |
| `txtOnStrategy` | **`high-contrast`**, `brand-tint`, `custom-tint` | Cor do texto sobre cada tom. |
| `txtOnCustomTint` | `{ light?, dark?, fallback }` | Obrigatório no `custom-tint`. `fallback`: `brand-tint` ou `high-contrast`. |
| `colorContrastDecompose` | **`startDark`**, `startLight` | Ponta da escala que o texto tenta primeiro. |
| `overlap` | `{ level }` | No `brand-tint`, do nível em diante o texto vai direto a preto ou branco. |
| `accessibilityLevel` | **`AA`** (4,5), `AAA` (7) | Contraste mínimo do texto gerado. |
| `onAccessibilityFailure` | **`accept-aa`**, `warn`, `throw` | O que fazer quando o AAA é impossível (ver divergências). |
| `darkModeChroma` | **0.85** | Multiplicador de croma no modo escuro. |
| `borderOffset` | `{ palette: 10, neutrals: 1, grayscale: 1 }` | Distância da borda: paleta em níveis; neutros e cinzas em passos. |
| `brandLevel` | **100** (o `baseLevel` do preset), ou outro nível da paleta | **Extensão, não existe no Aplica.** Nível onde a cor da marca fica, exata. A escala passa por ela; no escuro, a marca fica no nível espelhado. Por padrão os estados de comportamento seguem nos níveis do preset (o `normal` continua no 100). `suggestBrandLevel(hex, preset)` devolve o nível de claridade mais próxima. |
| `behaviorFollowsBrand` | **`false`**, `true` | Só vale com `brandLevel` fora do padrão. O `normal` passa para o nível da marca (no escuro, o espelhado) e os demais estados se espalham em volta, de cada lado, mantendo a ordem e níveis diferentes quando há espaço. As variables do Figma apontam para o nível certo em cada modo. |
| `generateTxt`, `txtBaseColorLevel` | `false`, 140 | Token `txt` (texto geral sobre o fundo da interface). |

Sobrescrita dos neutros (`neutralsOverride` em `decompose`, `neutralsOverrides` em `decomposeTheme`):
`{ baseColor, referenceLevel, surface, txtOn, border }`, num bloco só (vale para o light; o dark é o espelho) ou como `{ light, dark }`.
Sobrescrita dos cinzas: `grayscaleOverrides`, com `{ surface, txtOn, border }` ou `{ light, dark }`.

### Presets

Um preset é um dado (`src/presets.js`), sem código. Regras comuns:

- o primeiro nível é o mais claro (L 0,98) e o último o mais escuro (L 0,05);
- na paleta, o nível `baseLevel` (100) é a cor exata da marca;
- o dark é gerado direto, com o nível espelhado `primeiro + último − nível` e croma reduzido.

| Preset | Paleta | Neutros | Espelho (paleta / neutros) |
|---|---|---|---|
| `aplica` | 19 níveis, de 10 a 190 | 15 níveis, de 5 a 140 | 200 / 145 |
| `standard` | 9 níveis, de 20 a 180 | 9 níveis, de 10 a 130 | 200 / 140 |

O `standard` é uma extensão para o UaiUI: **não existe no Aplica**. Aplica as mesmas regras a uma escala menor.

## Como sabemos que bate com o Aplica

1. **Golden** (`test/golden.test.js`): dois temas reais do [aplica-tokens-themes-sample](https://github.com/aplica-ds/aplica-tokens-themes-sample), Joy (`brand-tint` + AAA) e Blue Sky (`high-contrast` + AA, com neutros sobrescritos). Paleta, neutros, behavior e cinzas saem **iguais** aos arquivos oficiais.
2. **Oráculo** (`test/oracle.test.js`): compara com o `ColorDecomposer` da engine 3.23.4 em 71 cores × 13 combinações de opções, mais as sobrescritas dos neutros.
3. **Invariantes** (`test/engine.test.js`): nível 100 exato, ordem de luminosidade, espelho do dark, bordas, validações e contraste mínimo.

O token `txt` não entra no golden: os arquivos de exemplo vieram da engine ^3.6 e a regra mudou até a 3.23.4. Seguimos a 3.23.4 (`test/txt.test.js`).

## Decisões

### Comportamentos do Aplica reproduzidos de propósito

- A borda dos neutros vem das superfícies **geradas**: sobrescrever `surface` não muda a `border` (sobrescreva a borda também).
- No AAA com `accept-aa`, a **paleta** mantém o texto se ele já passa em 4,5 para 1, e os **neutros** sempre refazem (preto ou branco). É inconsistente, mas é como o Aplica gera os temas oficiais.
- Neutros no dark usam `145 − nível`, que pode cair entre dois níveis (fica só no código do Aplica, não nos documentos).
- O token `txt` é normalizado contra o fundo ambiente: os neutros da primeira cor, no primeiro nível.

### Onde divergimos do Aplica

| # | Divergência | Motivo |
|---|---|---|
| 1 | Hex sempre em minúsculas, inclusive o nível 100. | Saída consistente. A cor é a mesma. |
| 2 | `borderOffset.palette` fora da grade (por exemplo, 14) vira o passo mais próximo. | O oficial cai no nível 190, o que é um defeito. |
| 3 | O `overlap` usa o nível declarado, sem procurar o hex na paleta. | Com hex repetido (pretos, brancos), o oficial acha o primeiro nível igual e decide errado. Só muda nesses casos. |
| 4 | `onAccessibilityFailure` tem padrão `accept-aa`, com aviso. | O oficial, sem terminal interativo, mantém o texto que falha. O modo `warn` reproduz isso. |
| 5 | Bloco único de neutros com `baseColor`: o dark mantém a cor própria. | O oficial a descarta quando há `surface` junto. |
| 6 | Cinzas `{ light, dark }`: sobrescritas do dark partem dos padrões já espelhados. | O oficial mistura com a orientação do light. |
| 7 | Cinzas do preset `standard` são uma rampa neutra gerada. | O Aplica só tem a tabela fixa de 15 níveis. |

### Regras do `color-engine` sem equivalente no Aplica

Análise crítica, uma a uma. Onde o Aplica tem regra, vale a do Aplica.

| Regra do `color-engine` | Decisão | Por quê |
|---|---|---|
| Direção da paleta invertida (nível menor escurece) | Removida | Contradiz o Aplica (10 é o mais claro, 190 o mais escuro). Provável origem: uma frase ambígua em `01-colors.md`. |
| Dark = escala invertida e depois `200 − nível` | Removida | Inversão dupla. O Aplica gera o dark direto. |
| `brand-tint` escolhe o candidato de menor contraste | Removida | O Aplica percorre a paleta a partir de uma ponta e usa o primeiro que passa. |
| `borderOffset` único e sem efeito | Substituída | Deslocamento por grupo, como no Aplica. |
| Tabela de cinzas própria (`#efefef`, `#e3e3e3`…) | Removida | Vale a tabela do Aplica. |
| `validate.js` exigindo AAA em tudo | Substituída | `accessibilityLevel` + política de falha + `auditResult` + testes. |
| Preset `standard` | Mantida | Necessidade real (UaiUI). Virou dado, com a regra de espelho do Aplica. |
| `run()` com `mapping` (brand, interface, product) | Não implementada | Faz parte do gerador de temas completo do Aplica (`_brand.json`), fora do escopo do decomposer. |
| Dependência do `culori` e servidor Express | Removidas | Matemática própria, idêntica à oficial; a interface é estática. |
| Interface com abas, modo claro/escuro, detalhe e copiar | Mantida como ideia, refeita | Ver abaixo. |

## Interface

- **Sistema de níveis padrão:** a interface abre no preset Padrão (9 tons e 9 neutros). O Aplica (19 tons e 15 neutros) continua disponível no seletor "Sistema de níveis". O motor (`decompose`, `decomposeTheme`) mantém o `aplica` como padrão.
- **A interface usa o próprio motor:** fundo, texto e bordas saem dos neutros da cor escolhida, em claro e escuro.
- Faixa de tons navegável por teclado (setas, Home, End, Esc), com um único ponto de foco.
- Cada tom informa superfície, texto, borda, contraste (com o veredito em texto, não só em cor) e o equivalente no outro modo.
- Em telas estreitas, a faixa vira uma lista e o detalhe abre logo abaixo do tom.
- **Ajuste da cor da marca:** sliders de claridade, intensidade e matiz em OKLCh (a mesma base da decomposição), sincronizados com o campo hexadecimal. Se a intensidade não cabe no sRGB, o croma é reduzido e a interface avisa.
- **Tons parecidos:** `checkToneSeparation` mede a distância perceptual (ΔE em OKLab) entre tons vizinhos, por 10 níveis, e avisa quando fica abaixo de `SEPARATION_LIMIT` (0,016). O limite foi calibrado com cores conhecidas e com o olho de quem usa (amarelos, âmbar, limões e ciano ficam abaixo; laranja, rosa, azul e verde, acima). Não é um padrão de mercado.
- **Auto:** botão ao lado da barra de tons. Fica desabilitado quando a gradação está ok e habilitado quando há tons parecidos. Ao clicar, coloca a cor da marca no nível de claridade mais próxima (`suggestBrandLevel`) e refaz a paleta. O nível fica na URL (`lvl`) e volta ao 100 quando você muda a cor ou o sistema de níveis. Na aba Comportamento, depois do Auto, aparece o toggle "Usar sua cor no estado normal" (`normal=brand` na URL).
- **Cor viva:** botão ao lado do Auto, com estado pressionado. Começa desabilitado. Habilita depois do Auto, quando a cor tem pouca intensidade e a opção muda a paleta de forma visível (`vividGain` acima de `VIVID_VISIBLE_LIMIT`, 0,045). Ligada, os tons ganham intensidade e a cor digitada fica exata no nível dela. Fica na URL (`vivid=1`) e desliga quando você muda a cor ou o sistema de níveis.
- O estado fica na URL: dá para compartilhar um ajuste.
- Exporta tokens do Aplica (JSON), variáveis CSS, JSON completo e variables do Figma (para o plugin).
- Verificada com axe (WCAG 2.2 AA) em claro, escuro e mobile.
- Decisões de espaçamento, agrupamento e destaque: [`docs/principios-visuais.md`](docs/principios-visuais.md).
- Textos escritos em PT-BR com a skill `ux-microcopy`. Os fixos estão em `app/index.html`; os dinâmicos, em `app/strings.js`.
- Fonte: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) (OFL), incluída em `app/fonts/`.

## Figma

O plugin em [`figma-plugin/`](figma-plugin) cria as paletas como variables no Figma.

1. No Color Decomposer, abra **Exportar**, escolha **Variables do Figma (para o plugin)** e copie ou baixe o arquivo.
2. No app desktop do Figma: **Plugins → Desenvolvimento → Importar plugin do manifest** e escolha `figma-plugin/manifest.json`.
3. Rode o plugin, cole o arquivo e clique em **Criar variables**.

O que ele cria:

| Coleção | Conteúdo | Modos |
| --- | --- | --- |
| **Primitivos** | palette, neutros e cinzas, cada um com `surface`, `txtOn`, `border` (e `txt`, se ligado) | Claro e Escuro, com o valor de cada modo |
| **Semântica** | os tons de comportamento (`lightest`, `active`, `normal`, `action`, `pressed`, `darkest`) | Claro e Escuro, como alias do tom da paleta |

- Nomes em grupos do Figma: `marca/palette/surface/100`, `marca/neutrals/border/60`, `grayscale/txtOn/5` e, na semântica, `marca/behavior/normal/surface`.
- Cada variable tem escopo próprio (superfície em preenchimentos, texto em texto, borda em contornos), em vez de "todos os usos".
- Rodar de novo atualiza as variables de mesmo nome, sem duplicar.
- A opção **Criar também uma página de amostras** desenha uma tela por modo, com as faixas ligadas às variables.
- O plugin não usa rede: ele só lê o que você cola.

Como foi verificado: o formato é coberto por testes (`test/figma.test.js`) e a mesma lógica do plugin rodou num arquivo de teste do Figma, com os dois modos, os aliases, os escopos e a segunda execução sem duplicar. A interface do plugin (`ui.html`) não foi aberta no Figma.

## Publicar no GitHub Pages (quando você quiser)

1. Torne o repositório público (no plano gratuito, o Pages exige isso).
2. Em **Settings → Pages**, escolha **GitHub Actions** como origem.
3. Peça o workflow de publicação, que roda `npm ci && npm run build` e publica `dist/`.

## Licença e créditos

- Código: [Apache-2.0](LICENSE).
- `test/oracle/aplica-color-decomposer.mjs`: cópia, só para testes, do `ColorDecomposer` de `@aplica/aplica-theme-engine` 3.23.4 (Apache-2.0, © Poe Bellentani). Veja `test/oracle/NOTICE-aplica-theme-engine`.
- `test/fixtures/`: arquivos de [aplica-tokens-themes-sample](https://github.com/aplica-ds/aplica-tokens-themes-sample) (MIT, © 2026 Aplica DS). Veja `test/fixtures/LICENSE-aplica-tokens-themes-sample`.
- "Aplica" e "Aplica Design" são marcas de Poe Bellentani.
