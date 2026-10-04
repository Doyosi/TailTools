// Validate the shipped archive in isolation, including its real declarations.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspace = process.cwd();
const temporary = mkdtempSync(join(tmpdir(), 'tailtools-package-'));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run test:package');
const archive = JSON.parse(execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', temporary], { encoding: 'utf8' }))[0];
const files = new Set(archive.files.map(file => file.path));
assert(![...files].some(file => file.startsWith('node_modules/') || file.startsWith('dist/demo/')));
for (const file of ['dist/tailtools.js', 'dist/tailtools.umd.cjs', 'dist/tailtools.css', 'src/index.d.ts', 'styles.css']) assert(files.has(file), `Missing ${file}`);
const consumer = join(temporary, 'consumer');
const modules = join(consumer, 'node_modules');
mkdirSync(modules, { recursive: true });
execFileSync('tar', ['-xf', join(temporary, archive.filename), '-C', modules]);
// npm archives always extract into package/.
const packed = join(modules, 'package');
const pkg = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'));
const plugins = readdirSync(join(packed, 'plugins')).filter(name => name.startsWith('CGE'));
assert.deepEqual(plugins.sort(), readdirSync(join(workspace, 'plugins')).filter(name => name.startsWith('CGE')).sort());
const library = await import(pathToFileURL(join(packed, 'dist/tailtools.js')));
assert.equal(typeof library.init, 'function');
assert.equal(typeof library.default.init, 'function');
for (const plugin of plugins) {
  for (const file of [`plugins/${plugin}/index.d.ts`, `plugins/${plugin}/${plugin}.d.ts`]) assert(files.has(file));
  assert.equal(typeof library[plugin], 'function');
  const module = await import(pathToFileURL(join(packed, 'plugins', plugin, 'index.js')));
  assert.equal(module.default, module[plugin]);
}
const submodules = Object.keys(pkg.exports).filter(path => path.includes('/modules/') && path.endsWith('.js'));
for (const path of submodules) {
  const entry = pkg.exports[path];
  assert(files.has(entry.types.slice(2)), `Missing ${entry.types}`);
  const module = await import(pathToFileURL(join(packed, entry.import)));
  const name = path.split('/').at(-1).slice(0, -3);
  assert.equal(typeof module[name], 'function');
  assert.equal(module.default, module[name]);
}
// Use package self-reference from a consumer within the extracted package;
// this exercises the actual exports conditions without registry installs.
const typeSource = `import TailTools, { CGESelect, CGEDropzone } from 'tailtools';\n` +
  plugins.map(name => `import ${name}Plugin from 'tailtools/plugins/${name}';\nvoid ${name}Plugin;`).join('\n') +
  submodules.map((path, index) => `\nimport Module${index} from 'tailtools${path.slice(1)}';\nvoid Module${index};`).join('\n') +
  '\nnew TailTools.CGEFilter(); new TailTools.CGESort(); new TailTools.CGEPagination(); new TailTools.CGEResponsive();\n' +
  `\nTailTools.init(document);\nconst select = new CGESelect(document.createElement('select'));\nselect.on('opened', detail => detail.instance.close());\nconst cleared: Promise<void> = new CGEDropzone(document.createElement('div')).clear();\nvoid cleared;\n`;
writeFileSync(join(packed, 'consumer.mts'), typeSource);
const compiler = resolve(workspace, 'node_modules/typescript/bin/tsc');
for (const [module, resolution] of [['NodeNext', 'NodeNext'], ['ESNext', 'Bundler']]) {
  execFileSync(process.execPath, [compiler, '--strict', '--noEmit', '--target', 'ES2022', '--module', module, '--moduleResolution', resolution, '--lib', 'ES2022,DOM,DOM.Iterable', join(packed, 'consumer.mts')], { stdio: 'pipe' });
}
// Archive retained in OS temp for inspection; no repository-generated output.
console.log(JSON.stringify({ archive: archive.filename, plugins: plugins.length, strictTypes: ['NodeNext', 'Bundler'], size: archive.size, unpackedSize: archive.unpackedSize, private: pkg.private }, null, 2));
