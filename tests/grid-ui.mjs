import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function verifyGridUI(browser, testUrl) {
  const directory = mkdtempSync(join(tmpdir(), 'tailtools-grid-ui-'));
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const layouts = [];
  try {
    await page.goto(`${testUrl}/tests/regressions.html`);
    await page.evaluate(async () => {
      const { CGEDataGrid } = await import('/plugins/CGEDataGrid/index.js');
      document.body.innerHTML = '<div id="grid-ui" style="max-width:960px;margin:auto"></div>';
      window.gridUI = new CGEDataGrid('#grid-ui', {
        source: 'json', perPage: 6, gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        data: Array.from({ length: 60 }, (_, id) => ({ id, title: `Cloud cluster ${id + 1}` })),
        cardRenderer: item => {
          const card = document.createElement('article');
          card.className = 'p-5 rounded-sm border border-slate-200 bg-white text-slate-900';
          card.textContent = item.title;
          return card;
        },
      });
    });
    for (const width of [320, 390, 639, 640, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      const state = await page.evaluate(() => {
        const root = document.querySelector('#grid-ui');
        const compact = root.querySelector('.cge-pagination-compact');
        const desktop = root.querySelector('.cge-pagination-desktop');
        const visible = getComputedStyle(compact).display !== 'none' ? compact : desktop;
        const bounds = visible.getBoundingClientRect();
        return { width: innerWidth, compact: getComputedStyle(compact).display !== 'none',
          desktop: getComputedStyle(desktop).display !== 'none', overflow: root.scrollWidth > root.clientWidth + 1,
          outsideViewport: bounds.right > innerWidth || bounds.left < 0 };
      });
      layouts.push(state);
      assert.equal(state.compact, width < 640);
      assert.equal(state.desktop, width >= 640);
      assert(!state.overflow && !state.outsideViewport, `Grid overflow at ${width}px`);
    }
    await page.locator('#grid-ui').screenshot({ path: join(directory, 'desktop.png') });
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.locator('.cge-pagination-compact input').fill('8');
    await page.locator('.cge-pagination-compact [data-cge-jump-btn]').click();
    assert.equal(await page.evaluate(() => window.gridUI.pagination.page), 8);
    await page.locator('#grid-ui').screenshot({ path: join(directory, 'mobile.png') });
    await page.evaluate(() => window.gridUI.setLoading(true));
    await page.waitForFunction(() => getComputedStyle(window.gridUI.loadingEl).opacity === '1');
    await page.locator('#grid-ui').screenshot({ path: join(directory, 'mobile-loading.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => getComputedStyle(window.gridUI.loadingEl).transitionDuration), '0s');
    await page.evaluate(() => window.gridUI.destroy());
    assert.deepEqual(errors, []);
    return { layouts, pageJump: 8, reducedMotion: true, screenshots: directory, errors };
  } finally { await page.close(); }
}
