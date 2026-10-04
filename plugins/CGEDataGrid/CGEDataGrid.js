/**
 * CGEDataGrid - Modern Reactive Card Grid & List Engine
 * TailTools Plugin Library
 *
 * Designed for Tailwind CSS v4.3+ and Laravel Blade.
 * Supports dual rendering modes (grid vs list), direct Laravel Blade HTML resource ingestion,
 * interactive card selection, decoupled filter/sort/pagination sub-modules, and seamless CGEActionButton binding.
 */

import { CGEFilter } from './modules/CGEFilter.js';
import { CGESort } from './modules/CGESort.js';
import { CGEPagination } from './modules/CGEPagination.js';

export class CGEDataGrid {
  /**
   * Static registry of all active CGEDataGrid instances
   * @type {Map<HTMLElement, CGEDataGrid>}
   */
  static instances = new Map();

  /**
   * Global default configuration options
   */
  static defaults = {
    source: 'dom', // 'dom' | 'json' | 'ajax'
    data: null, // Array of records (for source: 'json')
    url: null, // Endpoint URL (for source: 'ajax')
    method: 'GET',
    headers: {},
    driver: 'auto', // 'auto' | 'axios' | 'fetch'
    serverSide: false, // true = remote filter/sort/pagination; false = client-side
    perPage: 12,
    perPageOptions: [6, 12, 24, 48, 'All'],
    
    // Layout & View Mode
    layoutMode: 'both', // 'grid' | 'list' | 'both'
    viewMode: 'grid', // Initial active view: 'grid' | 'list'
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    listGap: 'gap-3',

    // Renderers & Resource Keys
    cardRendererGrid: null, // (item, index) => string | HTMLElement
    cardRendererList: null, // (item, index) => string | HTMLElement
    cardRenderer: null, // (item, index, viewMode) => string | HTMLElement (fallback)
    htmlCardKey: 'html_card',
    htmlListKey: 'html_list',

    // Selection
    selectable: false,
    selectOnClick: false,

    // Actions & Interceptors
    autoBindActions: true, // Automatically bind CGEActionButton on render

    ui: {
      wrapper: 'cge-datagrid-wrapper flex flex-col gap-4 font-sans text-slate-900 dark:text-slate-100',
      headerWrapper: 'cge-datagrid-header flex flex-wrap items-center justify-between gap-3',
      searchWrapper: 'relative flex-1 sm:max-w-xs min-w-[200px]',
      searchInput: 'w-full pl-9 pr-3 py-1.5 text-xs rounded-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition',
      searchIcon: 'absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
      controlsWrapper: 'flex flex-wrap items-center gap-2 text-xs',
      sortSelect: 'px-2.5 py-1.5 text-xs rounded-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer',
      viewModeWrapper: 'inline-flex items-center p-0.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
      viewModeButton: 'inline-flex items-center justify-center p-1.5 rounded-sm text-xs font-medium cursor-pointer transition hover:text-slate-900 dark:hover:text-slate-100 select-none',
      viewModeButtonActive: 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold',
      perPageSelect: 'px-2 py-1.5 text-xs rounded-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer',
      
      // Selection toolbar
      selectionBar: 'cge-datagrid-selection-bar flex items-center justify-between gap-3 px-4 py-2.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 transition-all duration-200',
      selectionCount: 'font-semibold',
      selectionActions: 'flex items-center gap-2',
      selectionButton: 'px-2.5 py-1 rounded-sm border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 cursor-pointer font-medium transition',
      selectionDeleteButton: 'px-2.5 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer transition shadow-xs',

      // Cards container
      cardsContainer: 'cge-grid-items relative min-h-[140px] transition-all duration-200',
      cardItem: 'cge-card transition duration-200',
      cardSelected: 'cge-card-selected ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20',
      cardCheckboxWrapper: 'cge-card-checkbox-wrapper absolute top-3 left-3 z-10',
      cardCheckbox: 'w-4 h-4 rounded-sm text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer',

      // Feedback states
      emptyState: 'cge-datagrid-empty py-16 text-center text-xs text-slate-400 dark:text-slate-500 italic',
      loadingOverlay: 'absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-20 transition-opacity',

      // Footer
      footerWrapper: 'cge-datagrid-footer flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400',
      infoWrapper: 'text-xs text-slate-500 dark:text-slate-400',
      paginationWrapper: 'flex items-center gap-1',
      pageButton: 'inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-medium rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none',
      pageButtonActive: '!bg-indigo-600 !border-indigo-600 !text-white font-semibold shadow-xs',
      pageButtonDisabled: 'opacity-40 cursor-not-allowed pointer-events-none',
      jumpWrapper: 'flex items-center gap-1.5 ml-2',
      jumpInput: 'w-12 px-1.5 py-1 text-xs text-center rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500',
      jumpButton: 'px-2 py-1 text-xs font-medium rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition',
    },

    translations: {
      'search-placeholder': 'Search items...',
      'sort-by': 'Sort by...',
      'per-page': 'Show :count items',
      info: 'Showing :from to :to of :total items',
      'no-data': 'No matching records found',
      'selected-count': ':count selected',
      'select-all': 'Select All',
      'clear-selection': 'Clear',
      'delete-selected': 'Delete Selected',
      'confirm-bulk-delete': 'Are you sure you want to delete :count selected items?',
    },
  };

  /**
   * Initializes declarative CGEDataGrid instances on elements with `[data-cge-datagrid]`.
   * @param {HTMLElement | Document} [root=document]
   * @returns {CGEDataGrid[]}
   */
  static init(root = document) {
    const elements = root.querySelectorAll('[data-cge-datagrid]');
    const instances = [];
    elements.forEach((el) => {
      if (!CGEDataGrid.instances.has(el)) {
        let options = {};
        const configAttr = el.getAttribute('data-cge-config');
        if (configAttr) {
          try {
            options = JSON.parse(configAttr);
          } catch (e) {
            console.warn('[CGEDataGrid] Invalid data-cge-config JSON on element:', el, e);
          }
        }
        instances.push(new CGEDataGrid(el, options));
      }
    });
    return instances;
  }

  /**
   * @param {HTMLElement | string} element Root container
   * @param {Partial<typeof CGEDataGrid.defaults>} [options={}] Configuration overrides
   */
  constructor(element, options = {}) {
    this.root = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.root) {
      throw new Error(`[CGEDataGrid] Target container "${element}" not found.`);
    }

    if (CGEDataGrid.instances.has(this.root)) {
      return CGEDataGrid.instances.get(this.root);
    }

    this.options = this._mergeOptions(CGEDataGrid.defaults, options);

    /** @type {'grid' | 'list'} */
    this.viewMode = this.options.viewMode === 'list' ? 'list' : 'grid';

    /** @type {'grid' | 'list' | 'both'} */
    this.layoutMode = ['grid', 'list', 'both'].includes(this.options.layoutMode) ? this.options.layoutMode : 'both';

    /** @type {Set<string | number>} Set of selected item IDs */
    this.selectedIds = new Set();

    /** @type {Array<any>} Primary in-memory dataset */
    this.data = [];

    /** @type {Array<any>} Filtered and sorted dataset */
    this.processedData = [];

    /** @type {boolean} */
    this.loading = false;

    /** @type {Map<string, Set<Function>>} Event listeners map */
    this._listeners = new Map();

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} Internal cleanup registry */
    this._eventCleanups = [];

    // Initialize decoupled sub-modules
    this.filter = new CGEFilter({
      debounce: 300,
      onChange: () => this._onFilterChange(),
    });
    this.filter.grid = this;

    this.sort = new CGESort({
      onChange: () => this._onSortChange(),
    });
    this.sort.grid = this;

    this.pagination = new CGEPagination({
      perPage: this.options.perPage,
      perPageOptions: this.options.perPageOptions,
      translations: {
        info: this.options.translations.info,
        'per-page': this.options.translations['per-page'],
      },
      onChange: () => this._onPaginationChange(),
    });
    this.pagination.grid = this;

    CGEDataGrid.instances.set(this.root, this);

    this._init();
  }

  /**
   * Internal initialization workflow.
   * @private
   */
  _init() {
    this._setupDOMStructure();
    this._bindEvents();

    if (this.options.source === 'json' && Array.isArray(this.options.data)) {
      this.setData(this.options.data);
    } else if (this.options.source === 'dom') {
      this._ingestDOMCards();
      this.refresh();
    } else if (this.options.source === 'ajax') {
      this.fetch();
    }

    this.emit('init', { instance: this });
  }

  /**
   * Sets up or wraps container elements.
   * @private
   */
  _setupDOMStructure() {
    this.root.classList.add(...this.options.ui.wrapper.split(' ').filter(Boolean));

    // 1. Header Toolbar
    let headerEl = this.root.querySelector('.cge-datagrid-header');
    if (!headerEl) {
      headerEl = document.createElement('div');
      headerEl.className = this.options.ui.headerWrapper;
      this.root.prepend(headerEl);
    }
    this.headerEl = headerEl;

    // Search Box
    let searchWrap = this.headerEl.querySelector('.cge-datagrid-search-wrapper');
    if (!searchWrap) {
      searchWrap = document.createElement('div');
      searchWrap.className = `${this.options.ui.searchWrapper} cge-datagrid-search-wrapper`;
      searchWrap.innerHTML = `
        <svg class="${this.options.ui.searchIcon}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" class="${this.options.ui.searchInput}" placeholder="${this.options.translations['search-placeholder']}" />
      `;
      this.headerEl.appendChild(searchWrap);
    }
    const searchInput = searchWrap.querySelector('input');
    if (searchInput) {
      this.filter.attachSearchInput(searchInput);
    }

    // Controls container (Filter slots, Sort dropdown, View switcher, Per page)
    let controlsWrap = this.headerEl.querySelector('.cge-datagrid-controls');
    if (!controlsWrap) {
      controlsWrap = document.createElement('div');
      controlsWrap.className = `${this.options.ui.controlsWrapper} cge-datagrid-controls`;
      this.headerEl.appendChild(controlsWrap);
    }
    this.controlsWrap = controlsWrap;

    // Sort Dropdown (if not already custom provided)
    if (!this.controlsWrap.querySelector('[data-cge-sort]')) {
      const sortSelect = document.createElement('select');
      sortSelect.className = this.options.ui.sortSelect;
      sortSelect.setAttribute('data-cge-sort', '');
      sortSelect.innerHTML = `
        <option value="none">${this.options.translations['sort-by']}</option>
      `;
      this.controlsWrap.appendChild(sortSelect);
      this.sort.attachSortSelect(sortSelect);
    } else {
      const existingSort = this.controlsWrap.querySelector('[data-cge-sort]');
      if (existingSort) {
        this.sort.attachSortSelect(existingSort);
      }
    }

    // View Mode Switcher (only if layoutMode === 'both')
    if (this.layoutMode === 'both' && !this.controlsWrap.querySelector('.cge-view-switcher')) {
      const viewSwitcher = document.createElement('div');
      viewSwitcher.className = `${this.options.ui.viewModeWrapper} cge-view-switcher`;
      viewSwitcher.innerHTML = `
        <button type="button" data-cge-view="grid" class="${this.options.ui.viewModeButton} ${this.viewMode === 'grid' ? this.options.ui.viewModeButtonActive : ''}" title="${this.options.translations['view-grid']}">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
        </button>
        <button type="button" data-cge-view="list" class="${this.options.ui.viewModeButton} ${this.viewMode === 'list' ? this.options.ui.viewModeButtonActive : ''}" title="${this.options.translations['view-list']}">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      `;
      this.controlsWrap.appendChild(viewSwitcher);

      viewSwitcher.querySelectorAll('[data-cge-view]').forEach((btn) => {
        const handler = (e) => {
          e.preventDefault();
          const targetMode = btn.getAttribute('data-cge-view');
          if (targetMode === 'grid' || targetMode === 'list') {
            this.setViewMode(targetMode);
          }
        };
        btn.addEventListener('click', handler);
        this._eventCleanups.push({ element: btn, event: 'click', handler });
      });
    }

    // Per Page Select
    if (!this.controlsWrap.querySelector('.cge-datagrid-perpage')) {
      const perPageSelect = document.createElement('select');
      perPageSelect.className = `${this.options.ui.perPageSelect} cge-datagrid-perpage`;
      this.options.perPageOptions.forEach((opt) => {
        const optEl = document.createElement('option');
        optEl.value = String(opt);
        optEl.textContent = this.options.translations['per-page'].replace(':count', String(opt));
        if (opt === this.pagination.perPage || (opt === 'All' && this.pagination.perPage <= 0)) {
          optEl.selected = true;
        }
        perPageSelect.appendChild(optEl);
      });
      this.controlsWrap.appendChild(perPageSelect);

      const handler = (e) => {
        this.pagination.setPerPage(e.target.value);
      };
      perPageSelect.addEventListener('change', handler);
      this._eventCleanups.push({ element: perPageSelect, event: 'change', handler });
    }

    // 2. Selection Bar (if selectable)
    if (this.options.selectable) {
      let selBar = this.root.querySelector('.cge-datagrid-selection-bar');
      if (!selBar) {
        selBar = document.createElement('div');
        selBar.className = this.options.ui.selectionBar;
        selBar.style.display = 'none';
        selBar.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="${this.options.ui.selectionCount} cge-sel-count">0 selected</span>
          </div>
          <div class="${this.options.ui.selectionActions}">
            <button type="button" class="${this.options.ui.selectionButton} cge-btn-select-all">${this.options.translations['select-all']}</button>
            <button type="button" class="${this.options.ui.selectionButton} cge-btn-clear-selection">${this.options.translations['clear-selection']}</button>
            <button type="button" class="${this.options.ui.selectionDeleteButton} cge-btn-delete-selected">${this.options.translations['delete-selected']}</button>
          </div>
        `;
        this.headerEl.after(selBar);

        const selAllBtn = selBar.querySelector('.cge-btn-select-all');
        const clearBtn = selBar.querySelector('.cge-btn-clear-selection');
        const delBtn = selBar.querySelector('.cge-btn-delete-selected');

        if (selAllBtn) {
          const h = () => this.selectAll();
          selAllBtn.addEventListener('click', h);
          this._eventCleanups.push({ element: selAllBtn, event: 'click', handler: h });
        }
        if (clearBtn) {
          const h = () => this.clearSelection();
          clearBtn.addEventListener('click', h);
          this._eventCleanups.push({ element: clearBtn, event: 'click', handler: h });
        }
        if (delBtn) {
          const h = () => this.deleteSelected();
          delBtn.addEventListener('click', h);
          this._eventCleanups.push({ element: delBtn, event: 'click', handler: h });
        }
      }
      this.selectionBar = selBar;
    }

    // 3. Cards Container
    let cardsContainer = this.root.querySelector('.cge-grid-items');
    if (!cardsContainer) {
      cardsContainer = document.createElement('div');
      cardsContainer.className = this.options.ui.cardsContainer;
      if (this.selectionBar) {
        this.selectionBar.after(cardsContainer);
      } else {
        this.headerEl.after(cardsContainer);
      }
    }
    this.cardsContainer = cardsContainer;
    this._updateCardsContainerLayout();

    // 4. Loading Overlay
    let loadingEl = this.root.querySelector('.cge-datagrid-loading');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = `${this.options.ui.loadingOverlay} cge-datagrid-loading`;
      loadingEl.style.display = 'none';
      loadingEl.innerHTML = `
        <div class="flex items-center gap-2.5 px-4 py-2 rounded-sm bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
          <svg class="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      `;
      this.cardsContainer.appendChild(loadingEl);
    }
    this.loadingEl = loadingEl;

    // 5. Footer Toolbar (Info + Pagination)
    let footerEl = this.root.querySelector('.cge-datagrid-footer');
    if (!footerEl) {
      footerEl = document.createElement('div');
      footerEl.className = this.options.ui.footerWrapper;
      footerEl.innerHTML = `
        <div class="${this.options.ui.infoWrapper} cge-datagrid-info"></div>
        <div class="${this.options.ui.paginationWrapper} cge-datagrid-pagination"></div>
      `;
      this.cardsContainer.after(footerEl);
    }
    this.footerEl = footerEl;
    this.infoEl = footerEl.querySelector('.cge-datagrid-info');
    this.paginationEl = footerEl.querySelector('.cge-datagrid-pagination');
  }

  /**
   * Synchronizes CSS grid vs flex layout classes on cardsContainer.
   * @private
   */
  _updateCardsContainerLayout() {
    if (!this.cardsContainer) return;
    if (this.viewMode === 'list') {
      this.cardsContainer.className = `${this.options.ui.cardsContainer} flex flex-col ${this.options.listGap} cge-view-list`;
    } else {
      this.cardsContainer.className = `${this.options.ui.cardsContainer} grid gap-4 ${this.options.gridCols} cge-view-grid`;
    }
  }

  /**
   * Binds declarative filters and card selection clicks.
   * @private
   */
  _bindEvents() {
    // Declarative field filter selects e.g. <select data-cge-filter="category">
    this.root.querySelectorAll('[data-cge-filter]').forEach((el) => {
      const field = el.getAttribute('data-cge-filter');
      if (field) {
        this.filter.attachFieldFilter(field, el);
      }
    });

    // Card selection delegation on cardsContainer
    if (this.options.selectable) {
      const selectionHandler = (e) => {
        // 1. Checkbox click
        const checkbox = e.target.closest('.cge-card-checkbox, [data-cge-select-id]');
        if (checkbox) {
          const id = checkbox.getAttribute('data-cge-select-id') || checkbox.value;
          if (id) {
            this.toggleSelect(id, checkbox.checked);
          }
          return;
        }

        // 2. Click on card itself if selectOnClick is enabled
        if (this.options.selectOnClick) {
          const card = e.target.closest('.cge-card');
          if (card && !e.target.closest('button, a, input, select, textarea, [data-cge-action]')) {
            const id = card.getAttribute('data-cge-id');
            if (id) {
              const willSelect = !this.selectedIds.has(id);
              this.toggleSelect(id, willSelect);
            }
          }
        }
      };

      this.cardsContainer.addEventListener('click', selectionHandler);
      this._eventCleanups.push({ element: this.cardsContainer, event: 'click', handler: selectionHandler });
    }

    // Auto action button binding listener for card deletion
    if (this.options.autoBindActions) {
      const actionSuccessHandler = (e) => {
        const trigger = e.target;
        if (trigger && this.cardsContainer.contains(trigger)) {
          const card = trigger.closest('.cge-card');
          if (card) {
            this.removeCard(card);
          }
        }
      };

      this.cardsContainer.addEventListener('cge:action:success', actionSuccessHandler);
      this._eventCleanups.push({ element: this.cardsContainer, event: 'cge:action:success', handler: actionSuccessHandler });
    }
  }

  /**
   * Ingests pre-rendered cards present inside `.cge-grid-items`.
   * @private
   */
  _ingestDOMCards() {
    const cards = Array.from(this.cardsContainer.querySelectorAll('.cge-card'));
    this.data = cards.map((card, idx) => {
      const id = card.getAttribute('data-cge-id') || `card-${idx + 1}`;
      card.setAttribute('data-cge-id', id);

      // Scrape text content and custom data attributes
      const record = {
        id,
        _domCard: card.cloneNode(true),
        text: card.textContent.trim(),
      };

      for (const attr of card.attributes) {
        if (attr.name.startsWith('data-cge-') && attr.name !== 'data-cge-id') {
          const key = attr.name.replace('data-cge-', '');
          record[key] = attr.value;
        }
      }

      return record;
    });
  }

  /**
   * Sets new data array and refreshes grid.
   * @param {Array<any>} data
   * @returns {this}
   */
  setData(data) {
    this.data = Array.isArray(data) ? [...data] : [];
    this.pagination.page = 1;
    this.clearSelection();
    this.refresh();
    return this;
  }

  /**
   * Fetches remote data from API (Laravel LengthAwarePaginator compatible).
   * @param {Record<string, any>} [extraParams={}]
   * @returns {Promise<any>}
   */
  async fetch(extraParams = {}) {
    if (!this.options.url) return;

    this.setLoading(true);

    try {
      const queryParams = {
        ...this.filter.serialize(),
        ...this.sort.serialize(),
        ...this.pagination.serialize(),
        ...extraParams,
      };

      const urlObj = new URL(this.options.url, window.location.origin);
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          urlObj.searchParams.set(k, String(v));
        }
      });

      let responseData;
      if (this.options.driver === 'axios' || (this.options.driver === 'auto' && window.axios)) {
        const client = window.axios;
        const res = await client.get(urlObj.toString(), { headers: this.options.headers });
        responseData = res.data;
      } else {
        const res = await fetch(urlObj.toString(), {
          method: this.options.method || 'GET',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...this.options.headers,
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        }
        responseData = await res.json();
      }

      // Handle Laravel LengthAwarePaginator structure
      if (responseData && Array.isArray(responseData.data)) {
        this.data = responseData.data;
        this.pagination.total = responseData.total !== undefined ? responseData.total : responseData.data.length;
        if (responseData.current_page !== undefined) {
          this.pagination.page = responseData.current_page;
        }
        if (responseData.per_page !== undefined) {
          this.pagination.perPage = responseData.per_page;
        }
      } else if (Array.isArray(responseData)) {
        this.data = responseData;
        this.pagination.total = responseData.length;
      } else {
        this.data = [];
        this.pagination.total = 0;
      }

      this.emit('data-loaded', { data: this.data, raw: responseData });
      this._renderCards(this.data);
      this._renderFooter();
      return responseData;
    } catch (err) {
      console.error('[CGEDataGrid] Fetch error:', err);
      this.emit('fetch-error', { error: err });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Refreshes active view, processing filtering, sorting, and pagination locally.
   * @returns {this}
   */
  refresh() {
    if (this.options.serverSide) {
      this.fetch();
      return this;
    }

    // 1. Filter
    let items = this.filter.filterData(this.data);

    // 2. Sort
    items = this.sort.sortData(items);
    this.processedData = items;

    // 3. Paginate
    const paginatedItems = this.pagination.paginateData(items);

    // 4. Render
    this._renderCards(paginatedItems);
    this._renderFooter();
    this._updateSelectionBar();

    this.emit('render', { items: paginatedItems, total: items.length });
    return this;
  }

  /**
   * Renders card elements into cardsContainer.
   * @private
   * @param {Array<any>} items
   */
  _renderCards(items) {
    if (!this.cardsContainer) return;

    // Remove existing cards and empty states (retaining loading overlay)
    const existing = Array.from(this.cardsContainer.children).filter(c => !c.classList.contains('cge-datagrid-loading'));
    existing.forEach(c => c.remove());

    if (!items || items.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = this.options.ui.emptyState;
      emptyEl.textContent = this.options.translations['no-data'];
      this.cardsContainer.appendChild(emptyEl);
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const cardEl = this._createCardElement(item, index);
      fragment.appendChild(cardEl);
    });

    this.cardsContainer.appendChild(fragment);

    // Auto-init CGEActionButton on newly rendered cards
    if (this.options.autoBindActions && window.TailTools && typeof window.TailTools.CGEActionButton?.init === 'function') {
      window.TailTools.CGEActionButton.init(this.cardsContainer);
    }
  }

  /**
   * Constructs an individual card HTMLElement for an item.
   * @private
   * @param {any} item
   * @param {number} index
   * @returns {HTMLElement}
   */
  _createCardElement(item, index) {
    const isList = this.viewMode === 'list';
    const itemId = String(item.id !== undefined ? item.id : `item-${index}`);

    let htmlContent = '';

    // Check 1: Direct Laravel API Resource HTML
    if (isList) {
      htmlContent = item[this.options.htmlListKey] || item.html_list || item.html_row || item.list_html;
    } else {
      htmlContent = item[this.options.htmlCardKey] || item.html_card || item.html_grid || item.card_html;
    }

    // Check 2: JS Callback renderers
    if (!htmlContent) {
      if (isList && typeof this.options.cardRendererList === 'function') {
        htmlContent = this.options.cardRendererList(item, index);
      } else if (!isList && typeof this.options.cardRendererGrid === 'function') {
        htmlContent = this.options.cardRendererGrid(item, index);
      } else if (typeof this.options.cardRenderer === 'function') {
        htmlContent = this.options.cardRenderer(item, index, this.viewMode);
      } else if (item._domCard) {
        const clone = item._domCard.cloneNode(true);
        this._decorateCardElement(clone, itemId);
        return clone;
      }
    }

    let wrapper;
    if (typeof htmlContent === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = htmlContent.trim();
      wrapper = temp.firstElementChild || document.createElement('div');
    } else if (htmlContent instanceof HTMLElement) {
      wrapper = htmlContent;
    } else {
      wrapper = document.createElement('div');
      wrapper.className = 'p-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
      wrapper.textContent = JSON.stringify(item);
    }

    this._decorateCardElement(wrapper, itemId);
    return wrapper;
  }

  /**
   * Decorates a card element with classes, IDs, selection states, and checkboxes.
   * @private
   * @param {HTMLElement} el
   * @param {string} id
   */
  _decorateCardElement(el, id) {
    el.classList.add('cge-card');
    el.setAttribute('data-cge-id', id);

    // Apply selected styling
    if (this.selectedIds.has(id)) {
      el.classList.add(...this.options.ui.cardSelected.split(' ').filter(Boolean));
    } else {
      el.classList.remove(...this.options.ui.cardSelected.split(' ').filter(Boolean));
    }

    // Inject checkbox if selectable and no checkbox exists in card
    if (this.options.selectable) {
      let checkbox = el.querySelector('.cge-card-checkbox, [data-cge-select-id]');
      if (!checkbox) {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = this.options.ui.cardCheckboxWrapper;
        checkboxWrapper.innerHTML = `
          <input type="checkbox" class="${this.options.ui.cardCheckbox} cge-card-checkbox" data-cge-select-id="${id}" ${this.selectedIds.has(id) ? 'checked' : ''} />
        `;
        if (getComputedStyle(el).position === 'static') {
          el.style.position = 'relative';
        }
        el.prepend(checkboxWrapper);
      } else {
        checkbox.checked = this.selectedIds.has(id);
      }
    }
  }

  /**
   * Renders footer information and pagination controls.
   * @private
   */
  _renderFooter() {
    if (!this.footerEl) return;

    // Info counter
    if (this.infoEl) {
      this.infoEl.textContent = this.pagination.formatInfo();
    }

    // Pagination buttons
    if (this.paginationEl) {
      this.paginationEl.innerHTML = '';
      const totalPages = this.pagination.lastPage;

      if (totalPages <= 1) return;

      // Responsive Compact Mode (Mobile): < current / total > + jump
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        this._renderCompactPagination();
        return;
      }

      // Desktop Mode: Sliding numerical window
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = `${this.options.ui.pageButton} ${this.pagination.page <= 1 ? this.options.ui.pageButtonDisabled : ''}`;
      prevBtn.innerHTML = '&lsaquo;';
      prevBtn.title = 'Previous';
      prevBtn.onclick = () => this.pagination.prevPage();
      this.paginationEl.appendChild(prevBtn);

      const win = this.pagination.getWindow();
      win.forEach((p) => {
        if (p === '...') {
          const dots = document.createElement('span');
          dots.className = 'px-1.5 py-1 text-slate-400 select-none';
          dots.textContent = '...';
          this.paginationEl.appendChild(dots);
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          const isActive = p === this.pagination.page;
          btn.className = `${this.options.ui.pageButton} ${isActive ? this.options.ui.pageButtonActive : ''}`;
          btn.textContent = String(p);
          btn.onclick = () => this.pagination.goToPage(p);
          this.paginationEl.appendChild(btn);
        }
      });

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = `${this.options.ui.pageButton} ${this.pagination.page >= totalPages ? this.options.ui.pageButtonDisabled : ''}`;
      nextBtn.innerHTML = '&rsaquo;';
      nextBtn.title = 'Next';
      nextBtn.onclick = () => this.pagination.nextPage();
      this.paginationEl.appendChild(nextBtn);

      // Jump to page input
      const jumpWrap = document.createElement('div');
      jumpWrap.className = this.options.ui.jumpWrapper;
      jumpWrap.innerHTML = `
        <span class="text-slate-400">Go:</span>
        <input type="number" min="1" max="${totalPages}" value="${this.pagination.page}" class="${this.options.ui.jumpInput}" />
      `;
      const jumpInput = jumpWrap.querySelector('input');
      if (jumpInput) {
        jumpInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.pagination.goToPage(jumpInput.value);
          }
        });
      }
      this.paginationEl.appendChild(jumpWrap);
    }
  }

  /**
   * Renders compact pagination for mobile viewports.
   * @private
   */
  _renderCompactPagination() {
    const totalPages = this.pagination.lastPage;

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = `${this.options.ui.pageButton} ${this.pagination.page <= 1 ? this.options.ui.pageButtonDisabled : ''}`;
    prevBtn.innerHTML = '&lsaquo;';
    prevBtn.onclick = () => this.pagination.prevPage();
    this.paginationEl.appendChild(prevBtn);

    const label = document.createElement('span');
    label.className = 'px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 select-none';
    label.textContent = `${this.pagination.page} / ${totalPages}`;
    this.paginationEl.appendChild(label);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = `${this.options.ui.pageButton} ${this.pagination.page >= totalPages ? this.options.ui.pageButtonDisabled : ''}`;
    nextBtn.innerHTML = '&rsaquo;';
    nextBtn.onclick = () => this.pagination.nextPage();
    this.paginationEl.appendChild(nextBtn);
  }

  /**
   * Switches view mode between 'grid' and 'list'.
   * @param {'grid' | 'list'} mode
   * @returns {this}
   */
  setViewMode(mode) {
    if (mode !== 'grid' && mode !== 'list') return this;
    if (this.viewMode === mode) return this;

    this.viewMode = mode;
    this._updateCardsContainerLayout();

    // Update switcher buttons UI
    if (this.controlsWrap) {
      const switcher = this.controlsWrap.querySelector('.cge-view-switcher');
      if (switcher) {
        switcher.querySelectorAll('[data-cge-view]').forEach((btn) => {
          const isTarget = btn.getAttribute('data-cge-view') === mode;
          btn.className = `${this.options.ui.viewModeButton} ${isTarget ? this.options.ui.viewModeButtonActive : ''}`;
        });
      }
    }

    this.refresh();
    this.emit('viewmode', { viewMode: mode });
    return this;
  }

  /**
   * Toggles selection of an item.
   * @param {string | number} id
   * @param {boolean} [force]
   * @returns {this}
   */
  toggleSelect(id, force = null) {
    const strId = String(id);
    const willSelect = force !== null ? force : !this.selectedIds.has(strId);

    if (willSelect) {
      this.selectedIds.add(strId);
    } else {
      this.selectedIds.delete(strId);
    }

    // Update card DOM visual state
    const card = this.cardsContainer.querySelector(`[data-cge-id="${strId}"]`);
    if (card) {
      if (willSelect) {
        card.classList.add(...this.options.ui.cardSelected.split(' ').filter(Boolean));
      } else {
        card.classList.remove(...this.options.ui.cardSelected.split(' ').filter(Boolean));
      }
      const cb = card.querySelector('.cge-card-checkbox, [data-cge-select-id]');
      if (cb) cb.checked = willSelect;
    }

    this._updateSelectionBar();
    this.emit('selection-change', {
      selectedIds: this.getSelectedIds(),
      selectedItems: this.getSelectedItems(),
    });
    return this;
  }

  /**
   * Selects all items currently matching filters.
   * @returns {this}
   */
  selectAll() {
    const targetItems = this.options.serverSide ? this.data : this.processedData;
    targetItems.forEach((item, idx) => {
      const id = String(item.id !== undefined ? item.id : `item-${idx}`);
      this.selectedIds.add(id);
    });

    this._updateCardsSelectionState();
    this._updateSelectionBar();
    this.emit('selection-change', {
      selectedIds: this.getSelectedIds(),
      selectedItems: this.getSelectedItems(),
    });
    return this;
  }

  /**
   * Clears all active selections.
   * @returns {this}
   */
  clearSelection() {
    this.selectedIds.clear();
    this._updateCardsSelectionState();
    this._updateSelectionBar();
    this.emit('selection-change', {
      selectedIds: [],
      selectedItems: [],
    });
    return this;
  }

  /**
   * Returns array of selected item IDs.
   * @returns {string[]}
   */
  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  /**
   * Returns array of selected item objects.
   * @returns {any[]}
   */
  getSelectedItems() {
    const idSet = this.selectedIds;
    return this.data.filter((item, idx) => {
      const id = String(item.id !== undefined ? item.id : `item-${idx}`);
      return idSet.has(id);
    });
  }

  /**
   * Deletes all currently selected cards with user confirmation.
   * @returns {Promise<number>} Number of removed items
   */
  async deleteSelected() {
    const count = this.selectedIds.size;
    if (count === 0) return 0;

    // Trigger confirmation via CGEAlert if available, or native confirm
    const confirmMessage = this.options.translations['confirm-bulk-delete'].replace(':count', String(count));
    let confirmed = false;

    if (window.TailTools && typeof window.TailTools.CGEAlert?.confirm === 'function') {
      try {
        const res = await window.TailTools.CGEAlert.confirm({
          title: 'Delete Selected Items',
          text: confirmMessage,
          variant: 'destructive',
          confirmText: 'Delete All',
        });
        confirmed = res && res.isConfirmed;
      } catch {
        confirmed = false;
      }
    } else {
      confirmed = window.confirm(confirmMessage);
    }

    if (!confirmed) return 0;

    const idsToDelete = new Set(this.selectedIds);
    this.data = this.data.filter((item, idx) => {
      const id = String(item.id !== undefined ? item.id : `item-${idx}`);
      return !idsToDelete.has(id);
    });

    this.clearSelection();
    this.refresh();
    this.emit('bulk-delete', { deletedCount: count, deletedIds: Array.from(idsToDelete) });
    return count;
  }

  /**
   * Smoothly removes a card from view and dataset with animation.
   * @param {HTMLElement | string} target Card element or ID
   * @returns {boolean}
   */
  removeCard(target) {
    const card = typeof target === 'string' ? this.cardsContainer.querySelector(`[data-cge-id="${target}"]`) : target;
    if (!card) return false;

    const id = card.getAttribute('data-cge-id');

    // Add scale-down fade exit transition
    card.style.transition = 'all 250ms ease-out';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';

    setTimeout(() => {
      card.remove();

      // Remove from data arrays
      if (id) {
        this.selectedIds.delete(id);
        this.data = this.data.filter((item, idx) => {
          const itemId = String(item.id !== undefined ? item.id : `item-${idx}`);
          return itemId !== id;
        });
      }

      this.pagination.setTotal(this.data.length);
      this._renderFooter();
      this._updateSelectionBar();
      this.emit('card-removed', { id, card });
    }, 250);

    return true;
  }

  /**
   * Synchronizes visual selection classes and checkboxes across all visible cards.
   * @private
   */
  _updateCardsSelectionState() {
    if (!this.cardsContainer) return;
    this.cardsContainer.querySelectorAll('.cge-card').forEach((card) => {
      const id = card.getAttribute('data-cge-id');
      const isSelected = this.selectedIds.has(id);

      if (isSelected) {
        card.classList.add(...this.options.ui.cardSelected.split(' ').filter(Boolean));
      } else {
        card.classList.remove(...this.options.ui.cardSelected.split(' ').filter(Boolean));
      }

      const cb = card.querySelector('.cge-card-checkbox, [data-cge-select-id]');
      if (cb) cb.checked = isSelected;
    });
  }

  /**
   * Updates selection bar counter and visibility.
   * @private
   */
  _updateSelectionBar() {
    if (!this.selectionBar) return;
    const count = this.selectedIds.size;
    if (count > 0) {
      this.selectionBar.style.display = 'flex';
      const countEl = this.selectionBar.querySelector('.cge-sel-count');
      if (countEl) {
        countEl.textContent = this.options.translations['selected-count'].replace(':count', String(count));
      }
    } else {
      this.selectionBar.style.display = 'none';
    }
  }

  /**
   * Toggles loading overlay display.
   * @param {boolean} isLoading
   * @returns {this}
   */
  setLoading(isLoading) {
    this.loading = Boolean(isLoading);
    if (this.loadingEl) {
      this.loadingEl.style.display = this.loading ? 'flex' : 'none';
    }
    return this;
  }

  // --- Sub-module Event Handlers ---

  _onFilterChange() {
    this.pagination.page = 1;
    this.refresh();
  }

  _onSortChange() {
    this.refresh();
  }

  _onPaginationChange() {
    this.refresh();
  }

  // --- Event Dispatching System ---

  /**
   * Attaches an event listener.
   * @param {string} event
   * @param {Function} handler
   * @returns {this}
   */
  on(event, handler) {
    if (typeof handler !== 'function') return this;
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  /**
   * Removes an event listener.
   * @param {string} event
   * @param {Function} handler
   * @returns {this}
   */
  off(event, handler) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(handler);
    }
    return this;
  }

  /**
   * Dispatches an event locally and as a DOM CustomEvent.
   * @param {string} event
   * @param {any} [detail={}]
   */
  emit(event, detail = {}) {
    const payload = { ...detail, instance: this };

    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`[CGEDataGrid] Error in "${event}" event listener:`, e);
        }
      });
    }

    if (this.root) {
      const customEvent = new CustomEvent(`cge:datagrid:${event}`, {
        bubbles: true,
        cancelable: true,
        detail: payload,
      });
      this.root.dispatchEvent(customEvent);
    }
  }

  /**
   * Deep merges user options with defaults.
   * @private
   */
  _mergeOptions(defaults, overrides) {
    const result = { ...defaults, ...overrides };
    if (overrides.ui) {
      result.ui = { ...defaults.ui, ...overrides.ui };
    }
    if (overrides.translations) {
      result.translations = { ...defaults.translations, ...overrides.translations };
    }
    return result;
  }

  /**
   * Teardown and cleanup of instances, listeners, and sub-modules.
   */
  destroy() {
    for (const item of this._eventCleanups) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._eventCleanups = [];

    this.filter.destroy();
    this.sort.destroy();
    this.pagination.destroy();

    this._listeners.clear();
    CGEDataGrid.instances.delete(this.root);
    this.emit('destroyed', { instance: this });
  }
}

export default CGEDataGrid;
