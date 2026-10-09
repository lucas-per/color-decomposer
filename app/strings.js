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
  yourColor: 'Sua cor',
  overlapOff: 'Desligado',
  resetDone: 'Ajustes voltaram ao padrão.',
  hexError: 'Esse código não funciona. Use 6 letras ou números, como #E7398A.',
  pickHint: 'Selecione um tom para ver o texto, a borda e o contraste dele.',

  detail: {
    level: (n) => `Nível ${n}`,
    behavior: (name, level) => `${name}, nível ${level}`,
    surface: 'Superfície',
    txtOn: 'Texto sobre a superfície',
    border: 'Borda',
    copy: 'Copiar',
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
