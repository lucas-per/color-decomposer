// Plugin do Figma: cria as variables exportadas pelo Color Decomposer ("Figma (plugin)").
// Duas coleções (Primitivos e Semântica), cada uma com os modos Claro e Escuro,
// e, se você quiser, uma página com as faixas de tons ligadas às variables.
// Rodar de novo atualiza o que já existe, sem duplicar.

const FORMAT = 'color-decomposer/figma-variables';

// Onde cada tipo de variable aparece nos seletores do Figma (nada de "todos os usos").
const SCOPES = {
  surface: ['FRAME_FILL', 'SHAPE_FILL'],
  txtOn: ['TEXT_FILL', 'SHAPE_FILL'],
  txt: ['TEXT_FILL', 'SHAPE_FILL'],
  border: ['STROKE_COLOR']
};
const scopesFor = (item) => SCOPES[item.scale] || ['ALL_FILLS', 'STROKE_COLOR'];

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Cor inválida no arquivo: "${hex}".`);
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

function validate(spec) {
  if (!spec || spec.format !== FORMAT) throw new Error('Esse arquivo não é do Color Decomposer. Exporte de novo, no formato "Figma (plugin)".');
  if (spec.version !== 1) throw new Error(`Versão ${spec.version} do arquivo não é suportada por este plugin. Atualize o plugin.`);
  if (!Array.isArray(spec.collections) || !Array.isArray(spec.modes) || spec.modes.length < 1) throw new Error('O arquivo está incompleto. Exporte de novo.');
}

// Reaproveita a coleção de mesmo nome e deixa nela exatamente os modos pedidos, na ordem.
async function ensureCollection(name, modes, existing) {
  let col = existing.find((c) => c.name === name);
  if (!col) col = figma.variables.createVariableCollection(name);
  const current = col.modes.map((m) => m.name);
  if (!current.includes(modes[0]) && current.length) col.renameMode(col.modes[0].modeId, modes[0]);
  for (const m of modes) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
  return col;
}

function modeId(col, name) {
  const m = col.modes.find((x) => x.name === name);
  if (!m) throw new Error(`O modo "${name}" não existe na coleção "${col.name}".`);
  return m.modeId;
}

async function applyVariables(spec) {
  validate(spec);
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const locals = await figma.variables.getLocalVariablesAsync('COLOR');
  const byName = new Map(); // `${coleção}::${nome}` → Variable
  for (const v of locals) byName.set(`${v.variableCollectionId}::${v.name}`, v);

  const made = {};
  for (const c of spec.collections) made[c.name] = await ensureCollection(c.name, spec.modes, collections);

  const find = (col, name) => byName.get(`${col.id}::${name}`);
  const getOrCreate = (col, name) => {
    let v = find(col, name);
    if (!v) { v = figma.variables.createVariable(name, col, 'COLOR'); byName.set(`${col.id}::${name}`, v); }
    return v;
  };

  const stats = { created: 0, updated: 0 };
  // 1) valores
  for (const c of spec.collections) {
    const col = made[c.name];
    for (const item of c.variables) {
      if (!item.values) continue;
      const existed = Boolean(find(col, item.name));
      const v = getOrCreate(col, item.name);
      v.scopes = scopesFor(item);
      for (const [mode, hex] of Object.entries(item.values)) v.setValueForMode(modeId(col, mode), { ...hexToRgb(hex), a: 1 });
      existed ? stats.updated++ : stats.created++;
    }
  }
  // 2) aliases (depois, para o alvo já existir)
  const primitives = made[spec.collections[0].name];
  for (const c of spec.collections) {
    const col = made[c.name];
    for (const item of c.variables) {
      if (!item.aliases) continue;
      const existed = Boolean(find(col, item.name));
      const v = getOrCreate(col, item.name);
      v.scopes = scopesFor(item);
      for (const [mode, target] of Object.entries(item.aliases)) {
        const t = find(primitives, target);
        if (!t) throw new Error(`A variable "${item.name}" aponta para "${target}", que não existe.`);
        v.setValueForMode(modeId(col, mode), figma.variables.createVariableAlias(t));
      }
      existed ? stats.updated++ : stats.created++;
    }
  }
  const lookup = (name) => {
    for (const col of Object.values(made)) { const v = find(col, name); if (v) return v; }
    return null;
  };
  return { stats, made, lookup };
}

// ---- Página de amostras ----------------------------------------------------

const SW = { w: 76, h: 132, gap: 0 };

function paint(variable, fallbackHex) {
  const base = { type: 'SOLID', color: hexToRgb(fallbackHex || '#808080') };
  return figma.variables.setBoundVariableForPaint(base, 'color', variable);
}

function text(chars, size, weight, variable) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.fontSize = size;
  t.characters = String(chars);
  if (variable) t.fills = [paint(variable)];
  return t;
}

function swatch(item, lookup) {
  const s = lookup(item.surface), on = lookup(item.txtOn), border = lookup(item.border);
  if (!s) throw new Error(`A amostra "${item.label}" usa "${item.surface}", que não existe.`);
  const f = figma.createFrame();
  f.name = String(item.label);
  f.layoutMode = 'VERTICAL';
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.resize(SW.w, SW.h);
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.paddingLeft = f.paddingRight = 8;
  f.paddingTop = f.paddingBottom = 10;
  f.fills = [paint(s)];
  if (border) { f.strokes = [paint(border)]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE'; }
  f.appendChild(text(item.label, 12, 'Semi Bold', on || null));
  f.appendChild(text('Aa', 22, 'Bold', on || null));
  return f;
}

async function buildSamples(spec, ctx, pageName) {
  await Promise.all([figma.loadFontAsync({ family: 'Inter', style: 'Regular' }), figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }), figma.loadFontAsync({ family: 'Inter', style: 'Bold' })]);
  let page = figma.root.children.find((p) => p.name === pageName);
  if (!page) { page = figma.createPage(); page.name = pageName; }
  await page.loadAsync();
  for (const n of [...page.children]) n.remove();

  const fill = ctx.lookup(spec.canvas.fill), ink = ctx.lookup(spec.canvas.text);
  let x = 0;
  for (const mode of spec.modes) {
    const frame = figma.createFrame();
    frame.name = mode;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = 40;
    frame.paddingLeft = frame.paddingRight = 48;
    frame.paddingTop = frame.paddingBottom = 48;
    frame.fills = [paint(fill)];
    for (const col of Object.values(ctx.made)) frame.setExplicitVariableModeForCollection(col, modeId(col, mode));

    const title = text(`Modo ${mode.toLowerCase()}`, 28, 'Bold', ink);
    frame.appendChild(title);
    for (const group of spec.samples) {
      const block = figma.createFrame();
      block.name = group.title;
      block.layoutMode = 'VERTICAL';
      block.primaryAxisSizingMode = 'AUTO';
      block.counterAxisSizingMode = 'AUTO';
      block.itemSpacing = 12;
      block.fills = [];
      block.appendChild(text(group.title, 14, 'Semi Bold', ink));
      const row = figma.createFrame();
      row.name = 'Faixa';
      row.layoutMode = 'HORIZONTAL';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.itemSpacing = 0;
      row.fills = [];
      row.cornerRadius = 12;
      row.clipsContent = true;
      for (const item of group.items) row.appendChild(swatch(item, ctx.lookup));
      block.appendChild(row);
      frame.appendChild(block);
    }
    page.appendChild(frame);
    frame.x = x;
    frame.y = 0;
    x += frame.width + 120;
  }
  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView(page.children);
}

// ---- Ponte com a interface -------------------------------------------------

figma.showUI(__html__, { width: 440, height: 520, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'close') { figma.closePlugin(); return; }
  if (msg.type !== 'apply') return;
  try {
    const spec = JSON.parse(msg.json);
    const ctx = await applyVariables(spec);
    if (msg.samples) await buildSamples(spec, ctx, msg.pageName || 'Color Decomposer');
    figma.ui.postMessage({ type: 'done', created: ctx.stats.created, updated: ctx.stats.updated, samples: Boolean(msg.samples) });
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: e instanceof SyntaxError ? 'Não consegui ler o texto colado. Cole o arquivo inteiro, do primeiro "{" ao último "}".' : String(e.message || e) });
  }
};
