import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Exercise the actual showcase with native clicks/keys and computed CSS.
export async function verifyNavigationUI(page) {
  const screenshots = mkdtempSync(join(tmpdir(), 'tailtools-navigation-'));
  const widths = [390, 1024];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.switchTab('tabs'));
    const first = page.locator('#demo-hash-tabs-instance [data-cge-tab]').first();
    await first.click(); await first.press('ArrowRight');
    assert.equal(await page.evaluate(() => window.demoHashTabs.activeTabId), 'tab-security');
    await first.press('End');
    assert.equal(await page.evaluate(() => window.demoHashTabs.activeTabId), 'tab-integrations');
    assert(await page.evaluate(() => {
      const list = window.demoHashTabs.tabList.getBoundingClientRect();
      const tab = window.demoHashTabs.getTab('tab-integrations').getBoundingClientRect();
      return tab.left >= list.left - 1 && tab.right <= list.right + 1;
    }));
    await first.press('Home'); await first.press('ArrowRight');
    await page.waitForFunction(() => parseFloat(window.demoHashTabs.indicatorEl.style.width) > 0);
    await page.locator('#demo-hash-tabs-instance').screenshot({ path: join(screenshots, `tabs-${width}.png`) });
    await page.evaluate(() => window.switchTab('accordion'));
    const trigger = page.locator('#demo-faq-accordion [data-cge-trigger]').first();
    await trigger.click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await trigger.press('ArrowDown');
    assert(await page.evaluate(() => document.activeElement === window.demoFaqAccordion.items[1].trigger));
    await page.locator('#demo-faq-accordion').screenshot({ path: join(screenshots, `accordion-${width}.png`) });
    // Reset using the programmatic API so the next width starts collapsed.
    await page.evaluate(() => window.demoFaqAccordion.closeAll());
  }
  const collapse = page.locator('[data-cge-collapse="#collapse-secret-token"]');
  await collapse.click();
  assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
  await collapse.press('Space'); assert.equal(await collapse.getAttribute('aria-expanded'), 'false');

  await page.evaluate(() => window.switchTab('tabs'));
  await page.locator('#demo-ajax-tabs-instance [data-cge-tab="ajax-telemetry"]').click();
  assert.equal(await page.locator('#demo-ajax-tabs-instance [data-cge-panel="ajax-telemetry"]').getAttribute('aria-busy'), 'true');
  await page.waitForFunction(() => window.demoAjaxTabs.getPanel('ajax-telemetry').hasAttribute('data-cge-ajax-loaded'));
  assert((await page.locator('#demo-ajax-tabs-instance [data-cge-panel="ajax-telemetry"]').textContent()).includes('Remote Blade Partial Injected'));
  await page.locator('#demo-ajax-tabs-instance [data-cge-tab="ajax-error"]').click();
  await page.locator('#demo-ajax-tabs-instance [data-cge-tab-retry]').waitFor();
  await page.locator('#demo-ajax-tabs-instance [data-cge-tab-retry]').click();
  await page.waitForFunction(() => !window.demoAjaxTabs.getPanel('ajax-error').hasAttribute('aria-busy'));
  assert(await page.locator('#demo-ajax-tabs-instance [role="alert"]').count());

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const tabsMotion = await page.evaluate(() => ({
    panel: getComputedStyle(window.demoHashTabs.getPanel(window.demoHashTabs.activeTabId)).animationName,
    indicator: getComputedStyle(window.demoHashTabs.indicatorEl).transitionDuration
  }));
  assert.equal(tabsMotion.panel, 'none'); assert.equal(tabsMotion.indicator, '0s');
  await page.evaluate(() => window.switchTab('accordion'));
  assert.equal(await page.evaluate(() => getComputedStyle(window.demoFaqAccordion.items[0].wrapper).transitionDuration), '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { window.testAccordionDestroyToggle(); window.testAccordionDestroyToggle(); });
  assert(await page.evaluate(() => window.CGEAccordion.get('demo-faq-accordion') === window.demoFaqAccordion));
  await page.evaluate(() => { window.switchTab('tabs'); window.testTabsDestroyToggle(); window.testTabsDestroyToggle(); });
  assert(await page.evaluate(() => window.CGETabs.get('demo-hash-tabs-instance') === window.demoHashTabs));
  return { widths, nativeKeyboard: true, ajaxSuccessAndRetry: true, reducedMotion: true, recreation: true, screenshots };
}
