// Browser regressions for the October 2026 stability fixes (overlay plugins).
import { CGEModal } from '../plugins/CGEModal/CGEModal.js';
import { CGEDrawer } from '../plugins/CGEDrawer/CGEDrawer.js';
import { CGEAlert } from '../plugins/CGEAlert/CGEAlert.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';
import { CGEToast } from '../plugins/CGEToast/CGEToast.js';

const PAYLOAD = '<img src="x" data-xss onerror="window.__cgeXss=1">';
const key = (name, init = {}) => new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init });

export async function stabilityOverlayRegressions({ check, mount, fixture, track, assert, wait, deferred }) {
  const closeAlert = async () => {
    const alert = CGEAlert.currentAlert;
    if (alert?.isOpen) { alert.isLoadingState = false; alert.dismiss('close'); }
    await wait(0);
  };
  const bodyState = () => ({ overflow: document.body.style.overflow, hidden: document.body.classList.contains('overflow-hidden') });

  await check('Stability Alert: title, message, requireInput and buttons render as text', async () => {
    try {
      CGEAlert.fire({ title: PAYLOAD, message: PAYLOAD, requireInput: PAYLOAD, confirmButtonText: PAYLOAD, animationDriver: 'none' });
      await wait(20);
      const dialog = CGEAlert.currentAlert.dialogEl;
      assert(!dialog.querySelector('[data-xss]') && !window.__cgeXss, 'Alert injected markup');
      assert(dialog.querySelector('.cge-alert-title').textContent === PAYLOAD, 'Title text was altered');
      assert(dialog.querySelector('.cge-alert-helper strong')?.textContent === PAYLOAD, 'Helper lost its trusted markup or escaped phrase');
      assert(dialog.getAttribute('role') === 'alertdialog' && document.getElementById(dialog.getAttribute('aria-describedby')), 'Alert ARIA references are broken');
    } finally { await closeAlert(); }
  });

  await check('Stability Alert: no title keeps a valid accessible name', async () => {
    try {
      CGEAlert.fire({ message: 'Only a message', animationDriver: 'none' }); await wait(10);
      const dialog = CGEAlert.currentAlert.dialogEl;
      const labelledby = dialog.getAttribute('aria-labelledby');
      assert(!labelledby || document.getElementById(labelledby), 'aria-labelledby points to a missing element');
      assert(dialog.getAttribute('aria-label') || labelledby, 'Dialog has no accessible name');
    } finally { await closeAlert(); }
  });

  await check('Stability Alert: Enter on a focused Cancel button does not confirm', async () => {
    try {
      const result = CGEAlert.confirm('Delete?', 'Body', { animationDriver: 'none' }); await wait(20);
      const alert = CGEAlert.currentAlert;
      alert.cancelBtn.focus();
      alert.cancelBtn.dispatchEvent(key('Enter'));
      await wait(10);
      assert(alert.isOpen, 'Enter on Cancel confirmed the dialog');
      alert.confirmBtn.focus(); document.dispatchEvent(key('Enter', { repeat: true })); await wait(10);
      assert(alert.isOpen, 'Held Enter confirmed the dialog');
      alert.dialogEl.focus(); document.dispatchEvent(key('Enter')); await wait(10);
      assert((await result).isConfirmed, 'Enter on the dialog did not confirm');
    } finally { await closeAlert(); }
  });

  await check('Stability Alert: loading preConfirm ignores Escape, backdrop and close button', async () => {
    const hook = deferred();
    try {
      const result = CGEAlert.fire({ animationDriver: 'none', preConfirm: () => hook.promise }); await wait(10);
      const alert = CGEAlert.currentAlert;
      const confirming = alert._handleConfirm(); await wait(0);
      document.dispatchEvent(key('Escape'));
      alert.overlayEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      alert.dialogEl.querySelector('[data-cge-alert-action="close"]')?.click();
      await wait(10);
      assert(alert.isOpen, 'Alert was dismissed while loading');
      hook.resolve('done'); await confirming;
      const value = await result;
      assert(value.isConfirmed && value.value === 'done', 'Loading confirmation was lost');
    } finally { await closeAlert(); }
  });

  await check('Stability Alert: capture-phase gate holds wire:click/onclick until confirmed, then replays once', async () => {
    window.__cgeInline = 0;
    const button = mount('<button type="button" data-cge-alert onclick="window.__cgeInline++">Go</button>');
    let handlers = 0, confirmed = 0;
    button.addEventListener('click', () => handlers++);
    button.addEventListener('cge:confirmed', () => confirmed++);
    const fire = CGEAlert.fire, confirmation = deferred();
    CGEAlert.fire = () => confirmation.promise; CGEAlert.init(fixture);
    try {
      button.click(); button.click(); await wait(0);
      assert(handlers === 0 && window.__cgeInline === 0, 'Element handlers ran before confirmation');
      confirmation.resolve({ isConfirmed: true }); await wait(10);
      assert(handlers === 1 && window.__cgeInline === 1 && confirmed === 1, `Confirmed click replayed ${handlers}/${window.__cgeInline}/${confirmed} times`);
    } finally { CGEAlert.fire = fire; delete window.__cgeInline; }
  });

  await check('Stability Alert: canceled confirmation never runs element handlers', async () => {
    const button = mount('<button type="button" data-cge-alert>Go</button>');
    let handlers = 0; button.addEventListener('click', () => handlers++);
    const fire = CGEAlert.fire; CGEAlert.fire = async () => ({ isConfirmed: false, isDismissed: true });
    CGEAlert.init(fixture);
    try { button.click(); await wait(10); assert(handlers === 0, 'Dismissed confirmation ran the handler'); }
    finally { CGEAlert.fire = fire; }
  });

  await check('Stability Alert: portal renders above an open Lightbox', async () => {
    const lb = track(new CGELightbox({ duration: 0, animationDriver: 'none', thumbnails: false }));
    try {
      await lb.open(0, [{ type: 'inline', content: '<p>Media</p>' }]);
      CGEAlert.fire({ title: 'Above', animationDriver: 'none' }); await wait(10);
      const portalZ = parseInt(getComputedStyle(CGEAlert.getPortal()).zIndex, 10);
      const lightboxZ = parseInt(getComputedStyle(lb.portalEl).zIndex, 10) || 0;
      assert(portalZ > lightboxZ, `Alert portal z ${portalZ} is not above lightbox z ${lightboxZ}`);
    } finally { await closeAlert(); }
  });

  await check('Stability Overlay: overlay removed by a DOM swap no longer locks body scroll', async () => {
    const before = bodyState();
    const el = mount('<div class="hidden"><div data-cge-modal-dialog><button>In</button></div></div>');
    const modal = new CGEModal(el, { animationDriver: 'none' });
    await modal.open();
    assert(document.body.style.overflow === 'hidden', 'Modal did not lock scroll');
    fixture.replaceChildren(); // Livewire morph / Turbo swap without close()
    const other = mount('<div class="hidden"><div data-cge-modal-dialog><button>Other</button></div></div>');
    const second = track(new CGEModal(other, { animationDriver: 'none' }));
    await second.open(); await second.close();
    const after = bodyState();
    assert(after.overflow === before.overflow && after.hidden === before.hidden, 'Body scroll stayed locked after the overlay was removed');
    CGEModal.init(fixture);
    assert(!CGEModal.instances.has(el), 'init did not prune the detached modal');
  });

  await check('Stability Overlay: Modal focus trap pulls escaped focus back inside', async () => {
    const root = mount('<div><button id="outside-focus">Outside</button><div id="trap-modal" class="hidden"><div data-cge-modal-dialog><button id="trap-first">A</button><button id="trap-last">B</button></div></div></div>');
    const modal = track(new CGEModal('#trap-modal', { animationDriver: 'none' }));
    await modal.open();
    root.querySelector('#outside-focus').focus();
    document.dispatchEvent(key('Tab'));
    assert(document.activeElement?.id === 'trap-first', 'Tab from outside did not move focus into the modal');
    await modal.close();
    const empty = mount('<div class="hidden"><div data-cge-modal-dialog><p>No focusables</p></div></div>');
    const bare = track(new CGEModal(empty, { animationDriver: 'none' }));
    await bare.open();
    const event = key('Tab'); document.dispatchEvent(event);
    assert(event.defaultPrevented && bare.dialog.contains(document.activeElement), 'Dialog without focusables leaked Tab');
  });

  await check('Stability Drawer: focus trap, cancelable events and missing targets', async () => {
    const root = mount('<div><button id="drawer-outside">Out</button><div id="trap-drawer" class="hidden"><div data-cge-drawer-dialog><button id="drawer-first">A</button></div></div></div>');
    const drawer = track(new CGEDrawer('trap-drawer', { duration: 0 }));
    const cancel = event => event.preventDefault();
    drawer.drawer.addEventListener('cge:drawer:open', cancel, { once: true });
    await drawer.open();
    assert(!drawer.isOpen() && drawer.drawer.classList.contains('hidden'), 'Canceled open still opened');
    await drawer.open();
    root.querySelector('#drawer-outside').focus();
    document.dispatchEvent(key('Tab'));
    assert(document.activeElement?.id === 'drawer-first', 'Drawer did not pull focus inside');
    drawer.drawer.addEventListener('cge:drawer:close', cancel, { once: true });
    await drawer.close();
    assert(drawer.isOpen(), 'Canceled close still closed');
    await drawer.close();
    let error;
    try { new CGEDrawer('.does-not-exist'); } catch (e) { error = e; }
    assert(/not found/.test(error?.message), 'Missing drawer target did not throw a clear error');
  });

  await check('Stability Drawer: non-modal drawer does not steal focus after a modal closes', async () => {
    const root = mount('<div><button id="nm-trigger">Trigger</button><div id="nm-drawer" class="hidden"><div data-cge-drawer-dialog><button id="nm-inside">Inside</button></div></div><div id="nm-modal" class="hidden"><div data-cge-modal-dialog><button>Modal</button></div></div></div>');
    const drawer = track(new CGEDrawer('#nm-drawer', { duration: 0, backdrop: false, autoFocus: false }));
    const modal = track(new CGEModal('#nm-modal', { animationDriver: 'none' }));
    const trigger = root.querySelector('#nm-trigger');
    await drawer.open(); trigger.focus();
    await modal.open(trigger); await modal.close();
    assert(document.activeElement === trigger, 'Closing the modal moved focus into the non-modal drawer');
    assert(!drawer.drawer.hasAttribute('aria-modal'), 'Non-modal drawer advertised aria-modal');
    document.dispatchEvent(key('Escape')); await wait(10);
    assert(!drawer.isOpen(), 'Escape no longer closes a non-modal drawer');
  });

  await check('Stability Drawer: mini rail stays visible and accessible after closing', async () => {
    const el = mount('<div><div data-cge-drawer-dialog><button>Item</button></div></div>');
    const drawer = track(new CGEDrawer(el, { duration: 0, mini: true, animationDriver: 'tailwind-animations' }));
    assert(el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('aria-modal'), 'Mini rail hidden from assistive tech');
    await drawer.open(); await drawer.close();
    const placement = CGEDrawer.PLACEMENTS.left;
    assert(!drawer.dialog.classList.contains(placement.closedClass) && drawer.dialog.classList.contains(placement.openClass), 'Mini rail slid off-screen after close');
    assert(el.getAttribute('aria-hidden') !== 'true', 'Collapsed rail is aria-hidden');
  });

  await check('Stability Lightbox: rapid opens leave one portal and release the lock', async () => {
    const before = bodyState();
    const items = [{ type: 'inline', content: '<p>One</p>' }];
    const a = CGELightbox.open(items, { duration: 0, animationDriver: 'none', thumbnails: false });
    const b = CGELightbox.open(items, { duration: 0, animationDriver: 'none', thumbnails: false });
    const c = CGELightbox.open(items, { duration: 0, animationDriver: 'none', thumbnails: false });
    [a, b, c].forEach(track);
    await wait(60);
    assert(document.querySelectorAll('#cge-lightbox-portal').length === 1 && CGELightbox.activeInstance === c, 'Rapid opens orphaned portals');
    await c.close();
    const after = bodyState();
    assert(after.overflow === before.overflow && after.hidden === before.hidden, 'Orphaned lightbox kept the scroll lock');
  });

  await check('Stability Lightbox: captions are text, glyph buttons are labelled, typing keeps keys', async () => {
    const lb = track(new CGELightbox({ duration: 0, animationDriver: 'none' }));
    await lb.open(0, [
      { type: 'inline', content: '<input id="lb-typing">', caption: PAYLOAD, description: PAYLOAD },
      { type: 'inline', content: '<p>Two</p>', caption: '<b>rich</b>', captionHtml: true }
    ]);
    assert(!lb.captionEl.querySelector('[data-xss]') && lb.captionEl.textContent.includes('<img'), 'Caption injected markup');
    const close = lb.portalEl.querySelector('[data-cge-lb-action="close"]');
    assert(close.getAttribute('aria-label') && close.getAttribute('aria-label') !== '✕', 'Close button has no accessible name');
    const input = lb.portalEl.querySelector('#lb-typing'); input.focus();
    input.dispatchEvent(key('ArrowRight'));
    input.dispatchEvent(key('f'));
    assert(lb.currentIndex === 0 && !document.fullscreenElement, 'Typing in inline content triggered shortcuts');
    await lb.goTo(1);
    assert(lb.captionEl.querySelector('b'), 'captionHtml opt-in did not render HTML');
  });

  await check('Stability Lightbox: failed image source and thumbnails are not parsed as HTML', async () => {
    const lb = track(new CGELightbox({ duration: 0, animationDriver: 'none' }));
    const src = '/missing.png"><img data-xss src=x>';
    await lb.open(0, [{ src }, { src: '/other.png', thumb: src }]);
    await wait(50);
    assert(!lb.portalEl.querySelector('img[data-xss]') && !lb.portalEl.querySelector('[data-xss]'), 'Image URL injected markup');
  });

  await check('Stability Toast: title and message are text unless html is enabled', async () => {
    const plain = CGEToast.show({ title: PAYLOAD, message: PAYLOAD, duration: 0 });
    assert(!plain.el.querySelector('[data-xss]') && plain.el.querySelector('.cge-toast-message').textContent === PAYLOAD, 'Toast injected markup by default');
    const rich = CGEToast.show({ message: '<b>bold</b>', html: true, duration: 0 });
    assert(rich.el.querySelector('.cge-toast-message b'), 'html: true did not render HTML');
    const trigger = mount(`<button data-cge-toast="${PAYLOAD.replace(/"/g, '&quot;')}">Toast</button>`);
    CGEToast.init(fixture); trigger.click(); await wait(0);
    const latest = [...CGEToast.activeToasts].at(-1);
    assert(!latest.el.querySelector('[data-xss]'), 'Declarative toast injected markup');
  });

  await check('Stability Toast: dismiss before entry animation never flashes back', async () => {
    const toasts = [];
    for (let i = 0; i < 4; i++) toasts.push(CGEToast.show({ message: `T${i}`, duration: 0, maxToasts: 1, position: 'bottom-left' }));
    const early = CGEToast.show({ message: 'early', duration: 0 }); early.dismiss();
    await wait(60);
    for (const toast of [...toasts.slice(0, -1), early]) {
      assert(!toast.el.classList.contains('opacity-100'), 'Dismissed toast became visible again');
    }
  });

  await check('Stability lifecycle: destroyAll tears down overlay plugins inside a root', async () => {
    const root = mount('<div><div id="da-modal" data-cge-modal class="hidden"><div data-cge-modal-dialog></div></div><div id="da-drawer" data-cge-drawer class="hidden"><div data-cge-drawer-dialog></div></div><button data-cge-alert>Go</button></div>');
    CGEModal.init(root); CGEDrawer.init(root); CGEAlert.init(root);
    const modal = CGEModal.getInstance('#da-modal'), drawer = CGEDrawer.get('#da-drawer');
    await modal.open();
    CGEModal.destroyAll(root); CGEDrawer.destroyAll(root);
    // Earlier checks bound the shared fixture, so tear down from there (it contains root).
    CGEAlert.destroyAll(fixture);
    assert(!CGEModal.instances.has(modal.modal) && !CGEDrawer.instances.has(drawer.drawer), 'destroyAll kept instances inside root');
    assert(document.body.style.overflow !== 'hidden', 'destroyAll left the scroll lock');
    assert(!CGEAlert._delegations.has(root) && !CGEAlert._delegations.has(fixture), 'Alert delegation survived destroyAll');
    if (!CGEAlert._delegations.has(document)) {
      let fired = 0; const fire = CGEAlert.fire; CGEAlert.fire = async () => { fired++; return { isConfirmed: false }; };
      try { root.querySelector('[data-cge-alert]').click(); await wait(0); assert(fired === 0, 'Alert delegation still intercepts clicks'); }
      finally { CGEAlert.fire = fire; }
    }
    const toastOnDocument = CGEToast._delegations.has(document);
    CGEToast.show({ message: 'Teardown', duration: 0 });
    await CGEToast.destroyAll(document);
    assert(CGEToast.activeToasts.size === 0 && CGEToast._delegations.size === 0, 'Toast destroyAll left toasts or delegation');
    if (toastOnDocument) CGEToast.init(document);
  });
}
