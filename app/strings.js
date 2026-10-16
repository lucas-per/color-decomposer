// Textos dinâmicos da interface (os fixos ficam no index.html). Escritos com a skill ux-microcopy:
// PT-BR, "você", sentence case, sem pontuação em rótulos e botões.

// A numeração é fixa; o que muda com o modo é qual ponta fica clara.
const order = (first, last, mode) =>
  mode === 'dark'
    ? `No modo escuro, a ordem se inverte: o ${first} é o mais escuro e o ${last}, o mais claro.`
    : `No modo claro, o ${first} é o mais claro e o ${last}, o mais escuro.`;

const orderShort = (first, mode) =>
  mode === 'dark' ? `Modo escuro: o ${first} é o mais escuro.` : `Modo claro: o ${first} é o mais claro.`;

export const T = {
  orderShort,
  tabs: { palette: 'Paleta', neutrals: 'Neutros', behavior: 'Comportamento', grayscale: 'Cinzas' },
  // Texto curto, sempre visível perto da faixa. No comportamento ele já é o texto inteiro.
  intro: {
    behavior: (n) => `${n} tons da paleta com nome de uso. Aparecem em estados como foco, passar o mouse e clicar.`
  },
  // Texto completo, no pop-up "Saiba mais".
  learn: {
    open: 'Saiba mais',
    openAria: { palette: 'Saiba mais sobre a paleta', neutrals: 'Saiba mais sobre os neutros', grayscale: 'Saiba mais sobre os cinzas' },
    title: { palette: 'Sobre a paleta', neutrals: 'Sobre os neutros', grayscale: 'Sobre os cinzas' },
    body: {
      palette: (n, first, last, base, mode) => [
        `${n} tons da sua cor, numerados de ${first} a ${last}.`,
        order(first, last, mode),
        mode === 'dark'
          ? `O nível ${base} é a base da sua cor, ajustada para o modo escuro.`
          : `O nível ${base} é a cor que você informou.`
      ],
      neutrals: (n, first, last, mode) => [
        `${n} cinzas com um toque da sua cor, numerados de ${first} a ${last}.`,
        'Servem para fundos, textos e bordas.',
        order(first, last, mode)
      ],
      grayscale: (n, first, last, mode) => [
        `${n} cinzas puros e fixos, iguais para qualquer cor, numerados de ${first} a ${last}.`,
        order(first, last, mode)
      ]
    }
  },
  groupLabel: {
    palette: 'Tons da paleta, em ordem numérica',
    neutrals: 'Neutros, em ordem numérica',
    behavior: 'Tons de comportamento',
    grayscale: 'Cinzas, em ordem numérica'
  },
  behaviorNames: { lightest: 'Início da escala', active: 'Ativo', normal: 'Normal', action: 'Ação', pressed: 'Pressionado', darkest: 'Fim da escala' },
  // Rótulos que o preset Padrão troca (a chave do motor continua a do Aplica)
  behaviorNamesByPreset: { standard: { action: 'Hover' } },
  yourColor: 'Sua cor',
  mainColor: 'Cor principal',
  supportColor: 'Cor de apoio',
  overlapOff: 'Desligado',
  resetDone: 'Ajustes voltaram ao padrão.',
  tune: {
    group: 'Ajustar a cor por claridade, intensidade e matiz',
    lightness: 'Claridade',
    chroma: 'Intensidade',
    hue: 'Matiz',
    clipped: (c) => `Essa intensidade passa do máximo possível para esta cor. Ajustamos para ${c}. Para ter mais, mude a claridade ou o matiz.`,
    ok: 'Tons bem separados.',
    okAt: (level) => `Tons bem separados. Sua cor está no nível ${level}.`,
    some: (n, total, level) => `${n} de ${total} tons quase iguais ao tom ao lado, marcados abaixo da barra.${level ? ` O Auto coloca sua cor no nível ${level} e refaz a paleta.` : ''}`,
    okVivid: (level) => `Tons bem separados. Sua cor está no nível ${level}. Quer mais cor nos tons? Use a Cor viva.`,
    vividOn: 'Cor viva aplicada.',
    auto: 'Auto',
    autoAria: 'Auto: colocar a cor no melhor nível da paleta'
  },

  normal: {
    on: (level) => `Ligado: o estado normal usa o nível ${level}, onde está a sua cor. Os outros estados se ajustam junto.`,
    off: (level) => `Desligado: o estado normal usa o nível ${level}, o tom do meio da escala.`
  },

  similar: {
    msg: (ranges, side, canAuto, hasSupport) => {
      const tip = hasSupport ? 'Tente ajustar a cor de apoio ou a principal.' : canAuto ? 'Use o Auto, ao lado da barra de tons, para refazer a paleta.' : side === 'lighter' ? 'Tente deixar a cor da marca menos clara.'
        : side === 'darker' ? 'Tente deixar a cor da marca mais clara.' : 'Tente ajustar a claridade da cor da marca.';
      return `${ranges.length === 1 ? 'Os tons' : 'Os trechos'} ${ranges.join(' e ')} estão muito parecidos entre si. ${tip}`;
    }
  },

  support: {
    atLevel: (level) => `Fica no nível ${level}.`,
    sameLevel: (level) => `Cai no mesmo nível da cor principal (${level}).`,
    outOfOrder: (level) => `Não cabe no nível ${level}.`,
    tuneOn: 'Tons bem separados. Com a cor de apoio, o Auto e a Cor viva ficam desligados.',
    warnSame: (level) => `As duas cores caem no mesmo nível (${level}). Escolha uma cor de apoio mais clara ou mais escura.`,
    warnOrder: (level) => `A cor de apoio não cabe no nível ${level}, porque quebra a ordem de claridade da cor principal. Escolha uma cor de apoio mais clara ou mais escura.`,
    note: 'Sua cor de apoio, sem alteração.',
    removed: 'Cor de apoio removida.'
  },

  hexError: 'Esse código não funciona. Use 6 letras ou números, como #E7398A.',
  pickHint: 'Selecione um tom para ver o texto, a borda e o contraste dele.',

  detail: {
    level: (n) => `Nível ${n}`,
    behavior: (name, level) => `${name}, nível ${level}`,
    surface: 'Superfície',
    txtOn: 'Texto sobre a superfície',
    border: 'Borda',
    copy: 'Copiar',
    copyLevelAria: (title, hex) => `Copiar o código do ${title.toLowerCase()}, ${hex}`,
    copyAria: (what, hex) => `Copiar ${what.toLowerCase()} ${hex}`,
    copied: (hex) => `Copiado: ${hex}`,
    copyFail: 'Não deu para copiar. Selecione o código e use Ctrl+C.',
    close: 'Fechar detalhes',
    sample: 'Texto de exemplo',
    baseNote: 'Sua cor, sem alteração.',
    otherMode: (mode) => `No modo ${mode === 'dark' ? 'escuro' : 'claro'}`,
    contrast: (r) => `Contraste ${fmt(r)} para 1`
  },

  verdict: {
    both: 'Passa no AA e no AAA',
    aa: 'Passa no AA, mas não no AAA',
    none: 'Não passa no AA'
  },

  swatchAria: (label, surface, txtOn, ratio, verdict) =>
    `${label}. Superfície ${surface}. Texto ${txtOn}. Contraste ${fmt(ratio)} para 1. ${verdict}.`,
  flagBelow: (req) => `Abaixo de ${req}`,

  warnings: {
    title: 'Contraste abaixo do pedido',
    accept: (n, req) => `${n} ${n === 1 ? 'tom não chega' : 'tons não chegam'} a ${req} para 1. Neles, usamos 4,5 para 1 (AA). Eles têm uma marca.`,
    keep: (n, req) => `${n} ${n === 1 ? 'tom não chega' : 'tons não chegam'} a ${req} para 1. Mantivemos o texto gerado. Eles têm uma marca.`,
    short: (n) => `${n} ${n === 1 ? 'tom abaixo' : 'tons abaixo'} do contraste pedido.`,
    show: 'Ver quais',
    hide: 'Ocultar',
    item: (group, level, ratio) => `${group[0].toUpperCase()}${group.slice(1)}, nível ${level}: ${fmt(ratio)} para 1`,
    groups: { palette: 'paleta', neutrals: 'neutros' },
    override: (n) => `${n} ${n === 1 ? 'texto informado por você não passa' : 'textos informados por você não passam'} no contraste pedido.`,
    config: 'Nenhuma cor própria foi preenchida, então usamos a alternativa escolhida em todos os tons.',
    errorTitle: 'Não foi possível gerar os tons',
    errorHelp: 'Escolha outra opção em “Se o contraste pedido não for possível” ou mude o contraste mínimo para AA.'
  },

  export: {
    copied: 'Copiado para a área de transferência.',
    copyFail: 'Não deu para copiar. Selecione o texto e use Ctrl+C.',
    figmaHelp: 'Cole este arquivo no plugin Color Decomposer, dentro do Figma. Ele cria as coleções Primitivos e Semântica, cada uma com os modos Claro e Escuro.',
    downloaded: (file) => `Arquivo ${file} baixado.`
  },
};

export function fmt(ratio) {
  return (Math.floor(ratio * 10) / 10).toFixed(1).replace('.', ',');
}

/* ---------- Ajuda ---------- */

// Recebe os presets para citar números e cores que vêm dos dados, não de cópias.
export function helpText({ standard: S, aplica: A }) {
  const n = (p) => ({ pal: p.palette.levels.length, neu: p.neutrals.levels.length });
  const s = n(S), a = n(A);
  const mir = (p) => ({ pal: p.palette.levels[0] + p.palette.levels.at(-1), neu: p.neutrals.levels[0] + p.neutrals.levels.at(-1) });
  const sm = mir(S);
  const sFirst = S.palette.levels[0], sLast = S.palette.levels.at(-1);
  const ink = { dark: S.ink.dark.toUpperCase(), light: S.ink.light.toUpperCase() };
  const base = S.palette.baseLevel;
  const hover = S.behavior.action;

  return {
    link: 'Ajuda',
    linkAria: 'Abrir a ajuda',
    back: 'Voltar para a paleta',
    title: 'Ajuda',
    docTitle: 'Ajuda · Color Decomposer',
    intro: 'Um guia de cinco passos e as respostas para as dúvidas mais comuns. A última parte é para quem usa o motor no código.',
    toc: 'Nesta página',
    openAll: 'Abrir todas',
    closeAll: 'Fechar todas',
    copy: 'Copiar',
    copied: 'Copiado.',
    copyFail: 'Não deu para copiar. Selecione o texto e use Ctrl+C.',
    codeAria: (what) => `Copiar ${what}`,
    sections: {
      quick: 'Guia rápido',
      faq: 'Perguntas frequentes',
      devs: 'Para devs'
    },
    forDesigners: 'Para quem usa a interface',
    steps: [
      {
        title: 'Escolha a cor',
        text: 'Digite o código em Cor da marca ou use o seletor. Os tons aparecem na hora. Em Ajustar a cor, refine claridade, intensidade e matiz.'
      },
      {
        title: 'Escolha o sistema de níveis',
        text: `Em Ajustes básicos, o Padrão tem ${s.pal} tons e ${s.neu} neutros. O Aplica tem ${a.pal} tons e ${a.neu} neutros e segue as regras do Aplica Design System.`
      },
      {
        title: 'Leia os tons',
        text: 'As abas Paleta, Neutros, Comportamento e Cinzas mostram cada grupo. Troque entre claro e escuro em Modo de cor. Ao escolher um tom, você vê a superfície, o texto, a borda e o contraste, com o veredito em palavras.'
      },
      {
        title: 'Ajuste se precisar',
        text: 'Se os tons ficarem parecidos, use o Auto. Para cores de pouca intensidade, a Cor viva. Para ter duas cores na mesma paleta, Adicionar cor de apoio.'
      },
      {
        title: 'Leve para o projeto',
        text: 'Nas abas Paleta e Neutros, cada tom tem um botão para copiar o código. Para tudo de uma vez, use Exportar tokens: JSON do Aplica, variáveis CSS, JSON completo ou variables do Figma.'
      }
    ],
    faq: [
      {
        q: 'O que é um nível?',
        a: [
          `Cada tom da escala tem um número. No modo claro, quanto menor o número, mais claro o tom. No nível ${base} fica a sua cor, sem alteração.`,
          `No modo escuro, a escala é espelhada: o nível ${sFirst} recebe a claridade que o ${sLast} tem no claro, e o contrário. A intensidade cai para 85%, por padrão.`
        ]
      },
      {
        q: 'Padrão ou Aplica: qual escolher?',
        a: [
          `O Aplica tem ${a.pal} tons e ${a.neu} neutros e reproduz as regras do Aplica Design System (engine 3.23.4). Escolha esse se você precisa dos mesmos tokens do Aplica.`,
          `O Padrão tem ${s.pal} tons e ${s.neu} neutros, uma escala menor. O tom mais escuro é menos profundo, o texto usa ${ink.dark} e ${ink.light} em vez de preto e branco, e os tons que não cabem no sRGB mantêm o matiz. Para começar, é o mais simples.`
        ]
      },
      {
        q: 'Por que o Auto muda o nível da minha cor?',
        a: [
          `Em cores muito claras ou muito escuras, o nível ${base} deixa os tons vizinhos colados. O Auto coloca a cor no nível de claridade mais próxima e a escala passa por ela.`,
          `O botão fica desligado quando a gradação já está boa. Na aba Comportamento, depois do Auto, aparece a opção Usar sua cor no estado normal.`
        ]
      },
      {
        q: 'O que quer dizer o aviso de tons parecidos?',
        a: [
          'A diferença entre tons vizinhos ficou pequena demais para o olho separar. Medimos a distância perceptual entre tons a 10 níveis um do outro. Amarelos, âmbar, limões e ciano costumam cair aqui.',
          'O limite foi calibrado com cores conhecidas e com o olho de quem usa. Não é um padrão de mercado. Experimente o Auto.'
        ]
      },
      {
        q: 'O que a Cor viva faz?',
        a: [
          'Dá intensidade aos tons de uma cor com pouca intensidade, como um off-white ou um cinza azulado. Sua cor continua exata, e nenhum tom perde intensidade.',
          'O botão só liga depois do Auto, quando a opção muda a paleta de forma visível. Ela não vale junto com a cor de apoio.'
        ]
      },
      {
        q: 'Para que serve a cor de apoio?',
        a: [
          'Para quando uma cor só não basta, como um off-white de fundo e um amarelo de destaque. A cor principal fica no nível 100. A de apoio vai para o nível de claridade mais próxima, do lado certo da principal.',
          'Entre as duas, a claridade muda em passos iguais, e o matiz e a intensidade se misturam aos poucos. Neutros e comportamento vêm da cor principal. Para editar cada cor nos controles, use Cor a ajustar.',
          'Se as duas caírem no mesmo nível ou a de apoio fizer a claridade subir, a interface avisa e usa só a principal.'
        ]
      },
      {
        q: 'Por que o texto no Padrão não é preto nem branco?',
        a: [
          `No Padrão, o texto escuro é ${ink.dark} e o claro é ${ink.light}. Se nenhum dos dois alcança o contraste pedido em um tom, usamos a cor mais próxima deles que alcança: um pouco mais escura ou mais clara, só o necessário.`,
          'Isso acontece em tons de claridade média. Nos tons mais escuros ou mais claros, as duas cores já passam.'
        ]
      },
      {
        q: 'O contraste mínimo é AA?',
        a: [
          'Por padrão, sim: 4,5 para 1. Em Contraste mínimo, você pode pedir AAA (7 para 1).',
          'Cada tom mostra o veredito em palavras. Se o AAA for impossível em algum tom, avisamos. O que fazer nesse caso você escolhe em Se o contraste pedido não for possível.'
        ]
      },
      {
        q: 'Como compartilho a paleta que montei?',
        a: ['A cor, o sistema de níveis, a aba e os ajustes ficam no endereço da página. Copie o endereço e quem abrir vê o mesmo resultado.']
      },
      {
        q: `Por que o nível ${hover} se chama Hover no Padrão e Ação no Aplica?`,
        a: [
          `É o mesmo estado: um passo mais escuro que o normal, para o elemento quando o mouse está sobre ele. O Aplica o chama de Ação. No Padrão usamos Hover.`,
          'Só o rótulo muda. Nos arquivos exportados, a chave continua action.'
        ]
      }
    ],
    dev: {
      quick: {
        title: 'Guia rápido',
        steps: [
          { title: 'Instale e teste', text: 'Requer Node 18 ou mais novo. O motor, em src/, não tem dependências.' },
          { title: 'Decomponha uma cor', text: 'decompose devolve paleta, neutros e comportamento, em claro e escuro. decomposeTheme junta várias cores e os cinzas.' },
          { title: 'Escolha as opções', text: 'Os nomes seguem os do Aplica. A tabela completa está no README, em Opções.' }
        ],
        setup: ['npm install', 'npm test', 'npm run dev     # interface em http://localhost:3000', 'npm run build   # gera a interface em dist/'].join('\n'),
        setupAria: 'os comandos de instalação',
        code: [
          "import { decompose, decomposeTheme, auditResult } from './src/index.js';",
          '',
          "const r = decompose({ base: '#E7398A', preset: 'standard' });",
          `r.light.palette.surface[${base}];   // '#e7398a'`,
          'r.dark.behavior.surface.action; // nível 120, no escuro',
          'r.warnings;                     // avisos de contraste, se houver',
          '',
          'const theme = decomposeTheme({',
          "  colors: { brand: '#E7398A', info: '#38C2D0' },",
          "  options: { txtOnStrategy: 'brand-tint', accessibilityLevel: 'AAA' }",
          '});'
        ].join('\n'),
        codeAria: 'o exemplo de código'
      },
      faq: {
        title: 'Perguntas frequentes',
        items: [
          {
            q: 'Como sei que o Aplica sem extensões bate com o oficial?',
            a: [
              'Três camadas de teste. O golden compara dois temas reais do repositório de exemplo do Aplica. O oráculo compara com o ColorDecomposer da engine 3.23.4 em 71 cores e 13 combinações de opções. Os invariantes cobrem nível 100 exato, ordem de claridade, espelho do escuro, bordas e contraste.',
              'Rode npm test para ver tudo.'
            ]
          },
          {
            q: 'O que é uma extensão?',
            a: [
              'Algo que não existe no Aplica e é opcional: o preset standard, brandLevel, behaviorFollowsBrand, vividChroma e anchors. O comportamento padrão não muda, e sem extensões o resultado é idêntico ao oficial.'
            ]
          },
          {
            q: 'Posso criar meu próprio preset?',
            a: [
              'Sim. Um preset é um objeto de dados, sem código: níveis e claridades da paleta e dos neutros, o nível base, os níveis de comportamento e, se quiser, ink e gamutMap. Passe o objeto em preset. O modelo está em src/presets.js.'
            ]
          },
          {
            q: 'Quais formatos de exportação existem?',
            a: [
              'toPrimitiveTheme e toGrayscaleTheme (tokens do Aplica), toCssVariables (variáveis CSS), toPlainJson (JSON completo) e toFigmaJson (variables do Figma). auditResult lista o contraste de cada par de superfície e texto.'
            ]
          },
          {
            q: 'Como uso no Figma?',
            a: [
              'Em Exportar tokens, escolha Variables do Figma e copie o arquivo. No Figma desktop, importe o plugin de figma-plugin/manifest.json em Plugins, Desenvolvimento, e cole o arquivo. Rodar de novo atualiza as variables, sem duplicar.',
              'A lógica foi testada num arquivo do Figma. A interface do plugin ainda não foi aberta lá.'
            ]
          },
          {
            q: 'O que não está implementado?',
            a: [
              'A camada mapping (brand, interface, product), que faz parte do gerador de temas completo do Aplica e fica fora do escopo do decomposer.'
            ]
          }
        ]
      }
    }
  };
}
