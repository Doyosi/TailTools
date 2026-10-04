import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const plugins = readdirSync('plugins').filter(name => name.startsWith('CGE'));
const read = file => readFileSync(file, 'utf8').replaceAll('\r\n', '\n');

test('Every plugin barrel and API reference matches its shipped declaration', () => {
  for (const plugin of plugins) {
    const declaration = read(`plugins/${plugin}/${plugin}.d.ts`).trimEnd();
    assert(read(`plugins/${plugin}/index.d.ts`).includes(`export { ${plugin} as default }`));
    assert(read(`docs/${plugin}/api.md`).includes(declaration), `${plugin} API reference drifted`);
  }
});

test('Compatibility guides, skills and tracking entries point to existing canonical sources', () => {
  const entries = ['docs/installation.md', 'docs/development.md'];
  for (const plugin of plugins) {
    const slug = plugin.replace(/^CGE/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const candidates = [`.agents/skills/cge-${slug}-skill.md`, `ai-todos/plans/plan-${plugin}.md`,
      `ai-todos/todo-checks/check-${plugin}.md`, `ai-todos/todo-cheks/check-${plugin}.md`];
    entries.push(...candidates.filter(existsSync));
  }
  for (const entry of entries) {
    const content = read(entry);
    const links = [...content.matchAll(/\]\(([^)]+)\)/g)];
    assert(links.length > 0, `${entry} has no forwarding link`);
    for (const [, target] of links) assert(existsSync(resolve(dirname(entry), target)), `${entry} points to missing ${target}`);
    assert(content.length < 1500, `${entry} became a duplicated guide again`);
  }
});

test('Maintained sources have portable links and preserve the Dropzone visual contract', () => {
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(`${directory}/${entry.name}`) : entry.name.endsWith('.md') ? [`${directory}/${entry.name}`] : []);
  for (const file of ['AGENTS.md', ...walk('docs'), ...walk('.agents'), ...walk('ai-todos')]) {
    assert(!read(file).includes('file:///'), `${file} contains a machine-specific link`);
  }
  const rules = read('.agents/rules/cge-architecture.md');
  assert(rules.includes('circular avatar') && /[Ss]tatic\/promise/.test(rules));
  assert(read('.agents/skills/cge-dropzone/SKILL.md').includes('rounded-xl'));
});
