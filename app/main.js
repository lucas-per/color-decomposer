import {
  decomposeTheme, contrastRatio, PRESETS, toPrimitiveTheme, toGrayscaleTheme, toCssVariables, toPlainJson
} from '../src/index.js';
import { T, fmt } from './strings.js';
import { chromeTokens, applyChrome } from './chrome.js';
import { DEFAULTS, parseHash, serialize } from './state.js';

const NAME = 'marca';
const $ = (id) => document.getElementById(id);
const systemMode = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const HEX6 = /^#?[0-9a-f]{6}$/i;
const toHex = (v) => (HEX6.test(v.trim()) ? `#${v.trim().replace('#', '').toLowerCase()}` : null);
const up = (hex) => hex.toUpperCase();

let state = parseHash(location.hash, systemMode());
let current = null; // último resultado válido: { theme, preset }
let lastError = '';

/* ---------- Motor ---------- */

function buildOptions(s) {
  const o = {
    txtOnStrategy: s.strategy,
    accessibilityLevel: s.level,
    colorContrastDecompose: s.order,
    darkModeChroma: s.darkChroma / 100,
    onAccessibilityFailure: s.failure,
    generateTxt: s.txt
  };
  if (s.overlap !== '') o.overlap = { level: Number(s.overlap) };
  if (s.strategy === 'custom-tint') {
    o.txtOnCustomTint = { fallback: s.customFallback, ...(s.customLight && { light: s.customLight }), ...(s.customDark && { dark: s.customDark }) };
  }
  const border = {};
  if (s.borderPalette !== '') border.palette = Number(s.borderPalette);
  if (s.borderNeutrals !== '') border.neutrals = Number(s.borderNeutrals);
  if (Object.keys(border).length) o.borderOffset = border;
  return o;
}

function build(s, name = NAME) {
  const preset = PRESETS[s.preset];
  try {
    const neutralsOverrides = {};
    if (s.neutralsOwn) {
      const block = { baseColor: s.neutralsBase, referenceLevel: Number(s.neutralsRef || preset.neutrals.referenceLevel) };
      neutralsOverrides[name] = { light: block, dark: block };
    }
    const theme = decomposeTheme({ colors: { [name]: s.color }, preset, options: buildOptions(s), neutralsOverrides });
    return { theme, preset };
  } catch (e) {
    return { error: e.message };
  }
}

/* ---------- Modelo dos tons exibidos ---------- */

const requiredRatio = () => (state.level === 'AAA' ? 7 : 4.5);

function verdictOf(ratio) {
  if (ratio >= 7) return { text: T.verdict.both, ok: true };
  if (ratio >= 4.5) return { text: T.verdict.aa, ok: true };
  return { text: T.verdict.none, ok: false };
}

function pair(group, key) {
  return { s: group.surface[key], t: group.txtOn[key], b: group.border[key] };
}

function itemsFor(tab, mode) {
  const { theme, preset } = current;
  const other = mode === 'dark' ? 'light' : 'dark';
  const c = theme.colors[NAME];
  const mk = (key, num, label, title, a, o, extra = {}) => {
    const ratio = contrastRatio(a.s, a.t);
    return { key: String(key), num, label, title, a, o, ratio, ...extra };
  };
  if (tab === 'behavior') {
    return Object.entries(preset.behavior).map(([name, level]) => {
      const nice = T.behaviorNames[name] ?? name;
      return mk(name, level, T.detail.behavior(nice, level), T.detail.behavior(nice, level),
        pair(c[mode].behavior, name), pair(c[other].behavior, name), { name: nice, base: level === preset.palette.baseLevel });
    });
  }
  if (tab === 'grayscale') {
    return preset.neutrals.levels.map((l) =>
      mk(l, l, T.detail.level(l), T.detail.level(l), pair(theme.grayscale[mode], l), pair(theme.grayscale[other], l)));
  }
  const levels = preset[tab].levels;
  return levels.map((l) => {
    const base = tab === 'palette' && l === preset.palette.baseLevel;
    const label = base ? `${T.detail.level(l)}, ${T.yourColor.toLowerCase()}` : T.detail.level(l);
    return mk(l, l, label, T.detail.level(l), pair(c[mode][tab], l), pair(c[other][tab], l), { base });
  });
}

/* ---------- Avisos ---------- */

function renderAlerts() {
  const host = $('alerts');
  host.replaceChildren();
  const add = (html, role) => {
    const d = document.createElement('div');
    d.className = 'notice';
    if (role) d.setAttribute('role', role);
    d.innerHTML = html;
    host.append(d);
    return d;
  };
  if (lastError) {
    add(`<p class="notice__title">${T.warnings.errorTitle}</p><p>${esc(lastError)}</p><p>${T.warnings.errorHelp}</p>`, 'alert');
    return;
  }
  const ws = current.theme.warnings;
  const acc = [];
  const seen = new Set();
  for (const w of ws.filter((x) => x.type === 'accessibility' && x.mode === state.mode)) {
    const k = `${w.mode}|${w.group}|${w.level}`;
    if (!seen.has(k)) { seen.add(k); acc.push(w); }
  }
  if (acc.length) {
    const accepted = acc.every((w) => w.accepted === 'AA');
    const req = fmt(acc[0].required).replace(',0', '');
    const d = add(`<p class="notice__title">${T.warnings.title}</p><p>${(accepted ? T.warnings.accept : T.warnings.keep)(acc.length, req)}</p>
      <button type="button" class="btn" aria-expanded="false" aria-controls="warn-list">${T.warnings.show}</button>
      <ul class="notice__list" id="warn-list" hidden>${acc.map((w) => `<li>${T.warnings.item(T.warnings.groups[w.group], w.level, w.ratio)}</li>`).join('')}</ul>`, 'status');
    const btn = d.querySelector('button');
    btn.addEventListener('click', () => {
      const list = d.querySelector('ul');
      const open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? T.warnings.hide : T.warnings.show;
    });
  }
  const ov = ws.filter((x) => x.type === 'override');
  if (ov.length) add(`<p>${T.warnings.override(ov.length)}</p>`, 'status');
  if (ws.some((x) => x.type === 'config')) add(`<p>${T.warnings.config}</p>`, 'status');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- Abas ---------- */

function renderTabs() {
  const host = $('tabs');
  if (!host.children.length) {
    for (const id of ['palette', 'neutrals', 'behavior', 'grayscale']) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.role = 'tab'; b.id = `tab-${id}`; b.dataset.tab = id;
      b.setAttribute('aria-controls', 'panel');
      b.textContent = T.tabs[id];
      host.append(b);
    }
    host.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
    host.addEventListener('keydown', (e) => {
      const tabs = [...host.children];
      const i = tabs.findIndex((t) => t.dataset.tab === state.tab);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const t = tabs[(next + tabs.length) % tabs.length];
      setTab(t.dataset.tab);
      t.focus();
    });
  }
  for (const b of host.children) {
    const on = b.dataset.tab === state.tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  $('panel').setAttribute('aria-labelledby', `tab-${state.tab}`);
}

function setTab(tab) {
  if (tab === state.tab) return;
  state.tab = tab;
  state.sel = '';
  render();
}

/* ---------- Faixa de tons ---------- */

const narrow = () => matchMedia('(max-width: 56.25rem)').matches;

function swatchHtml(it, tab) {
  const flag = it.ratio < requiredRatio();
  const flagEl = flag ? '<span class="swatch__flag" aria-hidden="true"></span>' : '';
  const inner = flagEl + (tab === 'behavior'
    ? `<span class="swatch__num">${it.num}</span><span class="swatch__stack"><span class="swatch__aa" aria-hidden="true">Aa</span><span class="swatch__name">${esc(it.name)}</span></span>`
    : `<span class="swatch__num">${it.num}</span><span class="swatch__aa" aria-hidden="true">Aa</span>`);
  const tag = it.base ? `<span class="swatch__tag">${T.yourColor}</span>` : '';
  return `${inner}<span class="swatch__meta" aria-hidden="true"><span class="swatch__hex">${up(it.a.s)}</span>${tag}<br>${fmt(it.ratio)} para 1</span>`;
}

function paintSwatch(btn, it, tab) {
  btn.style.setProperty('--s', it.a.s);
  btn.style.setProperty('--t', it.a.t);
  const flag = it.ratio < requiredRatio();
  const v = verdictOf(it.ratio);
  btn.setAttribute('aria-label', T.swatchAria(it.label, up(it.a.s), up(it.a.t), it.ratio, v.text) + (flag ? ` ${T.flagBelow(state.level)}.` : ''));
  btn.innerHTML = swatchHtml(it, tab);
}

function renderRibbon() {
  const host = $('ribbon-host');
  const tab = state.tab;
  const items = itemsFor(tab, state.mode);
  const sig = `${tab}|${state.preset}|${items.map((i) => i.key).join(',')}|${narrow()}`;
  const focusedKey = document.activeElement?.closest?.('.swatch')?.dataset.key;

  let ribbon = host.firstElementChild;
  if (host.dataset.sig !== sig) {
    host.dataset.sig = sig;
    ribbon = document.createElement('div');
    ribbon.className = 'ribbon';
    ribbon.setAttribute('role', 'radiogroup');
    ribbon.setAttribute('aria-label', T.groupLabel[tab]);
    ribbon.style.setProperty('--n', items.length);
    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.role = 'radio'; b.dataset.key = it.key; b.dataset.i = i;
      ribbon.append(b);
      if (it.base && !narrow() && tab !== 'behavior') {
        const tagEl = document.createElement('span');
        tagEl.className = 'ribbon__base'; tagEl.style.gridColumn = String(i + 1); tagEl.textContent = T.yourColor;
        tagEl.setAttribute('aria-hidden', 'true');
        ribbon.append(tagEl);
      }
    });
    ribbon.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) select(b.dataset.key); });
    ribbon.addEventListener('keydown', onRibbonKey);
    host.replaceChildren(ribbon);
  }

  const buttons = [...ribbon.querySelectorAll('.swatch')];
  items.forEach((it, i) => paintSwatch(buttons[i], it, tab));
  const selIndex = items.findIndex((it) => it.key === state.sel);
  buttons.forEach((b, i) => {
    const on = i === selIndex;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on || (selIndex < 0 && i === 0) ? 0 : -1;
  });

  ribbon.querySelectorAll('.detail, .hint').forEach((n) => n.remove());
  if (selIndex < 0) {
    const p = document.createElement('p');
    p.className = 'hint'; p.textContent = T.pickHint;
    ribbon.append(p);
  } else {
    const panel = detailPanel(items[selIndex], selIndex, items.length);
    if (narrow()) buttons[selIndex].after(panel); else ribbon.append(panel);
  }
  if (focusedKey) ribbon.querySelector(`.swatch[data-key="${CSS.escape(focusedKey)}"]`)?.focus({ preventScroll: true });
}

function onRibbonKey(e) {
  const buttons = [...e.currentTarget.querySelectorAll('.swatch')];
  const i = buttons.indexOf(document.activeElement);
  if (i < 0) return;
  if (e.key === 'Escape') { if (state.sel) { e.preventDefault(); state.sel = ''; render(); } return; }
  const target = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
  if (target === undefined) return;
  e.preventDefault();
  const b = buttons[Math.max(0, Math.min(buttons.length - 1, target))];
  select(b.dataset.key);
  e.currentTarget.querySelector(`.swatch[data-key="${CSS.escape(b.dataset.key)}"]`)?.focus();
}

function select(key) {
  state.sel = key;
  render();
}

/* ---------- Detalhes ---------- */

const ICON_OK = '<svg class="verdict__icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NO = '<svg class="verdict__icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8.5 15h-17z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v4.5M10 14.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function detailPanel(it, index, count) {
  const v = verdictOf(it.ratio);
  const el = document.createElement('section');
  el.className = 'detail';
  el.setAttribute('aria-label', `Detalhes: ${it.title}`);
  el.style.setProperty('--caret', String((index + 0.5) / count));
  const row = (what, hex) => `
    <div class="value">
      <span class="value__chip" style="--c:${hex}"></span>
      <span><span class="value__label">${what}</span><span class="value__hex">${up(hex)}</span></span>
      <button type="button" class="btn" data-copy="${up(hex)}" aria-label="${T.detail.copyAria(what, up(hex))}">${T.detail.copy}</button>
    </div>`;
  const otherMode = state.mode === 'dark' ? 'light' : 'dark';
  el.innerHTML = `
    <div class="detail__head">
      <h3 class="detail__title">${esc(it.title)}</h3>
      ${it.base && state.tab !== 'behavior' ? `<span class="detail__note">${T.detail.baseNote}</span>` : ''}
      <button type="button" class="btn btn--quiet" data-close>${T.detail.close}</button>
    </div>
    <div>
      <div class="values">${row(T.detail.surface, it.a.s)}${row(T.detail.txtOn, it.a.t)}${row(T.detail.border, it.a.b)}</div>
      <p class="verdict">${v.ok ? ICON_OK : ICON_NO}<span>${T.detail.contrast(it.ratio)}. ${v.text}.</span></p>
    </div>
    <div class="sample" style="--s:${it.a.s};--t:${it.a.t};--b:${it.a.b}">
      <span class="sample__big" aria-hidden="true">Aa</span>
      <span class="sample__small">${T.detail.sample}</span>
    </div>
    <div class="other">
      <span>${T.detail.otherMode(otherMode)}</span>
      <span class="other__chip"><i style="--c:${it.o.s}"></i>${up(it.o.s)}</span>
      <span class="other__chip"><i style="--c:${it.o.t}"></i>${up(it.o.t)}</span>
      <span class="other__chip"><i style="--c:${it.o.b}"></i>${up(it.o.b)}</span>
    </div>`;
  el.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-copy]');
    if (c) { await copyText(c.dataset.copy, T.detail.copied(c.dataset.copy), T.detail.copyFail); return; }
    if (e.target.closest('[data-close]')) {
      const key = state.sel;
      state.sel = '';
      render();
      $('ribbon-host').querySelector(`.swatch[data-key="${CSS.escape(key)}"]`)?.focus();
    }
  });
  return el;
}

/* ---------- Área de transferência e avisos falados ---------- */

let liveTimer;
function say(text) {
  const live = $('live');
  live.textContent = '';
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { live.textContent = text; }, 30);
}

async function copyText(text, okMsg, failMsg, statusEl) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  const msg = ok ? okMsg : failMsg;
  if (statusEl) statusEl.textContent = msg; else say(msg);
}

/* ---------- Ajustes ---------- */

const FIELD_HEX = [
  { id: 'hex', key: 'color', optional: false },
  { id: 'customLight', key: 'customLight', optional: true },
  { id: 'customDark', key: 'customDark', optional: true },
  { id: 'neutralsBase', key: 'neutralsBase', optional: false }
];
const FIELD_SIMPLE = ['preset', 'strategy', 'level', 'order', 'overlap', 'failure', 'customFallback', 'neutralsRef', 'borderPalette', 'borderNeutrals'];

function setInvalid(input, on) {
  let err = $(`${input.id}-error`);
  if (!err) {
    err = document.createElement('p');
    err.className = 'field__error'; err.id = `${input.id}-error`; err.hidden = true;
    err.textContent = T.hexError;
    input.closest('.field').append(err);
    input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') ?? ''} ${err.id}`.trim());
  }
  err.hidden = !on;
  err.textContent = T.hexError;
  if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
}

function bindControls() {
  for (const f of FIELD_HEX) {
    const input = $(f.id);
    input.addEventListener('input', () => {
      const v = input.value.trim();
      const hex = toHex(v);
      if (hex) { state[f.key] = hex; setInvalid(input, false); if (f.id === 'hex') $('picker').value = hex; update(); }
      else if (f.optional && v === '') { state[f.key] = ''; setInvalid(input, false); update(); }
      else if (v.replace('#', '').length >= 6) setInvalid(input, true);
    });
    input.addEventListener('blur', () => {
      const v = input.value.trim();
      const ok = toHex(v) || (f.optional && v === '');
      setInvalid(input, !ok);
    });
  }
  $('picker').addEventListener('input', (e) => {
    state.color = e.target.value.toLowerCase();
    $('hex').value = up(state.color); setInvalid($('hex'), false);
    update();
  });
  for (const id of FIELD_SIMPLE) {
    $(id).addEventListener('change', (e) => {
      state[id] = e.target.value;
      if (id === 'preset') { state.overlap = ''; state.neutralsRef = ''; state.sel = ''; }
      update();
    });
  }
  $('darkChroma').addEventListener('input', (e) => { state.darkChroma = Number(e.target.value); $('darkChroma-out').textContent = `${state.darkChroma}%`; update(); });
  for (const id of ['neutralsOwn', 'txt']) $(id).addEventListener('change', (e) => { state[id] = e.target.checked; update(); });
  for (const r of document.querySelectorAll('input[name="mode"]')) r.addEventListener('change', () => { state.mode = r.value; update(); });
  $('reset').addEventListener('click', () => {
    state = { ...DEFAULTS, mode: state.mode };
    for (const f of FIELD_HEX) setInvalid($(f.id), false);
    update();
    say(T.resetDone);
  });
  $('rail').addEventListener('submit', (e) => e.preventDefault());
}

function syncControls() {
  const preset = PRESETS[state.preset];
  $('hex').value = up(state.color);
  if (document.activeElement !== $('hex')) setInvalid($('hex'), false);
  $('picker').value = state.color;
  for (const id of FIELD_SIMPLE) if (!['overlap', 'neutralsRef'].includes(id)) $(id).value = state[id];
  $('borderPalette').placeholder = String(preset.palette.step);
  $('borderNeutrals').placeholder = '1';
  $('customLight').value = state.customLight ? up(state.customLight) : '';
  $('customDark').value = state.customDark ? up(state.customDark) : '';
  $('neutralsBase').value = up(state.neutralsBase);
  $('darkChroma').value = state.darkChroma;
  $('darkChroma-out').textContent = `${state.darkChroma}%`;
  $('neutralsOwn').checked = state.neutralsOwn;
  $('txt').checked = state.txt;
  document.querySelector(`input[name="mode"][value="${state.mode}"]`).checked = true;

  const overlap = $('overlap');
  overlap.replaceChildren(new Option(T.overlapOff, ''), ...preset.palette.levels.map((l) => new Option(String(l), String(l))));
  overlap.value = preset.palette.levels.includes(Number(state.overlap)) ? state.overlap : '';
  const ref = $('neutralsRef');
  ref.replaceChildren(...preset.neutrals.levels.map((l) => new Option(String(l), String(l))));
  ref.value = String(state.neutralsRef || preset.neutrals.referenceLevel);

  const show = {
    custom: state.strategy === 'custom-tint',
    overlap: state.strategy === 'brand-tint' || (state.strategy === 'custom-tint' && state.customFallback === 'brand-tint'),
    failure: state.level === 'AAA',
    neutrals: state.neutralsOwn,
    order: true
  };
  for (const el of document.querySelectorAll('[data-when]')) el.hidden = !show[el.dataset.when];
}

/* ---------- Exportação ---------- */

const exp = { name: 'marca' };
const slug = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'marca';

function exportFile(format, name) {
  const { theme, error } = build({ ...state, txt: state.txt }, name);
  if (error) return { text: error, file: 'erro.txt' };
  if (format === 'css') return { text: toCssVariables(theme), file: `${name}.css` };
  if (format === 'json') return { text: toPlainJson(theme), file: `${name}-decomposicao.json` };
  const prim = toPrimitiveTheme(theme);
  const gray = toGrayscaleTheme(theme)._color_palette.mode;
  for (const m of ['light', 'dark']) prim._color_palette.mode[m].grayscale = gray[m].grayscale;
  return { text: `${JSON.stringify(prim, null, 2)}\n`, file: `${name}-tokens-aplica.json` };
}

function refreshExport() {
  const name = slug($('export-name').value || exp.name);
  const format = document.querySelector('input[name="format"]:checked').value;
  const { text } = exportFile(format, name);
  $('export-preview').value = text;
  $('export-status').textContent = '';
}

function bindExport() {
  const dlg = $('export');
  $('open-export').addEventListener('click', () => {
    $('export-name').value = exp.name;
    refreshExport();
    dlg.showModal();
  });
  $('export-name').addEventListener('input', () => { exp.name = slug($('export-name').value); refreshExport(); });
  for (const r of document.querySelectorAll('input[name="format"]')) r.addEventListener('change', refreshExport);
  $('export-copy').addEventListener('click', () => copyText($('export-preview').value, T.export.copied, T.export.copyFail, $('export-status')));
  $('export-download').addEventListener('click', () => {
    const format = document.querySelector('input[name="format"]:checked').value;
    const { text, file } = exportFile(format, slug($('export-name').value || exp.name));
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: file });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('export-status').textContent = T.export.downloaded(file);
  });
}

/* ---------- Ciclo principal ---------- */

function render() {
  const preset = current.preset;
  const n = state.tab === 'behavior' ? Object.keys(preset.behavior).length : (state.tab === 'palette' ? preset.palette.levels.length : preset.neutrals.levels.length);
  const intro = state.tab === 'palette'
    ? T.intro.palette(n, preset.palette.levels[0], preset.palette.levels.at(-1), preset.palette.baseLevel, state.mode)
    : T.intro[state.tab](n, preset.neutrals.levels[0], preset.neutrals.levels.at(-1), state.mode);
  $('intro').textContent = intro;
  renderTabs();
  renderAlerts();
  renderRibbon();
  const hash = serialize(state, systemMode());
  history.replaceState(null, '', hash || location.pathname + location.search);
}

function update() {
  const r = build(state);
  if (r.error) {
    lastError = r.error;
  } else {
    lastError = '';
    current = r;
    applyChrome(chromeTokens(r.theme, NAME, state.mode, r.preset), state.mode);
  }
  if (!current) { current = build(DEFAULTS); }
  syncControls();
  render();
}

function placeMore() {
  const more = $('more');
  more.classList.toggle('more--static', !narrow());
  if (!narrow()) more.open = true; else if (!more.dataset.seen) more.open = false;
  more.dataset.seen = '1';
}
placeMore();
bindControls();
bindExport();
matchMedia('(max-width: 56.25rem)').addEventListener('change', () => { placeMore(); $('ribbon-host').dataset.sig = ''; update(); });
update();
