/**
 * CGEAccordion & CGECollapse - TailTools Plugin
 * Ultra-smooth, accessible accordion and collapsible panel plugin engineered for Tailwind CSS v4.3+ and Laravel Blade.
 * Utilizes modern CSS Grid row transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) to eliminate laggy height/scrollHeight calculations.
 * Features single-expand (exclusive accordion) and multi-expand (independent collapse) modes, URL hash/deep-linking activation,
 * animated chevron/icon rotation, nested hierarchy support, and full WAI-ARIA keyboard navigation.
 *
 * @license MIT
 * @package TailTools
 */

import {
  captureAttributes, ownsNode, readHash, registeredInstance, setPanelAccess, applyDuration,
  hasCommandModifier, nestedInteractive
} from '../shared/navigation.js';
import { prefersReducedMotion, destroyInstances, pruneInstances } from '../shared/dom.js';

const ACCORDION = '[data-cge-accordion], .cge-accordion';
const ACCORDION_TRIGGER = '[data-cge-trigger], .cge-trigger';
const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

export class CGEAccordion {
  /**
   * Active CGEAccordion instances indexed by element and id.
   * @type {Map<HTMLElement | string, CGEAccordion>}
   */
  static instances = new Map();

  /**
   * Default configuration options.
   */
  static defaults = {
    exclusive: true, // boolean: single-expand accordion vs multi-expand
    alwaysOpen: false, // boolean: prevent closing active item if it's the only one open
    defaultOpen: null, // string | string[] | null: item ID or array of IDs to open initially
    urlSync: 'hash', // 'hash' | false
    updateHash: false, // boolean: whether manual toggle updates window.location.hash
    scrollIntoView: false, // boolean: scroll item into view when opened via hash
    storage: false, // 'localStorage' | 'sessionStorage' | false
    storageKey: null, // string | null: defaults to cge_accordion_${id}
    duration: 300, // number: transition duration in ms
    animation: false, // string | false: optional custom tailwind-animation class
    keyboard: true, // boolean: enable arrow key navigation
    onOpen: null, // (itemId, itemEl) => void
    onClose: null, // (itemId, itemEl) => void
    onToggle: null, // (itemId, isOpen, itemEl) => void
    ui: {
      item: 'border-b border-zinc-200 dark:border-zinc-800 transition-colors',
      trigger: 'flex justify-between items-center w-full py-4 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer',
      activeTrigger: 'text-primary-600 dark:text-primary-400 font-semibold',
      icon: 'w-4 h-4 transition-transform duration-300',
      activeIcon: 'rotate-180',
      wrapper: 'grid grid-rows-[0fr] transition-all duration-300 ease-out overflow-hidden',
      activeWrapper: 'grid-rows-[1fr]',
      content: 'overflow-hidden min-h-0 text-sm text-zinc-600 dark:text-zinc-400 py-0',
      activeContent: 'pb-4'
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
      throw new Error('[CGEAccordion] A valid HTMLElement or matching selector is required.');
    }

    if (CGEAccordion.instances.has(element)) {
      return CGEAccordion.instances.get(element);
    }

    this._restorers = [captureAttributes(element)];
    this._frames = new Set();
    this._userOptions = options;
    this.element = element;
    this.id = element.id || `cge-accordion-${++CGEAccordion._counter}`;
    if (!element.id) {
      element.id = this.id;
    }

    this.options = this._resolveOptions(options);

    // State
    this.items = []; // Array of ItemDescriptor
    this.openItemIds = new Set();
    this._listeners = new Map();
    this._destroyed = false;

    // Bound listeners for cleanup
    this._onTriggerClick = this._handleTriggerClick.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
    this._onHashChange = this._handleHashChange.bind(this);

    // Initialize
    this._discoverItems();
    this._bindEvents();
    this._restoreInitialState();

    // Register instance
    CGEAccordion.instances.set(this.element, this);
    CGEAccordion.instances.set(this.id, this);

    // Mark ready on DOM
    this.element.setAttribute('data-cge-accordion-ready', 'true');
  }

  /**
   * Resolves options merging defaults, data-attributes, and user options.
   * @private
   */
  _resolveOptions(userOptions = {}) {
    const dataOpts = {};
    const dataset = this.element.dataset;

    if (dataset.cgeExclusive !== undefined) {
      dataOpts.exclusive = dataset.cgeExclusive !== 'false';
    }
    if (dataset.cgeAlwaysOpen !== undefined) {
      dataOpts.alwaysOpen = dataset.cgeAlwaysOpen === 'true';
    }
    if (dataset.cgeUrlSync !== undefined) {
      dataOpts.urlSync = dataset.cgeUrlSync === 'false' ? false : dataset.cgeUrlSync;
    }
    if (dataset.cgeUpdateHash !== undefined) {
      dataOpts.updateHash = dataset.cgeUpdateHash === 'true';
    }
    if (dataset.cgeScrollIntoView !== undefined) {
      dataOpts.scrollIntoView = dataset.cgeScrollIntoView === 'true';
    }
    if (dataset.cgeStorage !== undefined) {
      dataOpts.storage = dataset.cgeStorage === 'false' ? false : dataset.cgeStorage;
    }
    if (dataset.cgeStorageKey) {
      dataOpts.storageKey = dataset.cgeStorageKey;
    }
    if (dataset.cgeDuration) {
      const dur = parseInt(dataset.cgeDuration, 10);
      if (!isNaN(dur)) dataOpts.duration = dur;
    }
    if (dataset.cgeDefaultOpen) {
      dataOpts.defaultOpen = dataset.cgeDefaultOpen.includes(',')
        ? dataset.cgeDefaultOpen.split(',').map(s => s.trim())
        : dataset.cgeDefaultOpen.trim();
    }
    if (dataset.cgeKeyboard !== undefined) {
      dataOpts.keyboard = dataset.cgeKeyboard !== 'false';
    }

    return {
      ...CGEAccordion.defaults,
      ...dataOpts,
      ...userOptions,
      ui: {
        ...CGEAccordion.defaults.ui,
        ...(userOptions.ui || {})
      }
    };
  }

  /**
   * Discovers direct accordion items, triggers, wrappers, and icons.
   * Scoped to prevent picking up items from nested child accordions.
   * @private
   */
  _discoverItems() {
    this.items = [];
    // Direct items belonging strictly to this accordion container
    const directItemEls = this._ownedItemElements();

    let autoItemIndex = 0;
    for (const itemEl of directItemEls) {
      autoItemIndex++;
      const itemId = itemEl.getAttribute('data-cge-item') ||
        itemEl.id ||
        `item-${autoItemIndex}`;

      // Discover trigger
      const findOwned = selector => Array.from(itemEl.querySelectorAll(selector)).find(node =>
        node.closest('[data-cge-item], .cge-accordion-item') === itemEl &&
        ownsNode(this.element, node, '[data-cge-accordion], .cge-accordion', CGEAccordion.instances));
      let trigger = findOwned('[data-cge-trigger], .cge-trigger');
      if (!trigger) {
        // Fallback: look for direct button or first interactive element
        const buttons = Array.from(itemEl.querySelectorAll('button, [role="button"]'));
        trigger = buttons.find(b => {
          const closestItem = b.closest('[data-cge-item], .cge-accordion-item');
          return closestItem === itemEl;
        });
      }

      // Discover wrapper / body
      let wrapper = findOwned('[data-cge-body], .cge-wrapper, .cge-accordion-wrapper');
      if (!wrapper) {
        // If trigger's parent is an h1-h6, wrapper is next sibling of header
        if (trigger && trigger.parentElement && /^H[1-6]$/i.test(trigger.parentElement.tagName)) {
          wrapper = trigger.parentElement.nextElementSibling;
        } else if (trigger) {
          wrapper = trigger.nextElementSibling;
        }
      }

      // Discover content
      let content = null;
      if (wrapper) {
        content = wrapper.querySelector(':scope > [data-cge-content], :scope > .cge-content') || wrapper.firstElementChild;
      }

      // Discover icon inside trigger or item
      const icon = trigger?.querySelector('[data-cge-icon], [data-cge-accordion-icon], .cge-icon') || null;

      if (trigger && wrapper && !this.items.some(item => item.id === itemId)) {
        this._restorers.push(captureAttributes(itemEl, trigger, wrapper, content, icon));
        applyDuration(wrapper, [icon], this.options.duration);
        if (trigger.tagName === 'BUTTON' && !trigger.hasAttribute('type')) trigger.type = 'button';
        // Generate missing IDs for ARIA linkage
        const triggerId = trigger.id || `cge-acc-trig-${this.id}-${itemId}`;
        const panelId = wrapper.id || `cge-acc-panel-${this.id}-${itemId}`;
        trigger.id = triggerId;
        wrapper.id = panelId;

        // Apply ARIA roles
        if (trigger.tagName.toLowerCase() !== 'button') {
          trigger.setAttribute('role', 'button');
          if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');
        }
        trigger.setAttribute('aria-controls', panelId);
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-labelledby', triggerId);

        // Apply base UI styling classes
        this._applyBaseUI(itemEl, trigger, wrapper, content, icon);

        const isOpen = (itemEl.hasAttribute('data-cge-open') && itemEl.getAttribute('data-cge-open') !== 'false') ||
          itemEl.classList.contains('is-open') ||
          itemEl.classList.contains('open') ||
          trigger.getAttribute('aria-expanded') === 'true';

        const descriptor = {
          id: itemId,
          el: itemEl,
          trigger,
          wrapper,
          content,
          icon,
          isOpen: false
        };

        this.items.push(descriptor);

        if (isOpen) {
          this.openItemIds.add(itemId);
        }
      }
    }
  }

  /**
   * Item elements owned by this container (nested accordions excluded).
   * @private
   */
  _ownedItemElements() {
    return Array.from(this.element.querySelectorAll('[data-cge-item], .cge-accordion-item'))
      .filter(el => ownsNode(this.element, el, ACCORDION, CGEAccordion.instances));
  }

  /**
   * True when server-side morphing (e.g. Livewire) stripped plugin attributes or replaced items.
   * @private
   */
  _isStale() {
    if (this._destroyed || !this.element.isConnected || this.element.getAttribute('data-cge-accordion-ready') !== 'true') return true;
    if (this.items.some(item => !this.element.contains(item.trigger) || !this.element.contains(item.wrapper) ||
      !item.trigger.hasAttribute('aria-expanded') || item.wrapper.getAttribute('role') !== 'region')) return true;
    return this._ownedItemElements().some(el => !this.items.some(item => item.el === el) &&
      el.querySelector(`${ACCORDION_TRIGGER}, button, [role="button"]`));
  }

  /**
   * Tears down listeners without restoring attributes the server has already replaced.
   * @private
   */
  _discard() {
    this._skipRestore = true;
    this.destroy();
  }

  /**
   * Applies headless UI classes to DOM nodes.
   * @private
   */
  _applyBaseUI(itemEl, trigger, wrapper, content, icon) {
    const ui = this.options.ui;

    if (ui.item && !itemEl.className.includes(ui.item)) {
      this._addClasses(itemEl, ui.item);
    }
    if (ui.trigger && !trigger.className.includes(ui.trigger)) {
      this._addClasses(trigger, ui.trigger);
    }
    if (ui.wrapper) {
      if (!wrapper.className.includes('grid-rows-')) {
        this._addClasses(wrapper, ui.wrapper);
      }
      if (!wrapper.classList.contains('overflow-hidden')) {
        wrapper.classList.add('overflow-hidden');
      }
    }
    if (content) {
      if (ui.content) this._addClasses(content, ui.content);
      if (!content.classList.contains('min-h-0')) content.classList.add('min-h-0');
      if (!content.classList.contains('overflow-hidden')) content.classList.add('overflow-hidden');
    }
    if (icon && ui.icon) {
      this._addClasses(icon, ui.icon);
    }
  }

  /**
   * Safely adds whitespace-separated class strings to an element.
   * @private
   */
  _addClasses(el, classes) {
    if (!el || !classes) return;
    const tokens = classes.split(/\s+/).filter(Boolean);
    if (tokens.length) el.classList.add(...tokens);
  }

  /**
   * Safely removes whitespace-separated class strings from an element.
   * @private
   */
  _removeClasses(el, classes) {
    if (!el || !classes) return;
    const tokens = classes.split(/\s+/).filter(Boolean);
    if (tokens.length) el.classList.remove(...tokens);
  }

  /**
   * Attaches event listeners for clicks, keyboard navigation, and URL sync.
   * @private
   */
  _bindEvents() {
    this.element.addEventListener('click', this._onTriggerClick);

    this.element.addEventListener('keydown', this._onKeydown);

    if (this.options.urlSync === 'hash' && typeof window !== 'undefined') {
      window.addEventListener('hashchange', this._onHashChange);
    }
  }

  /**
   * Restores initial open state taking into account URL hash, storage, defaultOpen, and DOM state.
   * @private
   */
  _restoreInitialState() {
    let initialIds = [];
    let storedState = false;

    // 1. URL Hash has highest precedence if urlSync is enabled
    if (this.options.urlSync === 'hash' && typeof window !== 'undefined' && window.location.hash) {
      const hashId = readHash();
      const match = this.items.find(item => item.id === hashId || item.wrapper.id === hashId);
      if (match) {
        initialIds = [match.id];
      }
    }

    // 2. Storage persistence if enabled and no hash match
    if (initialIds.length === 0 && this.options.storage) {
      const stored = this._loadStoredState();
      if (Array.isArray(stored)) {
        initialIds = stored.filter(id => this.items.some(i => i.id === id));
        storedState = true;
      }
    }

    // 3. defaultOpen configuration if provided
    if (initialIds.length === 0 && !storedState && this.options.defaultOpen) {
      const def = this.options.defaultOpen;
      initialIds = Array.isArray(def) ? def : [def];
    }

    // 4. Initial DOM open markup
    if (initialIds.length === 0 && !storedState && this.openItemIds.size > 0) {
      initialIds = Array.from(this.openItemIds);
    }

    initialIds = [...new Set(initialIds)].filter(id => this.items.some(item => item.id === id));
    // Respect exclusive mode: if exclusive, only keep at most 1 item
    if (this.options.exclusive && initialIds.length > 1) {
      initialIds = [initialIds[0]];
    }

    // Enforce alwaysOpen if required and no item is opened
    if (this.options.alwaysOpen && initialIds.length === 0 && this.items.length > 0) {
      initialIds = [this.items[0].id];
    }

    // Apply initial state without animation transition delay
    this.openItemIds.clear();
    for (const item of this.items) {
      const shouldOpen = initialIds.includes(item.id);
      this._applyItemVisualState(item, shouldOpen, false);
      if (shouldOpen) {
        this.openItemIds.add(item.id);
      }
    }

    // Scroll into view if requested via hash
    if (initialIds.length > 0 && this.options.scrollIntoView && this.options.urlSync === 'hash' && readHash()) {
      const firstOpened = this.items.find(i => i.id === initialIds[0]);
      if (firstOpened) {
        const frame = requestAnimationFrame(() => {
          this._frames.delete(frame);
          if (this._destroyed) return;
          firstOpened.el.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
        });
        this._frames.add(frame);
      }
    }
  }

  /**
   * Event handler for click events on accordion triggers.
   * @private
   */
  _handleTriggerClick(e) {
    if (this._destroyed || !(e.target instanceof Element)) return;

    // Verify the click happened inside a trigger owned directly by this accordion
    const item = this.items.find(i => i.trigger.contains(e.target));
    if (!item) return;
    const { trigger } = item;

    // Buttons, links and form controls nested inside the trigger keep their own behavior.
    if (nestedInteractive(trigger, e.target)) return;
    if (trigger.matches(':disabled, [aria-disabled="true"]')) return;
    if (!ownsNode(this.element, trigger, ACCORDION, CGEAccordion.instances)) return;

    e.preventDefault();
    this.toggle(item.id);
  }

  /**
   * Event handler for keyboard navigation (WAI-ARIA).
   * @private
   */
  _handleKeydown(e) {
    if (this._destroyed || hasCommandModifier(e)) return;
    if (!this.options.keyboard && e.key !== 'Enter' && e.key !== ' ') return;

    const activeEl = document.activeElement;
    if (!activeEl) return;

    // Check if focused element is one of our direct triggers
    const available = this.items.filter(item => !item.trigger.matches(':disabled, [aria-disabled="true"]'));
    const currentIndex = available.findIndex(i => i.trigger === activeEl || i.trigger.contains(activeEl));
    if (currentIndex === -1) return;
    // Focused controls nested inside a trigger handle their own keys.
    if (nestedInteractive(available[currentIndex].trigger, activeEl)) return;

    // Stop child accordion triggers from triggering parent navigation
    if (!ownsNode(this.element, activeEl, ACCORDION, CGEAccordion.instances)) return;

    const total = available.length;
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % total;
        break;

      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + total) % total;
        break;

      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        nextIndex = total - 1;
        break;

      case 'Enter':
      case ' ':
        // Space/Enter toggles non-native button triggers
        if (activeEl.tagName.toLowerCase() !== 'button') {
          e.preventDefault();
          this.toggle(available[currentIndex].id);
        }
        return;

      default:
        return;
    }

    if (nextIndex !== -1 && available[nextIndex]) {
      available[nextIndex].trigger.focus();
    }
  }

  /**
   * Event handler for URL hash changes.
   * @private
   */
  _handleHashChange() {
    if (this._destroyed || this.options.urlSync !== 'hash' || typeof window === 'undefined') return;
    const hash = readHash();
    if (!hash) return;

    const match = this.items.find(item => item.id === hash || item.wrapper.id === hash);
    if (match && !this.isOpen(match.id)) {
      this.open(match.id);
      if (this.options.scrollIntoView) {
        match.el.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
      }
    }
  }

  /**
   * Opens an accordion item by ID.
   * @param {string} itemId
   * @returns {CGEAccordion}
   */
  open(itemId) {
    if (this._destroyed) return this;
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.isOpen) return this;

    // Exclusive mode: close all other items first
    if (this.options.exclusive) {
      for (const openId of Array.from(this.openItemIds)) {
        if (openId !== itemId) {
          this._closeItemInternal(openId);
          if (this._destroyed) return this;
        }
      }
    }

    // Open targeted item
    item.isOpen = true;
    this.openItemIds.add(itemId);
    this._applyItemVisualState(item, true, true);
    this._saveStoredState();

    // URL sync update
    if (this.options.urlSync === 'hash' && this.options.updateHash && typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', `#${encodeURIComponent(itemId)}`);
    }

    // Trigger hooks and events
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(itemId, item.el);
    }
    if (this._destroyed) return this;
    if (typeof this.options.onToggle === 'function') {
      this.options.onToggle(itemId, true, item.el);
    }

    this._dispatch('open', { itemId, itemEl: item.el, isOpen: true });
    this._dispatch('toggle', { itemId, itemEl: item.el, isOpen: true });

    return this;
  }

  /**
   * Internal helper to close an item without alwaysOpen guard (used during exclusive swap).
   * @private
   */
  _closeItemInternal(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || !item.isOpen) return;

    item.isOpen = false;
    this.openItemIds.delete(itemId);
    this._applyItemVisualState(item, false, true);

    if (typeof this.options.onClose === 'function') {
      this.options.onClose(itemId, item.el);
    }
    if (this._destroyed) return;
    if (typeof this.options.onToggle === 'function') {
      this.options.onToggle(itemId, false, item.el);
    }

    this._dispatch('close', { itemId, itemEl: item.el, isOpen: false });
    this._dispatch('toggle', { itemId, itemEl: item.el, isOpen: false });
  }

  /**
   * Closes an accordion item by ID.
   * @param {string} itemId
   * @returns {CGEAccordion}
   */
  close(itemId) {
    if (this._destroyed) return this;
    const item = this.items.find(i => i.id === itemId);
    if (!item || !item.isOpen) return this;

    // Enforce alwaysOpen: cannot close if it's the only one open
    if (this.options.alwaysOpen && this.openItemIds.size <= 1) {
      return this;
    }

    this._closeItemInternal(itemId);
    this._saveStoredState();

    return this;
  }

  /**
   * Toggles an accordion item by ID.
   * @param {string} itemId
   * @returns {CGEAccordion}
   */
  toggle(itemId) {
    if (this.isOpen(itemId)) {
      return this.close(itemId);
    }
    return this.open(itemId);
  }

  /**
   * Opens all items in the accordion (applicable in non-exclusive mode).
   * @returns {CGEAccordion}
   */
  openAll() {
    if (this._destroyed || this.options.exclusive) return this;
    for (const item of this.items) {
      if (!item.isOpen) {
        this.open(item.id);
      }
    }
    return this;
  }

  /**
   * Closes all items in the accordion (respects alwaysOpen).
   * @returns {CGEAccordion}
   */
  closeAll() {
    if (this._destroyed) return this;
    const itemsToClose = Array.from(this.openItemIds);

    // If alwaysOpen is enabled, retain the first currently open item
    if (this.options.alwaysOpen && itemsToClose.length > 0) {
      const keep = itemsToClose[0];
      for (const id of itemsToClose) {
        if (id !== keep) this.close(id);
      }
      return this;
    }

    for (const id of itemsToClose) {
      this.close(id);
    }
    return this;
  }

  /**
   * Returns whether the specified item is currently expanded.
   * @param {string} itemId
   * @returns {boolean}
   */
  isOpen(itemId) {
    return this.openItemIds.has(itemId);
  }

  /**
   * Returns a copy of the direct item descriptors.
   * @returns {Array<Object>}
   */
  getItems() {
    return [...this.items];
  }

  /**
   * Returns the item descriptor for a given ID.
   * @param {string} itemId
   * @returns {Object | null}
   */
  getItem(itemId) {
    return this.items.find(i => i.id === itemId) || null;
  }

  /**
   * Applies CSS classes, ARIA attributes, and icon rotations according to open state.
   * Uses CSS Grid row transitions (`grid-rows-[0fr]` vs `grid-rows-[1fr]`).
   * @private
   */
  _applyItemVisualState(item, isOpen, animate = true) {
    const { trigger, wrapper, content, icon, el } = item;
    const ui = this.options.ui;

    item.isOpen = isOpen;
    setPanelAccess(wrapper, isOpen, trigger);
    wrapper.setAttribute('data-cge-open', String(isOpen));
    if (!isOpen) wrapper.classList.remove('open', 'is-open');

    // ARIA expanded state
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    el.setAttribute('data-cge-open', isOpen ? 'true' : 'false');

    // Trigger active classes
    if (ui.activeTrigger) {
      if (isOpen) {
        this._addClasses(trigger, ui.activeTrigger);
      } else {
        this._removeClasses(trigger, ui.activeTrigger);
      }
    }

    // Grid Row Transition classes on wrapper
    // 0fr = collapsed, 1fr = expanded
    if (isOpen) {
      this._removeClasses(wrapper, 'grid-rows-[0fr]');
      this._addClasses(wrapper, ui.activeWrapper || 'grid-rows-[1fr]');
      wrapper.setAttribute('aria-hidden', 'false');
    } else {
      this._removeClasses(wrapper, ui.activeWrapper || 'grid-rows-[1fr]');
      this._addClasses(wrapper, 'grid-rows-[0fr]');
      wrapper.setAttribute('aria-hidden', 'true');
    }

    // Inner content active padding/margin
    if (content && ui.activeContent) {
      if (isOpen) {
        this._addClasses(content, ui.activeContent);
      } else {
        this._removeClasses(content, ui.activeContent);
      }
    }

    // Icon rotation
    if (icon) {
      const activeIconClass = ui.activeIcon || 'rotate-180';
      if (isOpen) {
        this._removeClasses(icon, 'rotate-0');
        this._addClasses(icon, activeIconClass);
      } else {
        this._removeClasses(icon, activeIconClass);
        this._addClasses(icon, 'rotate-0');
      }
    }

    // Optional tailwind-animations class on content (skipped for reduced motion)
    if (this.options.animation && content && animate) {
      if (isOpen && !prefersReducedMotion()) {
        this._addClasses(content, this.options.animation);
      } else {
        this._removeClasses(content, this.options.animation);
      }
    }
  }

  /**
   * Loads stored open items array from localStorage or sessionStorage.
   * @private
   */
  _loadStoredState() {
    if (!this.options.storage || typeof window === 'undefined') return null;
    const key = this.options.storageKey || `cge_accordion_${this.id}`;
    try {
      const store = this.options.storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
      const data = store.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persists currently open items array to storage.
   * @private
   */
  _saveStoredState() {
    if (!this.options.storage || typeof window === 'undefined') return;
    const key = this.options.storageKey || `cge_accordion_${this.id}`;
    try {
      const store = this.options.storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
      store.setItem(key, JSON.stringify(Array.from(this.openItemIds)));
    } catch {
      // Storage quota or privacy mode exception handling
    }
  }

  /**
   * Subscribes a listener to an instance event.
   * @param {string} eventName
   * @param {Function} callback
   * @returns {CGEAccordion}
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') return this;
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(callback);
    return this;
  }

  /**
   * Unsubscribes a listener from an instance event.
   * @param {string} eventName
   * @param {Function} callback
   * @returns {CGEAccordion}
   */
  off(eventName, callback) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).delete(callback);
    }
    return this;
  }

  /**
   * Dispatches both instance callback listeners and DOM CustomEvents.
   * @private
   */
  _dispatch(eventName, detail = {}) {
    if (this._destroyed) return;
    const eventData = { instance: this, ...detail };

    // 1. Instance event emitter
    if (this._listeners.has(eventName)) {
      for (const callback of this._listeners.get(eventName)) {
        try {
          callback(eventData);
        } catch (err) {
          console.error(`[CGEAccordion] Error in '${eventName}' listener:`, err);
        }
      }
    }

    // 2. DOM CustomEvent on container
    const customEvent = new CustomEvent(`cge:accordion:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: eventData
    });
    this.element.dispatchEvent(customEvent);

    // Also dispatch on the specific item element if present
    if (detail.itemEl && detail.itemEl instanceof HTMLElement) {
      detail.itemEl.dispatchEvent(new CustomEvent(`cge:accordion:${eventName}`, {
        bubbles: false,
        detail: eventData
      }));
    }

    return customEvent;
  }

  /**
   * Destroys the instance, detaching events, cleaning up ARIA attributes, and removing registries.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    // Remove bound events
    this.element.removeEventListener('click', this._onTriggerClick);
    this.element.removeEventListener('keydown', this._onKeydown);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this._onHashChange);
    }

    for (const frame of this._frames) cancelAnimationFrame(frame);
    this._frames.clear();
    // Morphed markup is server-owned and is not restored.
    if (!this._skipRestore) for (const restore of this._restorers.reverse()) restore();

    // Clear registry
    CGEAccordion.instances.delete(this.element);
    CGEAccordion.instances.delete(this.id);
    this._listeners.clear();

    // Dispatch destroyed event
    const event = new CustomEvent('cge:accordion:destroy', {
      bubbles: true,
      detail: { instance: this, id: this.id }
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Static auto-initialization method. Safe to call repeatedly: detached instances are destroyed,
   * instances whose attributes were morphed away are rebuilt and existing ones are reused.
   * @param {HTMLElement | Document | string} [root=document]
   * @param {Object} [options={}]
   * @returns {CGEAccordion[]} Every instance under root (new and existing), in document order.
   */
  static init(root = document, options = {}) {
    const context = typeof root === 'string' ? document.querySelector(root) : root;
    if (!context) return [];
    pruneInstances(CGEAccordion.instances, (key, instance) => instance.element);

    const elements = Array.from(context.querySelectorAll(ACCORDION));
    if (context instanceof HTMLElement && context.matches(ACCORDION)) elements.unshift(context);

    return elements.map(el => {
      const existing = CGEAccordion.instances.get(el);
      if (existing && !existing._isStale()) return existing;
      if (existing) existing._discard();
      return new CGEAccordion(el, existing ? { ...existing._userOptions, ...options } : options);
    });
  }

  /**
   * Destroys every instance whose element is inside root or no longer connected.
   * @param {HTMLElement | Document} [root=document]
   * @returns {CGEAccordion[]}
   */
  static destroyAll(root = document) {
    return [...new Set(destroyInstances(CGEAccordion.instances, root, (key, instance) => instance.element))];
  }

  /**
   * Retrieves an existing instance by element or id.
   * @param {HTMLElement | string} elementOrId
   * @returns {CGEAccordion | null}
   */
  static get(elementOrId) {
    return registeredInstance(CGEAccordion.instances, elementOrId);
  }
}

/**
 * CGECollapse - Standalone helper for isolated collapsible elements without accordion group.
 */
export class CGECollapse {
  /**
   * Active CGECollapse instances indexed by element and id.
   * @type {Map<HTMLElement | string, CGECollapse>}
   */
  static instances = new Map();

  /**
   * Default configuration options for standalone collapse.
   */
  static defaults = {
    defaultOpen: false, // boolean: initially open
    duration: 300, // number: transition duration ms
    animation: false, // string | false: optional animation class
    storage: false, // 'localStorage' | 'sessionStorage' | false
    storageKey: null, // string | null: defaults to cge_collapse_${id}
    onOpen: null, // (instance) => void
    onClose: null, // (instance) => void
    onToggle: null, // (isOpen, instance) => void
    ui: {
      trigger: 'cursor-pointer select-none',
      activeTrigger: 'font-semibold',
      icon: 'w-4 h-4 transition-transform duration-300',
      activeIcon: 'rotate-180',
      wrapper: 'grid grid-rows-[0fr] transition-all duration-300 ease-out overflow-hidden',
      activeWrapper: 'grid-rows-[1fr]',
      content: 'overflow-hidden min-h-0'
    }
  };

  /**
   * Internal ID counter.
   * @private
   */
  static _counter = 0;

  /**
   * @param {string | HTMLElement} target - Trigger button or collapsible wrapper element
   * @param {Object} [options={}]
   */
  constructor(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('[CGECollapse] A valid HTMLElement or matching selector is required.');
    }

    if (CGECollapse.instances.has(element)) {
      return CGECollapse.instances.get(element);
    }

    this._listeners = new Map();
    this._destroyed = false;
    this._restorers = [];
    this._userOptions = options;
    this._resolveElements(element);
    const existing = CGECollapse.instances.get(this.wrapper);
    if (existing) {
      for (const trigger of this.triggers) existing._bindTrigger(trigger);
      existing._applyVisualState(existing.isOpen());
      return existing;
    }
    this.id = this.wrapper.id || 'cge-collapse-' + (++CGECollapse._counter);
    const ds = element.dataset;
    const data = {};
    if (ds.cgeDefaultOpen !== undefined) data.defaultOpen = ds.cgeDefaultOpen === 'true';
    if (ds.cgeDuration !== undefined) data.duration = Number(ds.cgeDuration);
    if (ds.cgeStorage !== undefined) data.storage = ds.cgeStorage === 'false' ? false : ds.cgeStorage;
    if (ds.cgeStorageKey) data.storageKey = ds.cgeStorageKey;
    this.options = { ...CGECollapse.defaults, ...data, ...options, ui: { ...CGECollapse.defaults.ui, ...(options.ui || {}) } };
    this._restorers.push(captureAttributes(this.wrapper, this.content));
    this.wrapper.id = this.id;
    const ui = this.options.ui;
    this._addClasses(this.wrapper, ui.wrapper);
    this._addClasses(this.content, ui.content);
    this.wrapper.setAttribute('role', 'region');
    applyDuration(this.wrapper, [], this.options.duration);
    this._onClick = this._handleClick.bind(this);
    this._onKeydown = e => {
      if (this._destroyed || hasCommandModifier(e) || e.target !== e.currentTarget) return;
      if (e.currentTarget.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) this._handleClick(e);
    };
    const triggers = this.triggers;
    this.triggers = [];
    for (const trigger of triggers) this._bindTrigger(trigger);
    this.trigger = this.triggers[0] || null;
    this.icon = this.trigger?.querySelector('[data-cge-icon], [data-cge-accordion-icon], .cge-icon') || null;
    this._restoreInitialState();
    CGECollapse.instances.set(this.wrapper, this);
    CGECollapse.instances.set(this.id, this);
  }

  _resolveElements(element) {
    const target = element.getAttribute('data-cge-collapse') || element.getAttribute('data-cge-toggle');
    const resolve = value => value ? document.getElementById(value.startsWith('#') ? value.slice(1) : value) : null;
    this.wrapper = target ? resolve(target) : element;
    if (!this.wrapper) throw new Error('[CGECollapse] Target panel was not found.');
    this.content = this.wrapper.querySelector(':scope > [data-cge-content], :scope > .cge-content') || this.wrapper.firstElementChild;
    this.triggers = Array.from(document.querySelectorAll('[data-cge-collapse], [data-cge-toggle], [aria-controls]')).filter(trigger =>
      trigger !== this.wrapper && resolve(trigger.getAttribute('data-cge-collapse') || trigger.getAttribute('data-cge-toggle') || trigger.getAttribute('aria-controls')) === this.wrapper);
  }

  _bindTrigger(trigger) {
    if (this.triggers.includes(trigger)) return;
    const icon = trigger.querySelector('[data-cge-icon], [data-cge-accordion-icon], .cge-icon');
    this._restorers.push(captureAttributes(trigger, icon));
    this.triggers.push(trigger);
    if (trigger.tagName === 'BUTTON' && !trigger.hasAttribute('type')) trigger.type = 'button';
    if (trigger.tagName !== 'BUTTON') {
      trigger.setAttribute('role', 'button');
      if (!trigger.hasAttribute('tabindex')) trigger.tabIndex = 0;
    }
    trigger.setAttribute('aria-controls', this.wrapper.id);
    this._addClasses(trigger, this.options.ui.trigger);
    this._addClasses(icon, this.options.ui.icon);
    if (icon) applyDuration(this.wrapper, [icon], this.options.duration);
    trigger.addEventListener('click', this._onClick);
    trigger.addEventListener('keydown', this._onKeydown);
    CGECollapse.instances.set(trigger, this);
  }

  _addClasses(el, classes) {
    if (!el || !classes) return;
    const tokens = classes.split(/\s+/).filter(Boolean);
    if (tokens.length) el.classList.add(...tokens);
  }

  _removeClasses(el, classes) {
    if (!el || !classes) return;
    const tokens = classes.split(/\s+/).filter(Boolean);
    if (tokens.length) el.classList.remove(...tokens);
  }

  _restoreInitialState() {
    let isOpen = this.options.defaultOpen ||
      this.wrapper.classList.contains('grid-rows-[1fr]') ||
      this.wrapper.classList.contains('open') ||
      this.wrapper.classList.contains('is-open') ||
      (this.trigger && this.trigger.getAttribute('aria-expanded') === 'true');

    if (this.options.storage && typeof window !== 'undefined') {
      try {
        const store = this.options.storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
        const key = this.options.storageKey || `cge_collapse_${this.id}`;
        const saved = store.getItem(key);
        if (saved !== null) isOpen = saved === 'true';
      } catch {}
    }

    this._applyVisualState(isOpen);
  }

  _handleClick(e) {
    if (this._destroyed || e.currentTarget.matches(':disabled, [aria-disabled="true"]')) return;
    if (nestedInteractive(e.currentTarget, e.target)) return;
    e.preventDefault();
    this.toggle();
  }

  open() {
    if (this._destroyed || this._isOpen) return this;
    this._isOpen = true;
    this._applyVisualState(true);
    this._saveStorage(true);

    if (typeof this.options.onOpen === 'function') this.options.onOpen(this);
    if (this._destroyed) return this;
    if (typeof this.options.onToggle === 'function') this.options.onToggle(true, this);
    this._dispatch('open', { isOpen: true });
    this._dispatch('toggle', { isOpen: true });

    return this;
  }

  close() {
    if (this._destroyed || !this._isOpen) return this;
    this._isOpen = false;
    this._applyVisualState(false);
    this._saveStorage(false);

    if (typeof this.options.onClose === 'function') this.options.onClose(this);
    if (this._destroyed) return this;
    if (typeof this.options.onToggle === 'function') this.options.onToggle(false, this);
    this._dispatch('close', { isOpen: false });
    this._dispatch('toggle', { isOpen: false });

    return this;
  }

  toggle() {
    return this._isOpen ? this.close() : this.open();
  }

  isOpen() {
    return !!this._isOpen;
  }

  _applyVisualState(isOpen) {
    this._isOpen = isOpen;
    const ui = this.options.ui;
    setPanelAccess(this.wrapper, isOpen, this.trigger);
    this.wrapper.setAttribute('data-cge-open', String(isOpen));
    if (!isOpen) this.wrapper.classList.remove('open', 'is-open');
    for (const trigger of this.triggers) {
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) this._addClasses(trigger, ui.activeTrigger);
      else this._removeClasses(trigger, ui.activeTrigger);
      const icon = trigger.querySelector('[data-cge-icon], [data-cge-accordion-icon], .cge-icon');
      this._removeClasses(icon, isOpen ? 'rotate-0' : ui.activeIcon);
      this._addClasses(icon, isOpen ? ui.activeIcon : 'rotate-0');
    }
    this._removeClasses(this.wrapper, isOpen ? 'grid-rows-[0fr]' : (ui.activeWrapper || 'grid-rows-[1fr]'));
    this._addClasses(this.wrapper, isOpen ? (ui.activeWrapper || 'grid-rows-[1fr]') : 'grid-rows-[0fr]');
    if (this.options.animation) {
      if (isOpen && !prefersReducedMotion()) this._addClasses(this.content, this.options.animation);
      else this._removeClasses(this.content, this.options.animation);
    }
  }

  _saveStorage(isOpen) {
    if (!this.options.storage || typeof window === 'undefined') return;
    const key = this.options.storageKey || `cge_collapse_${this.id}`;
    try {
      const store = this.options.storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
      store.setItem(key, String(isOpen));
    } catch {
      // Storage quota or privacy mode exception handling
    }
  }

  on(eventName, callback) {
    if (typeof callback !== 'function') return this;
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(callback);
    return this;
  }

  off(eventName, callback) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).delete(callback);
    }
    return this;
  }

  _dispatch(eventName, detail = {}) {
    if (this._destroyed) return;
    const eventData = { instance: this, ...detail };

    if (this._listeners.has(eventName)) {
      for (const callback of this._listeners.get(eventName)) {
        try {
          callback(eventData);
        } catch (err) {
          console.error(`[CGECollapse] Error in '${eventName}' listener:`, err);
        }
      }
    }

    // Dispatched once on the panel; it bubbles, so document listeners see a single event.
    const customEvent = new CustomEvent(`cge:collapse:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: eventData
    });
    this.wrapper.dispatchEvent(customEvent);

    return customEvent;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    for (const trigger of this.triggers) {
      trigger.removeEventListener('click', this._onClick);
      trigger.removeEventListener('keydown', this._onKeydown);
      CGECollapse.instances.delete(trigger);
    }
    if (!this._skipRestore) for (const restore of this._restorers.reverse()) restore();
    CGECollapse.instances.delete(this.wrapper);
    CGECollapse.instances.delete(this.id);
    this._listeners.clear();
  }

  /**
   * True when server-side morphing stripped plugin attributes or removed a bound control.
   * @private
   */
  _isStale() {
    return this._destroyed || !this.wrapper.isConnected || this.wrapper.getAttribute('role') !== 'region' ||
      !this.wrapper.hasAttribute('data-cge-open') ||
      this.triggers.some(trigger => !trigger.isConnected || !trigger.hasAttribute('aria-expanded'));
  }

  /** @private */
  _discard() {
    this._skipRestore = true;
    this.destroy();
  }

  /**
   * Initializes declarative collapse controls under root and returns every instance found.
   * Controls that are triggers of an accordion item are skipped; collapses placed inside
   * accordion bodies are initialized normally.
   * @param {HTMLElement | Document | string} [root=document]
   * @param {Object} [options={}]
   * @returns {CGECollapse[]}
   */
  static init(root = document, options = {}) {
    const context = typeof root === 'string' ? document.querySelector(root) : root;
    if (!context) return [];
    pruneInstances(CGECollapse.instances, (key, instance) => instance.wrapper);

    const elements = Array.from(
      context.querySelectorAll('[data-cge-collapse], [data-cge-toggle]')
    );

    if (context instanceof HTMLElement && context.matches('[data-cge-collapse], [data-cge-toggle]')) elements.unshift(context);
    const accordionTriggers = new Set([...CGEAccordion.instances.values()].flatMap(instance => instance.items.map(item => item.trigger)));
    const instances = [];
    for (const el of elements) {
      // Skip only triggers owned by an accordion group, not collapses nested in accordion bodies.
      if (accordionTriggers.has(el)) continue;
      const accordion = el.closest(ACCORDION);
      if (accordion && el.matches(ACCORDION_TRIGGER) && ownsNode(accordion, el, ACCORDION, CGEAccordion.instances)) continue;
      const target = el.getAttribute('data-cge-collapse') || el.getAttribute('data-cge-toggle');
      if (!target || !document.getElementById(target.replace(/^#/, ''))) continue;
      const existing = CGECollapse.instances.get(el);
      if (existing?._isStale()) existing._discard();
      const instance = new CGECollapse(el, existing?._destroyed ? { ...existing._userOptions, ...options } : options);
      if (!instances.includes(instance)) instances.push(instance);
    }
    return instances;
  }

  /**
   * Destroys every collapse whose panel is inside root or no longer connected.
   * @param {HTMLElement | Document} [root=document]
   * @returns {CGECollapse[]}
   */
  static destroyAll(root = document) {
    return [...new Set(destroyInstances(CGECollapse.instances, root, (key, instance) => instance.wrapper))];
  }

  static get(elementOrId) {
    return registeredInstance(CGECollapse.instances, elementOrId);
  }
}

export default CGEAccordion;
