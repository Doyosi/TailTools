import { CGEAccordion, CGECollapse } from '../plugins/CGEAccordion/CGEAccordion.js';
import { CGETabs } from '../plugins/CGETabs/CGETabs.js';

export async function navigationRegressions({ check, mount, fixture, track, assert, wait, deferred }) {
  await import('../src/index.ts');
  const item = (id, attrs = '', trigger = '') => `<section data-cge-item="${id}" ${attrs}><h3><button data-cge-trigger ${trigger}>${id}<span data-cge-icon></span></button></h3><div data-cge-body><div data-cge-content><input value="${id}"></div></div></section>`;
  const accordion = (attrs = '', items = item('a') + item('b')) => `<div ${attrs}>${items}</div>`;
  const tabs = (attrs = '', buttons = '<button data-cge-tab="a">A</button><button data-cge-tab="b">B</button>') => `<div ${attrs}><div data-cge-tablist>${buttons}</div><div><section data-cge-panel="a"><input value="original"></section><section data-cge-panel="b">B panel</section></div></div>`;
  const key = (el, value) => el.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  const scoped = async fn => {
    const url = location.href, state = history.state;
    try { history.replaceState({ marker: 'host' }, '', location.pathname); await fn(); }
    finally { history.replaceState(state, '', url); }
  };
  const test = (name, fn) => check(name, () => scoped(fn));

  await test('Accordion: raw programmatic root, explicit options and DOM restoration', () => {
    const root = mount(accordion('data-cge-exclusive="true"'));
    const before = root.outerHTML, input = root.querySelector('input');
    const acc = track(new CGEAccordion(root, { exclusive: false, urlSync: false, duration: 70 }));
    assert(acc.items.length === 2 && !acc.options.exclusive, 'Raw root or JS option override failed');
    acc.openAll();
    assert(acc.openItemIds.size === 2 && acc.items[0].wrapper.style.transitionDuration === '70ms', 'Open-all or configured duration failed');
    acc.destroy();
    assert(root.outerHTML === before && root.querySelector('input') === input && !CGEAccordion.get(acc.id), 'DOM or registry was not restored');
    assert(track(new CGEAccordion(root, { urlSync: false })).items.length === 2, 'Recreation failed');
  });
  await test('Accordion: matching init root, safe get by ID/selector and repeated init', () => {
    const root = mount(accordion('id="faq:one" data-cge-accordion'));
    const [acc] = CGEAccordion.init(root); track(acc);
    assert(acc && CGEAccordion.get('faq:one') === acc && CGEAccordion.get('[id="faq:one"]') === acc, 'Scoped root or get failed');
    assert(CGEAccordion.get('[') === null && CGEAccordion.init(root).length === 0, 'Invalid lookup threw or repeated init duplicated');
  });
  await test('Accordion: nested items and icons belong only to their own group', () => {
    const root = mount(accordion('data-cge-accordion', item('outer')));
    root.querySelector('[data-cge-content]').insertAdjacentHTML('beforeend', accordion('data-cge-accordion', item('inner')));
    const childRoot = root.querySelector('[data-cge-accordion]');
    const parent = track(new CGEAccordion(root, { urlSync: false, defaultOpen: 'outer' }));
    const child = track(new CGEAccordion(childRoot, { urlSync: false }));
    child.items[0].trigger.click();
    assert(parent.items.length === 1 && child.items.length === 1 && child.isOpen('inner') && parent.isOpen('outer'), 'Nested click leaked to parent');
    child.destroy(); parent.destroy();
  });
  await test('Accordion: explicit false markup, inert focus protection and closing focus', () => {
    const acc = track(new CGEAccordion(mount(accordion('', item('a', 'data-cge-open="false"'))), { urlSync: false }));
    const { trigger, wrapper, content } = acc.items[0];
    assert(!acc.isOpen('a') && wrapper.inert, 'False markup opened or closed panel is interactive');
    content.querySelector('input').focus();
    assert(document.activeElement !== content.querySelector('input'), 'Collapsed input received focus');
    acc.open('a'); content.querySelector('input').focus(); acc.close('a');
    assert(document.activeElement === trigger && wrapper.inert, 'Closing did not restore focus');
  });
  await test('Accordion: exclusive alwaysOpen survives invalid defaults and swaps', () => {
    const acc = track(new CGEAccordion(mount(accordion()), { urlSync: false, alwaysOpen: true, defaultOpen: 'missing' }));
    assert(acc.isOpen('a'), 'Invalid default defeated alwaysOpen');
    acc.close('a'); assert(acc.isOpen('a'), 'Last panel closed');
    acc.open('b'); assert(!acc.isOpen('a') && acc.isOpen('b'), 'Exclusive swap failed');
    acc.closeAll(); assert(acc.isOpen('b'), 'closeAll violated alwaysOpen');
  });
  await test('Accordion: empty persisted state overrides default and DOM open markup', () => {
    const storageKey = 'tailtools-audit-accordion'; const before = localStorage.getItem(storageKey);
    try {
      localStorage.setItem(storageKey, '[]');
      const acc = track(new CGEAccordion(mount(accordion('', item('a', 'data-cge-open="true"'))), { urlSync: false, defaultOpen: 'a', storage: 'localStorage', storageKey }));
      assert(!acc.isOpen('a'), 'Persisted all-closed state ignored');
      acc.open('a'); acc.close('a'); assert(localStorage.getItem(storageKey) === '[]', 'Close did not persist empty state');
    } finally { if (before === null) localStorage.removeItem(storageKey); else localStorage.setItem(storageKey, before); }
  });
  await test('Accordion: keyboard skips disabled triggers and navigation buttons do not submit', () => {
    const form = mount(`<form>${accordion('', item('a') + item('b', '', 'disabled') + item('c'))}</form>`);
    let submits = 0; form.addEventListener('submit', e => { e.preventDefault(); submits++; });
    const acc = track(new CGEAccordion(form.firstElementChild, { urlSync: false }));
    acc.items[0].trigger.focus(); key(acc.items[0].trigger, 'ArrowDown');
    assert(document.activeElement === acc.items[2].trigger, 'Disabled trigger was not skipped');
    key(acc.items[2].trigger, 'Home'); assert(document.activeElement === acc.items[0].trigger, 'Home navigation failed');
    acc.items[0].trigger.click(); assert(submits === 0 && acc.isOpen('a'), 'Accordion submitted its form');
  });
  await test('Accordion: encoded hash, history state and canceled initial scroll', async () => {
    history.replaceState(history.state, '', '#hello%20world');
    const root = mount(accordion('', item('hello world') + item('b')));
    let scrolls = 0; root.querySelector('[data-cge-item]').scrollIntoView = () => scrolls++;
    const acc = track(new CGEAccordion(root, { updateHash: true, scrollIntoView: true }));
    assert(acc.isOpen('hello world'), 'Encoded hash was not decoded');
    acc.open('b'); assert(history.state.marker === 'host' && location.hash === '#b', 'Host history state lost');
    acc.destroy(); await wait(30); assert(scrolls === 0, 'Destroy left a scheduled scroll');
  });
  await test('Collapse: multiple controls share one instance, ARIA, duration and restoration', () => {
    const root = mount('<div><button data-cge-collapse="#shared:panel">One</button><button data-cge-collapse="shared:panel">Two</button><div id="shared:panel"><div><input></div></div></div>');
    const before = root.outerHTML;
    const instances = CGECollapse.init(root, { duration: 80 }); const collapse = track(instances[0]);
    assert(instances.length === 1 && collapse.triggers.length === 2 && collapse.wrapper.inert, 'Controls created duplicate instances');
    collapse.triggers[1].click();
    assert(collapse.isOpen() && collapse.triggers.every(trigger => trigger.getAttribute('aria-expanded') === 'true'), 'Controls diverged');
    assert(CGECollapse.get('shared:panel') === collapse && collapse.wrapper.style.transitionDuration === '80ms', 'ID lookup or duration failed');
    collapse.destroy(); assert(root.outerHTML === before && CGECollapse.get('shared:panel') === null, 'Collapse DOM/registry not restored');
  });
  await test('Collapse: scoped trigger root, non-button keys and dynamic second control', () => {
    const root = mount('<div><a data-cge-collapse="#panel-x" href="#panel-x">Toggle</a><div id="panel-x"><div>Content</div></div></div>');
    const [collapse] = CGECollapse.init(root.firstElementChild); track(collapse);
    collapse.trigger.focus(); key(collapse.trigger, ' '); assert(collapse.isOpen(), 'Non-button Space failed');
    const extra = document.createElement('button'); extra.dataset.cgeCollapse = '#panel-x'; root.prepend(extra);
    assert(new CGECollapse(extra) === collapse, 'Dynamic trigger replaced instance');
    extra.click(); assert(!collapse.isOpen(), 'Dynamic trigger did not share state');
    assert(CGECollapse.get('[') === null, 'Malformed get selector failed');
  });
  await test('Collapse: missing declarative targets are skipped and programmatic targets fail clearly', () => {
    const root = mount('<div><button data-cge-collapse="#missing">Missing</button><button data-cge-toggle="modal">Other</button></div>');
    assert(CGECollapse.init(root).length === 0, 'Invalid toggle became a panel');
    let threw = false; try { new CGECollapse(root.firstElementChild); } catch { threw = true; }
    assert(threw, 'Missing target did not fail clearly');
  });
  await test('Tabs: raw root preserves preselected ARIA, consumer nodes and full destroy/recreate', () => {
    const root = mount(tabs('', '<button data-cge-tab="a">A</button><button data-cge-tab="b" aria-selected="true">B</button>'));
    const before = root.outerHTML, input = root.querySelector('input');
    const instance = track(new CGETabs(root, { urlSync: false }));
    assert(instance.tabs.length === 2 && instance.activeTabId === 'b', 'Raw root or preselection failed');
    instance.show('a'); instance.destroy();
    assert(root.outerHTML === before && root.querySelector('input') === input && !CGETabs.get(instance.id), 'Original DOM/registry not restored');
    assert(track(new CGETabs(root, { urlSync: false })).activeTabId === 'b', 'Recreation lost preselection');
  });
  await test('Tabs: nested discovery and events stay scoped to each instance', () => {
    const root = mount(tabs('data-cge-tabs'));
    root.querySelector('[data-cge-panel]').insertAdjacentHTML('beforeend', tabs('data-cge-tabs'));
    const parent = track(new CGETabs(root, { urlSync: false }));
    const child = track(new CGETabs(root.querySelector('[data-cge-tabs]'), { urlSync: false }));
    child.getTab('b').click();
    assert(parent.tabs.length === 2 && child.activeTabId === 'b' && parent.activeTabId === 'a', 'Nested tab changed parent');
    child.destroy(); parent.destroy();
  });
  await test('Tabs: manual keyboard, disabled tabs, non-button activation and form safety', () => {
    const form = mount(`<form>${tabs('', '<button data-cge-tab="a">A</button><button data-cge-tab="skip" disabled>Skip</button><span data-cge-tab="b">B</span>')}</form>`);
    const instance = track(new CGETabs(form.firstElementChild, { urlSync: false, manual: true, indicator: false }));
    let submits = 0; form.addEventListener('submit', e => { e.preventDefault(); submits++; });
    instance.getTab('a').focus(); key(instance.getTab('a'), 'ArrowRight');
    assert(document.activeElement === instance.getTab('b') && instance.activeTabId === 'a', 'Manual arrows activated or failed to skip disabled');
    key(instance.getTab('b'), 'Enter'); assert(instance.activeTabId === 'b', 'Manual Enter failed');
    instance.getTab('a').click(); assert(submits === 0 && instance.activeTabId === 'a', 'Tabs submitted their form');
    instance.options.manual = false; instance.getTab('b').focus(); key(instance.getTab('b'), ' ');
    assert(instance.activeTabId === 'b', 'Automatic non-button Space failed');
  });
  await test('Tabs: show cancellation, multi-class animation and no duplicate activation events', () => {
    const instance = track(new CGETabs(mount(tabs()), { urlSync: false, animationIn: 'custom-one custom-two' }));
    let shown = 0; instance.on('cge:tabs:shown', () => shown++);
    const cancel = e => e.preventDefault(); instance.element.addEventListener('cge:tabs:show', cancel);
    assert(instance.show('b') === false && instance.activeTabId === 'a', 'Cancelable show ignored');
    instance.element.removeEventListener('cge:tabs:show', cancel);
    instance.show('b'); instance.show('b');
    assert(shown === 1 && instance.getPanel('b').classList.contains('custom-two'), 'Same tab activated twice or multi-class animation failed');
  });
  await test('Tabs: encoded hash, safe selector get and popstate retain host history state', () => {
    const root = mount(tabs('id="tabs:one"', '<button data-cge-tab="a">A</button><button data-cge-tab="b space">B</button>'));
    root.querySelector('[data-cge-panel="b"]').dataset.cgePanel = 'b space';
    history.replaceState(history.state, '', '#b%20space');
    const instance = track(new CGETabs(root, { historyMode: 'push' }));
    assert(instance.activeTabId === 'b space' && CGETabs.get('#tabs\\:one') === instance && !CGETabs.get('['), 'Hash decode or lookup failed');
    instance.show('a'); assert(history.state.marker === 'host', 'History state was discarded');
    history.replaceState(history.state, '', '#b%20space'); window.dispatchEvent(new PopStateEvent('popstate'));
    assert(instance.activeTabId === 'b space', 'Hash popstate was ignored');
  });
  await test('Tabs: query URL updates preserve unrelated parameters/hash and disabled fallback', () => {
    history.replaceState(history.state, '', '?keep=1&section=b#anchor');
    const root = mount(tabs('', '<button data-cge-tab="a">A</button><button data-cge-tab="b" disabled>B</button>'));
    const instance = track(new CGETabs(root, { urlSync: 'query', queryParamKey: 'section' }));
    assert(instance.activeTabId === 'a', 'Disabled URL tab activated');
    instance.getTab('b').disabled = false; instance.show('b');
    assert(location.search.includes('keep=1') && location.hash === '#anchor' && history.state.marker === 'host', 'Query sync lost host state');
  });
  await test('Tabs: latest forced Axios request wins even when cancellation is ignored', async () => {
    const old = deferred(), newer = deferred(); let calls = 0;
    window.axios = { request: () => (++calls === 1 ? old.promise : newer.promise) };
    const instance = track(new CGETabs(mount(tabs()), { urlSync: false, ajaxDriver: 'axios', ajaxTabs: { a: '/old' } }));
    const next = instance.loadAjaxTab('a', true);
    newer.resolve({ data: '<p>New</p>' }); await next;
    old.resolve({ data: '<p>Old</p>' }); await wait(20);
    assert(instance.getPanel('a').textContent === 'New' && !instance.getPanel('a').hasAttribute('aria-busy'), 'Stale response won or busy state remained');
  });
  await test('Tabs: cached activation makes one request; forced failure invalidates cache', async () => {
    let requests = 0; window.fetch = async () => { requests++; return new Response('Cached'); };
    const instance = track(new CGETabs(mount(tabs()), { urlSync: false, ajaxDriver: 'fetch', ajaxTabs: { b: '/partial' } }));
    instance.show('b'); await wait(20); instance.show('a'); instance.show('b'); instance.show('b');
    assert(requests === 1, 'Cached tab refetched');
    window.fetch = async () => new Response('Fail', { status: 500 }); await instance.loadAjaxTab('b', true);
    assert(!instance.getPanel('b').hasAttribute('data-cge-ajax-loaded') && instance.getPanel('b').querySelector('[role="alert"]'), 'Failed reload retained stale cache');
    window.fetch = async () => { requests++; return new Response('Recovered'); };
    instance.show('a'); instance.show('b'); await wait(20);
    assert(instance.getPanel('b').textContent === 'Recovered' && requests === 2, 'Failed cache prevented recovery');
  });
  await test('Tabs: HTTP error retry handles quoted IDs and treats translations as text', async () => {
    const id = 'quote"tab'; const root = mount(tabs());
    root.querySelector('[data-cge-tab="b"]').setAttribute('data-cge-tab', id);
    root.querySelector('[data-cge-panel="b"]').setAttribute('data-cge-panel', id);
    window.fetch = async () => new Response('Fail', { status: 503 });
    const instance = track(new CGETabs(root, { urlSync: false, ajaxDriver: 'fetch', ajaxTabs: { [id]: '/partial' }, translations: { 'ajax-error': '<img src=x onerror=alert(1)>', retry: '<b>Retry</b>' } }));
    await instance.loadAjaxTab(id);
    const panel = instance.getPanel(id); assert(!panel.querySelector('img') && panel.textContent.includes('<img'), 'Translation was interpreted as HTML');
    assert(panel.querySelector('[data-cge-tab-retry]').dataset.cgeTabRetry === id, 'Retry ID was corrupted');
    window.fetch = async () => new Response('Retried'); panel.querySelector('[data-cge-tab-retry]').click(); await wait(20);
    assert(panel.textContent === 'Retried', 'Quoted ID retry failed');
  });
  await test('Tabs: uncached AJAX initializes child plugins once and destroys them on reload/destroy', async () => {
    window.fetch = async () => new Response('<div data-cge-accordion><section data-cge-item="x"><button data-cge-trigger>X</button><div data-cge-body><div><select data-cge-select><option>X</option></select></div></div></section></div>');
    const root = mount(tabs()); const before = root.outerHTML;
    const instance = track(new CGETabs(root, { urlSync: false, cacheAjax: false, ajaxDriver: 'fetch', ajaxTabs: { b: '/partial' } }));
    instance.show('b'); await wait(20);
    const childRoot = instance.getPanel('b').querySelector('[data-cge-accordion]');
    const child = CGEAccordion.get(childRoot), selectEl = childRoot.querySelector('select');
    const select = window.CGESelect.get(selectEl);
    assert(child && select && childRoot.querySelectorAll('[data-cge-select-instance]').length === 1, 'AJAX lifecycle skipped or duplicated child init');
    instance.show('a'); instance.show('b'); await wait(20);
    assert(!CGEAccordion.get(childRoot) && !window.CGESelect.get(selectEl) && child._destroyed, 'Replaced children leaked');
    const latest = CGEAccordion.get(instance.getPanel('b').querySelector('[data-cge-accordion]'));
    instance.destroy(); assert(latest._destroyed && root.outerHTML === before, 'Destroy leaked children or failed to restore markup');
  });
  await test('Tabs: destroy cancels pending fetch and future explicit reloads', async () => {
    const pending = deferred(); let requests = 0;
    window.fetch = () => { requests++; return pending.promise; };
    const root = mount(tabs()); const before = root.outerHTML;
    const instance = track(new CGETabs(root, { urlSync: false, ajaxDriver: 'fetch', ajaxTabs: { b: '/partial' } }));
    instance.show('b'); assert(instance.getPanel('b').getAttribute('aria-busy') === 'true', 'Missing loading busy state');
    instance.destroy(); pending.resolve(new Response('Late')); await wait(20); await instance.loadAjaxTab('b', true);
    assert(root.outerHTML === before && requests === 1, 'Destroy permitted late DOM/network work');
  });
  await test('Tabs: fallback lifecycle uses correct standalone init signatures once', async () => {
    const library = window.TailTools, actions = window.CGEActionButton; let actionArgs;
    try {
      window.TailTools = undefined; window.CGEActionButton = { init: (...args) => { actionArgs = args; } };
      window.fetch = async () => new Response('<select data-cge-select><option>X</option></select>');
      const instance = track(new CGETabs(mount(tabs()), { urlSync: false, ajaxDriver: 'fetch', ajaxTabs: { b: '/partial' } }));
      await instance.loadAjaxTab('b');
      assert(actionArgs?.length === 0 && window.CGESelect.get(instance.getPanel('b').querySelector('select')), 'Fallback init used wrong signature');
      instance.destroy();
    } finally { window.TailTools = library; window.CGEActionButton = actions; }
  });
  await test('Navigation: blocked storage does not break Accordion or Collapse initialization', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    try {
      Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new Error('Blocked storage'); } });
      const root = mount(accordion());
      const acc = track(new CGEAccordion(root, { urlSync: false, storage: 'localStorage' }));
      acc.open('a'); acc.close('a');
      const panel = document.createElement('div'); panel.innerHTML = '<div>Panel</div>'; fixture.append(panel);
      const collapse = track(new CGECollapse(panel, { storage: 'localStorage' }));
      collapse.open(); collapse.close();
      assert(!acc.isOpen('a') && !collapse.isOpen(), 'Blocked storage interrupted transitions');
    } finally { Object.defineProperty(window, 'localStorage', descriptor); }
  });
  await test('Collapse: Blade open markup and declarative duration survive initialization', () => {
    const root = mount('<div><button data-cge-collapse="#blade-open" data-cge-duration="35">Toggle</button><div id="blade-open" class="grid-rows-[1fr]"><div>Open content</div></div></div>');
    const [collapse] = CGECollapse.init(root); track(collapse);
    assert(collapse.isOpen() && !collapse.wrapper.inert && collapse.wrapper.style.transitionDuration === '35ms', 'Blade initial state or data duration was lost');
    collapse.close(); assert(!collapse.wrapper.classList.contains('grid-rows-[1fr]'), 'Open markup prevented closing');
  });
  await test('Accordion: non-button activation remains available when arrow navigation is disabled', () => {
    const root = mount(accordion().replaceAll('<button data-cge-trigger', '<span tabindex="0" data-cge-trigger').replaceAll('</button>', '</span>'));
    const acc = track(new CGEAccordion(root, { urlSync: false, keyboard: false }));
    const trigger = acc.items[0].trigger; trigger.focus(); key(trigger, 'ArrowDown');
    assert(document.activeElement === trigger, 'Disabled arrow navigation moved focus');
    key(trigger, 'Enter'); assert(acc.isOpen('a'), 'Disabling arrows disabled non-button activation');
  });
  await test('Tabs: explicit base UI slots apply and restore without replacing default markup', () => {
    const root = mount(tabs()); const before = root.outerHTML;
    const instance = track(new CGETabs(root, { urlSync: false, ui: { tabList: 'custom-list', tab: 'custom-tab', panelContainer: 'custom-container' } }));
    assert(instance.tabList.classList.contains('custom-list') && instance.getTab('a').classList.contains('custom-tab') && instance.getPanel('a').parentElement.classList.contains('custom-container'), 'Configured base slots were ignored');
    instance.destroy(); assert(root.outerHTML === before, 'Custom UI classes survived teardown');
  });
  await test('Accordion/Collapse: callbacks may destroy without later DOM mutation', () => {
    const root = mount(accordion()); const before = root.outerHTML;
    const acc = track(new CGEAccordion(root, { urlSync: false, defaultOpen: 'a' }));
    acc.options.onClose = () => acc.destroy(); acc.open('b');
    assert(root.outerHTML === before && !CGEAccordion.get(acc.id), 'Exclusive swap mutated DOM after callback destroy');
    const panel = document.createElement('div'); panel.innerHTML = '<div>Content</div>'; fixture.append(panel);
    const panelBefore = panel.outerHTML; let toggles = 0;
    const collapse = track(new CGECollapse(panel, { onOpen: instance => instance.destroy(), onToggle: () => toggles++ }));
    collapse.open();
    assert(panel.outerHTML === panelBefore && toggles === 0, 'Collapse continued after onOpen destroy');
  });
  await test('Tabs: lifecycle initialization failure cleans partial children and invalidates cache', async () => {
    const library = window.TailTools; let child, childRoot;
    try {
      window.TailTools = { ...library, init: panel => {
        childRoot = panel.querySelector('[data-cge-accordion]');
        child = new CGEAccordion(childRoot, { urlSync: false });
        throw new Error('Child init failed');
      } };
      window.fetch = async () => new Response(accordion('data-cge-accordion'));
      const instance = track(new CGETabs(mount(tabs()), { urlSync: false, ajaxDriver: 'fetch', ajaxTabs: { b: '/partial' } }));
      await instance.loadAjaxTab('b');
      const panel = instance.getPanel('b');
      assert(child._destroyed && !CGEAccordion.get(childRoot) && !panel.hasAttribute('data-cge-ajax-loaded') && !panel.hasAttribute('aria-busy') && panel.querySelector('[role="alert"]'), 'Initialization failure leaked child/cache state');
      instance.destroy();
    } finally { window.TailTools = library; }
  });
  await test('Tabs: overflowing horizontal lists scroll focused tabs into view and restore styles', () => {
    const root = mount(tabs());
    const list = root.firstElementChild; list.style.cssText = 'display:flex;width:120px';
    for (const button of list.children) button.style.cssText = 'flex-shrink:0;width:100px';
    const before = root.outerHTML;
    const instance = track(new CGETabs(root, { urlSync: false }));
    instance.show('b', { focus: true });
    const bounds = list.getBoundingClientRect(), tab = instance.getTab('b').getBoundingClientRect();
    assert(getComputedStyle(list).overflowX === 'auto' && list.scrollLeft > 0 && tab.right <= bounds.right + 1, 'Focused overflow tab remained clipped');
    instance.destroy(); assert(root.outerHTML === before, 'Horizontal scroll style was not restored');
  });
}
