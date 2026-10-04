import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGESelect } from '../plugins/CGESelect/CGESelect.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { CGEToast } from '../plugins/CGEToast/CGEToast.js';
import { CGEModal } from '../plugins/CGEModal/CGEModal.js';
import { CGEDrawer } from '../plugins/CGEDrawer/CGEDrawer.js';
import { CGEAlert } from '../plugins/CGEAlert/CGEAlert.js';
import { maintenanceRegressions } from './maintenance-regressions.js';
import { collectionRegressions } from './collection-regressions.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const until = async condition => {
  for (let i = 0; i < 100; i++) { if (condition()) return; await wait(10); }
  throw new Error('Timed out waiting for lifecycle completion');
};
let running = false;

export async function runRegressionTests({ maintenance = true } = {}) {
  if (running) return;
  running = true;
  const results = [];
  const fixture = document.createElement('div');
  document.body.append(fixture);
  const nativeFetch = window.fetch;
  const nativeAxios = window.axios;
  const nativeAlert = window.CGEAlert;
  const cleanups = [];
  const mount = html => { fixture.innerHTML = html; return fixture.firstElementChild; };
  const track = instance => { cleanups.push(() => instance.destroy()); return instance; };
  const check = async (name, fn) => {
    try { await fn(); results.push({ name, ok: true }); }
    catch (error) { results.push({ name, ok: false, error: error.message }); }
    finally {
      for (const dispose of cleanups.splice(0)) dispose();
      for (const toast of [...CGEToast.activeToasts]) await toast.dismiss();
      if (CGELightbox.activeInstance) await CGELightbox.activeInstance.close();
      window.fetch = nativeFetch;
      window.axios = nativeAxios;
      window.CGEAlert = nativeAlert;
      fixture.replaceChildren();
    }
  };
  try {
    await check('Select: JS multiple serializes every value and destroy restores attributes', () => {
      const form = mount('<form><select name="tags[]" style="color:red" tabindex="3" aria-hidden="false"><option value="a">A</option><option value="b">B</option></select></form>');
      const el = form.querySelector('select');
      const style = el.getAttribute('style');
      const select = track(new CGESelect(el, { multiple: true }));
      select.setValue(['a', 'b']);
      assert(new FormData(form).getAll('tags[]').join(',') === 'a,b', 'Native multi-select lost a selected value');
      select.destroy();
      assert(el.getAttribute('style') === style && el.getAttribute('tabindex') === '3' && el.getAttribute('aria-hidden') === 'false' && !el.multiple, 'Original attributes were not restored');
    });
    await check('Select: declarative remote settings and close-on-select', () => {
      const el = mount('<select data-cge-select data-cge-async-url="/search" data-cge-async-driver="fetch" data-cge-async-param="term" data-cge-async-debounce="0" data-cge-close-on-select="false"></select>');
      const instances = CGESelect.init('select[data-cge-select]', {}, el);
      const select = track(instances[0] || new CGESelect(el));
      assert(instances.length === 1, 'Matching discovery root was skipped');
      assert(select.options.asyncSource?.url === '/search' && select.options.asyncSource.param === 'term' && select.options.asyncSource.debounce === 0 && select.options.closeOnSelect === false, 'Declarative settings were ignored');
    });
    await check('Select: remote choice survives FormData and later result changes', async () => {
      const form = mount('<form><select name="user_id"></select></form>');
      const select = track(new CGESelect(form.querySelector('select'), { asyncSource: { url: '/search', debounce: 0 } }));
      window.fetch = async () => new Response(JSON.stringify([{ value: '42', label: 'User 42' }]), { headers: { 'Content-Type': 'application/json' } });
      select._handleAsyncSearch('user');
      await wait(20);
      select.setValue('42');
      assert(new FormData(form).get('user_id') === '42', 'Remote option did not serialize');
      window.fetch = async () => new Response('[]');
      select._handleAsyncSearch('other');
      await wait(20);
      assert(select.selectionContainer.textContent.includes('User 42'), 'Selected label disappeared on new search');
    });
    await check('Select: stale response cannot replace newer results', async () => {
      const select = track(new CGESelect(mount('<select></select>'), { asyncSource: { url: '/search', debounce: 0 } }));
      const old = deferred();
      window.fetch = async url => url.includes('old') ? old.promise : new Response('[{"value":"new","label":"New"}]');
      select._handleAsyncSearch('old');
      await wait(10);
      select._handleAsyncSearch('new');
      await wait(20);
      old.resolve(new Response('[{"value":"old","label":"Old"}]'));
      await wait(20);
      assert(select.filteredItems[0]?.value === 'new', 'Stale response replaced the latest query');
    });
    await check('Select: minimum query length and destroy cancel scheduled requests', async () => {
      const select = track(new CGESelect(mount('<select></select>'), { minSearchLength: 2, asyncSource: { url: '/search', debounce: 20 } }));
      let requests = 0;
      window.fetch = async () => { requests++; return new Response('[]'); };
      select._handleAsyncSearch('x');
      await wait(30);
      assert(requests === 0, 'Query below threshold made a request');
      select._handleAsyncSearch('xx');
      select.destroy();
      await wait(40);
      assert(requests === 0, 'Destroyed select sent a delayed request');
    });
    await check('Select: reopening resets local search and respects disabled optgroup', () => {
      const select = track(new CGESelect(mount('<select><option value="a">Alpha</option><optgroup label="Unavailable" disabled><option value="b">Beta</option></optgroup></select>')));
      select.open();
      select.searchQuery = 'Alpha';
      select._handleSearch();
      select.close();
      select.open();
      assert(select.filteredItems.length === 2 && select.items[1].disabled, 'Search/optgroup state is incorrect');
      select.close();
    });
    await check('Form: concurrent programmatic submits produce one request', async () => {
      const gate = deferred();
      let calls = 0;
      const form = track(new CGEForm(mount('<form method="post"><input name="name" value="User"><button>Save</button></form>'), { feedback: 'none', beforeSubmit: async () => { calls++; await gate.promise; return { status: 200, data: {} }; } }));
      const first = form.submit();
      const second = form.submit();
      gate.resolve();
      await Promise.all([first, second]);
      assert(calls === 1, 'Form submitted twice while active');
      assert(!form.form.querySelector('input').disabled, 'Form remained frozen');
    });
    await check('Form: declarative init, validation clearing and destroy cleanup', () => {
      const el = mount('<form data-cge-form data-cge-feedback="none"><input name="email"><span data-cge-feedback="email"></span></form>');
      CGEForm.init(fixture);
      const form = track(CGEForm.getInstance(el));
      let clears = 0;
      const original = form._clearInputError.bind(form);
      form._clearInputError = input => { clears++; original(input); };
      form.bindErrors({ email: ['Required'] });
      el.querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
      assert(el.querySelector('input').getAttribute('aria-invalid') !== 'true', 'Error did not clear');
      form.destroy();
      const before = clears;
      el.querySelector('input').dispatchEvent(new Event('change', { bubbles: true }));
      assert(clears === before && !el.hasAttribute('novalidate'), 'Destroy left an input handler or novalidate');
    });
    await check('ActionButton: confirmation double-click performs one action', async () => {
      const action = track(new CGEActionButton(mount('<button>Execute</button>'), { onExecute: async () => ({ ok: true }) }));
      const gate = deferred();
      let confirmations = 0, executions = 0;
      action._promptConfirmation = async () => { confirmations++; return gate.promise; };
      action._runTargetAction = async () => { executions++; return {}; };
      const first = action.execute();
      const second = action.execute();
      gate.resolve(true);
      await Promise.all([first, second]);
      assert(confirmations === 1 && executions === 1, 'Duplicate confirmation/action workflow');
    });
    await check('ActionButton: declarative direct click works with partial translations', async () => {
      const el = mount('<button data-cge-action="direct">Execute</button>');
      const action = track(CGEActionButton.getOrCreate(el, { translations: { loading: 'Bekleyin' }, onExecute: async () => ({ ok: true }) }));
      let successes = 0;
      action.on('success', () => successes++);
      CGEActionButton.init();
      el.click();
      await wait(20);
      assert(successes === 1 && action.options.translations['confirm-title'], 'Declarative action or default translations failed');
    });
    await check('Dropzone: declarative file mode serializes files', () => {
      const el = mount('<form><div data-cge-dropzone data-cge-upload-mode="form" data-cge-param-name="attachments"></div></form>');
      const dz = track(CGEDropzone.init(el)[0]);
      dz.addFile(new File(['file'], 'file.txt', { type: 'text/plain' }));
      assert(new FormData(el).get('attachments[]')?.name === 'file.txt', 'Dropped file did not enter FormData');
    });
    await check('Dropzone: cancel/remove keeps concurrency limit and neighboring files', async () => {
      const dz = track(new CGEDropzone(mount('<div></div>'), { url: '/upload', maxConcurrent: 1, autoProcessQueue: false, driver: 'xhr' }));
      const requests = [];
      dz._uploadWithXHR = (_url, _data, _headers, file) => {
        const request = deferred(); requests.push(request);
        file.xhr = { abort: () => request.resolve({ canceled: true }) };
        return request.promise;
      };
      const a = dz.addFile(new File(['a'], 'a.txt'));
      const b = dz.addFile(new File(['b'], 'b.txt'));
      dz.uploadAll();
      assert(requests.length === 1, 'uploadAll exceeded maxConcurrent');
      await dz.removeFile(a.id, true);
      await wait(10);
      assert(dz.files.some(file => file.id === b.id), 'Cancel/remove deleted the next file');
      assert(requests.length === 2 && dz._activeUploadsCount === 1, 'Canceled slot was counted incorrectly');
      requests[1].resolve({ ok: true });
      await wait(10);
      assert(dz._activeUploadsCount === 0, 'Upload counter did not return to zero');
    });
    await check('Dropzone: failed remote deletion keeps card and reports error', async () => {
      const dz = track(new CGEDropzone(mount('<div></div>'), { uploadMode: 'form', removeUrl: '/delete', confirmDelete: false }));
      const file = dz.addFile(new File(['x'], 'x.txt'));
      file.status = 'success';
      let errors = 0;
      dz.on('error', () => errors++);
      window.axios = undefined;
      window.fetch = async () => new Response('', { status: 500 });
      await dz.removeFile(file.id);
      assert(dz.files.includes(file) && file.domCard.isConnected && errors === 1, 'Failed deletion removed the file or skipped error event');
    });
    await check('Dropzone: destroy cannot start a queued upload', async () => {
      const dz = new CGEDropzone(mount('<div></div>'), { url: '/upload', maxConcurrent: 1, autoProcessQueue: false });
      const request = deferred();
      let calls = 0;
      dz._uploadWithXHR = (_url, _data, _headers, file) => { calls++; file.xhr = { abort: () => request.resolve({}) }; return request.promise; };
      dz.addFile(new File(['a'], 'a.txt'));
      dz.addFile(new File(['b'], 'b.txt'));
      dz.uploadAll();
      dz.destroy();
      await wait(20);
      assert(calls === 1, 'Destroy restarted upload queue');
    });
    await check('Toast: flash init is idempotent and zero duration persists', async () => {
      mount('<div data-cge-toast-flash data-cge-message="Saved" data-cge-duration="0"></div>');
      CGEToast.init(fixture);
      CGEToast.init(fixture);
      const toasts = [...CGEToast.activeToasts];
      assert(toasts.length === 1 && toasts[0].options.duration === 0, 'Flash duplicated or duration=0 was ignored');
    });
    await check('Toast: declarative false duration and programmatic notification', () => {
      const el = mount('<button data-cge-toast="Saved" data-cge-toast-duration="false">Show</button>');
      CGEToast.init(fixture);
      el.click();
      const toast = [...CGEToast.activeToasts][0];
      assert(toast?.options.duration === false, 'False declarative duration was ignored');
      const programmatic = CGEToast.success('Programmatic', { duration: 0 });
      assert(programmatic.isOpen, 'Programmatic toast did not open');
    });
    await check('Lightbox: close/reopen preserves new portal and merged translations', async () => {
      const lb = track(new CGELightbox({ duration: 10, thumbnails: false, translations: { close: 'Kapat' } }));
      const items = [{ type: 'inline', content: '<p>Media</p>' }];
      await lb.open(0, items);
      const closing = lb.close();
      const opening = lb.open(0, items);
      await Promise.all([closing, opening]);
      await wait(20);
      assert(lb.portalEl?.isConnected && lb.isOpen && lb.options.translations.counter, 'Close timer destroyed reopened viewer');
      await lb.close();
      assert(!lb.portalEl && document.body.style.overflow !== 'hidden', 'Await close returned before cleanup');
    });
    await check('Lightbox: stale media load cannot replace the newest slide', async () => {
      const lb = track(new CGELightbox({ duration: 0, thumbnails: false, preload: false }));
      const old = deferred();
      lb._createImageNode = item => item.src === 'old' ? old.promise : Promise.resolve(document.createElement('img'));
      const opening = lb.open(0, [{ src: 'old' }, { type: 'inline', content: '<p>Latest</p>' }]);
      await lb.goTo(1);
      old.resolve(document.createElement('img'));
      await opening;
      assert(lb.wrapperEl.querySelectorAll('.cge-lightbox-media').length === 1 && lb.wrapperEl.textContent.includes('Latest'), 'Old slide appended after new slide');
      await lb.close();
    });
    await check('Lightbox: repeated close removes every global runtime listener', async () => {
      const registrations = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if ((this === window && ['mousemove', 'mouseup'].includes(type)) || (this === document && type === 'keydown')) registrations.push(options?.signal);
        return add.call(this, type, listener, options);
      };
      try {
        const lb = track(new CGELightbox({ duration: 0, thumbnails: false }));
        for (let i = 0; i < 2; i++) {
          await lb.open(0, [{ type: 'inline', content: '<p>Media</p>' }]);
          await lb.close();
        }
        assert(registrations.length === 6 && registrations.every(signal => signal?.aborted), 'Global handlers remained registered after close');
      } finally { EventTarget.prototype.addEventListener = add; }
    });
    await check('Lightbox: declarative gallery names with quotes are supported', async () => {
      const trigger = mount('<button data-cge-lightbox data-cge-type="inline" data-cge-src="#inline-test">View</button>');
      trigger.dataset.cgeGallery = 'album"quoted';
      const inline = document.createElement('template'); inline.id = 'inline-test'; inline.innerHTML = '<p>Inline</p>'; fixture.append(inline);
      CGELightbox.init();
      trigger.click();
      await wait(20);
      assert(CGELightbox.activeInstance?.isOpen, 'Quoted gallery failed to open');
      await CGELightbox.activeInstance.close();
    });
    await check('Modal: declarative trigger, Escape and programmatic lifecycle smoke', async () => {
      mount('<div><button data-cge-modal-target="#audit-modal">Open</button><div id="audit-modal" data-cge-modal class="hidden" data-cge-animation-driver="none"><div data-cge-modal-dialog><button data-cge-modal-close>Close</button></div></div></div>');
      CGEModal.init(fixture);
      const modal = track(CGEModal.getInstance('#audit-modal'));
      fixture.querySelector('[data-cge-modal-target]').click();
      await wait(30);
      assert(modal.isOpen, 'Declarative modal did not open');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await wait(30);
      assert(!modal.isOpen, 'Escape did not close modal');
      await modal.open(); await modal.close();
    });
    await check('Drawer: declarative trigger, Escape and programmatic lifecycle smoke', async () => {
      mount('<div><button data-cge-drawer-target="#audit-drawer">Open</button><div id="audit-drawer" data-cge-drawer class="hidden" data-cge-duration="1"><div data-cge-drawer-dialog><button data-cge-drawer-close>Close</button></div></div></div>');
      CGEDrawer.init(fixture);
      const drawer = track(CGEDrawer.get('#audit-drawer'));
      fixture.querySelector('[data-cge-drawer-target]').click();
      await until(() => !drawer._isAnimating);
      assert(drawer.isOpen(), 'Declarative drawer did not open');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await until(() => !drawer._isAnimating);
      assert(!drawer.isOpen(), 'Escape did not close drawer');
      await drawer.open(); await drawer.close();
    });
    await check('Alert: programmatic confirmation and declarative trigger smoke', async () => {
      const promise = CGEAlert.confirm('Confirm', 'Test');
      await wait(20);
      document.querySelector('[data-cge-alert-action="confirm"]').click();
      assert((await promise).isConfirmed, 'Programmatic confirmation failed');
      await wait(230);
      const el = mount('<button data-cge-alert="confirm" data-cge-title="Declarative">Confirm</button>');
      let confirmed = 0;
      el.addEventListener('cge:confirmed', () => confirmed++);
      CGEAlert.init(fixture); el.click();
      await wait(20);
      document.querySelector('[data-cge-alert-action="confirm"]').click();
      await wait(230);
      assert(confirmed === 1, 'Declarative confirmation failed');
    });
    if (maintenance) await maintenanceRegressions({ check, mount, fixture, track, assert, wait, deferred });
    if (maintenance) await collectionRegressions({ check, mount, fixture, track, assert, wait, deferred });
    await check('Core: subtree init scopes selects and nested toast delegation handles one click', async () => {
      const { initTailTools } = await import('../src/index.ts');
      mount('<div id="audit-panel"><select data-cge-select><option>A</option></select><button data-cge-toast="Once" data-cge-toast-duration="0">Show</button></div>');
      const outside = document.createElement('select');
      outside.dataset.cgeSelect = ''; fixture.append(outside);
      const panel = fixture.querySelector('#audit-panel');
      initTailTools(panel); initTailTools(panel);
      track(CGESelect.get(panel.querySelector('select')));
      const outsideInstance = CGESelect.get(outside);
      if (outsideInstance) track(outsideInstance);
      assert(!outsideInstance && panel.querySelectorAll('[data-cge-select-instance]').length === 1, 'Subtree init touched an outside select or duplicated a wrapper');
      panel.querySelector('[data-cge-toast]').click();
      assert(CGEToast.activeToasts.size === 1, 'Nested delegation duplicated a toast');
    });
    return results;
  } finally { fixture.remove(); running = false; }
}
