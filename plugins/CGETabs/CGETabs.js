/**
 * CGETabs - TailTools Plugin
 * High-performance, accessible tabs and segmented control plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
 * Features dual navigation state persistence (URL Hash and URL Query Param deep linking), on-demand Ajax / Blade partial
 * lazy loading with caching, WAI-ARIA compliant keyboard navigation, dynamic animated sliding indicators,
 * headless UI theming, and automated lifecycle re-binding for internal CGE plugins.
 *
 * @license MIT
 * @package TailTools
 */

import {
  captureAttributes, ownsNode, registeredInstance, parseHashState, updateHashState,
  hasCommandModifier, isRtl, panelHtmlFromResponse
} from '../shared/navigation.js';
import { escapeHTML, setContent, prefersReducedMotion, destroyInstances, pruneInstances } from '../shared/dom.js';
import { laravelHeaders, resolveAxios, isSafeMethod, HttpError, parseBody } from '../shared/http.js';

const OWNED_TAB = '[data-cge-tabs]';

export class CGETabs {
  /**
   * Active CGETabs instances indexed by element and id.
   * @type {Map<HTMLElement | string, CGETabs>}
   */
  static instances = new Map();

  /**
   * Initializer used for nested plugins inside freshly loaded AJAX panels.
   * Set by `tailtools/auto` (or the application) through setPanelInitializer().
   * @type {((panel: HTMLElement, tabId: string, instance: CGETabs) => void) | null}
   */
  static _panelInitializer = null;

  /** Counterpart of _panelInitializer called before panel content is replaced. */
  static _panelDestroyer = null;

  /**
   * Default configuration options.
   */
  static defaults = {
    urlSync: 'hash', // 'hash' | 'query' | false
    hashKey: null, // string | null: key of this group in the namespaced hash (#<hashKey>=<tabId>), defaults to element id
    queryParamKey: 'tab', // Query parameter name when urlSync is 'query'
    historyMode: 'replace', // 'replace' | 'push'
    storage: false, // 'localStorage' | 'sessionStorage' | false
    storageKey: null, // string | null (defaults to cge-tabs-${element.id || uid})
    defaultTab: null, // string | null
    orientation: 'horizontal', // 'horizontal' | 'vertical'
    indicator: true, // boolean | 'line' | 'pill'
    cacheAjax: true, // boolean (caches loaded HTML partials in memory)
    ajaxDriver: 'auto', // 'auto' | 'axios' | 'fetch'
    ajaxHeaders: {}, // Record<string, string>
    ajaxTabs: {}, // Record<string, string | { url: string, method?: string, driver?: string }>
    axiosInstance: null, // configured axios instance (wins over window.axios)
    sanitize: null, // (html, tabId) => string | Node: applied to every AJAX response before injection
    initPanel: null, // (panelEl, tabId, instance) => void: initializes nested plugins in loaded panels
    destroyPanel: null, // (panelEl, instance) => void: tears nested plugins down before content is replaced
    manual: false, // boolean: if true, arrows move focus and Enter/Space activates; if false, arrows activate immediately
    transition: true, // boolean (enables animated panel visibility transition)
    animationIn: 'animate-fade-in', // CSS animation/transition class for active panel entry
    onShow: null, // (tabId, panelEl, tabBtn) => void
    onShown: null, // (tabId, panelEl, tabBtn) => void
    onAjaxStart: null, // (tabId, panelEl) => void
    onAjaxLoaded: null, // (tabId, panelEl, response) => void
    onAjaxError: null, // (tabId, error) => void
    ui: {
      tabList: 'flex border-b border-slate-200 dark:border-slate-800 gap-2 relative',
      tab: 'px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer',
      activeTab: 'text-indigo-600 dark:text-indigo-400 font-semibold',
      inactiveTab: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
      disabledTab: 'opacity-50 cursor-not-allowed pointer-events-none',
      indicator: 'absolute bottom-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 pointer-events-none',
      panelContainer: 'mt-4',
      panel: 'hidden focus:outline-hidden',
      activePanel: 'block',
      loadingContainer: 'py-12 flex flex-col justify-center items-center gap-2 text-slate-400',
      errorContainer: 'py-8 text-center text-sm text-rose-500 flex flex-col items-center gap-2'
    },
    translations: {
      loading: 'Loading content...',
      'ajax-error': 'Failed to load tab content. Please try again.',
      retry: 'Retry'
    }
  };

  /**
   * Internal unique ID counter.
   * @private
   */
  static _counter = 0;

  /**
   * @param {string | HTMLElement} target - Container element or selector string
   * @param {Object} [options={}] - Custom configuration options
   */
  constructor(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('[CGETabs] A valid HTMLElement or matching selector is required.');
    }

    if (CGETabs.instances.has(element)) {
      return CGETabs.instances.get(element);
    }

    this._restorers = [captureAttributes(element)];
    this._originalContent = new Map();
    this._userOptions = options;
    this._disabledStyled = new Map();
    this.element = element;
    this.id = element.id || `cge-tabs-${++CGETabs._counter}`;
    if (!element.id) {
      element.id = this.id;
    }

    this.options = this._resolveOptions(options);
    this._hashKey = String(this.options.hashKey || this.id);

    // State
    this.activeTabId = null;
    this.tabs = []; // Array of { id: string, trigger: HTMLElement, panel: HTMLElement | null }
    this._listeners = new Map();
    this._ajaxLoaded = new Set();
    this._abortControllers = new Map();
    this._destroyed = false;
    this._createdIndicator = false;

    // DOM references
    this.tabList = null;
    this.indicatorEl = null;

    // Bound listeners for cleanup
    this._onTriggerClick = this._handleTriggerClick.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
    this._onResize = this._handleResize.bind(this);
    this._onLocationChange = this._handleLocationChange.bind(this);

    // Initialize DOM & Events
    this._discoverDOM();
    this._setupIndicator();
    this._bindEvents();

    // Register instance
    CGETabs.instances.set(this.element, this);
    if (this.element.id) {
      CGETabs.instances.set(this.element.id, this);
    }

    // Determine and activate initial tab; Back without URL state returns to the non-URL initial tab.
    this._initialTabId = this._resolveInitialTab({ url: false });
    const urlTabId = this._urlTab();
    const initialTabId = urlTabId || this._nestedUrlTab() || this._initialTabId;
    if (initialTabId) {
      this.show(initialTabId, { focus: false, updateHistory: false });
    }
    if (urlTabId) this._revealInParents();
    this.element.setAttribute('data-cge-tabs-ready', 'true');
  }

  // =========================================================================
  // Static Helper & Factory Methods
  // =========================================================================

  /**
   * Retrieves an existing CGETabs instance by DOM element or ID.
   * @param {string | HTMLElement} elementOrId
   * @returns {CGETabs | null}
   */
  static get(elementOrId) {
    return registeredInstance(CGETabs.instances, elementOrId) || null;
  }

  /**
   * Destroys every instance whose element is inside root or no longer connected
   * (Livewire morph / wire:navigate, Turbo visits, innerHTML swaps).
   * @param {HTMLElement | Document} [root=document]
   * @returns {CGETabs[]}
   */
  static destroyAll(root = document) {
    return [...new Set(destroyInstances(CGETabs.instances, root, (key, instance) => instance.element))];
  }

  /**
   * Registers the initializer used for nested plugins inside loaded AJAX panels.
   * `tailtools/auto` registers initTailTools automatically; ESM users can pass their own.
   * @param {((panel: HTMLElement, tabId: string, instance: CGETabs) => void) | null} initializer
   * @param {((panel: HTMLElement, instance: CGETabs) => void) | null} [destroyer=null]
   */
  static setPanelInitializer(initializer, destroyer = null) {
    CGETabs._panelInitializer = typeof initializer === 'function' ? initializer : null;
    CGETabs._panelDestroyer = typeof destroyer === 'function' ? destroyer : null;
  }

  /**
   * Initializes declarative tabs elements.
   * Can accept (root), (selector, options), or (selector, options, root).
   *
   * @param {string | HTMLElement | Document} [selectorOrRoot='[data-cge-tabs]']
   * @param {Object} [options={}]
   * @param {HTMLElement | Document} [root=document]
   * @returns {CGETabs[]}
   */
  static init(selectorOrRoot = '[data-cge-tabs]', options = {}, root = document) {
    let selector = '[data-cge-tabs]';
    let queryRoot = root;
    let config = options;

    if (selectorOrRoot instanceof HTMLElement || selectorOrRoot instanceof Document) {
      queryRoot = selectorOrRoot;
      selector = '[data-cge-tabs]';
    } else if (typeof selectorOrRoot === 'string') {
      selector = selectorOrRoot;
    }

    const elements = Array.from(queryRoot.querySelectorAll(selector));
    // Also include queryRoot if it itself matches the selector
    if (queryRoot instanceof HTMLElement && queryRoot.matches(selector) && !elements.includes(queryRoot)) {
      elements.unshift(queryRoot);
    }

    // Drop instances whose markup was removed, then rebuild ones whose attributes were morphed away.
    pruneInstances(CGETabs.instances, (key, instance) => instance.element);
    return elements.map(el => {
      const existing = CGETabs.instances.get(el);
      if (existing && !existing._isStale()) return existing;
      if (existing) existing._discard();
      return new CGETabs(el, existing ? { ...existing._userOptions, ...config } : config);
    });
  }

  /**
   * True when server-side morphing (e.g. Livewire) stripped plugin attributes or replaced owned nodes.
   * @private
   */
  _isStale() {
    if (this._destroyed || !this.element.isConnected || this.element.getAttribute('data-cge-tabs-ready') !== 'true') return true;
    if (this.tabs.some(tab => !this.element.contains(tab.trigger) || tab.trigger.getAttribute('role') !== 'tab' ||
      (tab.panel && !this.element.contains(tab.panel)))) return true;
    const owns = node => ownsNode(this.element, node, OWNED_TAB, CGETabs.instances);
    const ids = new Set(Array.from(this.element.querySelectorAll('[data-cge-tab]')).filter(owns)
      .map(trigger => trigger.getAttribute('data-cge-tab')).filter(Boolean));
    return ids.size !== this.tabs.length || this.tabs.some(tab => !ids.has(tab.id));
  }

  /**
   * Tears down listeners without restoring attributes the server has already replaced.
   * @private
   */
  _discard() {
    this._skipRestore = true;
    this.destroy();
  }

  // =========================================================================
  // Options Resolution
  // =========================================================================

  /**
   * Merges defaults, data-cge-* attributes, and explicit JS options.
   * @private
   */
  _resolveOptions(userOptions) {
    const ds = this.element.dataset;
    let jsonOptions = {};

    if (ds.cgeTabs && ds.cgeTabs.trim().startsWith('{')) {
      try {
        jsonOptions = JSON.parse(ds.cgeTabs);
      } catch (e) {
        console.warn('[CGETabs] Failed to parse JSON in data-cge-tabs attribute:', e);
      }
    }

    const dataAttrOptions = {};
    if (ds.cgeUrlSync !== undefined) {
      dataAttrOptions.urlSync = ds.cgeUrlSync === 'false' ? false : ds.cgeUrlSync;
    }
    if (ds.cgeHashKey) dataAttrOptions.hashKey = ds.cgeHashKey;
    if (ds.cgeQueryParamKey) dataAttrOptions.queryParamKey = ds.cgeQueryParamKey;
    if (ds.cgeHistoryMode) dataAttrOptions.historyMode = ds.cgeHistoryMode;
    if (ds.cgeStorage !== undefined) {
      dataAttrOptions.storage = ds.cgeStorage === 'false' ? false : ds.cgeStorage;
    }
    if (ds.cgeStorageKey) dataAttrOptions.storageKey = ds.cgeStorageKey;
    if (ds.cgeDefaultTab) dataAttrOptions.defaultTab = ds.cgeDefaultTab;
    if (ds.cgeOrientation) dataAttrOptions.orientation = ds.cgeOrientation;
    if (ds.cgeIndicator !== undefined) {
      if (ds.cgeIndicator === 'false') dataAttrOptions.indicator = false;
      else if (ds.cgeIndicator === 'pill' || ds.cgeIndicator === 'line') dataAttrOptions.indicator = ds.cgeIndicator;
      else dataAttrOptions.indicator = true;
    }
    if (ds.cgeCacheAjax !== undefined) dataAttrOptions.cacheAjax = ds.cgeCacheAjax !== 'false';
    if (ds.cgeAjaxDriver) dataAttrOptions.ajaxDriver = ds.cgeAjaxDriver;
    if (ds.cgeManual !== undefined) dataAttrOptions.manual = ds.cgeManual === 'true';
    if (ds.cgeTransition !== undefined) dataAttrOptions.transition = ds.cgeTransition !== 'false';
    if (ds.cgeAnimationIn) dataAttrOptions.animationIn = ds.cgeAnimationIn;

    // Base layout classes remain consumer-owned unless explicitly configured.
    this._baseUI = { ...(jsonOptions.ui || {}), ...(userOptions.ui || {}) };
    return {
      ...CGETabs.defaults,
      ...jsonOptions,
      ...dataAttrOptions,
      ...userOptions,
      ui: {
        ...CGETabs.defaults.ui,
        ...(jsonOptions.ui || {}),
        ...(userOptions.ui || {})
      },
      translations: {
        ...CGETabs.defaults.translations,
        ...(jsonOptions.translations || {}),
        ...(userOptions.translations || {})
      }
    };
  }

  // =========================================================================
  // DOM Discovery & ARIA Attributes
  // =========================================================================

  /**
   * Scans container to find tab triggers, panels, and tablist, ignoring nested tabs.
   * Injects necessary WAI-ARIA roles and IDs.
   * @private
   */
  _discoverDOM() {
    const owns = node => ownsNode(this.element, node, OWNED_TAB, CGETabs.instances);
    // Locate or identify tablist
    this.tabList = Array.from(this.element.querySelectorAll('[role="tablist"], [data-cge-tablist]')).find(owns) ||
                   this.element.firstElementChild;

    if (this.tabList) {
      this._restorers.push(captureAttributes(this.tabList));
      this._applyClasses(this.tabList, this._baseUI.tabList);
      if (this.options.orientation === 'horizontal' && getComputedStyle(this.tabList).overflowX === 'visible') {
        this.tabList.style.overflowX = 'auto';
      }
      this.tabList.setAttribute('role', 'tablist');
      this.tabList.setAttribute('aria-orientation', this.options.orientation);
    }

    // Find all triggers belonging directly to this tabs instance (exclude nested [data-cge-tabs])
    const allTriggers = Array.from(this.element.querySelectorAll('[data-cge-tab]'));
    const triggers = allTriggers.filter(owns);

    // Find all panels belonging directly to this tabs instance
    const allPanels = Array.from(this.element.querySelectorAll('[data-cge-panel]'));
    const panels = allPanels.filter(owns);
    const panelContainer = panels[0]?.parentElement;
    if (panelContainer && panels.every(panel => panel.parentElement === panelContainer) && this._baseUI.panelContainer) {
      this._restorers.push(captureAttributes(panelContainer));
      this._applyClasses(panelContainer, this._baseUI.panelContainer);
    }

    this._initialSelected = new Set(triggers.filter(trigger => trigger.getAttribute('aria-selected') === 'true'));
    const seen = new Set();
    this.tabs = triggers.filter(trigger => {
      const id = trigger.getAttribute('data-cge-tab');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).map(trigger => {
      const tabId = trigger.getAttribute('data-cge-tab');
      const panel = panels.find(p => p.getAttribute('data-cge-panel') === tabId) || null;
      this._restorers.push(captureAttributes(trigger, panel));
      this._applyClasses(trigger, this._baseUI.tab);
      if (trigger.tagName === 'BUTTON' && !trigger.hasAttribute('type')) trigger.type = 'button';

      // Assign IDs for ARIA linkage
      if (!trigger.id) {
        trigger.id = `${this.id}-tab-${tabId}`;
      }
      if (panel && !panel.id) {
        panel.id = `${this.id}-panel-${tabId}`;
      }

      // Trigger ARIA
      trigger.setAttribute('role', 'tab');
      trigger.setAttribute('aria-selected', 'false');
      trigger.setAttribute('tabindex', '-1');
      if (panel) {
        trigger.setAttribute('aria-controls', panel.id);
      }

      // Panel ARIA
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', trigger.id);
        panel.setAttribute('tabindex', '0');
        // Initial hidden state
        panel.setAttribute('hidden', '');
      }

      return {
        id: tabId,
        trigger,
        panel
      };
    });
  }

  /**
   * Configures dynamic sliding indicator if enabled.
   * @private
   */
  _setupIndicator() {
    if (!this.options.indicator || !this.tabList) return;

    if (this.tabList instanceof HTMLElement) {
      const computedPos = window.getComputedStyle ? window.getComputedStyle(this.tabList).position : '';
      if (!computedPos || computedPos === 'static') {
        this.tabList.style.position = 'relative';
      }
    }

    let indicator = this.tabList.querySelector('[data-cge-tabs-indicator], .cge-tabs-indicator, [data-cge-indicator]');
    if (indicator) this._restorers.push(captureAttributes(indicator));
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.setAttribute('data-cge-tabs-indicator', '');
      indicator.classList.add('cge-tabs-indicator');
      indicator.setAttribute('aria-hidden', 'true');

      // Base classes
      const indicatorClass = this.options.ui.indicator || '';
      if (indicatorClass) {
        indicator.className = 'cge-tabs-indicator ' + indicatorClass;
      }
      this.tabList.appendChild(indicator);
      this._createdIndicator = true;
    }

    this.indicatorEl = indicator;

    // Set up ResizeObserver on tablist for responsive alignment
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        if (!this._destroyed) {
          this.updateIndicator();
        }
      });
      this._resizeObserver.observe(this.tabList);
    }
  }

  // =========================================================================
  // Event Binding
  // =========================================================================

  /**
   * Binds click, keydown, resize, and history synchronization listeners.
   * @private
   */
  _bindEvents() {
    this.element.addEventListener('click', this._onTriggerClick);

    if (this.tabList) {
      this.tabList.addEventListener('keydown', this._onKeydown);
    }

    window.addEventListener('resize', this._onResize);

    if (this.options.urlSync === 'hash') {
      window.addEventListener('hashchange', this._onLocationChange);
      window.addEventListener('popstate', this._onLocationChange);
    } else if (this.options.urlSync === 'query') {
      window.addEventListener('popstate', this._onLocationChange);
    }
  }

  /**
   * Handles click events on tab triggers via delegation.
   * @private
   */
  _handleTriggerClick(e) {
    if (this._destroyed) return;
    const retry = e.target.closest('[data-cge-tab-retry]');
    if (retry && this.tabs.some(tab => tab.id === retry.dataset.cgeTabRetry && tab.panel?.contains(retry))) {
      e.preventDefault();
      this.loadAjaxTab(retry.dataset.cgeTabRetry, true);
      return;
    }
    const trigger = e.target.closest('[data-cge-tab]');
    if (!trigger || !this.tabs.some(tab => tab.trigger === trigger)) return;

    e.preventDefault();
    const tabId = trigger.getAttribute('data-cge-tab');
    if (tabId && !this._isTabDisabled(tabId)) {
      this.show(tabId, { focus: true });
    }
  }

  /**
   * WAI-ARIA keyboard navigation handler.
   * Supports Arrow keys, Home, End, Enter, Space.
   * @private
   */
  _handleKeydown(e) {
    if (this._destroyed || hasCommandModifier(e)) return;
    const isVertical = this.options.orientation === 'vertical';
    // Right-to-left layouts mirror the horizontal arrow keys.
    const rtl = !isVertical && isRtl(this.tabList || this.element);
    const nextKey = isVertical ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');
    const prevKey = isVertical ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');

    const activeEl = document.activeElement;
    const isTriggerFocused = this.tabs.some(tab => tab.trigger === activeEl);
    if (!isTriggerFocused) return;

    const availableTabs = this.tabs.filter(t => !this._isTabDisabled(t.id));
    if (!availableTabs.length) return;

    const currentTabId = activeEl.getAttribute('data-cge-tab');
    const currentIdx = availableTabs.findIndex(t => t.id === currentTabId);

    let targetTab = null;

    if (e.key === nextKey) {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % availableTabs.length;
      targetTab = availableTabs[nextIdx];
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prevIdx = (currentIdx - 1 + availableTabs.length) % availableTabs.length;
      targetTab = availableTabs[prevIdx];
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetTab = availableTabs[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      targetTab = availableTabs[availableTabs.length - 1];
    } else if ((this.options.manual || activeEl.tagName !== 'BUTTON') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (currentTabId && !this._isTabDisabled(currentTabId)) {
        this.show(currentTabId, { focus: true });
      }
      return;
    }

    if (targetTab) {
      if (this.options.manual) {
        this._focusTrigger(targetTab.trigger);
      } else {
        this.show(targetTab.id, { focus: true });
      }
    }
  }

  /**
   * Window resize handler.
   * @private
   */
  _handleResize() {
    this.updateIndicator();
  }

  _focusTrigger(trigger) {
    trigger.focus();
    if (!this.tabList) return;
    const list = this.tabList.getBoundingClientRect();
    const tab = trigger.getBoundingClientRect();
    const vertical = this.options.orientation === 'vertical';
    const size = vertical ? this.tabList.clientHeight : this.tabList.clientWidth;
    if (!size) return;
    const start = vertical ? list.top + this.tabList.clientTop : list.left + this.tabList.clientLeft;
    const leading = vertical ? tab.top : tab.left;
    const trailing = vertical ? tab.bottom : tab.right;
    const delta = trailing > start + size ? trailing - start - size : Math.min(0, leading - start);
    if (delta) this.tabList.scrollBy({ [vertical ? 'top' : 'left']: delta, behavior: 'instant' });
    this.updateIndicator();
  }

  /**
   * Browser navigation (popstate/hashchange) handler.
   * @private
   */
  _handleLocationChange() {
    if (this._destroyed) return;
    const urlTabId = this._urlTab();
    if (urlTabId) {
      if (urlTabId !== this.activeTabId) this.show(urlTabId, { focus: false, updateHistory: false });
      this._revealInParents();
      return;
    }
    const nestedTabId = this._nestedUrlTab();
    if (nestedTabId) {
      if (nestedTabId !== this.activeTabId) this.show(nestedTabId, { focus: false, updateHistory: false });
      return;
    }
    // Back/Forward to an entry without this group's state returns to the initial tab.
    if (this.options.historyMode === 'push') {
      const fallback = this._initialTabId && !this._isTabDisabled(this._initialTabId)
        ? this._initialTabId
        : this.tabs.find(tab => !this._isTabDisabled(tab.id))?.id;
      if (fallback && fallback !== this.activeTabId) this.show(fallback, { focus: false, updateHistory: false });
    }
  }

  /**
   * Valid, enabled tab requested by the current URL for this group.
   * @private
   * @returns {string | null}
   */
  _urlTab() {
    const urlTab = this._readUrlState();
    return urlTab && this.getTab(urlTab) && !this._isTabDisabled(urlTab) ? urlTab : null;
  }

  /**
   * Own tab whose panel contains a nested tab group (or tab) deep-linked by the hash.
   * Lets the outer group open the right panel even when it initializes first.
   * @private
   * @returns {string | null}
   */
  _nestedUrlTab() {
    if (this.options.urlSync !== 'hash' || typeof window === 'undefined') return null;
    const { entries, plain } = parseHashState(window.location.hash);
    const targets = [];
    const registered = [...new Set(CGETabs.instances.values())];
    for (const key of entries.keys()) {
      if (key === this._hashKey) continue;
      const owner = registered.find(instance => instance !== this && instance._hashKey === key);
      const target = owner?.element || document.getElementById(key) ||
        Array.from(document.querySelectorAll('[data-cge-hash-key]')).find(node => node.getAttribute('data-cge-hash-key') === key);
      if (target) targets.push(target);
    }
    if (plain) {
      targets.push(...Array.from(this.element.querySelectorAll('[data-cge-tab]')).filter(node => node.getAttribute('data-cge-tab') === plain));
    }
    if (!targets.length) return null;
    const tab = this.tabs.find(item => item.panel && !this._isTabDisabled(item.id) &&
      targets.some(target => target !== item.panel && item.panel.contains(target)));
    return tab ? tab.id : null;
  }

  /**
   * Activates the parent tab panels that contain this group (deep link into nested tabs).
   * Parents with their own URL state keep it.
   * @private
   */
  _revealInParents() {
    const owners = [...new Set(CGETabs.instances.values())];
    for (let panel = this.element.parentElement?.closest('[data-cge-panel]'); panel; panel = panel.parentElement?.closest('[data-cge-panel]')) {
      const owner = owners.find(instance => instance !== this && !instance._destroyed && instance.tabs.some(tab => tab.panel === panel));
      if (!owner || owner._urlTab()) continue;
      const tab = owner.tabs.find(item => item.panel === panel);
      if (tab && owner.activeTabId !== tab.id) owner.show(tab.id, { focus: false, updateHistory: false });
    }
  }

  // =========================================================================
  // State & Deep Linking Helpers
  // =========================================================================

  /**
   * Resolves which tab should be activated initially on page load.
   * @private
   * @returns {string | null}
   */
  _resolveInitialTab({ url = true } = {}) {
    // 1. URL state (hash or query)
    const urlTab = url ? this._urlTab() : null;
    if (urlTab) {
      return urlTab;
    }

    // 2. Storage persistence
    if (this.options.storage) {
      const storageKey = this.options.storageKey || `cge-tabs-${this.id}`;
      try {
        const storedTab = window[this.options.storage]?.getItem(storageKey);
        if (storedTab && this.getTab(storedTab) && !this._isTabDisabled(storedTab)) {
          return storedTab;
        }
      } catch (e) {
        // Storage might be blocked or restricted
      }
    }

    // 3. Explicit defaultTab option
    if (this.options.defaultTab && this.getTab(this.options.defaultTab) && !this._isTabDisabled(this.options.defaultTab)) {
      return this.options.defaultTab;
    }

    // 4. Pre-marked active trigger in DOM
    const activeTrigger = this.tabs.find(t => {
      const hasClass = t.trigger.classList.contains('active') || t.trigger.classList.contains('cge-tab-active');
      const hasAria = this._initialSelected.has(t.trigger);
      return (hasClass || hasAria) && !this._isTabDisabled(t.id);
    });
    if (activeTrigger) {
      return activeTrigger.id;
    }

    // 5. First available non-disabled tab
    const firstAvailable = this.tabs.find(t => !this._isTabDisabled(t.id));
    return firstAvailable ? firstAvailable.id : null;
  }

  /**
   * Reads active tab ID from current URL based on urlSync configuration.
   * @private
   * @returns {string | null}
   */
  _readUrlState() {
    if (typeof window === 'undefined') return null;

    if (this.options.urlSync === 'hash') {
      // Namespaced "#group=tab&other=tab" wins; a legacy plain "#tab" still matches own tabs.
      const { entries, plain } = parseHashState(window.location.hash);
      if (entries.has(this._hashKey)) return entries.get(this._hashKey) || null;
      return plain && this.getTab(plain) ? plain : null;
    }

    if (this.options.urlSync === 'query') {
      const params = new URLSearchParams(window.location.search);
      const val = params.get(this.options.queryParamKey || 'tab');
      return val ? val.trim() : null;
    }

    return null;
  }

  /**
   * Writes active tab state to URL and/or storage.
   * @private
   * @param {string} tabId
   */
  _syncState(tabId) {
    if (typeof window === 'undefined') return;

    // Synchronize to URL
    if (this.options.urlSync === 'hash') {
      // Only this group's entry changes, so sibling and nested groups keep their state.
      const targetHash = updateHashState(window.location.hash, this._hashKey, tabId);
      if (window.location.hash !== targetHash) {
        const method = this.options.historyMode === 'push' ? 'pushState' : 'replaceState';
        try {
          window.history[method](window.history.state, '', targetHash);
        } catch (e) {}
      }
    } else if (this.options.urlSync === 'query') {
      const url = new URL(window.location.href);
      const key = this.options.queryParamKey || 'tab';
      if (url.searchParams.get(key) !== tabId) {
        url.searchParams.set(key, tabId);
        const method = this.options.historyMode === 'push' ? 'pushState' : 'replaceState';
        try {
          window.history[method](window.history.state, '', url.toString());
        } catch (e) {}
      }
    }

    // Synchronize to storage
    if (this.options.storage) {
      const storageKey = this.options.storageKey || `cge-tabs-${this.id}`;
      try {
        window[this.options.storage]?.setItem(storageKey, tabId);
      } catch (e) {}
    }
  }

  /**
   * Checks if a tab is disabled.
   * @private
   * @param {string} tabId
   * @returns {boolean}
   */
  _isTabDisabled(tabId) {
    const tab = this.getTab(tabId);
    if (!tab) return true;
    return tab.hasAttribute('disabled') ||
           tab.getAttribute('data-cge-disabled') === 'true' ||
           tab.getAttribute('aria-disabled') === 'true';
  }

  // =========================================================================
  // Public Programmatic API
  // =========================================================================

  /**
   * Activates a tab by ID.
   *
   * @param {string} tabId
   * @param {Object} [options={}]
   * @param {boolean} [options.focus=false] - If true, focuses the tab trigger
   * @param {boolean} [options.updateHistory=true] - If false, skips updating browser history
   * @returns {boolean} True if tab was shown, false if cancelled or invalid
   */
  show(tabId, options = {}) {
    if (this._destroyed) return false;

    const targetTab = this.tabs.find(t => t.id === tabId);
    if (!targetTab || this._isTabDisabled(tabId)) {
      return false;
    }

    const previousTabId = this.activeTabId;
    if (previousTabId === tabId) {
      if (options.focus) this._focusTrigger(targetTab.trigger);
      if (options.updateHistory !== false) this._syncState(tabId);
      return true;
    }

    // Dispatch cancelable cge:tabs:show event
    const showEvent = this._emit('cge:tabs:show', {
      tabId,
      previousTabId,
      panel: targetTab.panel,
      trigger: targetTab.trigger,
      instance: this
    }, true);

    if (showEvent.defaultPrevented || this._destroyed || this.activeTabId !== previousTabId) {
      return false;
    }

    // Call instance onShow hook
    if (typeof this.options.onShow === 'function') {
      this.options.onShow(tabId, targetTab.panel, targetTab.trigger);
    }
    if (this._destroyed || this.activeTabId !== previousTabId) return false;

    // Update active tab ID
    this.activeTabId = tabId;

    // 1. Update all triggers
    this.tabs.forEach(t => {
      const isActive = t.id === tabId;
      const isDisabled = this._isTabDisabled(t.id);

      t.trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.trigger.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive) {
        t.trigger.classList.add('active', 'cge-tab-active');
        this._applyClasses(t.trigger, this.options.ui.activeTab, this.options.ui.inactiveTab);
      } else {
        t.trigger.classList.remove('active', 'cge-tab-active');
        this._applyClasses(t.trigger, this.options.ui.inactiveTab, this.options.ui.activeTab);
      }

      this._syncDisabledClasses(t.trigger, isDisabled);
    });

    // 2. Update panels
    this.tabs.forEach(t => {
      if (!t.panel) return;
      const isActive = t.id === tabId;

      if (isActive) {
        t.panel.removeAttribute('hidden');
        this._applyClasses(t.panel, this.options.ui.activePanel, this.options.ui.panel);

        // Apply transition animation if enabled
        if (this.options.transition && this.options.animationIn && !prefersReducedMotion()) {
          const animClasses = this.options.animationIn.split(/\s+/).filter(Boolean);
          t.panel.classList.remove(...animClasses);
          // Reflow to restart CSS animation
          void t.panel.offsetWidth;
          t.panel.classList.add(...animClasses);
        }
      } else {
        t.panel.setAttribute('hidden', '');
        this._applyClasses(t.panel, this.options.ui.panel, this.options.ui.activePanel);
      }
    });

    // 3. Update sliding indicator
    this.updateIndicator();

    // 4. Focus trigger if requested
    if (options.focus) {
      this._focusTrigger(targetTab.trigger);
    }

    // 5. Update history & storage
    if (options.updateHistory !== false) {
      this._syncState(tabId);
    }

    // 6. Handle Ajax lazy loading
    if (targetTab.panel) {
      const hasAjax = targetTab.trigger.hasAttribute('data-cge-ajax') || Boolean(this.options.ajaxTabs?.[tabId]);
      if (hasAjax) {
        this._loadAjaxContent(tabId, targetTab.panel, targetTab.trigger);
      }
    }

    // 7. Dispatch shown event and instance hook
    this._emit('cge:tabs:shown', {
      tabId,
      previousTabId,
      panel: targetTab.panel,
      trigger: targetTab.trigger,
      instance: this
    });

    if (typeof this.options.onShown === 'function') {
      this.options.onShown(tabId, targetTab.panel, targetTab.trigger);
    }

    return true;
  }

  /**
   * Adds disabled classes to disabled triggers and removes only the classes the plugin added
   * once a trigger is enabled again.
   * @private
   */
  _syncDisabledClasses(trigger, isDisabled) {
    if (isDisabled && !this._disabledStyled.has(trigger)) {
      const classes = (this.options.ui.disabledTab || '').split(/\s+/).filter(Boolean);
      const added = classes.filter(name => !trigger.classList.contains(name));
      if (added.length) trigger.classList.add(...added);
      this._disabledStyled.set(trigger, added);
    } else if (!isDisabled && this._disabledStyled.has(trigger)) {
      const added = this._disabledStyled.get(trigger);
      if (added.length) trigger.classList.remove(...added);
      this._disabledStyled.delete(trigger);
    }
  }

  /**
   * Activates the next available tab.
   * @returns {boolean}
   */
  next() {
    const availableTabs = this.tabs.filter(t => !this._isTabDisabled(t.id));
    if (!availableTabs.length) return false;
    const currentIdx = availableTabs.findIndex(t => t.id === this.activeTabId);
    const nextIdx = (currentIdx + 1) % availableTabs.length;
    return this.show(availableTabs[nextIdx].id, { focus: true });
  }

  /**
   * Activates the previous available tab.
   * @returns {boolean}
   */
  prev() {
    const availableTabs = this.tabs.filter(t => !this._isTabDisabled(t.id));
    if (!availableTabs.length) return false;
    const currentIdx = availableTabs.findIndex(t => t.id === this.activeTabId);
    const prevIdx = (currentIdx - 1 + availableTabs.length) % availableTabs.length;
    return this.show(availableTabs[prevIdx].id, { focus: true });
  }

  /**
   * Activates the first available tab.
   * @returns {boolean}
   */
  first() {
    const first = this.tabs.find(t => !this._isTabDisabled(t.id));
    return first ? this.show(first.id, { focus: true }) : false;
  }

  /**
   * Activates the last available tab.
   * @returns {boolean}
   */
  last() {
    const available = this.tabs.filter(t => !this._isTabDisabled(t.id));
    return available.length ? this.show(available[available.length - 1].id, { focus: true }) : false;
  }

  /**
   * Returns current active tab identifier.
   * @returns {string | null}
   */
  getActiveTab() {
    return this.activeTabId;
  }

  /**
   * Returns trigger element for a specific tab.
   * @param {string} tabId
   * @returns {HTMLElement | null}
   */
  getTab(tabId) {
    const found = this.tabs.find(t => t.id === tabId);
    return found ? found.trigger : null;
  }

  /**
   * Returns panel element for a specific tab.
   * @param {string} tabId
   * @returns {HTMLElement | null}
   */
  getPanel(tabId) {
    const found = this.tabs.find(t => t.id === tabId);
    return found ? found.panel : null;
  }

  /**
   * Recalculates and animates dynamic indicator position and dimension.
   */
  updateIndicator() {
    if (this._destroyed || !this.indicatorEl || !this.tabList) return;

    const activeTrigger = this.getTab(this.activeTabId);
    if (!activeTrigger || activeTrigger.offsetParent === null) {
      this.indicatorEl.style.opacity = '0';
      return;
    }

    const isVertical = this.options.orientation === 'vertical';
    const isPill = this.options.indicator === 'pill';

    const tabListRect = this.tabList.getBoundingClientRect();
    const triggerRect = activeTrigger.getBoundingClientRect();

    const left = triggerRect.left - tabListRect.left + this.tabList.scrollLeft;
    const top = triggerRect.top - tabListRect.top + this.tabList.scrollTop;
    const width = triggerRect.width;
    const height = triggerRect.height;

    this.indicatorEl.style.opacity = '1';

    if (isVertical) {
      this.indicatorEl.style.top = `${top}px`;
      this.indicatorEl.style.height = `${height}px`;
      if (!isPill) {
        this.indicatorEl.style.width = '2px';
        this.indicatorEl.style.left = '';
        this.indicatorEl.style.right = '0px';
      } else {
        this.indicatorEl.style.left = `${left}px`;
        this.indicatorEl.style.width = `${width}px`;
      }
    } else {
      this.indicatorEl.style.left = `${left}px`;
      this.indicatorEl.style.width = `${width}px`;
      if (isPill) {
        this.indicatorEl.style.top = `${top}px`;
        this.indicatorEl.style.height = `${height}px`;
        this.indicatorEl.style.bottom = '';
      } else {
        this.indicatorEl.style.bottom = '0px';
        this.indicatorEl.style.top = '';
        this.indicatorEl.style.height = '2px';
      }
    }
  }

  /**
   * Loads remote HTML content into an Ajax tab panel.
   *
   * @param {string} tabId
   * @param {boolean} [force=false] - If true, bypasses in-memory cache
   * @returns {Promise<void>}
   */
  async loadAjaxTab(tabId, force = false) {
    if (this._destroyed) return;
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || !tab.panel) return;
    await this._loadAjaxContent(tabId, tab.panel, tab.trigger, force);
  }

  // =========================================================================
  // Ajax Loading Engine
  // =========================================================================

  /**
   * Internal lazy loader for tab panels.
   * @private
   */
  async _loadAjaxContent(tabId, panelEl, triggerEl, force = false) {
    if (this._destroyed) return;
    if (!force && this._ajaxLoaded.has(tabId) && this.options.cacheAjax) {
      return;
    }

    const endpoint = triggerEl?.getAttribute('data-cge-ajax') || this.options.ajaxTabs?.[tabId];
    if (!endpoint) return;

    const url = typeof endpoint === 'string' ? endpoint : endpoint.url;
    const method = (typeof endpoint === 'object' && endpoint.method) || triggerEl?.getAttribute('data-cge-ajax-method') || 'GET';
    const driver = (typeof endpoint === 'object' && endpoint.driver) || triggerEl?.getAttribute('data-cge-ajax-driver') || this.options.ajaxDriver;

    // Abort prior in-flight request for this specific tab if ongoing
    if (this._abortControllers.has(tabId)) {
      this._abortControllers.get(tabId).abort();
      this._abortControllers.delete(tabId);
    }

    const controller = new AbortController();
    this._abortControllers.set(tabId, controller);
    if (!this._originalContent.has(panelEl)) this._originalContent.set(panelEl, Array.from(panelEl.childNodes));
    this._destroyPanelPlugins(panelEl);
    panelEl.setAttribute('aria-busy', 'true');
    panelEl.removeAttribute('data-cge-ajax-loaded');
    this._ajaxLoaded.delete(tabId);

    // Render loading indicator inside panel
    panelEl.innerHTML = `
      <div class="${escapeHTML(this.options.ui.loadingContainer)}" role="status">
        <svg class="animate-spin w-6 h-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-xs font-medium">${escapeHTML(this._t('loading'))}</span>
      </div>
    `;

    this._emit('cge:tabs:ajax-start', { tabId, panel: panelEl, instance: this });
    if (typeof this.options.onAjaxStart === 'function') {
      this.options.onAjaxStart(tabId, panelEl);
    }
    if (this._destroyed || controller.signal.aborted) return;

    try {
      const html = await this._requestPanel(url, method, driver, controller.signal);
      if (this._destroyed || controller.signal.aborted || this._abortControllers.get(tabId) !== controller) return;

      // Optional sanitizer (e.g. DOMPurify) runs on every response before it reaches the DOM.
      const content = typeof this.options.sanitize === 'function' ? this.options.sanitize(html, tabId) : html;
      if (this._destroyed || controller.signal.aborted || this._abortControllers.get(tabId) !== controller) return;
      setContent(panelEl, content ?? '', true);
      const response = typeof content === 'string' ? content : panelEl.innerHTML;
      panelEl.setAttribute('data-cge-ajax-loaded', 'true');
      this._ajaxLoaded.add(tabId);
      panelEl.removeAttribute('aria-busy');

      // Auto-lifecycle bridge for nested plugins
      this._bridgeLifecycle(panelEl, tabId);
      if (this._destroyed || controller.signal.aborted || this._abortControllers.get(tabId) !== controller) return;
      this._abortControllers.delete(tabId);

      this._emit('cge:tabs:ajax-loaded', { tabId, panel: panelEl, response, instance: this });
      if (typeof this.options.onAjaxLoaded === 'function') {
        this.options.onAjaxLoaded(tabId, panelEl, response);
      }
    } catch (error) {
      if (controller.signal.aborted || this._destroyed || this._abortControllers.get(tabId) !== controller) return;
      this._abortControllers.delete(tabId);
      panelEl.removeAttribute('aria-busy');
      panelEl.removeAttribute('data-cge-ajax-loaded');
      this._ajaxLoaded.delete(tabId);
      this._destroyPanelPlugins(panelEl);

      panelEl.innerHTML = `
        <div class="${escapeHTML(this.options.ui.errorContainer)}" role="alert">
          <p class="text-sm font-medium">${escapeHTML(this._t('ajax-error'))}</p>
          <button type="button" data-cge-tab-retry="${escapeHTML(tabId)}" class="cge-tabs-retry-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>${escapeHTML(this._t('retry'))}</span>
          </button>
        </div>
      `;

      this._emit('cge:tabs:ajax-error', { tabId, error, instance: this });
      if (typeof this.options.onAjaxError === 'function') {
        this.options.onAjaxError(tabId, error);
      }
    }
  }

  /**
   * Requests panel markup with Laravel headers (CSRF for unsafe methods) and returns HTML only.
   * JSON is accepted solely as `{ html: string }`; anything else becomes an error state.
   * @private
   * @returns {Promise<string>}
   */
  async _requestPanel(url, method, driver, signal) {
    const headers = laravelHeaders(this.options.ajaxHeaders, {
      accept: 'text/html, application/json;q=0.9, */*;q=0.8',
      csrf: !isSafeMethod(method)
    });
    const axios = resolveAxios(this.options.axiosInstance);
    if (driver === 'axios' && !axios) {
      throw new Error('[CGETabs] Axios driver requested but no axiosInstance option or window.axios is available');
    }

    if (axios && (driver === 'axios' || driver === 'auto')) {
      let res;
      try {
        // Keep the raw body so the content type decides how it is rendered.
        res = await axios.request({ url, method, headers, signal, responseType: 'text', transformResponse: [data => data] });
      } catch (error) {
        const failed = error?.response;
        if (!failed) throw error;
        const type = this._headerValue(failed.headers, 'content-type');
        throw new HttpError(failed.status, failed.statusText || '', typeof failed.data === 'string' ? parseBody(failed.data, type) : failed.data ?? null);
      }
      return panelHtmlFromResponse(res?.data, this._headerValue(res?.headers, 'content-type'));
    }

    const res = await fetch(url, { method, headers, signal, credentials: 'same-origin' });
    const type = res.headers?.get?.('content-type') || '';
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, res.statusText, parseBody(text, type));
    return panelHtmlFromResponse(text, type);
  }

  /** @private */
  _headerValue(headers, name) {
    if (!headers) return '';
    if (typeof headers.get === 'function') return headers.get(name) || '';
    const key = Object.keys(headers).find(header => header.toLowerCase() === name);
    return key ? String(headers[key] ?? '') : '';
  }

  /**
   * Plugin classes discoverable without a registered initializer: this class plus globals
   * exposed by `tailtools/auto` or a CDN build.
   * @private
   */
  _pluginClasses() {
    const globals = typeof window === 'undefined' ? [] : ['CGETabs', 'CGEAccordion', 'CGECollapse', 'CGEForm', 'CGESelect',
      'CGEModal', 'CGEDrawer', 'CGEDropzone', 'CGEDataTable', 'CGEDataGrid'].map(name =>
      window.TailTools?.[name] || window[name]);
    return [...new Set([CGETabs, ...globals].filter(Boolean))];
  }

  _destroyPanelPlugins(panel) {
    const destroyer = typeof this.options.destroyPanel === 'function' ? this.options.destroyPanel : CGETabs._panelDestroyer;
    if (destroyer) {
      try { destroyer(panel, this); } catch (error) { console.error('[CGETabs] destroyPanel failed:', error); }
    }
    // Discover by DOM node: works for Map and WeakMap registries, including selects.
    const instances = new Set();
    const nodes = [panel, ...panel.querySelectorAll('*')].reverse();
    for (const node of nodes) for (const Plugin of this._pluginClasses()) {
      const instance = Plugin.instances?.get(node);
      if (instance && instance !== this) instances.add(instance);
    }
    for (const instance of instances) instance.destroy?.();
  }

  _bridgeLifecycle(panelEl, tabId) {
    if (this._destroyed) return;
    // Priority: instance option, registered initializer (tailtools/auto), global library, global classes.
    const initializer = typeof this.options.initPanel === 'function' ? this.options.initPanel : CGETabs._panelInitializer;
    if (initializer) {
      initializer(panelEl, tabId, this);
    } else if (window.TailTools?.init) {
      window.TailTools.init(panelEl);
    } else {
      const select = window.TailTools?.CGESelect || window.CGESelect;
      for (const Plugin of this._pluginClasses()) {
        if (Plugin === select) Plugin.init?.('select[data-cge-select]', {}, panelEl);
        else Plugin.init?.(panelEl);
      }
      // These plugins use one document-level delegate, not a root argument.
      window.CGEActionButton?.init?.();
      window.CGELightbox?.init?.();
    }
    document.dispatchEvent(new CustomEvent('cge:tabs:loaded', {
      detail: { tabId, panel: panelEl, instance: this }, bubbles: true
    }));
  }

  // =========================================================================
  // Event Emitter Helpers
  // =========================================================================

  /**
   * Subscribes to an instance event.
   * @param {string} event
   * @param {Function} callback
   * @returns {this}
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return this;
  }

  /**
   * Unsubscribes from an instance event.
   * @param {string} event
   * @param {Function} callback
   * @returns {this}
   */
  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
    return this;
  }

  /**
   * Dispatches both instance callback and native DOM CustomEvent.
   * @private
   */
  _emit(eventName, detail = {}, cancelable = false) {
    // Instance listeners
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach(cb => {
        try { cb(detail); } catch (e) { console.error(e); }
      });
    }

    // Native DOM CustomEvent
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable
    });
    this.element.dispatchEvent(event);
    return event;
  }

  /**
   * Helper to swap CSS classes without colliding.
   * @private
   */
  _applyClasses(element, toAdd, toRemove) {
    if (toRemove) {
      const removeList = toRemove.split(/\s+/).filter(Boolean);
      element.classList.remove(...removeList);
    }
    if (toAdd) {
      const addList = toAdd.split(/\s+/).filter(Boolean);
      element.classList.add(...addList);
    }
  }

  /**
   * Translates a localization key.
   * @private
   */
  _t(key) {
    return this.options.translations?.[key] || CGETabs.defaults.translations[key] || key;
  }

  // =========================================================================
  // Teardown & Destruction
  // =========================================================================

  /**
   * Destroys instance, unbinds all event listeners, aborts pending requests,
   * removes dynamically created indicators, and cleans up registry.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    // Abort active Ajax requests
    this._abortControllers.forEach(controller => controller.abort());
    this._abortControllers.clear();

    // Disconnect ResizeObserver
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    // Remove window listeners
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('hashchange', this._onLocationChange);
    window.removeEventListener('popstate', this._onLocationChange);

    // Remove container listeners
    this.element.removeEventListener('click', this._onTriggerClick);
    if (this.tabList) {
      this.tabList.removeEventListener('keydown', this._onKeydown);
    }

    // Remove created indicator
    if (this._createdIndicator && this.indicatorEl && this.indicatorEl.parentNode) {
      this.indicatorEl.parentNode.removeChild(this.indicatorEl);
    }

    // Clean up instances registry; morphed markup is server-owned and is not restored.
    for (const [panel, children] of this._originalContent) {
      this._destroyPanelPlugins(panel);
      if (!this._skipRestore) panel.replaceChildren(...children);
    }
    this._originalContent.clear();
    this._disabledStyled.clear();
    if (!this._skipRestore) for (const restore of this._restorers.reverse()) restore();
    CGETabs.instances.delete(this.element);
    CGETabs.instances.delete(this.id);

    // Dispatch destroyed event
    this._emit('cge:tabs:destroyed', { instance: this });
    this._listeners.clear();
  }
}
