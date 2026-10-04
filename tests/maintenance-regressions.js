import { CGEModal } from '../plugins/CGEModal/CGEModal.js';
import { CGEDrawer } from '../plugins/CGEDrawer/CGEDrawer.js';
import { CGEAlert } from '../plugins/CGEAlert/CGEAlert.js';
import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGESelect } from '../plugins/CGESelect/CGESelect.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';

export async function maintenanceRegressions({ check, mount, fixture, track, assert, wait, deferred }) {
  const settles = promise => Promise.race([promise, wait(500).then(() => { throw new Error('Teardown left a pending promise'); })]);
  await check('Drawer: destroy removes local click/touch listeners before recreation', async () => {
    const el = mount('<div class="hidden"><div data-cge-drawer-dialog><button data-cge-drawer-close>Close</button></div></div>');
    const old = new CGEDrawer(el, { duration: 0 });
    let calls = 0;
    old.close = () => { calls++; };
    old.destroy();
    const drawer = track(new CGEDrawer(el, { duration: 0 }));
    await drawer.open();
    el.querySelector('button').click();
    await wait(20);
    assert(calls === 0 && !drawer.isOpen(), 'A destroyed drawer still handled its DOM');
    const pending = drawer.open(); drawer.destroy(); await settles(pending);
    assert(el.classList.contains('hidden') && !drawer.isOpen(), 'Animation revived destroyed drawer');
  });
  await check('Modal: destroy during CSS entry settles work and restores scroll', async () => {
    const el = mount('<div class="hidden"><div data-cge-modal-dialog><button>Focus</button></div></div>');
    const modal = track(new CGEModal(el, { duration: 250, animationDriver: 'css' }));
    const pending = modal.open(); modal.destroy();
    await settles(pending); await wait(40);
    assert(!modal.isOpen && el.classList.contains('hidden') && document.body.style.overflow !== 'hidden', 'Destroyed modal animation altered state');
  });
  await check('Drawer: layout push restores original inline styles', async () => {
    mount('<div><div id="push-content" style="transform:scale(0.9);transition:color 1s"></div><div id="push-drawer" class="hidden"><div data-cge-drawer-dialog></div></div></div>');
    const content = fixture.querySelector('#push-content');
    const drawer = track(new CGEDrawer('#push-drawer', { duration: 0, pushContentSelector: '#push-content' }));
    await drawer.open(); drawer.destroy();
    assert(content.style.transform === 'scale(0.9)' && content.style.transition === 'color 1s', 'Push mode erased consumer styles');
  });
  for (const driver of ['fetch', 'axios', 'xhr']) await check(`Form: ${driver} destroy aborts active request without delayed callbacks`, async () => {
    const form = mount('<form action="/submit"><input name="title" value="hello"><button>Save</button></form>');
    const request = deferred(); let signal, aborted = false, success = 0, complete = 0;
    const nativeXHR = window.XMLHttpRequest;
    window.fetch = (_url, options) => { signal = options.signal; return request.promise; };
    window.axios = { request: options => { signal = options.signal; return request.promise; } };
    if (driver === 'xhr') window.XMLHttpRequest = class {
      upload = {}; open() {} setRequestHeader() {} send() {}
      abort() { aborted = true; this.onabort?.(); this.onloadend?.(); }
    };
    try {
      const instance = track(new CGEForm(form, { driver, feedback: 'none' }));
      instance.on('success', () => success++).on('complete', () => complete++);
      const submitting = instance.submit(); await wait(0); instance.destroy();
      assert(driver === 'xhr' ? aborted : signal?.aborted, 'Destroy did not cancel its driver');
      // Drivers that ignore abort still must not deliver success or restore old UI.
      request.resolve(driver === 'fetch' ? new Response('{}', { headers: { 'Content-Type': 'application/json' } }) : { data: {} });
      await settles(submitting);
      assert(success === 0 && complete === 0 && !form.querySelector('input').disabled && !form.querySelector('button').disabled, 'Late callbacks or frozen fields survived destroy');
    } finally { window.XMLHttpRequest = nativeXHR; }
  });
  await check('Form: destroy while beforeSubmit waits cannot start a request', async () => {
    const form = mount('<form><input name="x"></form>'); const hook = deferred(); let requests = 0;
    window.fetch = async () => { requests++; return new Response('{}'); };
    const instance = track(new CGEForm(form, { driver: 'fetch', feedback: 'none', beforeSubmit: () => hook.promise }));
    const submitting = instance.submit(); instance.destroy(); hook.resolve(true); await submitting;
    assert(requests === 0, 'Destroyed form started a delayed request');
  });
  await check('Dropzone: bulk clear waits, preserves failures, and leaves newly added files', async () => {
    const dz = track(new CGEDropzone(mount('<div></div>'), { autoProcessQueue: false, removeUrl: '/delete', confirmDelete: false }));
    const good = dz.addFile(new File(['a'], 'good.txt')), bad = dz.addFile(new File(['b'], 'bad.txt'));
    good.status = bad.status = 'success'; const request = deferred();
    dz._sendDeleteRequest = item => item === good ? request.promise : Promise.reject(new Error('Retain this file'));
    let finished = false; const clearing = dz.clear().then(() => { finished = true; }); await wait(10);
    const newer = dz.addFile(new File(['c'], 'new.txt'));
    assert(!finished && dz.files.includes(good), 'Clear returned before remote deletion');
    request.resolve({}); await clearing;
    assert(!dz.files.includes(good) && dz.files.includes(bad) && dz.files.includes(newer) && bad.domCard.isConnected, 'Clear lost failed or newly added files');
    await dz.clear({ remote: false }); assert(dz.files.length === 0, 'Local clear did not detach');
    dz.addFile(new File(['x'], 'again.txt')); await dz.clear({ remote: false });
    assert(dz.files.length === 0, 'Second clear reused an old promise');
  });
  await check('Dropzone: avatar replacement is local and invalid replacement preserves saved file', async () => {
    const dz = track(new CGEDropzone(mount('<div></div>'), { mode: 'avatar', autoProcessQueue: false, acceptedFiles: 'image/*', removeUrl: '/delete' }));
    const old = dz.addFile(new File(['a'], 'old.png', { type: 'image/png' })); old.status = 'success';
    let deletes = 0; dz._sendDeleteRequest = async () => { deletes++; };
    assert(dz.addFile(new File(['a'], 'bad.txt', { type: 'text/plain' })) === null && dz.files[0] === old, 'Invalid avatar erased the saved preview');
    const replacement = dz.addFile(new File(['b'], 'new.png', { type: 'image/png' })); await wait(10);
    assert(deletes === 0 && dz.files.length === 1 && dz.files[0] === replacement && !dz.avatarImage.classList.contains('hidden'), 'Replacement deleted remote asset or hid new preview');
  });
  await check('Dropzone: destroy cancels pending remote deletion', async () => {
    const dz = track(new CGEDropzone(mount('<div></div>'), { autoProcessQueue: false, removeUrl: '/delete', confirmDelete: false }));
    const file = dz.addFile(new File(['a'], 'a.txt')); file.status = 'success'; let signal; const request = deferred();
    window.axios = undefined; window.fetch = (_url, options) => { signal = options.signal; return request.promise; };
    const clearing = dz.clear(); dz.destroy(); assert(signal?.aborted, 'Delete was not canceled');
    request.resolve(new Response('{}')); await clearing;
  });
  await check('Dropzone: clear shares an in-flight remove and retains its failed card', async () => {
    const dz = track(new CGEDropzone(mount('<div></div>'), { autoProcessQueue: false, removeUrl: '/delete', confirmDelete: false }));
    const file = dz.addFile(new File(['x'], 'x.txt')); file.status = 'success';
    let reject, deletes = 0; const request = new Promise((_resolve, fail) => { reject = fail; });
    dz._sendDeleteRequest = () => { deletes++; return request; };
    const removing = dz.removeFile(file.id), clearing = dz.clear();
    reject(new Error('Failed deletion')); await Promise.all([removing,clearing]);
    assert(deletes === 1 && dz.files.includes(file) && file.domCard.isConnected, 'Concurrent remove/clear lost the file or sent two deletes');
  });
  await check('Select: valid controls, ARIA keyboard linkage and all declared lifecycle events', () => {
    const form = mount('<form><label for="aria-select">Category</label><select id="aria-select" multiple><option value="a">A</option><option value="b">B</option></select></form>');
    const select = track(new CGESelect(form.querySelector('select'))); const events = [];
    for (const name of ['open', 'opened', 'close', 'closed']) select.on(name, detail => { assert(detail.instance === select, 'Lifecycle payload absent'); events.push(name); });
    select.setValue(['a','b']); select.open(); select.trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    assert(!select.trigger.querySelector('button button') && select.trigger.tagName === 'DIV', 'Nested buttons remain');
    assert(select.trigger.getAttribute('aria-controls') === select.optionsContainer.id && select.trigger.getAttribute('aria-label') === 'Category', 'Combobox label/control missing');
    const active = document.getElementById(select.trigger.getAttribute('aria-activedescendant'));
    assert(active?.getAttribute('role') === 'option' && select.searchInput.getAttribute('aria-activedescendant') === active.id, 'Active option linkage missing');
    select.close(); assert(!select.trigger.hasAttribute('aria-activedescendant') && events.join(',') === 'open,opened,close,closed', 'Lifecycle contract inconsistent');
  });
  await check('Select: native change and form reset refresh selection without loops', async () => {
    const form = mount('<form><select name="choice"><option value="a" selected>A</option><option value="b">B</option></select></form>');
    const native = form.querySelector('select'); const select = track(new CGESelect(native)); let changes = 0;
    native.addEventListener('change', () => changes++); native.value = 'b'; native.dispatchEvent(new Event('change', { bubbles: true }));
    assert(select.getValue() === 'b' && select.selectionContainer.textContent.includes('B') && changes === 1, 'Native change not synchronized');
    native.selectedIndex = -1; native.dispatchEvent(new Event('change'));
    assert(select.getValue() === '', 'External clear was overwritten with the first option');
    form.reset(); await wait(0); assert(select.getValue() === 'a', 'Reset did not apply native defaults');
    select.destroy(); const replacement = track(new CGESelect(native)); native.value = 'b'; native.dispatchEvent(new Event('change'));
    assert(replacement.getValue() === 'b', 'Recreated select not synchronized');
  });
  await check('Alert: submitter validation, single value and temporary field cleanup', async () => {
    const form = mount('<form><input name="submit" value="shadow"><button data-cge-alert name="action" value="save">Save</button><button type="button" data-cge-alert name="action" value="preview">Preview</button><div data-cge-alert tabindex="0">Other</div></form>');
    CGEAlert.init(fixture); const original = CGEAlert.fire; CGEAlert.fire = async () => ({ isConfirmed: true }); const submissions = [];
    form.addEventListener('submit', event => { event.preventDefault(); submissions.push(new FormData(form, event.submitter).getAll('action')); });
    try {
      for (const trigger of form.querySelectorAll('[data-cge-alert]')) { trigger.click(); await wait(0); }
      assert(submissions.length === 3 && submissions[0].join() === 'save' && submissions[1].join() === 'preview' && submissions[2].length === 0, 'Submitter data duplicated or invalid trigger broke requestSubmit');
      assert(!form.querySelector('input[name="action"]'), 'Temporary field leaked');
    } finally { CGEAlert.fire = original; }
  });
  for (const driver of ['fetch', 'axios']) await check(`ActionButton: ${driver} Laravel multipart preserves submitter`, async () => {
    const form = mount('<form action="/save"><input name="title" value="text"><input name="_method" value="PUT"><button name="action" value="update">Save</button></form>');
    let options;
    window.axios = driver === 'axios' ? async config => { options = config; return { data: {} }; } : undefined;
    window.fetch = async (_url, config) => { options = config; return new Response('{}'); };
    const button = track(new CGEActionButton(form.querySelector('button'), { instant: true, ajax: true, method: 'PATCH', headers: { 'content-type': 'application/json' } }));
    await button.execute(); const data = options.body || options.data;
    assert(options.method.toUpperCase() === 'POST' && data.get('_method') === 'PATCH' && data.getAll('action').join() === 'update' && data.get('title') === 'text', 'Multipart method or submitter lost');
    assert(!Object.keys(options.headers).some(key => key.toLowerCase() === 'content-type'), 'Multipart boundary overridden');
  });
  await check('ActionButton: destroy during confirmation and request suppresses late actions', async () => {
    const element = mount('<button>Save</button>'); const confirmation = deferred(); let actions = 0;
    const button = new CGEActionButton(element, { onExecute: () => { actions++; } }); button._promptConfirmation = () => confirmation.promise;
    const executing = button.execute(); button.destroy(); confirmation.resolve(true); await executing;
    assert(actions === 0, 'Destroyed button executed after confirmation');
    const request = deferred(); let signal; window.axios = undefined;
    window.fetch = (_url, options) => { signal = options.signal; return request.promise; };
    const second = track(new CGEActionButton(element, { instant: true, url: '/action' })); let successes = 0;
    second.on('success', () => successes++); const pending = second.execute(); second.destroy();
    assert(signal.aborted && !element.disabled, 'Request/disabled state survived destroy'); request.resolve(new Response('{}')); await pending;
    assert(successes === 0, 'Destroyed button delivered success');
  });
  await check('Overlays: Modal, Drawer and Alert share scroll, focus and one Escape owner', async () => {
    mount('<div><button id="overlay-trigger">Launch</button><div id="stack-modal" class="hidden"><div data-cge-modal-dialog><button id="alert-trigger">Alert</button></div></div><div id="stack-drawer" class="hidden"><div data-cge-drawer-dialog><button>Drawer</button></div></div></div>');
    const body = document.body; const original = { padding: body.style.paddingRight, overflow: body.style.overflow };
    body.style.paddingRight = '7px'; body.style.overflow = 'auto';
    const trigger = fixture.querySelector('#overlay-trigger'); trigger.focus();
    const modal = track(new CGEModal('#stack-modal', { animationDriver: 'none' }));
    const drawer = track(new CGEDrawer('#stack-drawer', { duration: 0 }));
    try {
      await modal.open(trigger); await drawer.open();
      const result = CGEAlert.confirm('Confirm', 'Message', { animationDriver: 'none' }); await wait(20);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await result;
      assert(modal.isOpen && drawer.isOpen() && body.style.overflow === 'hidden', 'Escape closed underlying overlay or unlocked scroll');
      await drawer.close(); assert(body.style.overflow === 'hidden' && fixture.querySelector('#stack-modal').contains(document.activeElement), 'Closing drawer stole modal lock/focus');
      await modal.close(); assert(body.style.paddingRight === '7px' && body.style.overflow === 'auto' && document.activeElement === trigger, 'Original body/focus state lost');
      await modal.open(trigger); await drawer.open(); await modal.close();
      assert(body.style.overflow === 'hidden' && fixture.querySelector('#stack-drawer').contains(document.activeElement), 'Out-of-order close stole active focus');
      await drawer.close(); assert(body.style.overflow === 'auto' && document.activeElement === trigger, 'Out-of-order close lost original trigger');
    } finally { body.style.paddingRight = original.padding; body.style.overflow = original.overflow; }
  });
  await check('Modal: nested roots process one delegated click', async () => {
    mount('<div><button data-cge-modal-target="#nested-modal">Open</button><div id="nested-modal" data-cge-modal class="hidden" data-cge-animation-driver="none"><div data-cge-modal-dialog></div></div></div>');
    CGEModal.init(fixture); CGEModal.init(document); const modal = track(CGEModal.getInstance('#nested-modal')); let toggles = 0;
    const toggle = modal.toggle.bind(modal); modal.toggle = (...args) => { toggles++; return toggle(...args); };
    fixture.querySelector('button').click(); await wait(0); assert(toggles === 1 && modal.isOpen, 'Nested roots toggled twice');
  });
  await check('Lightbox: animation drivers and destroy during queued reopen', async () => {
    for (const driver of ['none', 'css', 'tailwind-animations']) {
      const lb = track(new CGELightbox({ animationDriver: driver, duration: 10, thumbnails: false }));
      await lb.open(0, [{ type: 'inline', content: '<p>Media</p>' }]);
      assert(driver !== 'tailwind-animations' || lb.portalEl.classList.contains('animate-fade-in'), 'Tailwind driver unused');
      assert(driver !== 'none' || !lb.portalEl.classList.contains('transition-opacity'), 'None driver still animated');
      const closing = lb.close(); const opening = lb.open(); lb.destroy(); await Promise.all([closing,opening]);
      assert(!lb.isOpen && !lb.portalEl && !CGELightbox.instances.has(lb), 'Destroyed viewer reopened after pending close');
    }
  });
  await check('Alert: dismissed async preConfirm cannot emit a late confirmation', async () => {
    const hook = deferred(); const alert = new CGEAlert({ animationDriver: 'none', preConfirm: () => hook.promise });
    let confirms = 0; const listener = () => { confirms++; }; document.addEventListener('cge:alert:confirm', listener);
    try {
      const result = alert.show(); const confirming = alert._handleConfirm(); alert.dismiss(); hook.resolve('done'); await confirming;
      assert((await result).isDismissed && confirms === 0, 'Dismissed alert confirmed later');
    } finally { document.removeEventListener('cge:alert:confirm', listener); alert.dismiss(); }
  });
  await check('Alert: repeat click while confirmation waits cannot submit a form', async () => {
    const form = mount('<form><button data-cge-alert>Submit</button></form>');
    let submissions = 0; form.addEventListener('submit', event => { event.preventDefault(); submissions++; });
    const confirmation = deferred(), fire = CGEAlert.fire;
    CGEAlert.fire = () => confirmation.promise; CGEAlert.init(fixture);
    try {
      form.querySelector('button').click(); form.querySelector('button').click();
      assert(submissions === 0, 'Repeated click bypassed pending confirmation');
      confirmation.resolve({ isConfirmed: true }); await wait(0);
      assert(submissions === 1, 'Confirmed form did not submit exactly once');
    } finally { CGEAlert.fire = fire; }
  });
  await check('ActionButton: destroy cancels delay before custom execution', async () => {
    let calls = 0; const button = track(new CGEActionButton(mount('<button>Run</button>'), { instant: true, simulate: 200, onExecute: () => { calls++; } }));
    const running = button.execute(); button.destroy(); await settles(running);
    assert(calls === 0, 'Destroyed button resumed delayed callback');
  });
  await check('ActionButton: AJAX simulation preserves demo mode without a request', async () => {
    const form = mount('<form action="/simulated"><button>Simulate</button></form>'); let requests = 0;
    window.axios = undefined; window.fetch = async () => { requests++; return new Response('{}'); };
    const button = track(new CGEActionButton(form.querySelector('button'), { instant: true, ajax: true, simulate: 1 }));
    const result = await button.execute(); assert(requests === 0 && result.submitted, 'AJAX simulation sent a real request');
  });
  await check('Lightbox: destroy settles a pending image load', async () => {
    const lb = track(new CGELightbox({ thumbnails: false, duration: 0 }));
    lb._createImageNode = () => new Promise(() => {});
    const opening = lb.open(0, [{ src: '/never-finishes.png' }]); lb.destroy(); await settles(opening);
    assert(!lb.isOpen && !lb.portalEl, 'Pending media survived destroy');
  });
  await check('Overlays: Lightbox traps Tab and retains another overlay scroll lock', async () => {
    const el = mount('<div class="hidden" style="z-index:50"><div data-cge-modal-dialog><button>Modal</button></div></div>');
    const modal = track(new CGEModal(el, { animationDriver: 'none' })); await modal.open();
    const lb = track(new CGELightbox({ duration: 0, animationDriver: 'none', thumbnails: false }));
    await lb.open(0, [{ type: 'inline', content: '<button>Inside</button>' }]); await wait(20);
    const buttons = [...lb.portalEl.querySelectorAll('button')].filter(element => element.offsetWidth || element.offsetHeight);
    buttons.at(-1).focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert(document.activeElement === buttons[0], 'Tab escaped active Lightbox');
    assert(parseInt(getComputedStyle(lb.portalEl).zIndex) > parseInt(getComputedStyle(el).zIndex), 'Newest overlay rendered under its predecessor');
    await lb.close(); assert(document.body.style.overflow === 'hidden', 'Lightbox removed modal scroll lock');
    await modal.close(); assert(el.style.zIndex === '50', 'Overlay changed original z-index');
  });
}
