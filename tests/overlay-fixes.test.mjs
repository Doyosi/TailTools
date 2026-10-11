// Node regressions for the October 2026 overlay stability fixes (pure logic with minimal DOM stubs).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { acquireOverlay, releaseOverlay, isTopOverlay, claimOverlayKey, claimFreeKey, trapTab, pruneOverlays, FOCUSABLE_SELECTOR } from '../plugins/shared/overlay.js';
import { CGEAlert } from '../plugins/CGEAlert/CGEAlert.js';
import { CGEToast } from '../plugins/CGEToast/CGEToast.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';
import { CGEModal } from '../plugins/CGEModal/CGEModal.js';
import { CGEDrawer } from '../plugins/CGEDrawer/CGEDrawer.js';

const style = (zIndex = '') => ({
  zIndex, overflow: '', paddingRight: '',
  getPropertyPriority: () => '',
  setProperty(name, value) { if (name === 'z-index') this.zIndex = value; }
});
const classList = () => {
  const set = new Set();
  return { add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), contains: c => set.has(c), toggle: (c, on) => (on ? set.add(c) : set.delete(c)), set };
};
const element = (props = {}) => ({ isConnected: true, style: style(props.z), classList: classList(), contains(other) { return other === this || (props.children || []).includes(other); }, focus() { globalThis.document.activeElement = this; }, querySelector: () => null, ...props });
const key = (k, extra = {}) => { const e = { key: k, repeat: false, shiftKey: false, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra }; return e; };

let owners = [];
beforeEach(() => {
  globalThis.document = {
    activeElement: null,
    body: { style: style(), classList: classList() },
    documentElement: { clientWidth: 1000, classList: classList() },
    getElementById: () => null,
    querySelector: () => null,
    dispatchEvent: () => true
  };
  globalThis.window = { innerWidth: 1000 };
  globalThis.getComputedStyle = el => ({ zIndex: el.style.zIndex || 'auto', paddingRight: '0' });
  globalThis.Element = class {};
  owners = [];
});
afterEach(() => {
  for (const owner of owners) releaseOverlay(owner);
  delete globalThis.document; delete globalThis.window; delete globalThis.getComputedStyle; delete globalThis.Element;
});
const own = owner => { owners.push(owner); return owner; };

test('overlay: removed overlay elements are pruned and the body scroll lock recovers', () => {
  const a = own({}), b = own({});
  const elA = element(), elB = element();
  acquireOverlay(a, elA, true);
  acquireOverlay(b, elB, true);
  assert.equal(document.body.style.overflow, 'hidden');
  // Livewire/Turbo removed both overlays without calling close().
  elA.isConnected = false; elB.isConnected = false;
  assert.equal(isTopOverlay(b), false);
  assert.equal(document.body.style.overflow, '');
  assert.equal(document.body.classList.contains('overflow-hidden'), false);
});

test('overlay: a pruned top overlay hands key ownership to the remaining one', () => {
  const a = own({}), b = own({});
  const elA = element(), elB = element();
  acquireOverlay(a, elA, false); acquireOverlay(b, elB, false);
  elB.isConnected = false;
  assert.equal(claimOverlayKey(a, key('Escape')), true);
  pruneOverlays();
});

test('overlay: z-index bump goes to the stacking layer (portal) and is restored', () => {
  const lightbox = own({}), alert = own({});
  const lightboxEl = element({ z: '99999' }), portal = element({ z: '99999' }), dialog = element();
  acquireOverlay(lightbox, lightboxEl, false);
  acquireOverlay(alert, dialog, false, portal);
  assert.equal(portal.style.zIndex, '100000');
  assert.equal(dialog.style.zIndex, '');
  releaseOverlay(alert);
  assert.equal(portal.style.zIndex, '99999');
});

test('overlay: shared layer keeps its bump until the last entry leaves', () => {
  const below = own({}), first = own({}), second = own({});
  const portal = element({ z: '99999' });
  acquireOverlay(below, element({ z: '99999' }), false);
  acquireOverlay(first, element(), false, portal);
  acquireOverlay(second, element(), false, portal);
  releaseOverlay(first);
  assert.equal(portal.style.zIndex, '100000');
  releaseOverlay(second);
  assert.equal(portal.style.zIndex, '99999');
});

test('overlay: focus fallback selector excludes negative tabindex', () => {
  assert.match(FOCUSABLE_SELECTOR, /\[tabindex\]:not\(\[tabindex\^="-"\]\)/);
  assert.doesNotMatch(FOCUSABLE_SELECTOR, /(^|, )\[tabindex\](,|$)/);
});

test('overlay: non-modal panels only claim keys while no modal overlay is open', () => {
  const modal = own({});
  const el = element();
  acquireOverlay(modal, el, false);
  assert.equal(claimFreeKey(key('Escape')), false);
  releaseOverlay(modal);
  const event = key('Escape');
  assert.equal(claimFreeKey(event), true);
  assert.equal(claimFreeKey(event), false, 'one key event has one owner');
});

test('trapTab pulls escaped focus inside and handles dialogs without focusables', () => {
  const first = element({ getClientRects: () => [1], closest: () => null });
  const last = element({ getClientRects: () => [1], closest: () => null });
  const attrs = {};
  const container = element({
    children: [first, last],
    querySelectorAll: () => [first, last],
    hasAttribute: name => name in attrs,
    setAttribute: (name, value) => { attrs[name] = value; }
  });
  document.activeElement = element(); // focus on page content behind the dialog
  let event = key('Tab');
  assert.equal(trapTab(container, event), true);
  assert.equal(event.defaultPrevented, true);
  assert.equal(document.activeElement, first);
  event = key('Tab', { shiftKey: true });
  document.activeElement = element();
  trapTab(container, event);
  assert.equal(document.activeElement, last);
  event = key('Tab');
  trapTab(container, event);
  assert.equal(document.activeElement, first, 'wraps from last to first');

  const empty = element({ querySelectorAll: () => [], hasAttribute: name => name in attrs, setAttribute: (name, value) => { attrs[name] = value; } });
  event = key('Tab');
  assert.equal(trapTab(empty, event), true);
  assert.equal(event.defaultPrevented, true);
  assert.equal(document.activeElement, empty);
  assert.equal(attrs.tabindex, '-1');
});

test('Alert: per-instance translations label archetype buttons', () => {
  const opts = CGEAlert.prototype._normalizeOptions.call(Object.create(CGEAlert.prototype),
    { archetype: 'delete', translations: { 'delete-button': 'Sil', 'cancel-button': 'Vazgeç' } });
  assert.equal(opts.confirmButtonText, 'Sil');
  assert.equal(opts.cancelButtonText, 'Vazgeç');
  const fallback = CGEAlert.prototype._normalizeOptions.call(Object.create(CGEAlert.prototype), { archetype: 'confirm' });
  assert.equal(fallback.confirmButtonText, CGEAlert.translations['confirm-button']);
});

test('Alert: prompt values, placeholders and select options are escaped', () => {
  const alert = Object.create(CGEAlert.prototype);
  alert.translations = { ...CGEAlert.translations };
  const payload = '"><img src=x onerror=alert(1)>';
  alert.options = { theme: 'light', input: 'text', inputValue: payload, inputPlaceholder: payload };
  let html = alert._buildInputHtml();
  assert(!html.includes('<img'), 'text input value/placeholder injected markup');
  alert.options = { theme: 'light', input: 'textarea', inputValue: '</textarea><script>x()</script>', inputPlaceholder: '' };
  html = alert._buildInputHtml();
  assert(!html.includes('<script>'), 'textarea content injected markup');
  alert.options = { theme: 'light', input: 'select', inputValue: 'b', inputOptions: [{ value: 'a"><b', label: '<i>A</i>' }, { value: 'b', label: 'B' }] };
  html = alert._buildInputHtml();
  assert(!html.includes('<i>') && !html.includes('a"><b') && /value="b" selected/.test(html), 'select options injected markup or lost selection');
  alert.options = { theme: 'light', input: 'text" onfocus="x', inputValue: '' };
  assert(alert._buildInputHtml().includes('type="text"'), 'input type was not restricted');
});

test('Alert: declarative trigger options are plain text and never HTML', () => {
  const attrs = { 'data-cge-alert': 'delete', 'data-cge-title': '<img src=x onerror=1>', 'data-cge-message': '<b>x</b>' };
  const options = CGEAlert.optionsFromTrigger({ getAttribute: name => attrs[name] ?? null });
  assert.equal(options.html, null);
  assert.equal(options.title, attrs['data-cge-title']);
  assert.equal(options.archetype, 'delete');
});

const openAlert = () => {
  const alert = own(Object.create(CGEAlert.prototype));
  let confirms = 0, dismissals = 0;
  Object.assign(alert, {
    isOpen: true, isLoadingState: false, options: { allowEscapeKey: true, trapFocus: true },
    dialogEl: element(), overlayEl: element(), inputEl: null,
    confirmBtn: element({ disabled: false, tagName: 'BUTTON' }),
    _handleConfirm() { confirms++; }, dismiss() { dismissals++; }, shake() {}
  });
  acquireOverlay(alert, alert.overlayEl, false);
  return { alert, counts: () => ({ confirms, dismissals }) };
};

test('Alert: Enter confirms only from the dialog or a single-line input, never on repeat', () => {
  const { alert, counts } = openAlert();
  const cancel = element({ tagName: 'BUTTON' });
  document.activeElement = cancel;
  alert._handleKeyDown(key('Enter'));
  assert.equal(counts().confirms, 0, 'Enter on Cancel confirmed');
  document.activeElement = alert.dialogEl;
  alert._handleKeyDown(key('Enter', { repeat: true }));
  assert.equal(counts().confirms, 0, 'held Enter confirmed');
  alert._handleKeyDown(key('Enter'));
  assert.equal(counts().confirms, 1);
  alert.inputEl = element({ tagName: 'TEXTAREA' });
  document.activeElement = alert.inputEl;
  alert._handleKeyDown(key('Enter'));
  assert.equal(counts().confirms, 1, 'Enter in textarea confirmed');
  alert.inputEl = element({ tagName: 'INPUT' });
  document.activeElement = alert.inputEl;
  alert._handleKeyDown(key('Enter'));
  assert.equal(counts().confirms, 2);
});

test('Alert: Escape cannot dismiss while preConfirm/validator is loading', () => {
  const { alert, counts } = openAlert();
  alert.isLoadingState = true;
  const event = key('Escape');
  alert._handleKeyDown(event);
  assert.equal(counts().dismissals, 0);
  assert.equal(event.defaultPrevented, true);
  alert.isLoadingState = false;
  alert._handleKeyDown(key('Escape'));
  assert.equal(counts().dismissals, 1);
});

test('Toast: dismiss before the entry frames run never re-shows the toast', async () => {
  const frames = new Map(); let nextId = 1;
  globalThis.requestAnimationFrame = cb => { const id = nextId++; frames.set(id, cb); return id; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  try {
    const toast = Object.create(CGEToast.prototype);
    Object.assign(toast, { isOpen: true, el: { classList: classList(), parentNode: null }, options: { position: 'top-right', animationDriver: 'none' } });
    CGEToast.activeToasts.add(toast);
    toast._animateIn();
    const dismissed = toast.dismiss();
    for (let i = 0; i < 3; i++) for (const [id, cb] of Array.from(frames)) { frames.delete(id); cb(0); }
    assert.equal(toast.el.classList.contains('opacity-100'), false, 'entry frame revived a dismissed toast');
    assert.equal(toast.el.classList.contains('opacity-0'), true);
    assert.equal(await dismissed, true);
    assert.equal(CGEToast.activeToasts.has(toast), false);
  } finally { delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame; }
});

test('Toast: HTML opt-in flags read data-cge-html as a boolean attribute', () => {
  const el = attrs => ({ hasAttribute: n => n in attrs, getAttribute: n => attrs[n] ?? null });
  assert.equal(CGEToast._readHtmlFlag(el({}), ['data-cge-html']), false);
  assert.equal(CGEToast._readHtmlFlag(el({ 'data-cge-html': '' }), ['data-cge-html']), true);
  assert.equal(CGEToast._readHtmlFlag(el({ 'data-cge-html': 'false' }), ['data-cge-html']), false);
  assert.equal(CGEToast.defaults.html, false);
});

test('Lightbox: rapid concurrent opens build exactly one portal and one lock', async () => {
  const built = [];
  const make = () => {
    const lb = new CGELightbox();
    Object.assign(lb, {
      _buildPortal() { this.portalEl = {}; built.push(this); },
      _lockScroll() {}, _bindEvents() {}, _emit() {}, async _renderSlide() {},
      async close() {
        if (!this.isOpen) return;
        await new Promise(resolve => setTimeout(resolve, 5));
        this.isOpen = false; this.portalEl = null;
        if (CGELightbox.activeInstance === this) CGELightbox.activeInstance = null;
        CGELightbox.instances.delete(this);
      }
    });
    return lb;
  };
  const items = [{ src: '/a.jpg' }];
  const first = make(); await first.open(0, items);
  const second = make(), third = make();
  await Promise.all([second.open(0, items), third.open(0, items)]);
  assert.deepEqual(built, [first, third], 'superseded open built a portal');
  assert.equal(CGELightbox.activeInstance, third);
  assert.equal(second.isOpen, false);
  assert.equal(CGELightbox.instances.has(second), false, 'superseded instance leaked');
  await third.close();
});

test('Lightbox: shortcuts are ignored while typing in inline form fields', () => {
  const input = Object.assign(new Element(), { tagName: 'INPUT', isContentEditable: false });
  const div = Object.assign(new Element(), { tagName: 'DIV', isContentEditable: false });
  const editable = Object.assign(new Element(), { tagName: 'DIV', isContentEditable: true });
  assert.equal(CGELightbox._isTyping({ target: input }), true);
  assert.equal(CGELightbox._isTyping({ target: editable }), true);
  assert.equal(CGELightbox._isTyping({ target: div }), false);
});

test('Modal and Drawer: missing targets throw instead of returning half-built instances', () => {
  assert.throws(() => new CGEModal('#missing-modal'), /\[CGEModal\] Target element "#missing-modal" not found/);
  assert.throws(() => new CGEDrawer('.missing-drawer'), /\[CGEDrawer\] Target element "\.missing-drawer" not found/);
});

test('Drawer: target resolution keeps selectors and resolves bare IDs first', () => {
  const byId = { id: 'nav' }, bySelector = { id: 'cls' };
  const queries = [];
  document.getElementById = id => (id === 'nav' ? byId : null);
  document.querySelector = selector => { queries.push(selector); return selector === '.foo' ? bySelector : null; };
  assert.equal(CGEDrawer.resolveTarget('nav'), byId);
  assert.equal(CGEDrawer.resolveTarget('.foo'), bySelector);
  assert(!queries.includes('#.foo'), 'class selector was rewritten into an ID');
  assert.equal(CGEModal.resolveTarget('nav'), byId);
  document.querySelector = () => { throw new SyntaxError('bad selector'); };
  assert.equal(CGEDrawer.resolveTarget('[bad'), null);
});
