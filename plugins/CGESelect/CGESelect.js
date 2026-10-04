/**
 * CGESelect - TailTools Plugin
 * Versatile, accessible searchable select and multi-tag combobox plugin
 * designed for Tailwind CSS v4.3+ and Laravel Blade environments.
 *
 * @license MIT
 * @package TailTools
 */

export class CGESelect {
  /**
   * Static WeakMap registry mapping DOM elements to CGESelect instances.
   * @type {WeakMap<HTMLElement, CGESelect>}
   */
  static instances = new WeakMap();

  /**
   * Default configuration options.
   */
  static defaults = {
    multiple: false,
    searchable: true,
    clearable: true,
    placeholder: null,
    searchPlaceholder: null,
    closeOnSelect: null, // null = auto (true for single, false for multi)
    maxItems: null,
    maxTagsVisible: null,
    minSearchLength: 0,
    placement: 'auto', // 'auto' | 'bottom' | 'top'
    asyncSource: null, // { url, driver: 'axios'|'fetch', method: 'GET', param: 'q', debounce: 300, transform: (data) => items }
    renderOption: null,
    renderTag: null,
    renderSelection: null,
    ui: {
      wrapper: 'cge-select-wrapper relative w-full text-slate-800 dark:text-slate-200 text-xs font-normal',
      trigger: 'cge-select-trigger flex items-center justify-between w-full min-h-[38px] px-3 py-1.5 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer select-none',
      triggerActive: 'ring-1 ring-indigo-500 border-indigo-500 dark:border-indigo-500',
      triggerDisabled: 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-50 dark:bg-slate-800/50',
      selectionContainer: 'cge-select-selection flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden',
      placeholder: 'text-slate-400 dark:text-slate-500 select-none truncate',
      controls: 'cge-select-controls flex items-center gap-1.5 shrink-0 ml-2',
      clearButton: 'cge-select-clear text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-xs cursor-pointer',
      arrow: 'cge-select-arrow text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0',
      dropdown: 'cge-select-dropdown absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-lg overflow-hidden text-xs transition-opacity duration-150',
      searchWrapper: 'cge-select-search-wrapper p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 relative',
      searchInput: 'cge-select-search-input w-full px-2.5 py-1.5 pl-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition',
      searchIcon: 'absolute left-4.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none',
      optionsList: 'cge-select-options max-h-60 overflow-y-auto p-1 divide-y divide-transparent space-y-0.5 overscroll-contain',
      optgroupLabel: 'cge-select-optgroup-label px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 select-none',
      option: 'cge-select-option flex items-center justify-between px-2.5 py-1.5 rounded-sm cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
      optionSelected: 'cge-select-option-selected bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold',
      optionFocused: 'cge-select-option-focused bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
      optionDisabled: 'opacity-40 cursor-not-allowed pointer-events-none',
      tag: 'cge-select-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-medium shrink-0',
      tagRemove: 'cge-select-tag-remove hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer rounded-xs p-0.5 transition-colors',
      tagCount: 'cge-select-tag-count inline-flex items-center px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold',
      emptyState: 'cge-select-empty px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic',
      loadingState: 'cge-select-loading px-4 py-4 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2'
    },
    translations: {
      placeholder: 'Select an option...',
      'search-placeholder': 'Search...',
      'no-results': 'No results found',
      loading: 'Loading results...',
      'max-items-reached': 'Maximum of :max items selected',
      'clear-all': 'Clear all',
      'more-tags': '+:count more'
    }
  };

  /**
   * Global localization dictionary.
   */
  static translations = { ...CGESelect.defaults.translations };

  /**
   * Updates global default translations.
   * @param {Object} dict
   */
  static setTranslations(dict) {
    CGESelect.translations = { ...CGESelect.translations, ...dict };
  }

  /**
   * @param {string | HTMLSelectElement} target - Select element or selector string
   * @param {Object} [options={}] - Custom configuration options
   */
  constructor(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element || !(element instanceof HTMLSelectElement)) {
      throw new Error('[CGESelect] A valid HTMLSelectElement or matching selector is required.');
    }

    if (CGESelect.instances.has(element)) {
      return CGESelect.instances.get(element);
    }

    this.element = element;
    this.options = this._resolveOptions(options);

    // State
    this.isOpen = false;
    this.items = [];
    this.filteredItems = [];
    this.selectedValues = [];
    this.focusedIndex = -1;
    this.searchQuery = '';
    this.isLoading = false;
    this.abortController = null;
    this._listeners = new Map();
    this._debounceTimer = null;

    // DOM Elements
    this.wrapper = null;
    this.trigger = null;
    this.selectionContainer = null;
    this.clearBtn = null;
    this.arrowIcon = null;
    this.dropdown = null;
    this.searchInput = null;
    this.optionsContainer = null;

    this._init();
    CGESelect.instances.set(this.element, this);
  }

  /**
   * Merges options with element attributes, translations, and defaults.
   * @private
   */
  _resolveOptions(options) {
    const el = this.element;
    const ds = el.dataset;

    const isMultiple =
      options.multiple !== undefined
        ? Boolean(options.multiple)
        : el.multiple || ds.cgeMultiple === 'true' || ds.cgeMultiple === '';

    const dataOpts = {
      multiple: isMultiple,
      searchable: ds.cgeSearchable !== undefined ? ds.cgeSearchable !== 'false' : options.searchable ?? true,
      clearable: ds.cgeClearable !== undefined ? ds.cgeClearable !== 'false' : options.clearable ?? true,
      placeholder: ds.cgePlaceholder || options.placeholder || null,
      searchPlaceholder: ds.cgeSearchPlaceholder || options.searchPlaceholder || null,
      maxItems: ds.cgeMaxItems ? parseInt(ds.cgeMaxItems, 10) : options.maxItems || null,
      maxTagsVisible: ds.cgeMaxTagsVisible ? parseInt(ds.cgeMaxTagsVisible, 10) : options.maxTagsVisible || null,
      minSearchLength: ds.cgeMinSearch ? parseInt(ds.cgeMinSearch, 10) : options.minSearchLength ?? 0,
      placement: ds.cgePlacement || options.placement || 'auto'
    };

    // If closeOnSelect is not explicitly configured, default to true for single, false for multi
    const closeOnSelect =
      options.closeOnSelect !== undefined
        ? options.closeOnSelect
        : !dataOpts.multiple;

    return {
      ...CGESelect.defaults,
      ...options,
      ...dataOpts,
      closeOnSelect,
      ui: { ...CGESelect.defaults.ui, ...(options.ui || {}) },
      translations: { ...CGESelect.translations, ...(options.translations || {}) }
    };
  }

  /**
   * Initializes DOM scaffolding, event bindings, and initial data parsing.
   * @private
   */
  _init() {
    this._parseOptionsFromDom();
    this._buildDom();
    this._bindEvents();
    this._renderSelection();

    // Respect disabled state
    if (this.element.disabled) {
      this.disable();
    }
  }

  /**
   * Parses native `<option>` and `<optgroup>` tags into structured data models.
   * @private
   */
  _parseOptionsFromDom() {
    this.items = [];
    this.selectedValues = [];

    const children = Array.from(this.element.children);

    const parseOption = (opt, groupLabel = null) => {
      // Ignore placeholder dummy options (value="" and disabled or empty label) if single mode
      const isPlaceholderOption =
        !this.options.multiple &&
        opt.value === '' &&
        (opt.disabled || opt.hasAttribute('data-placeholder'));

      if (isPlaceholderOption) {
        if (!this.options.placeholder) {
          this.options.placeholder = opt.textContent.trim();
        }
        return;
      }

      const item = {
        value: String(opt.value),
        label: opt.textContent.trim(),
        selected: opt.selected,
        disabled: opt.disabled,
        image: opt.dataset.cgeImage || opt.dataset.image || null,
        icon: opt.dataset.cgeIcon || opt.dataset.icon || null,
        subtext: opt.dataset.cgeSubtext || opt.dataset.subtext || opt.dataset.cgeDescription || null,
        badge: opt.dataset.cgeBadge || opt.dataset.badge || null,
        optgroup: groupLabel,
        element: opt
      };

      this.items.push(item);

      if (opt.selected) {
        this.selectedValues.push(item.value);
      }
    };

    children.forEach((child) => {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = child.getAttribute('label') || 'Group';
        Array.from(child.children).forEach((opt) => parseOption(opt, groupLabel));
      } else if (child.tagName === 'OPTION') {
        parseOption(child, null);
      }
    });

    // If single select has no selected item, default to first non-disabled option if native behavior dictates
    if (!this.options.multiple && this.selectedValues.length === 0 && this.items.length > 0) {
      if (!this.options.placeholder && !this.element.hasAttribute('data-cge-placeholder')) {
        const firstActive = this.items.find((i) => !i.disabled);
        if (firstActive) {
          firstActive.selected = true;
          this.selectedValues = [firstActive.value];
        }
      }
    }

    this.filteredItems = [...this.items];
  }

  /**
   * Generates the custom accessible DOM tree and hides original `<select>`.
   * @private
   */
  _buildDom() {
    const el = this.element;
    const ui = this.options.ui;

    // 1. Create Wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = ui.wrapper;
    this.wrapper.setAttribute('data-cge-select-instance', '');

    // 2. Hide Native Select while preserving accessibility & form serializability
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('cge-select-native-hidden');
    el.style.cssText =
      'position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; border: 0 !important; white-space: nowrap !important;';

    // Insert wrapper before native select and move select inside wrapper
    el.parentNode.insertBefore(this.wrapper, el);
    this.wrapper.appendChild(el);

    // 3. Extract Headless Styles from Original Select
    const inheritedClasses = this._extractInheritedClasses(el);

    // 4. Create Trigger Button
    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = `${ui.trigger} ${inheritedClasses}`.trim();
    this.trigger.setAttribute('role', 'combobox');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-haspopup', 'listbox');

    // Trigger Content Container (Selection & Tags)
    this.selectionContainer = document.createElement('div');
    this.selectionContainer.className = ui.selectionContainer;
    this.trigger.appendChild(this.selectionContainer);

    // Controls Container (Clear Button & Arrow)
    const controls = document.createElement('div');
    controls.className = ui.controls;

    // Clear Button
    this.clearBtn = document.createElement('button');
    this.clearBtn.type = 'button';
    this.clearBtn.className = `${ui.clearButton} hidden`;
    this.clearBtn.setAttribute('aria-label', this.options.translations['clear-all']);
    this.clearBtn.innerHTML = `
      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
    `;
    controls.appendChild(this.clearBtn);

    // Chevron Arrow Icon
    this.arrowIcon = document.createElement('span');
    this.arrowIcon.className = ui.arrow;
    this.arrowIcon.innerHTML = `
      <svg class="w-4 h-4 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;
    controls.appendChild(this.arrowIcon);

    this.trigger.appendChild(controls);
    this.wrapper.appendChild(this.trigger);

    // 5. Create Dropdown Panel
    this.dropdown = document.createElement('div');
    this.dropdown.className = `${ui.dropdown} hidden`;
    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-multiselectable', this.options.multiple ? 'true' : 'false');

    // Optional Search Bar
    if (this.options.searchable) {
      const searchWrapper = document.createElement('div');
      searchWrapper.className = ui.searchWrapper;

      const searchIcon = document.createElement('span');
      searchIcon.className = ui.searchIcon;
      searchIcon.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      `;
      searchWrapper.appendChild(searchIcon);

      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = ui.searchInput;
      this.searchInput.placeholder =
        this.options.searchPlaceholder || this.options.translations['search-placeholder'];
      this.searchInput.setAttribute('autocomplete', 'off');
      this.searchInput.setAttribute('autocapitalize', 'off');
      this.searchInput.setAttribute('spellcheck', 'false');

      searchWrapper.appendChild(this.searchInput);
      this.dropdown.appendChild(searchWrapper);
    }

    // Options Scrollable Container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = ui.optionsList;
    this.dropdown.appendChild(this.optionsContainer);

    this.wrapper.appendChild(this.dropdown);
  }

  /**
   * Extracts styling tokens (border, background, ring, padding, rounded-sm) from original select.
   * @private
   */
  _extractInheritedClasses(selectEl) {
    if (!selectEl.className) return '';

    const classList = Array.from(selectEl.classList);
    const inherited = [];

    // Filter out classes that would disrupt wrapper flow while keeping theme styles
    classList.forEach((cls) => {
      if (
        cls.startsWith('border') ||
        cls.startsWith('bg-') ||
        cls.startsWith('text-') ||
        cls.startsWith('ring-') ||
        cls.startsWith('shadow') ||
        cls.startsWith('dark:bg-') ||
        cls.startsWith('dark:border-') ||
        cls.startsWith('dark:text-') ||
        cls.includes('rounded-sm')
      ) {
        inherited.push(cls);
      }
    });

    return inherited.join(' ');
  }

  /**
   * Attaches event handlers for clicks, typing, keyboard navigation, and clicks outside.
   * @private
   */
  _bindEvents() {
    // 1. Toggle Trigger Click
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      // If clicking clear button, don't toggle open/close
      if (e.target.closest('.cge-select-clear')) {
        this.clear();
        return;
      }
      // If clicking tag remove button, don't toggle
      if (e.target.closest('.cge-select-tag-remove')) {
        const tag = e.target.closest('[data-cge-value]');
        if (tag) {
          this.deselect(tag.dataset.cgeValue);
        }
        return;
      }
      this.toggle();
    });

    // 2. Search Input Keyup / Input (Debounced for async, immediate for local)
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this._handleSearch();
      });

      this.searchInput.addEventListener('keydown', (e) => {
        // Backspace removes last tag if input is empty
        if (
          e.key === 'Backspace' &&
          this.options.multiple &&
          this.searchQuery === '' &&
          this.selectedValues.length > 0
        ) {
          const lastVal = this.selectedValues[this.selectedValues.length - 1];
          this.deselect(lastVal);
        }
      });
    }

    // 3. Keyboard Navigation on Dropdown & Trigger
    const handleKeyNav = (e) => {
      if (!this.isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          this.open();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this._navigateOptions(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._navigateOptions(-1);
          break;
        case 'Enter':
          e.preventDefault();
          if (this.focusedIndex >= 0 && this.focusedIndex < this.filteredItems.length) {
            const item = this.filteredItems[this.focusedIndex];
            if (!item.disabled) {
              this._toggleItemSelection(item);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.close();
          this.trigger.focus();
          break;
        case 'Tab':
          // Close on Tab and allow natural focus advance
          this.close();
          break;
        case 'Home':
          if (this.filteredItems.length > 0) {
            e.preventDefault();
            this.focusedIndex = 0;
            this._updateFocusedOption();
          }
          break;
        case 'End':
          if (this.filteredItems.length > 0) {
            e.preventDefault();
            this.focusedIndex = this.filteredItems.length - 1;
            this._updateFocusedOption();
          }
          break;
      }
    };

    this.trigger.addEventListener('keydown', handleKeyNav);
    if (this.searchInput) {
      this.searchInput.addEventListener('keydown', handleKeyNav);
    }

    // 4. Close when clicking outside
    this._onDocumentClick = (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close();
      }
    };
    document.addEventListener('click', this._onDocumentClick);

    // 5. Update placement on window resize / scroll
    this._onWindowResize = () => {
      if (this.isOpen) {
        this._calculatePlacement();
      }
    };
    window.addEventListener('resize', this._onWindowResize, { passive: true });
    window.addEventListener('scroll', this._onWindowResize, { passive: true });
  }

  /**
   * Filters options locally or triggers debounced async remote query.
   * @private
   */
  _handleSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    this._emit('search', { query: this.searchQuery });

    // Remote Async Search
    if (this.options.asyncSource) {
      this._handleAsyncSearch(this.searchQuery);
      return;
    }

    // Local Search
    if (query.length < this.options.minSearchLength) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter((item) => {
        const matchLabel = item.label.toLowerCase().includes(query);
        const matchValue = item.value.toLowerCase().includes(query);
        const matchSubtext = item.subtext ? item.subtext.toLowerCase().includes(query) : false;
        return matchLabel || matchValue || matchSubtext;
      });
    }

    this.focusedIndex = this.filteredItems.length > 0 ? 0 : -1;
    this._renderOptionsList();
  }

  /**
   * Dispatches debounced HTTP request to async endpoint with abort controller.
   * @private
   */
  async _handleAsyncSearch(query) {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    const cfg = this.options.asyncSource;
    const debounceMs = cfg.debounce !== undefined ? cfg.debounce : 300;

    this._debounceTimer = setTimeout(async () => {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      this.isLoading = true;
      this._renderLoadingState();

      try {
        const urlObj = new URL(cfg.url, window.location.origin);
        const paramName = cfg.param || 'q';
        urlObj.searchParams.set(paramName, query);

        let data = null;

        // Driver 1: window.axios
        if (cfg.driver === 'axios' && typeof window !== 'undefined' && window.axios) {
          const res = await window.axios.get(urlObj.toString(), {
            signal: this.abortController.signal
          });
          data = res.data;
        } else {
          // Driver 2: Native fetch()
          const res = await fetch(urlObj.toString(), {
            method: cfg.method || 'GET',
            signal: this.abortController.signal,
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          data = await res.json();
        }

        // Transform results if transformer provided
        let rawItems = [];
        if (typeof cfg.transform === 'function') {
          rawItems = cfg.transform(data);
        } else if (Array.isArray(data)) {
          rawItems = data;
        } else if (data && Array.isArray(data.data)) {
          rawItems = data.data;
        } else if (data && Array.isArray(data.items)) {
          rawItems = data.items;
        }

        // Map into internal structure
        this.items = rawItems.map((raw) => ({
          value: String(raw.value ?? raw.id),
          label: String(raw.label ?? raw.name ?? raw.title ?? raw.value),
          selected: this.selectedValues.includes(String(raw.value ?? raw.id)),
          disabled: Boolean(raw.disabled),
          image: raw.image || raw.avatar || null,
          icon: raw.icon || null,
          subtext: raw.subtext || raw.description || null,
          badge: raw.badge || null,
          optgroup: raw.optgroup || null,
          element: null
        }));

        this.filteredItems = [...this.items];
        this.focusedIndex = this.filteredItems.length > 0 ? 0 : -1;
        this.isLoading = false;
        this._renderOptionsList();
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[CGESelect] Async search failed:', err);
        this.isLoading = false;
        this.filteredItems = [];
        this._renderEmptyState();
      }
    }, debounceMs);
  }

  /**
   * Calculates auto-flip placement (top or bottom) based on viewport clearance.
   * @private
   */
  _calculatePlacement() {
    if (!this.dropdown || !this.trigger) return;

    if (this.options.placement === 'top') {
      this._applyPlacementTop();
      return;
    }
    if (this.options.placement === 'bottom') {
      this._applyPlacementBottom();
      return;
    }

    // Auto placement: measure clearance
    const triggerRect = this.trigger.getBoundingClientRect();
    const dropdownHeight = 260; // Estimated max height
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      this._applyPlacementTop();
    } else {
      this._applyPlacementBottom();
    }
  }

  /** @private */
  _applyPlacementTop() {
    this.dropdown.classList.remove('cge-select-placement-bottom');
    this.dropdown.classList.add('cge-select-placement-top');
    this.dropdown.style.bottom = '100%';
    this.dropdown.style.top = 'auto';
    this.dropdown.style.marginBottom = '4px';
    this.dropdown.style.marginTop = '0';
  }

  /** @private */
  _applyPlacementBottom() {
    this.dropdown.classList.remove('cge-select-placement-top');
    this.dropdown.classList.add('cge-select-placement-bottom');
    this.dropdown.style.top = '100%';
    this.dropdown.style.bottom = 'auto';
    this.dropdown.style.marginTop = '4px';
    this.dropdown.style.marginBottom = '0';
  }

  /**
   * Renders the visible selection in the trigger (Single item, placeholder, or multi-tags).
   * @private
   */
  _renderSelection() {
    const container = this.selectionContainer;
    container.innerHTML = '';

    const selectedItems = this.items.filter((item) => this.selectedValues.includes(item.value));
    const ui = this.options.ui;

    // 1. Empty / Placeholder State
    if (selectedItems.length === 0) {
      const placeholderText =
        this.options.placeholder || this.options.translations.placeholder;
      const phEl = document.createElement('span');
      phEl.className = ui.placeholder;
      phEl.textContent = placeholderText;
      container.appendChild(phEl);

      this.clearBtn.classList.add('hidden');
      return;
    }

    // Show Clear button if clearable
    if (this.options.clearable) {
      this.clearBtn.classList.remove('hidden');
    }

    // 2. Single Select Mode
    if (!this.options.multiple) {
      const item = selectedItems[0];
      if (typeof this.options.renderSelection === 'function') {
        container.innerHTML = this.options.renderSelection(item);
        return;
      }

      const itemEl = document.createElement('div');
      itemEl.className = 'flex items-center gap-2 truncate max-w-full';

      // Avatar / Image
      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.label;
        img.className = 'w-5 h-5 rounded-sm object-cover shrink-0';
        itemEl.appendChild(img);
      }

      // Icon
      if (item.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'shrink-0 text-slate-500';
        iconSpan.innerHTML = item.icon;
        itemEl.appendChild(iconSpan);
      }

      // Label
      const label = document.createElement('span');
      label.className = 'truncate font-medium';
      label.textContent = item.label;
      itemEl.appendChild(label);

      // Optional Subtext
      if (item.subtext) {
        const sub = document.createElement('span');
        sub.className = 'text-[11px] text-slate-400 dark:text-slate-500 truncate ml-1';
        sub.textContent = `(${item.subtext})`;
        itemEl.appendChild(sub);
      }

      // Optional Badge
      if (item.badge) {
        const badge = document.createElement('span');
        badge.className = 'px-1.5 py-0.2 rounded-sm bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400';
        badge.textContent = item.badge;
        itemEl.appendChild(badge);
      }

      container.appendChild(itemEl);
      return;
    }

    // 3. Multi-Select Tags Mode
    const maxVisible = this.options.maxTagsVisible || selectedItems.length;
    const visibleTags = selectedItems.slice(0, maxVisible);
    const hiddenCount = selectedItems.length - maxVisible;

    visibleTags.forEach((item) => {
      if (typeof this.options.renderTag === 'function') {
        const temp = document.createElement('div');
        temp.innerHTML = this.options.renderTag(item);
        container.appendChild(temp.firstElementChild);
        return;
      }

      const tag = document.createElement('span');
      tag.className = ui.tag;
      tag.setAttribute('data-cge-value', item.value);

      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.label;
        img.className = 'w-3.5 h-3.5 rounded-sm object-cover shrink-0';
        tag.appendChild(img);
      }

      const txt = document.createElement('span');
      txt.className = 'truncate max-w-[120px]';
      txt.textContent = item.label;
      tag.appendChild(txt);

      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = ui.tagRemove;
      rmBtn.setAttribute('aria-label', `Remove ${item.label}`);
      rmBtn.innerHTML = `
        <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;
      tag.appendChild(rmBtn);

      container.appendChild(tag);
    });

    // Overflow "+N more" badge
    if (hiddenCount > 0) {
      const moreTag = document.createElement('span');
      moreTag.className = ui.tagCount;
      moreTag.textContent = this.options.translations['more-tags'].replace(':count', String(hiddenCount));
      container.appendChild(moreTag);
    }
  }

  /**
   * Renders options list with optgroup support, checkmarks, avatars, and badges.
   * @private
   */
  _renderOptionsList() {
    const list = this.optionsContainer;
    list.innerHTML = '';

    if (this.filteredItems.length === 0) {
      this._renderEmptyState();
      return;
    }

    const ui = this.options.ui;
    let currentOptgroup = null;

    this.filteredItems.forEach((item, index) => {
      // Optgroup header
      if (item.optgroup && item.optgroup !== currentOptgroup) {
        currentOptgroup = item.optgroup;
        const groupHeader = document.createElement('div');
        groupHeader.className = ui.optgroupLabel;
        groupHeader.textContent = currentOptgroup;
        list.appendChild(groupHeader);
      }

      // Option item
      const optEl = document.createElement('div');
      optEl.className = ui.option;
      optEl.setAttribute('role', 'option');
      optEl.setAttribute('data-index', String(index));
      optEl.setAttribute('data-value', item.value);

      const isSelected = this.selectedValues.includes(item.value);
      optEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      if (isSelected) {
        optEl.classList.add(...ui.optionSelected.split(' '));
      }

      if (item.disabled) {
        optEl.classList.add(...ui.optionDisabled.split(' '));
        optEl.setAttribute('aria-disabled', 'true');
      }

      if (index === this.focusedIndex) {
        optEl.classList.add(...ui.optionFocused.split(' '));
      }

      // Custom option template callback
      if (typeof this.options.renderOption === 'function') {
        optEl.innerHTML = this.options.renderOption(item);
      } else {
        // Default Option Content
        const content = document.createElement('div');
        content.className = 'flex items-center gap-2 truncate flex-1';

        if (item.image) {
          const img = document.createElement('img');
          img.src = item.image;
          img.alt = item.label;
          img.className = 'w-6 h-6 rounded-sm object-cover shrink-0';
          content.appendChild(img);
        }

        if (item.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'shrink-0 text-slate-500';
          iconSpan.innerHTML = item.icon;
          content.appendChild(iconSpan);
        }

        const textGroup = document.createElement('div');
        textGroup.className = 'flex flex-col truncate';

        const label = document.createElement('span');
        label.className = 'truncate leading-snug';
        label.textContent = item.label;
        textGroup.appendChild(label);

        if (item.subtext) {
          const sub = document.createElement('span');
          sub.className = 'text-[11px] text-slate-400 dark:text-slate-500 truncate leading-snug';
          sub.textContent = item.subtext;
          textGroup.appendChild(sub);
        }

        content.appendChild(textGroup);
        optEl.appendChild(content);

        // Right side indicators (Badge & Checkmark)
        const rightContainer = document.createElement('div');
        rightContainer.className = 'flex items-center gap-1.5 shrink-0 ml-2';

        if (item.badge) {
          const badge = document.createElement('span');
          badge.className = 'px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400';
          badge.textContent = item.badge;
          rightContainer.appendChild(badge);
        }

        if (isSelected) {
          const check = document.createElement('span');
          check.className = 'text-indigo-600 dark:text-indigo-400 shrink-0';
          check.innerHTML = `
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          `;
          rightContainer.appendChild(check);
        }

        optEl.appendChild(rightContainer);
      }

      // Hover / Click Bindings
      optEl.addEventListener('mouseenter', () => {
        if (!item.disabled) {
          this.focusedIndex = index;
          this._updateFocusedOption();
        }
      });

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!item.disabled) {
          this._toggleItemSelection(item);
        }
      });

      list.appendChild(optEl);
    });

    this._scrollToFocused();
  }

  /**
   * Renders empty state message.
   * @private
   */
  _renderEmptyState() {
    this.optionsContainer.innerHTML = `
      <div class="${this.options.ui.emptyState}">
        ${this.options.translations['no-results']}
      </div>
    `;
  }

  /**
   * Renders loading state message with spinning SVG.
   * @private
   */
  _renderLoadingState() {
    this.optionsContainer.innerHTML = `
      <div class="${this.options.ui.loadingState}">
        <svg class="animate-spin w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>${this.options.translations.loading}</span>
      </div>
    `;
  }

  /**
   * Toggles item selection, respects maxItems limits, and synchronizes `<select>`.
   * @private
   */
  _toggleItemSelection(item) {
    if (item.disabled) return;

    if (!this.options.multiple) {
      // Single Select
      this.selectedValues = [item.value];
      this._syncNativeSelect();
      this._renderSelection();

      if (this.options.closeOnSelect) {
        this.close();
        this.trigger.focus();
      }
      return;
    }

    // Multi Select
    const isSelected = this.selectedValues.includes(item.value);

    if (isSelected) {
      this.deselect(item.value);
    } else {
      // Check maxItems limit
      if (this.options.maxItems && this.selectedValues.length >= this.options.maxItems) {
        const msg = this.options.translations['max-items-reached'].replace(
          ':max',
          String(this.options.maxItems)
        );
        if (typeof window !== 'undefined' && window.CGEToast) {
          window.CGEToast.warning(msg);
        }
        return;
      }

      this.select(item.value);
    }

    if (this.options.closeOnSelect) {
      this.close();
      this.trigger.focus();
    } else {
      this._renderOptionsList();
    }
  }

  /**
   * Synchronizes internal selectedValues array into native `<select>`,
   * and dispatches native bubbling 'change' and 'input' events.
   * @private
   */
  _syncNativeSelect(triggerChange = true) {
    const el = this.element;

    if (!this.options.multiple) {
      const val = this.selectedValues[0] || '';
      el.value = val;
    } else {
      Array.from(el.options).forEach((opt) => {
        opt.selected = this.selectedValues.includes(opt.value);
      });
    }

    if (triggerChange) {
      // Native bubbling events (for CGEForm, standard form listeners, and Livewire)
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      // Custom CGE Select change event
      const selectedItems = this.items.filter((i) => this.selectedValues.includes(i.value));
      const detail = {
        instance: this,
        element: el,
        value: this.getValue(),
        selectedItems
      };

      this._emit('change', detail);
    }
  }

  /**
   * Navigates focused option using keyboard arrow keys.
   * @private
   */
  _navigateOptions(direction) {
    if (this.filteredItems.length === 0) return;

    let newIndex = this.focusedIndex + direction;

    // Loop around
    if (newIndex < 0) {
      newIndex = this.filteredItems.length - 1;
    } else if (newIndex >= this.filteredItems.length) {
      newIndex = 0;
    }

    // Skip disabled items if possible
    let attempts = 0;
    while (this.filteredItems[newIndex] && this.filteredItems[newIndex].disabled && attempts < this.filteredItems.length) {
      newIndex += direction;
      if (newIndex < 0) newIndex = this.filteredItems.length - 1;
      if (newIndex >= this.filteredItems.length) newIndex = 0;
      attempts++;
    }

    this.focusedIndex = newIndex;
    this._updateFocusedOption();
    this._scrollToFocused();
  }

  /**
   * Highlights the currently focused option in the list.
   * @private
   */
  _updateFocusedOption() {
    const options = this.optionsContainer.querySelectorAll('[role="option"]');
    options.forEach((opt) => {
      const idx = parseInt(opt.dataset.index, 10);
      if (idx === this.focusedIndex) {
        opt.classList.add(...this.options.ui.optionFocused.split(' '));
      } else {
        opt.classList.remove(...this.options.ui.optionFocused.split(' '));
      }
    });
  }

  /**
   * Scrolls the focused option into view smoothly.
   * @private
   */
  _scrollToFocused() {
    const focusedEl = this.optionsContainer.querySelector(
      `[role="option"][data-index="${this.focusedIndex}"]`
    );
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Emits internal instance callbacks and bubbling DOM CustomEvents.
   * @private
   */
  _emit(eventName, detail = {}) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach((cb) => {
        try {
          cb(detail);
        } catch (err) {
          console.error(`[CGESelect] Error in listener "${eventName}":`, err);
        }
      });
    }

    const domEventName = `cge:select:${eventName.toLowerCase()}`;
    const customEvent = new CustomEvent(domEventName, {
      bubbles: true,
      cancelable: true,
      detail: { instance: this, element: this.element, ...detail }
    });

    this.element.dispatchEvent(customEvent);
  }

  // =========================================================================
  // Public Instance Methods
  // =========================================================================

  /**
   * Opens the dropdown panel.
   * @returns {this}
   */
  open() {
    if (this.isOpen || this.element.disabled) return this;
    this.isOpen = true;

    this.dropdown.classList.remove('hidden');
    this.trigger.classList.add(...this.options.ui.triggerActive.split(' '));
    this.trigger.setAttribute('aria-expanded', 'true');
    this.arrowIcon.classList.add('rotate-180');

    this._calculatePlacement();
    this._renderOptionsList();

    // Autofocus search input if present
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchQuery = '';
      setTimeout(() => this.searchInput.focus(), 50);
    }

    this._emit('open', {});
    return this;
  }

  /**
   * Closes the dropdown panel.
   * @returns {this}
   */
  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;

    this.dropdown.classList.add('hidden');
    this.trigger.classList.remove(...this.options.ui.triggerActive.split(' '));
    this.trigger.setAttribute('aria-expanded', 'false');
    this.arrowIcon.classList.remove('rotate-180');

    this._emit('close', {});
    return this;
  }

  /**
   * Toggles dropdown open/close state.
   * @returns {this}
   */
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Retrieves the current selection value (string for single, string[] for multi).
   * @returns {string | string[]}
   */
  getValue() {
    return this.options.multiple ? [...this.selectedValues] : this.selectedValues[0] || '';
  }

  /**
   * Sets value programmatically and updates native select.
   * @param {string | string[]} val
   * @param {boolean} [triggerChange=true]
   * @returns {this}
   */
  setValue(val, triggerChange = true) {
    if (val === null || val === undefined) {
      return this.clear(triggerChange);
    }

    if (this.options.multiple) {
      const arr = Array.isArray(val) ? val.map(String) : [String(val)];
      this.selectedValues = arr;
    } else {
      this.selectedValues = [String(val)];
    }

    this._syncNativeSelect(triggerChange);
    this._renderSelection();
    if (this.isOpen) {
      this._renderOptionsList();
    }
    return this;
  }

  /**
   * Selects an individual value (multi-select helper).
   * @param {string} val
   * @returns {this}
   */
  select(val) {
    const strVal = String(val);
    if (!this.selectedValues.includes(strVal)) {
      if (!this.options.multiple) {
        this.selectedValues = [strVal];
      } else {
        this.selectedValues.push(strVal);
      }
      this._syncNativeSelect();
      this._renderSelection();
    }
    return this;
  }

  /**
   * Deselects an individual value.
   * @param {string} val
   * @returns {this}
   */
  deselect(val) {
    const strVal = String(val);
    if (this.selectedValues.includes(strVal)) {
      this.selectedValues = this.selectedValues.filter((v) => v !== strVal);
      this._syncNativeSelect();
      this._renderSelection();
      if (this.isOpen) {
        this._renderOptionsList();
      }
    }
    return this;
  }

  /**
   * Clears all selected items.
   * @param {boolean} [triggerChange=true]
   * @returns {this}
   */
  clear(triggerChange = true) {
    this.selectedValues = [];
    this._syncNativeSelect(triggerChange);
    this._renderSelection();
    if (this.isOpen) {
      this._renderOptionsList();
    }
    this._emit('clear', {});
    return this;
  }

  /**
   * Disables the select combobox.
   * @returns {this}
   */
  disable() {
    this.element.disabled = true;
    this.trigger.disabled = true;
    this.trigger.classList.add(...this.options.ui.triggerDisabled.split(' '));
    this.close();
    return this;
  }

  /**
   * Enables the select combobox.
   * @returns {this}
   */
  enable() {
    this.element.disabled = false;
    this.trigger.disabled = false;
    this.trigger.classList.remove(...this.options.ui.triggerDisabled.split(' '));
    return this;
  }

  /**
   * Re-parses original `<select>` children when dynamic options are added/removed.
   * @returns {this}
   */
  refresh() {
    this._parseOptionsFromDom();
    this._renderSelection();
    if (this.isOpen) {
      this._renderOptionsList();
    }
    return this;
  }

  /**
   * Registers an event callback.
   * @param {string} eventName
   * @param {Function} callback
   * @returns {this}
   */
  on(eventName, callback) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    this._listeners.get(eventName).push(callback);
    return this;
  }

  /**
   * Unregisters an event callback.
   * @param {string} eventName
   * @param {Function} callback
   * @returns {this}
   */
  off(eventName, callback) {
    if (!this._listeners.has(eventName)) return this;
    const cbs = this._listeners.get(eventName).filter((cb) => cb !== callback);
    this._listeners.set(eventName, cbs);
    return this;
  }

  /**
   * Destroys instance, unbinds events, and restores native `<select>`.
   */
  destroy() {
    this.close();

    document.removeEventListener('click', this._onDocumentClick);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowResize);

    // Restore native select
    this.element.style.cssText = '';
    this.element.classList.remove('cge-select-native-hidden');
    this.element.removeAttribute('tabindex');
    this.element.removeAttribute('aria-hidden');

    // Move select back to original DOM parent and remove wrapper
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
      this.wrapper.remove();
    }

    this._listeners.clear();
    CGESelect.instances.delete(this.element);
  }

  // =========================================================================
  // Static Registry & Controller Methods
  // =========================================================================

  /**
   * Retrieves an existing instance by DOM element or selector.
   * @param {string | HTMLSelectElement} target
   * @returns {CGESelect | null}
   */
  static get(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    return el ? CGESelect.instances.get(el) || null : null;
  }

  /**
   * Retrieves or creates a new CGESelect instance.
   * @param {string | HTMLSelectElement} target
   * @param {Object} [options={}]
   * @returns {CGESelect}
   */
  static getOrCreate(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      throw new Error(`[CGESelect] Target select not found: ${target}`);
    }
    return CGESelect.instances.get(el) || new CGESelect(el, options);
  }

  /**
   * Initializes all matching select elements across the document.
   * @param {string} [selector='select[data-cge-select]']
   * @param {Object} [options={}]
   * @returns {CGESelect[]}
   */
  static init(selector = 'select[data-cge-select]', options = {}) {
    if (typeof document === 'undefined') return [];
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map((el) => CGESelect.getOrCreate(el, options));
  }
}
