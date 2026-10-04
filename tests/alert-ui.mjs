import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Visual checks for the real Alert demo. Screenshots/metrics stay in OS temp.
export async function verifyAlertUI(browser, testUrl) {
  const directory = mkdtempSync(join(tmpdir(), 'tailtools-alert-ui-'));
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CGEAlert);
  const open = async options => {
    await page.evaluate(options => {
      window.alertPreviewResult = window.CGEAlert.fire({ animationDriver: 'none', ...options });
    }, options);
    await page.locator('.cge-alert-dialog').waitFor();
    await page.waitForFunction(() => {
      const alert = window.CGEAlert.currentAlert;
      return document.activeElement === (alert.inputEl || alert.confirmBtn) || !alert.confirmBtn;
    });
  };
  const dismiss = async () => {
    await page.evaluate(() => window.CGEAlert.close());
    await page.waitForFunction(() => !document.querySelector('.cge-alert-overlay'));
  };
  const capture = async name => {
    const metrics = await page.evaluate(() => {
      const dialog = document.querySelector('.cge-alert-dialog');
      const body = dialog.querySelector('.cge-alert-body');
      const rect = dialog.getBoundingClientRect();
      const button = dialog.querySelector('[data-cge-alert-action="confirm"]');
      const close = dialog.querySelector('[data-cge-alert-action="close"]');
      const title = dialog.querySelector('h2');
      return {
        width: rect.width, height: rect.height,
        bodyPadding: parseFloat(getComputedStyle(body).paddingLeft),
        buttonHeight: button?.getBoundingClientRect().height,
        buttonWidth: button?.getBoundingClientRect().width,
        overflow: dialog.scrollWidth > dialog.clientWidth + 1,
        viewportOverflow: rect.left < 0 || rect.right > innerWidth + 1,
        titleOverlapsClose: title && close && title.getBoundingClientRect().right - parseFloat(getComputedStyle(title).paddingRight) > close.getBoundingClientRect().left + 1
      };
    });
    assert(!metrics.overflow && !metrics.viewportOverflow, `${name}: horizontal overflow`);
    assert(!metrics.titleOverlapsClose, `${name}: title/close overlap`);
    await page.locator('.cge-alert-dialog').screenshot({ path: join(directory, `${name}.png`), animations: 'disabled' });
    return { name, ...metrics };
  };
  const measurements = [];
  try {
    for (const width of [320, 390, 1024]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 });
      await open({ archetype: 'confirm', theme, title: 'Publish article?', message: 'This update will be visible to everyone in your workspace.' });
      const metrics = await capture(`confirm-${theme}-${width}`);
      measurements.push(metrics);
      assert(metrics.bodyPadding <= 20, 'Body spacing was not compact');
      if (width === 1024) assert(metrics.height < 220 && metrics.buttonHeight <= 34 && metrics.buttonWidth < 84, 'Desktop confirmation remained oversized');
      else assert(metrics.buttonHeight >= 36, 'Mobile action target too small');
      await dismiss();
    }

    await page.setViewportSize({ width: 390, height: 900 });
    await open({ archetype: 'delete', theme: 'light', title: 'Delete production cluster?', message: 'This action removes the cluster and its backups.', requireInput: 'DELETE' });
    assert(await page.locator('[data-cge-alert-action="confirm"]').isDisabled());
    assert.notEqual(await page.locator('.cge-alert-helper strong').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    measurements.push(await capture('delete-light-mobile'));
    await page.locator('[data-cge-alert-input]').fill('DELETE');
    assert(await page.locator('[data-cge-alert-action="confirm"]').isEnabled());
    await page.locator('[data-cge-alert-action="confirm"]').click();
    assert((await page.evaluate(() => window.alertPreviewResult)).isConfirmed);

    await open({ archetype: 'prompt', theme: 'dark', title: 'Name your workspace', message: 'Use a short, recognizable name.', input: 'text', inputPlaceholder: 'Workspace name' });
    await page.evaluate(() => {
      window.CGEAlert.currentAlert.options.inputValidator = value => value ? null : 'A workspace name is required.';
    });
    await page.locator('[data-cge-alert-action="confirm"]').click();
    assert(await page.locator('[data-cge-alert-error]').isVisible());
    measurements.push(await capture('prompt-dark-mobile'));
    await page.locator('[data-cge-alert-input]').fill('Studio');
    await page.locator('[data-cge-alert-input]').press('Enter');
    const prompt = await page.evaluate(() => window.alertPreviewResult);
    assert(prompt.isConfirmed && prompt.value === 'Studio');

    await open({ theme: 'light', icon: false, title: 'Save your changes?', message: 'Choose how to leave the editor.', showDenyButton: true, showCancelButton: true, confirmButtonText: 'Save draft' });
    assert.equal(await page.locator('[data-cge-alert-icon]').count(), 0);
    measurements.push(await capture('three-actions-iconless-mobile'));
    await page.locator('[data-cge-alert-action="deny"]').click();
    assert((await page.evaluate(() => window.alertPreviewResult)).isDenied);

    await page.setViewportSize({ width: 320, height: 900 });
    await open({ archetype: 'confirm', theme: 'dark', title: 'production-resource-with-a-very-long-identifier-0123456789', message: 'This long message should wrap cleanly inside the card without pushing actions off the screen.', showDenyButton: true, confirmButtonText: 'Apply changes to every selected production resource', denyButtonText: 'Keep the previous configuration', cancelButtonText: 'Cancel and return to editing' });
    measurements.push(await capture('long-content-dark-320'));
    await dismiss();

    await page.setViewportSize({ width: 1024, height: 900 });
    await open({ archetype: 'confirm', theme: 'light', title: 'Publish article?', message: 'Saving your changes.', confirmButtonClass: 'bg-violet-600 text-white' });
    await page.evaluate(() => window.CGEAlert.showLoading());
    assert(await page.locator('[data-cge-alert-action="confirm"]').isDisabled());
    assert(await page.locator('[data-cge-alert-spinner]').isVisible());
    assert(await page.locator('[data-cge-alert-action="confirm"]').evaluate(el => el.classList.contains('bg-violet-600')));
    measurements.push(await capture('custom-loading-desktop'));
    await page.evaluate(() => window.CGEAlert.hideLoading());
    assert(await page.locator('[data-cge-alert-action="confirm"]').isEnabled());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.cge-alert-dialog').evaluate(el => getComputedStyle(el).animationName), 'none');
    await dismiss(); await page.emulateMedia({ reducedMotion: 'no-preference' });

    await open({ icon: false, title: 'All caught up', message: 'There are no pending tasks.', showConfirmButton: false, showCloseButton: false });
    assert.equal(await page.locator('.cge-alert-actions').count(), 0);
    await dismiss();
    await page.locator('#section-alert a[data-cge-alert="confirm"]').click();
    await page.locator('[data-cge-alert-action="cancel"]').click();
    await page.waitForFunction(() => !document.querySelector('.cge-alert-overlay'));
    assert(!page.url().endsWith('#confirmed-link'), 'Declarative cancel navigated');
    assert.equal(errors.length, 0, errors.join('\n'));
    writeFileSync(join(directory, 'measurements.json'), JSON.stringify(measurements, null, 2));
    return { screenshots: directory, variants: measurements.length, measurements, declarationCancel: true, validationAndLoading: true, errors };
  } finally { await page.close(); }
}
