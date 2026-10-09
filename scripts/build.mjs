// Gera dist/: a interface pronta para abrir num servidor estático (por exemplo, GitHub Pages).
import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');

export async function buildApp({ minify = true } = {}) {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await build({
    entryPoints: [path.join(root, 'app/main.js')],
    outfile: path.join(out, 'app.js'),
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify,
    sourcemap: minify ? false : 'inline',
    legalComments: 'none'
  });
  for (const f of ['index.html', 'app.css', 'icon.svg']) await cp(path.join(root, 'app', f), path.join(out, f));
  await cp(path.join(root, 'app/fonts'), path.join(out, 'fonts'), { recursive: true });
  await writeFile(path.join(out, '.nojekyll'), '');
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = await buildApp();
  console.log(`Interface gerada em ${path.relative(root, dir)}/`);
}
