// Optional browser verification: npm test needs no additional dependencies.
// For this runner install Playwright separately, or set TAILTOOLS_PLAYWRIGHT_MODULE
// to a provided Playwright module directory. It uses an isolated Chrome profile.
import { createRequire } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { verifyGridUI } from './grid-ui.mjs';
import { verifyNavigationUI } from './navigation-ui.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TAILTOOLS_PLAYWRIGHT_MODULE || 'playwright');
const baseline = process.argv.includes('--baseline');
const expectedExports = [...readdirSync('plugins').filter(name => name.startsWith('CGE')),
  'CGECollapse', 'CGEFilter', 'CGESort', 'CGEPagination', 'CGEResponsive'].sort();
const testUrl = process.env.TAILTOOLS_TEST_URL || 'http://127.0.0.1:5184';
const server = process.argv.includes('--serve') ? spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', new URL(testUrl).port, '--strictPort'], { windowsHide: true, stdio: 'ignore' }) : null;
if (server) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(testUrl)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: process.env.TAILTOOLS_BROWSER_CHANNEL || 'chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (baseline) {
    await page.route('**/plugins/**/*.js', route => {
      const path = new URL(route.request().url()).pathname.slice(1);
      try {
        const source = execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8' });
        return route.fulfill({ contentType: 'application/javascript', body: source });
      } catch { return route.continue(); }
    });
  }
  await page.goto(`${testUrl}/tests/regressions.html`);
  await page.waitForFunction(() => typeof window.runTailToolsRegressionTests === 'function');
  const results = await page.evaluate(baseline => window.runTailToolsRegressionTests({ maintenance: !baseline }), baseline);
  console.log(JSON.stringify({ baseline, passed: results.filter(result => result.ok).length, total: results.length, errors,
    results: process.argv.includes('--compact') ? results.filter(result => !result.ok) : results }, null, 2));
  if (!baseline && (errors.length || results.some(result => !result.ok))) process.exitCode = 1;
  if (process.argv.includes('--demo')) {
    const demo = await browser.newPage();
    const demoErrors = [];
    demo.on('pageerror', error => demoErrors.push(error.message));
    await demo.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    await demo.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await demo.waitForFunction(() => window.TailTools?.CGESelect);
    const plugins = await demo.evaluate(() => Object.keys(window.TailTools).filter(name => name.startsWith('CGE')));
    await demo.evaluate(() => window.switchTab('datagrid'));
    await demo.waitForFunction(() => window.demoClustersGridInstance?.data.length === 6 && !window.demoClustersGridInstance.loading);
    const ajaxGrid = await demo.evaluate(() => ({ source: window.demoClustersGridInstance.options.source,
      total: window.demoClustersGridInstance.pagination.total, lastPage: window.demoClustersGridInstance.pagination.lastPage }));
    if (ajaxGrid.source !== 'ajax' || ajaxGrid.total !== 60 || ajaxGrid.lastPage !== 10) process.exitCode = 1;
    await demo.locator('#demo-clusters-grid .cge-pagination-desktop [data-cge-page-action="next"]').click();
    await demo.waitForFunction(() => !window.demoClustersGridInstance.loading
      && window.demoClustersGridInstance.pagination.page === 2
      && window.demoClustersGridInstance.data[0]?.id === 'CLS-1007');
    await demo.locator('#demo-clusters-grid .cge-datagrid-perpage').selectOption('All');
    await demo.waitForFunction(() => !window.demoClustersGridInstance.loading && window.demoClustersGridInstance.data.length === 60
      && window.demoClustersGridInstance.pagination.lastPage === 1);
    await demo.locator('#demo-clusters-grid .cge-datagrid-perpage').selectOption('6');
    await demo.waitForFunction(() => !window.demoClustersGridInstance.loading && window.demoClustersGridInstance.data.length === 6);
    console.log(JSON.stringify({ ajaxGrid }));
    console.log(JSON.stringify({ navigationUI: await verifyNavigationUI(demo) }, null, 2));
    console.log(JSON.stringify({ demoPlugins: plugins, demoErrors }, null, 2));
    if (demoErrors.length || JSON.stringify(plugins.sort()) !== JSON.stringify(expectedExports)) process.exitCode = 1;
  }
  if (process.argv.includes('--grid-ui')) console.log(JSON.stringify({ gridUI: await verifyGridUI(browser, testUrl) }, null, 2));
  if (process.argv.includes('--bundle')) {
    for (const format of ['esm', 'umd']) {
      const bundled = await browser.newPage();
      const bundleErrors = [];
      bundled.on('pageerror', error => bundleErrors.push(error.message));
      await bundled.goto(`${testUrl}/tests/regressions.html`);
      await bundled.evaluate(() => { document.body.innerHTML = '<form><select name="tags[]" data-cge-select multiple><option value="a">A</option><option value="b">B</option></select></form>'; });
      if (format === 'esm') await bundled.addScriptTag({ type: 'module', content: `import TailTools from '${testUrl}/dist/tailtools.js'; window.packedLibrary = TailTools;` });
      else {
        // Serve the UMD artifact as JavaScript regardless of dev-server .cjs MIME.
        await bundled.route('**/dist/tailtools.umd.cjs', route => route.fulfill({ contentType: 'application/javascript', body: readFileSync('dist/tailtools.umd.cjs', 'utf8') }));
        await bundled.addScriptTag({ url: `${testUrl}/dist/tailtools.umd.cjs` });
        await bundled.evaluate(() => { window.packedLibrary = window.TailTools; });
      }
      await bundled.waitForFunction(() => window.packedLibrary?.CGESelect);
      const result = await bundled.evaluate(() => {
        const api = window.packedLibrary;
        api.init(document);
        const select = api.CGESelect.get(document.querySelector('select'));
        select.setValue(['a', 'b']);
        const values = new FormData(document.querySelector('form')).getAll('tags[]');
        select.destroy();
        document.body.insertAdjacentHTML('beforeend', '<div data-cge-datagrid></div><table data-cge-datatable><thead><tr><th data-cge-key="name">Name</th></tr></thead><tbody><tr data-cge-id="0"><td>Table</td></tr></tbody></table>');
        const root = document.querySelector('[data-cge-datagrid]');
        root.dataset.cgeConfig = JSON.stringify({ source: 'json', data: [{ id: 0, html_card: '<article>Grid</article>' }] });
        const tableRoot = document.querySelector('[data-cge-datatable]');
        api.init(document);
        const grid = api.CGEDataGrid.instances.get(root);
        const table = api.CGEDataTable.get(tableRoot);
        const collections = grid?.data.length === 1 && table?.rawRows.length === 1
          && root.textContent.includes('Grid') && tableRoot.textContent.includes('Table');
        grid?.destroy(); table?.destroy();
        document.body.insertAdjacentHTML('beforeend', '<div data-cge-tabs><div data-cge-tablist><button data-cge-tab="one">One</button><button data-cge-tab="two">Two</button></div><section data-cge-panel="one">One panel</section><section data-cge-panel="two">Two panel</section></div><div data-cge-accordion><section data-cge-item="one"><button data-cge-trigger>One</button><div data-cge-body><div>Body</div></div></section></div><button data-cge-collapse="#packed-collapse">Toggle</button><div id="packed-collapse"><div>Collapse</div></div>');
        api.init(document);
        const tabsRoot = document.querySelector('[data-cge-tabs]');
        const accRoot = document.querySelector('[data-cge-accordion]');
        const tabs = api.CGETabs.get(tabsRoot);
        const acc = api.CGEAccordion.get(accRoot);
        const collapse = api.CGECollapse.get('packed-collapse');
        tabs.show('two'); acc.open('one'); collapse.open();
        const navigation = tabs.activeTabId === 'two' && acc.isOpen('one') && collapse.isOpen();
        tabs.destroy(); acc.destroy(); collapse.destroy();
        return { plugins: Object.keys(api).filter(key => key.startsWith('CGE')).sort(), values, collections, navigation };
      });
      console.log(JSON.stringify({ bundle: format, ...result, errors: bundleErrors }));
      if (bundleErrors.length || JSON.stringify(result.plugins) !== JSON.stringify(expectedExports)
        || !result.collections || !result.navigation || result.values.join(',') !== 'a,b') process.exitCode = 1;
      await bundled.close();
    }
  }
} finally { await browser?.close(); server?.kill(); }
