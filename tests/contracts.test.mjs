import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const plugins = readdirSync('plugins').filter(name => name.startsWith('CGE'));
const read = file => readFileSync(file, 'utf8').replaceAll('\r\n', '\n');

test('Every plugin barrel and API reference matches its shipped declaration', () => {
  for (const plugin of plugins) {
    const declaration = read(`plugins/${plugin}/${plugin}.d.ts`).trimEnd();
    assert(read(`plugins/${plugin}/index.d.ts`).includes(`export { ${plugin} as default }`));
    assert(read(`docs/${plugin}/api.md`).includes(declaration), `${plugin} API reference drifted`);
  }
});

test('Every plugin has exactly one canonical skill, plan, checklist and docs folder', () => {
  for (const plugin of plugins) {
    const slug = plugin.replace(/^CGE/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const skill = existsSync(`.agents/skills/cge-${slug}/SKILL.md`) || existsSync(`.agents/skills/cge-${slug.replaceAll('-', '')}/SKILL.md`);
    assert(skill, `${plugin} has no canonical skill`);
    assert(existsSync(`ai-todos/plans/${plugin}-plan.md`), `${plugin} has no plan`);
    assert(existsSync(`ai-todos/todo-cheks/${plugin}-checklist.md`), `${plugin} has no checklist`);
    for (const file of ['README.md', 'usage.md', 'examples.md', 'api.md']) assert(existsSync(`docs/${plugin}/${file}`), `${plugin} is missing docs/${file}`);
  }
  // Legacy duplicates were removed; keep a single source of truth.
  for (const legacy of ['ai-todos/todo-checks', 'docs/installation.md', 'docs/development.md']) assert(!existsSync(legacy), `${legacy} came back`);
  assert(!readdirSync('.agents/skills').some(name => name.endsWith('-skill.md')), 'Flat duplicate skill files came back');
  assert(!readdirSync('ai-todos/plans').some(name => name.startsWith('plan-')), 'Legacy plan files came back');
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
