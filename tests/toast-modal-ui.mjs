import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Real demo markup, native interactions and viewport boundaries; artifacts stay in OS temp.
export async function verifyToastModalUI(browser, testUrl) {
  const directory = mkdtempSync(join(tmpdir(), 'tailtools-toast-modal-ui-'));
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const errors = [];
  const measurements = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  try {
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.CGEToast && window.CGEModal);
    const capture = async (name, selector, square = false) => {
      const target = page.locator(selector);
      const metrics = await target.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const action = el.querySelector('.cge-toast-action-btn, .cge-modal-action');
        return {
          width: rect.width, height: rect.height, radius: parseFloat(style.borderTopLeftRadius),
          radiusSm: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-sm')) * 16,
          overflow: el.scrollWidth > el.clientWidth + 1,
          viewportOverflow: rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1,
          actionHeight: action?.getBoundingClientRect().height,
          actionRadius: action ? parseFloat(getComputedStyle(action).borderTopLeftRadius) : null
        };
      });
      assert(!metrics.overflow && !metrics.viewportOverflow, `${name}: overflow ${JSON.stringify(metrics)}`);
      assert.equal(metrics.radius, square ? 0 : metrics.radiusSm, `${name}: corners must remain rounded-sm`);
      if (metrics.actionRadius != null) assert.equal(metrics.actionRadius, metrics.radiusSm, `${name}: action radius`);
      await target.screenshot({ path: join(directory, `${name}.png`), animations: 'disabled' });
      measurements.push({ name, ...metrics });
    };
    const toast = async options => {
      await page.evaluate(options => {
        window.previewToast = window.CGEToast.show({ duration: false, ...options });
      }, options);
      await page.waitForFunction(() => window.previewToast.el.classList.contains('opacity-100')
        && getComputedStyle(window.previewToast.el).opacity === '1');
    };
    const clearToasts = () => page.evaluate(() => Promise.all([...window.CGEToast.activeToasts].map(t => t.dismiss())));
    const actions = [{ label: 'View details', class: 'cge-toast-btn-primary' }, { label: 'Undo' }];
    for (const width of [320, 390, 1024]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 });
      await toast({ theme, variant: 'success', title: 'Changes saved', message: 'Your workspace is up to date.', actions });
      await capture(`toast-${theme}-${width}`, '.cge-toast');
      await clearToasts();
    }
    for (const position of ['top-full', 'bottom-full']) for (const width of [320, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await toast({ position, theme: position === 'top-full' ? 'light' : 'dark', variant: 'info', title: 'Workspace settings updated', message: 'Review changes before continuing.', actions: [{ label: 'Review all workspace settings', class: 'cge-toast-btn-primary' }, { label: 'Keep the previous configuration' }] });
      await capture(`banner-${position}-${width}`, '.cge-toast', true);
      await clearToasts();
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await toast({ theme: 'dark', variant: 'warning', title: 'production-resource-0123456789-with-a-very-long-identifier', message: 'A long message remains readable without pushing controls beyond the card.', actions: [{ label: 'Apply changes to every selected production resource' }, { label: 'Return to workspace configuration' }] });
    await capture('toast-long-dark-320', '.cge-toast');
    await clearToasts();
    await toast({ theme: 'light', variant: 'neutral', icon: false, image: { src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#6366f1"/></svg>')}`, class: 'w-8 h-8 rounded-sm' }, title: 'Design team', message: '<strong>A new comment</strong> on your draft.', html: true });
    assert.equal(await page.locator('.cge-toast img').count(), 1);
    await capture('toast-custom-image-320', '.cge-toast');
    await clearToasts();
    await page.evaluate(() => {
      window.previewActionCount = 0;
      window.previewToast = window.CGEToast.show({ message: 'Action callback', duration: false, actions: [{ label: 'Apply', onClick: t => { window.previewActionCount++; t.dismiss(); } }] });
    });
    await page.locator('[data-cge-action="0"]').click();
    assert.equal(await page.evaluate(() => window.previewActionCount), 1);
    await page.waitForFunction(() => !document.querySelector('.cge-toast'));
    await toast({ duration: 10000 });
    await page.locator('.cge-toast').hover();
    assert(await page.evaluate(() => window.previewToast.isPaused));
    assert.equal(await page.locator('.cge-toast-progress').evaluate(el => el.getBoundingClientRect().height), 2);
    await page.locator('[data-cge-toast-close]').click();
    await page.waitForFunction(() => !document.querySelector('.cge-toast'));

    await page.evaluate(() => window.switchTab('modal'));
    const openModal = async (id, theme) => {
      await page.evaluate(({ id, theme }) => {
        const card = document.querySelector(`#${id} .cge-modal-surface`);
        card.classList.toggle('cge-modal-dark', theme === 'dark');
        card.classList.toggle('cge-modal-light', theme !== 'dark');
      }, { id, theme });
      await page.evaluate(id => window.CGEModal.getOrCreateInstance(`#${id}`, { animationDriver: 'none' }).open(), id);
    };
    for (const width of [320, 390, 1024]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 });
      await openModal('modal-basic', theme);
      await capture(`modal-${theme}-${width}`, '#modal-basic .cge-modal-dialog');
      assert(await page.locator('#modal-basic').evaluate(el => el.contains(document.activeElement)), 'Modal focus escaped');
      await page.keyboard.press('Escape');
      await page.locator('#modal-basic').waitFor({ state: 'hidden' });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-cge-modal-target="#modal-basic"]').click();
    await page.locator('#modal-basic .cge-modal-close').click();
    await page.locator('#modal-basic').waitFor({ state: 'hidden' });
    assert(await page.locator('[data-cge-modal-target="#modal-basic"]').evaluate(el => el === document.activeElement), 'Trigger focus not restored');
    for (const theme of ['light', 'dark']) {
      await openModal('modal-form', theme);
      await page.locator('#modal-project-name').fill('Design library');
      await capture(`modal-form-${theme}-390`, '#modal-form .cge-modal-dialog');
      await page.locator('#modal-form button[type="submit"]').click();
      await page.locator('#modal-form').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => [...window.CGEToast.activeToasts].some(t => t.options.message === 'Form saved!'));
      await clearToasts();
    }
    await page.setViewportSize({ width: 320, height: 600 });
    await openModal('modal-basic', 'dark');
    await page.evaluate(() => {
      document.querySelector('#modal-basic .cge-modal-body').textContent = 'Long content that stays inside its own scrolling body. '.repeat(100);
      document.querySelector('#modal-basic .cge-modal-title').textContent = 'production-resource-0123456789-with-a-very-long-identifier';
      document.querySelector('#modal-basic .cge-modal-footer button:last-child').textContent = 'Apply changes to every selected production resource';
    });
    assert(await page.locator('#modal-basic .cge-modal-body').evaluate(el => el.scrollHeight > el.clientHeight), 'Long body should scroll');
    await capture('modal-long-dark-320', '#modal-basic .cge-modal-dialog');
    await page.keyboard.press('Escape');
    await openModal('modal-size-demo', 'light');
    for (const size of ['xs', '5xl', 'full']) {
      await page.evaluate(size => window.CGEModal.getInstance('#modal-size-demo').setSize(size), size);
      await capture(`modal-size-${size}-320`, '#modal-size-demo .cge-modal-dialog');
    }
    await page.keyboard.press('Escape');
    await openModal('modal-static', 'light');
    assert.equal(await page.evaluate(() => window.CGEModal.getInstance('#modal-static').options.escapeClose), false);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modal-static .cge-modal-dialog').classList.contains('cge-modal-shake'));
    assert(await page.locator('#modal-static').isVisible(), 'Static modal closed unexpectedly');
    await page.locator('#modal-static .cge-modal-close').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toast({ message: 'Reduced motion' });
    assert.equal(await page.locator('.cge-toast').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await clearToasts();
    assert.equal(errors.length, 0, errors.join('\n'));
    writeFileSync(join(directory, 'measurements.json'), JSON.stringify(measurements, null, 2));
    return { screenshots: directory, variants: measurements.length, measurements, roundedSm: true, actionAndPause: true, modalFocusAndForm: true, errors };
  } finally { await page.close(); }
}
