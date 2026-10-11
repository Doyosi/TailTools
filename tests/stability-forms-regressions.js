// Browser regressions for the October 2026 stability fixes (forms plugins).
import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGESelect } from '../plugins/CGESelect/CGESelect.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { HttpError } from '../plugins/shared/http.js';

export async function stabilityFormsRegressions({ check, mount, fixture, track, assert, wait, deferred }) {
  const confirmWith = promise => { window.CGEAlert = { fire() {}, confirm: () => promise, delete: () => promise, restore: () => promise }; };

  await check('ActionButton: capture gating runs inline onclick and listeners once, after confirmation', async () => {
    const el = mount('<button type="button" data-cge-confirm="Run it?" onclick="window.__cgeInlineClicks = (window.__cgeInlineClicks || 0) + 1">Run</button>');
    window.__cgeInlineClicks = 0;
    let listenerClicks = 0;
    el.addEventListener('click', () => listenerClicks++);
    const gate = deferred();
    confirmWith(gate.promise);
    CGEActionButton.init();
    try {
      el.click();
      track(CGEActionButton.get(el));
      await wait(0);
      assert(window.__cgeInlineClicks === 0 && listenerClicks === 0, 'Handlers ran before confirmation');
      gate.resolve({ isConfirmed: true });
      await wait(30);
      assert(window.__cgeInlineClicks === 1 && listenerClicks === 1, `Expected one execution, got inline=${window.__cgeInlineClicks} listener=${listenerClicks}`);
      assert(!el.disabled && el.getAttribute('aria-busy') !== 'true', 'Button stayed busy');

      confirmWith(Promise.resolve({ isConfirmed: false }));
      el.click();
      await wait(30);
      assert(window.__cgeInlineClicks === 1 && listenerClicks === 1, 'Canceled confirmation still executed handlers');
    } finally { delete window.__cgeInlineClicks; }
  });

  await check('ActionButton: confirmed submit fires submit event with its submitter (CGEForm AJAX path)', async () => {
    const form = mount('<form action="/save" method="post"><input name="title" value="Draft"><button name="intent" value="publish" data-cge-confirm="Publish?">Publish</button></form>');
    const button = form.querySelector('button');
    let captured = null, submitEvents = 0, submitter = null;
    form.addEventListener('submit', event => { submitEvents++; submitter = event.submitter; });
    track(new CGEForm(form, { feedback: 'none', beforeSubmit: data => { captured = data; return { status: 200, data: {} }; } }));
    confirmWith(Promise.resolve({ isConfirmed: true }));
    CGEActionButton.init();
    button.click();
    track(CGEActionButton.get(button));
    await wait(40);
    assert(submitEvents === 1 && submitter === button, 'Submit event or submitter missing');
    assert(captured?.get('intent') === 'publish' && captured.get('title') === 'Draft', 'Submitter name/value lost from FormData');
    assert(!button.disabled && button.getAttribute('aria-busy') !== 'true', 'Prevented (AJAX) submit left the button frozen');
  });

  await check('ActionButton: non-submit buttons and anchors do not submit the enclosing form', async () => {
    const form = mount('<form><button type="button" data-cge-action="direct">Helper</button></form>');
    let submits = 0;
    form.addEventListener('submit', event => { event.preventDefault(); submits++; });
    const action = track(new CGEActionButton(form.querySelector('button')));
    await action.execute();
    assert(submits === 0, 'type="button" submitted its form');
  });

  await check('Dropzone: file names and error text render as text (existing files and new files)', async () => {
    const payload = '"><img src=x onerror="window.__cgeXss=1">.pdf';
    const dz = track(new CGEDropzone(mount('<div></div>'), { uploadMode: 'form', acceptedFiles: '.txt', existingFiles: [{ id: 1, name: payload, url: '/files/1' }] }));
    dz.addFile(new File(['x'], '<svg onload="window.__cgeXss=2">.exe'));
    await wait(20);
    assert(!window.__cgeXss && !dz.previewsContainer.querySelector('img, svg[onload]'), 'File data was parsed as HTML');
    const names = Array.from(dz.previewsContainer.querySelectorAll('.cge-dropzone-filename')).map(node => node.textContent);
    assert(names.includes(payload) && names.includes('<svg onload="window.__cgeXss=2">.exe'), 'File names not rendered as text');
    const rejected = dz.files.find(file => file.validationError);
    assert(rejected?.domCard.querySelector('.cge-dropzone-retry').classList.contains('hidden'), 'Retry offered for a client validation error');
    delete window.__cgeXss;
  });

  await check('Dropzone: form mode keeps click-picked files for submission', async () => {
    const form = mount('<form><div></div></form>');
    const dz = track(new CGEDropzone(form.querySelector('div'), { uploadMode: 'form', paramName: 'photos' }));
    const pick = (...files) => {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      dz.hiddenInput.files = dt.files;
      dz.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const image = new File(['img'], 'slide.png', { type: 'image/png' });
    pick(image);
    let data = new FormData(form);
    assert(data.getAll('photos[]').length === 1 && data.getAll('photos[]')[0].name === 'slide.png', 'Click-picked file missing from form submission');
    assert(!dz.hiddenInput.name && dz.hiddenInput.files.length === 0, 'Picker must stay unnamed and reset for re-selection');
    pick(image);
    data = new FormData(form);
    assert(dz.files.length === 2 && data.getAll('photos[]').length === 2, 'Picking the same file again was lost');
    dz.addFiles([new File(['b'], 'dropped.png', { type: 'image/png' })]);
    assert(new FormData(form).getAll('photos[]').length === 3, 'Dropped and picked files do not combine');
    dz.disable();
    assert(new FormData(form).getAll('photos[]').length === 0, 'Disabled dropzone still submits files');
    dz.enable();
    dz.destroy();
    assert(!form.querySelector('input[type="file"]'), 'destroy() left file inputs behind');
  });

  await check('Dropzone: instant mode keeps files out of the form and submits server IDs', async () => {
    const form = mount('<form><div></div></form>');
    const dz = track(new CGEDropzone(form.querySelector('div'), { url: '/upload', paramName: 'docs', driver: 'xhr' }));
    dz._uploadWithXHR = async () => ({ id: 42, path: 'docs/a.txt' });
    const file = dz.addFile(new File(['a'], 'a.txt', { type: 'text/plain' }));
    await wait(30);
    let data = new FormData(form);
    assert(file.status === 'success' && dz.isUploading === false, 'Upload did not finish');
    assert(data.getAll('docs[]').length === 0 && data.getAll('docs').length === 0 && dz.hiddenInput.files.length === 0, 'Instant mode re-submits uploaded files');
    assert(data.getAll('docs_ids[]').join() === '42', 'Server ID hidden input missing');
    await dz.removeFile(file.id, true);
    data = new FormData(form);
    assert(data.getAll('docs_ids[]').length === 0, 'Server ID survived removal');
  });

  await check('Dropzone: rejected avatar upload reverts the preview and shows the server error', async () => {
    const original = 'data:image/png;base64,iVBORw0KGgo=';
    const dz = track(new CGEDropzone(mount('<div></div>'), { mode: 'avatar', url: '/avatar', driver: 'xhr', existingFiles: [{ id: 9, name: 'me.png', url: original }] }));
    dz._uploadWithXHR = async () => { throw new HttpError(422, '', { message: 'Invalid.', errors: { file: ['The avatar is too small.'] } }); };
    dz.addFile(new File(['b'], 'new.png', { type: 'image/png' }));
    await wait(30);
    assert(dz.files.length === 1 && dz.files[0].isExisting && dz.avatarImage.getAttribute('src') === original, 'Rejected avatar kept the new image');
    assert(dz.avatarError.textContent === 'The avatar is too small.' && !dz.avatarError.classList.contains('hidden'), 'Avatar error not shown');
  });

  await check('Dropzone: destroy restores the element and form reset clears new previews', async () => {
    const el = mount('<div class="my-zone"></div>');
    new CGEDropzone(el).destroy();
    assert(el.className === 'my-zone' && !el.hasAttribute('role') && !el.hasAttribute('tabindex') && el.children.length === 0, 'Destroy left generated DOM or attributes');
    track(new CGEDropzone(el));
    assert(el.querySelectorAll('.cge-dropzone-trigger').length === 1 && el.querySelectorAll('input[type="file"]').length === 1, 'Re-init duplicated the UI');

    const form = mount('<form><div></div></form>');
    const dz = track(new CGEDropzone(form.querySelector('div'), { uploadMode: 'form', paramName: 'files', existingFiles: [{ id: 5, name: 'kept.pdf', url: '/kept.pdf' }] }));
    dz.addFile(new File(['a'], 'new.txt'));
    form.reset();
    await wait(20);
    assert(dz.files.length === 1 && dz.files[0].isExisting && dz.previewsContainer.children.length === 1, 'Reset kept new previews or dropped existing ones');
  });

  await check('Form: fields sharing a parent keep separate feedback and clear independently', async () => {
    const el = mount('<form><div><input name="first"><input name="last"></div><button>Save</button></form>');
    const form = track(new CGEForm(el, { feedback: 'none' }));
    form.bindErrors({ first: ['First name is required.'], last: ['Last name is required.'] });
    const feedback = key => el.querySelector(`[data-cge-feedback="${key}"]`);
    assert(feedback('first')?.textContent === 'First name is required.' && feedback('last')?.textContent === 'Last name is required.' && feedback('first') !== feedback('last'), 'Shared parent overwrote feedback');
    el.querySelector('[name="first"]').dispatchEvent(new Event('input', { bubbles: true }));
    assert(!feedback('first') && feedback('last')?.textContent === 'Last name is required.', 'Typing in one field cleared another');
    assert(el.querySelector('[name="last"]').getAttribute('aria-invalid') === 'true' && el.querySelector('[name="first"]').getAttribute('aria-invalid') !== 'true', 'Invalid state crossed fields');
  });

  await check('Form: nested/array error keys and author aria-describedby are preserved', async () => {
    const el = mount('<form><span id="hint">Hint</span><input name="items[0][name]" aria-describedby="hint"><label><input type="checkbox" name="tags[]" value="a"> A</label><label><input type="checkbox" name="tags[]" value="b"> B</label></form>');
    const form = track(new CGEForm(el, { feedback: 'none' }));
    form.bindErrors({ 'items.0.name': ['Item name is required.'], 'tags.1': ['Invalid tag.'] });
    const item = el.querySelector('[name="items[0][name]"]');
    const tags = el.querySelectorAll('[name="tags[]"]');
    assert(item.getAttribute('aria-invalid') === 'true' && item.getAttribute('aria-describedby').split(' ')[0] === 'hint', 'Nested key not bound');
    assert(tags[1].getAttribute('aria-invalid') === 'true' && tags[0].getAttribute('aria-invalid') !== 'true', 'Array index not resolved');
    form.clearErrors();
    assert(item.getAttribute('aria-describedby') === 'hint', 'Author aria-describedby was deleted');
  });

  await check('Form + Select: invalid state is visible on the trigger and clears on change', async () => {
    const el = mount('<form><select name="role"><option value="">Choose</option><option value="admin">Admin</option></select></form>');
    const select = track(new CGESelect(el.querySelector('select')));
    const form = track(new CGEForm(el, { feedback: 'none' }));
    form.bindErrors({ role: ['Pick a role.'] });
    await wait(0);
    assert(select.trigger.getAttribute('aria-invalid') === 'true' && select.trigger.classList.contains('border-red-500') && select.trigger.classList.contains('cge-select-invalid'), 'Trigger does not show the error');
    assert(select.wrapper.nextElementSibling?.getAttribute('data-cge-feedback') === 'role', 'Feedback not placed after the visible control');
    select.setValue('admin');
    await wait(0);
    assert(select.trigger.getAttribute('aria-invalid') !== 'true' && !select.trigger.classList.contains('border-red-500') && !select.trigger.classList.contains('cge-select-invalid'), 'Trigger error did not clear');
  });

  await check('Select: form reset applies native defaults after the browser resets controls', async () => {
    const form = mount('<form><select name="plan"><option value="free">Free</option><option value="pro" selected>Pro</option></select><button type="reset">Reset</button></form>');
    const select = track(new CGESelect(form.querySelector('select')));
    select.setValue('free');
    form.querySelector('button[type="reset"]').click();
    await wait(20);
    assert(select.getValue() === 'pro' && select.selectionContainer.textContent.includes('Pro'), 'Reset not reflected in the custom select');
  });

  await check('Lifecycle: destroyAll tears down forms plugins inside a root', async () => {
    const root = mount('<div><form><select name="s"><option>A</option></select><button data-cge-action="direct">Go</button></form><div class="zone"></div></div>');
    const form = new CGEForm(root.querySelector('form'), { feedback: 'none' });
    const select = new CGESelect(root.querySelector('select'));
    const dz = new CGEDropzone(root.querySelector('.zone'));
    const action = CGEActionButton.getOrCreate(root.querySelector('[data-cge-action]'));
    CGEForm.destroyAll(root); CGESelect.destroyAll(root); CGEDropzone.destroyAll(root); CGEActionButton.destroyAll(root);
    assert(!CGEForm.getInstance(form.form) && !CGESelect.get(select.element) && !CGEDropzone.get(dz.element) && !CGEActionButton.get(action.element), 'destroyAll left instances behind');
  });
}
