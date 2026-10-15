// Monta a página de ajuda a partir dos textos de strings.js. Só estrutura: nada de texto escrito aqui.

function el(tag, props = {}, ...kids) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids.flat().filter((k) => k != null));
  return node;
}

const paragraphs = (list) => list.map((t) => el('p', { textContent: t }));

function steps(list) {
  return el('ol', { className: 'help__steps' }, list.map((s) =>
    el('li', {}, el('strong', { className: 'help__step-title', textContent: s.title }), el('span', { textContent: s.text }))));
}

function faq(items, id, H) {
  const details = items.map((it) =>
    el('details', { className: 'help__q' },
      el('summary', { textContent: it.q }),
      el('div', { className: 'help__a' }, paragraphs(it.a))));
  const toggle = el('button', { type: 'button', className: 'btn btn--quiet help__toggle', textContent: H.openAll });
  toggle.setAttribute('aria-controls', details.map((d, i) => { d.id = `${id}-${i}`; return d.id; }).join(' '));
  const sync = () => { toggle.textContent = details.every((d) => d.open) ? H.closeAll : H.openAll; };
  toggle.addEventListener('click', () => {
    const open = !details.every((d) => d.open);
    details.forEach((d) => { d.open = open; });
    sync();
  });
  details.forEach((d) => d.addEventListener('toggle', sync));
  return el('div', { className: 'help__faq' }, toggle, el('div', { className: 'help__list' }, details));
}

function code(text, label, H, copyText) {
  const btn = el('button', { type: 'button', className: 'btn btn--quiet code__copy', textContent: H.copy });
  btn.setAttribute('aria-label', H.codeAria(label));
  btn.addEventListener('click', () => copyText(text, H.copied, H.copyFail));
  return el('figure', { className: 'code' }, el('pre', { tabIndex: 0 }, el('code', { textContent: text })), btn);
}

export function buildHelp(host, H, copyText) {
  const D = H.dev;
  const sections = [
    { id: 'help-quick', title: H.sections.quick },
    { id: 'help-faq', title: H.sections.faq },
    { id: 'help-devs', title: H.sections.devs }
  ];
  const heading = (s) => el('h3', { id: s.id, className: 'help__h2', tabIndex: -1, textContent: s.title });

  const nav = el('nav', { className: 'help__toc' }, el('p', { className: 'help__toc-title', textContent: H.toc }),
    el('ul', {}, sections.map((s) => el('li', {}, el('a', { href: `#${s.id}`, textContent: s.title })))));
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault(); // o endereço guarda o estado da paleta, então os atalhos não mexem nele
    const target = document.getElementById(a.getAttribute('href').slice(1));
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  });

  host.replaceChildren(el('div', { className: 'help__inner' },
    el('button', { type: 'button', className: 'btn help__back', id: 'help-back', textContent: H.back }),
    el('h2', { className: 'help__title', id: 'help-title', tabIndex: -1, textContent: H.title }),
    el('p', { className: 'help__intro', textContent: H.intro }),
    nav,

    el('section', { className: 'help__section', 'aria-labelledby': 'help-quick' },
      heading(sections[0]), el('p', { className: 'help__for', textContent: H.forDesigners }), steps(H.steps)),

    el('section', { className: 'help__section', 'aria-labelledby': 'help-faq' },
      heading(sections[1]), el('p', { className: 'help__for', textContent: H.forDesigners }), faq(H.faq, 'help-q', H)),

    el('section', { className: 'help__section', 'aria-labelledby': 'help-devs' },
      heading(sections[2]),
      el('h4', { className: 'help__h3', textContent: D.quick.title }),
      steps(D.quick.steps),
      code(D.quick.setup, D.quick.setupAria, H, copyText),
      code(D.quick.code, D.quick.codeAria, H, copyText),
      el('h4', { className: 'help__h3', textContent: D.faq.title }),
      faq(D.faq.items, 'help-dq', H))));
}
