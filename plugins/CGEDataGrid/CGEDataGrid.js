import { escapeHTML, initializeCollection, cancelCollectionWork, delayCollection, frameCollection, fetchCollection,
  readCollectionResponse, resolveParamNames } from '../shared/collection.js';
import { destroyInstances, pruneInstances } from '../shared/dom.js';
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

export { escapeHTML };

// Both collection plugins emit these synonyms so Grid and Table listeners are interchangeable.
const EVENT_ALIASES = { render: 'rendered', 'selection-change': 'selection:change', destroyed: 'destroy', 'fetch-error': 'error' };

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

    // Search, server parameters & responses
    searchKeys: null, // Fields searched by the global query (default: primitive, non-underscore, non-html_* fields)
    locale: null, // Search/sort locale; defaults to <html lang>
    allValue: -1, // per_page value sent for the "All" option
    paramNames: {}, // { page, perPage, sort, direction, search, filters, cursor }
    responseAdapter: null, // (response) => ({ rows, total, page, perPage, lastPage, hasMore })
    axiosInstance: null, // Configured axios instance (falls back to window.axios)

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
      loadingOverlay: 'absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-20 transition-opacity duration-200',

      // Footer
      footerWrapper: 'cge-datagrid-footer flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400',
      infoWrapper: 'text-xs text-slate-500 dark:text-slate-400',
      paginationWrapper: 'w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 flex-wrap',
      pageButton: 'inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-medium rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none',
      pageButtonActive: '!bg-indigo-600 !border-indigo-600 !text-white font-semibold shadow-xs',
      pageButtonDisabled: 'opacity-40 cursor-not-allowed pointer-events-none',
      jumpWrapper: 'flex items-center gap-1.5 ml-2',
      jumpInput: 'w-12 px-1.5 py-1 text-xs text-center rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500',
      jumpButton: 'px-2 py-1 text-xs font-medium rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition',
    },

    translations: {
      'search-placeholder': 'Search items...',
      'view-grid': 'Grid view',
      'view-list': 'List view',
      'sort-by': 'Sort by...',
      'per-page': 'Show :count items',
      info: 'Showing :from to :to of :total items',
      'info-simple': 'Showing :from to :to items',
      'no-data': 'No matching records found',
      loading: 'Loading data...',
      prev: 'Previous',
      next: 'Next',
      'go-to-page': 'Go to page',
      jump: 'Go',
      pagination: 'Pagination',
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
    pruneInstances(CGEDataGrid.instances);
    const elements = [...root.querySelectorAll('[data-cge-datagrid]')];
    if (root.matches?.('[data-cge-datagrid]')) elements.unshift(root);
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
   * Destroys instances whose root is inside root or already detached (Livewire/Turbo teardown).
   * @param {Document | HTMLElement} [root=document]
   * @returns {CGEDataGrid[]} Destroyed instances
   */
  static destroyAll(root = document) {
    return destroyInstances(CGEDataGrid.instances, root);
  }

  /**
   * Retrieves an existing instance by root element or selector.
   * @param {HTMLElement | string} target
   * @returns {CGEDataGrid | null}
   */
  static get(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    return el ? (CGEDataGrid.instances.get(el) || null) : null;
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

    initializeCollection(this, this.root);
    this._itemIds = new Map();
    this.options = this._mergeOptions(CGEDataGrid.defaults, options);

    /** @type {'grid' | 'list'} */
    this.viewMode = this.options.viewMode === 'list' ? 'list' : 'grid';

    /** @type {'grid' | 'list' | 'both'} */
    this.layoutMode = ['grid', 'list', 'both'].includes(this.options.layoutMode) ? this.options.layoutMode : 'both';

    /** @type {Set<string | number>} Set of selected item IDs */
    if (this.layoutMode !== 'both') this.viewMode = this.layoutMode;
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
    const names = resolveParamNames(this.options.paramNames);
    this.filter = new CGEFilter({
      debounce: 300,
      locale: this.options.locale,
      searchKeys: this.options.searchKeys,
      excludeKeys: [this.options.htmlCardKey, this.options.htmlListKey],
      searchParam: names.search,
      filtersParam: names.filters,
      onChange: () => this._onFilterChange(),
    });
    this.filter.grid = this;

    this.sort = new CGESort({
      locale: this.options.locale,
      sortByParam: names.sort,
      sortDirParam: names.direction,
      onChange: () => this._onSortChange(),
    });
    this.sort.grid = this;

    this.pagination = new CGEPagination({
      perPage: this.options.perPage,
      perPageOptions: this.options.perPageOptions,
      allValue: this.options.allValue,
      pageParam: names.page,
      perPageParam: names.perPage,
      cursorParam: names.cursor,
      translations: {
        info: this.options.translations.info,
        'info-simple': this.options.translations['info-simple'],
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
      this.fetch().catch(() => {});
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

    }
    if (this.layoutMode === 'both') {
      this.controlsWrap.querySelectorAll('[data-cge-view]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-cge-view') === this.viewMode));
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
        if (String(opt) === String(this.pagination.perPage) || (String(opt).toLowerCase() === 'all' && this.pagination.perPage <= 0)) {
          optEl.selected = true;
        }
        perPageSelect.appendChild(optEl);
      });
      this.controlsWrap.appendChild(perPageSelect);
    }
    const perPageSelect = this.controlsWrap.querySelector('.cge-datagrid-perpage');
    if (perPageSelect) {
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
      }
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
      loadingEl.classList.add('hidden', 'opacity-0');
      loadingEl.innerHTML = `
        <div class="flex items-center gap-2.5 px-4 py-2 rounded-sm bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
          <svg aria-hidden="true" class="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>${escapeHTML(this.options.translations.loading)}</span>
        </div>
      `;
      this.cardsContainer.appendChild(loadingEl);
    }
    this.loadingEl = loadingEl;
    this.loadingEl.setAttribute('role', 'status');
    this.loadingEl.setAttribute('aria-live', 'polite');
    this.loadingEl.setAttribute('aria-hidden', 'true');

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
            const action = (e.detail?.action || trigger.getAttribute('data-cge-action') || '').toLowerCase();
            if (['delete', 'revoke', 'destroy', 'remove', 'cancel', 'forcedelete'].includes(action) || trigger.hasAttribute('data-cge-delete-card')) this.removeCard(card);
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
    if (this._destroyed) return this;
    cancelCollectionWork(this);
    this.setLoading(false);
    this._indexData(Array.isArray(data) ? [...data] : []);
    this.pagination.resetPage();
    this.clearSelection();
    this.refresh();
    return this;
  }

  /**
   * Fetches remote data (Laravel paginate, API Resource meta, simplePaginate, cursorPaginate,
   * plain arrays or responseAdapter output). Failures emit 'fetch-error' and 'error' and reject.
   * @param {Record<string, any>} [extraParams={}]
   * @returns {Promise<any>}
   */
  async fetch(extraParams = {}) {
    if (this._destroyed || !this.options.url) return;
    this._requestController?.abort();
    const controller = this._requestController = new AbortController();
    const requestId = ++this._requestId;
    this.setLoading(true);

    try {
      const queryParams = {
        ...this.filter.serialize(),
        ...this.sort.serialize(),
        ...this.pagination.serialize(),
        ...extraParams,
      };

      const responseData = await fetchCollection(this.options, queryParams, controller.signal);
      if (this._destroyed || requestId !== this._requestId) return;

      const result = readCollectionResponse(responseData, this.options.responseAdapter);
      const page = result.page ?? this.pagination.page;
      this._indexData(result.rows, this.options.serverSide ? page : null);
      if (this.options.serverSide) {
        this.pagination.setMetrics({
          mode: result.mode,
          total: result.mode ? result.total : (result.total ?? result.rows.length),
          page,
          perPage: result.perPage,
          lastPage: result.lastPage,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          prevCursor: result.prevCursor,
          count: result.rows.length,
        });
      }

      this.emit('data-loaded', { data: this.data, raw: responseData });
      if (this._destroyed || requestId !== this._requestId) return;
      if (this.options.serverSide) {
        this._renderCards(this.data);
        this._renderFooter();
        this._updateSelectionBar();
        this.emit('render', { items: this.data, total: this.pagination.total });
      } else this.refresh();
      return responseData;
    } catch (err) {
      if (!this._destroyed && requestId === this._requestId && !controller.signal.aborted) {
        this.emit('fetch-error', { error: err });
        throw err;
      }
    } finally {
      if (!this._destroyed && requestId === this._requestId) this.setLoading(false);
    }
  }

  _indexData(data, page = null) {
    ++this._dataVersion;
    this.data = data;
    this._itemIds = new Map(data.map((item, index) => [item, this._fallbackId(item, index, page)]));
  }

  /**
   * Item ID: item.id, otherwise a fallback. Server pages are prefixed with the page number so
   * a selection on page 1 never matches the same position on page 2.
   * @private
   */
  _fallbackId(item, index, page = null) {
    if (item?.id !== undefined && item?.id !== null) return String(item.id);
    if (page === null || page === undefined) return `item-${index}`;
    if (!this._warnedFallbackIds) {
      this._warnedFallbackIds = true;
      console.warn('[CGEDataGrid] Server items without an id use page-scoped fallback IDs; add an "id" field for stable selection.');
    }
    return `p${page}-item-${index}`;
  }

  _getItemId(item, index) {
    return this._itemIds?.get(item) ?? String(item?.id ?? `item-${index}`);
  }

  _refreshAfterRemoval(count) {
    if (this.options.serverSide && this.options.source === 'ajax') {
      if (this.pagination.totalKnown) this.pagination.setTotal(Math.max(0, this.pagination.total - count));
      else this.pagination.setMetrics({ count: this.data.length });
      this._renderCards(this.data);
      this._renderFooter();
      this._updateSelectionBar();
      this.emit('render', { items: this.data, total: this.pagination.total });
    } else this.refresh();
  }

  /**
   * Refreshes active view, processing filtering, sorting, and pagination locally.
   * @returns {this}
   */
  refresh() {
    if (this._destroyed) return this;
    if (this.options.serverSide && this.options.source === 'ajax') {
      this.fetch().catch(() => {});
      return this;
    }

    // 1. Filter (global search only reads searchKeys or primitive public fields)
    let items = this.filter.filterData(this.data, this.options.searchKeys);

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
    const actions = window.CGEActionButton || window.TailTools?.CGEActionButton;
    if (this.options.autoBindActions && typeof actions?.init === 'function') actions.init();
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
    const itemId = this._getItemId(item, index);

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
          <input type="checkbox" class="${this.options.ui.cardCheckbox} cge-card-checkbox" data-cge-select-id="${escapeHTML(id)}" ${this.selectedIds.has(id) ? 'checked' : ''} />
        `;
        if (getComputedStyle(el).position === 'static') {
          el.style.position = 'relative';
        }
        el.prepend(checkboxWrapper);
      } else {
        checkbox.setAttribute('data-cge-select-id', id);
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
    if (this.infoEl) this.infoEl.textContent = this.pagination.formatInfo();
    this._syncPerPageSelect();
    if (!this.paginationEl) return;
    this.paginationEl.replaceChildren();
    this.paginationEl.setAttribute('role', 'navigation');
    this.paginationEl.setAttribute('aria-label', this.options.translations.pagination);
    if (this.pagination.lastPage <= 1) return;
    this._renderCompactPagination();
    this._renderDesktopPagination();
  }

  /**
   * Shows the active limit in the per-page select (All stays selected when the server
   * answers with per_page = total); unknown server values leave the selection untouched.
   * @private
   */
  _syncPerPageSelect() {
    const select = this.controlsWrap?.querySelector('.cge-datagrid-perpage');
    if (!select) return;
    const perPage = this.pagination.perPage;
    const wanted = perPage > 0 ? [String(perPage)] : ['All', 'all', String(this.options.allValue)];
    const option = Array.from(select.options).find(item => wanted.includes(item.value));
    if (option && select.value !== option.value) select.value = option.value;
  }

  _paginationButton(label, action, { disabled = false, active = false } = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = [this.options.ui.pageButton,
      disabled ? this.options.ui.pageButtonDisabled : '', active ? this.options.ui.pageButtonActive : ''].join(' ');
    button.textContent = label;
    button.disabled = disabled;
    if (active) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', action);
    return button;
  }

  _navigationButton(direction, compact = false) {
    const previous = direction === 'prev';
    const label = this.options.translations[direction];
    const button = this._paginationButton(label,
      () => previous ? this.pagination.prevPage() : this.pagination.nextPage(),
      { disabled: previous ? this.pagination.page <= 1 : this.pagination.page >= this.pagination.lastPage });
    button.setAttribute('data-cge-page-action', direction);
    button.setAttribute('aria-label', label);
    if (compact) {
      button.innerHTML = previous
        ? '<svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M12 5 7 10l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="m8 5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return button;
  }

  _renderJumpControls(compact = false) {
    const wrapper = document.createElement('div');
    wrapper.className = compact ? 'flex items-center gap-1.5' : this.options.ui.jumpWrapper;
    const label = document.createElement('span');
    label.className = 'text-slate-400 text-[11px]';
    label.textContent = this.options.translations['go-to-page'] + ':';
    const input = document.createElement('input');
    input.type = 'number'; input.min = '1'; input.max = String(this.pagination.lastPage);
    input.value = String(this.pagination.page);
    input.className = this.options.ui.jumpInput + (compact ? ' w-11 h-7' : '');
    input.setAttribute('data-cge-jump-input', '');
    input.setAttribute('aria-label', this.options.translations['go-to-page']);
    const jump = () => this.pagination.goToPage(input.value);
    const button = this._paginationButton(this.options.translations.jump, jump);
    button.className = this.options.ui.jumpButton;
    button.setAttribute('data-cge-jump-btn', '');
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); jump(); }
    });
    wrapper.append(label, input, button);
    return wrapper;
  }

  _renderCompactPagination() {
    const compact = document.createElement('div');
    compact.className = 'cge-pagination-compact flex sm:hidden items-center justify-between w-full gap-2 flex-wrap py-1';
    const navigation = document.createElement('div');
    navigation.className = 'flex items-center gap-1';
    const label = document.createElement('span');
    label.className = 'inline-flex items-center justify-center px-2.5 h-7 text-xs font-semibold rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 select-none';
    label.textContent = this.pagination.totalKnown ? this.pagination.page + ' / ' + this.pagination.lastPage : String(this.pagination.page);
    label.setAttribute('aria-live', 'polite');
    navigation.append(this._navigationButton('prev', true), label, this._navigationButton('next', true));
    compact.append(navigation);
    if (this.pagination.mode !== 'cursor') compact.append(this._renderJumpControls(true));
    this.paginationEl.append(compact);
  }

  _renderDesktopPagination() {
    const desktop = document.createElement('div');
    desktop.className = 'cge-pagination-desktop hidden sm:flex items-center gap-1 flex-wrap';
    desktop.append(this._navigationButton('prev'));
    for (const page of this.pagination.getWindow()) {
      if (page === '...') {
        const dots = document.createElement('span');
        dots.className = 'px-1 text-slate-400 select-none'; dots.textContent = '...'; desktop.append(dots);
      } else {
        const button = this._paginationButton(String(page), () => this.pagination.goToPage(page),
          { active: page === this.pagination.page });
        button.setAttribute('data-cge-page', String(page)); desktop.append(button);
      }
    }
    desktop.append(this._navigationButton('next'));
    if (this.pagination.lastPage > 5 && this.pagination.mode !== 'cursor') desktop.append(this._renderJumpControls());
    this.paginationEl.append(desktop);
  }

  /** Switches the active card view without refetching a loaded server page. */
  setViewMode(mode) {
    if (this._destroyed || (mode !== 'grid' && mode !== 'list') || (this.layoutMode !== 'both' && mode !== this.layoutMode)) return this;
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
          btn.setAttribute('aria-pressed', String(isTarget));
        });
      }
    }

    if (this.options.serverSide && this.options.source === 'ajax') this._renderCards(this.data);
    else this.refresh();
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
    const card = this.cardsContainer.querySelector(`[data-cge-id="${CSS.escape(strId)}"]`);
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
      const id = this._getItemId(item, idx);
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
      const id = this._getItemId(item, idx);
      return idSet.has(id);
    });
  }

  /**
   * Deletes all currently selected cards with user confirmation.
   * @returns {Promise<number>} Number of removed items
   */
  async deleteSelected() {
    if (this._destroyed || this._confirmingDelete || !this.selectedIds.size) return 0;
    const idsToDelete = new Set(this.selectedIds);
    const originalData = this.data;
    const message = this.options.translations['confirm-bulk-delete'].replace(':count', String(idsToDelete.size));
    this._confirmingDelete = true;
    try {
      const alert = window.CGEAlert || window.TailTools?.CGEAlert;
      const result = alert?.confirm ? await alert.confirm('Delete Selected Items', message, { archetype: 'delete' }) : window.confirm(message);
      if (!(result === true || result?.isConfirmed) || this._destroyed || this.data !== originalData) return 0;
      this.data = this.data.filter((item, idx) => !idsToDelete.has(this._getItemId(item, idx)));
      const removed = originalData.length - this.data.length;
      idsToDelete.forEach(id => this.selectedIds.delete(id));
      this._updateCardsSelectionState();
      this._refreshAfterRemoval(removed);
      this.emit('selection-change', { selectedIds: this.getSelectedIds(), selectedItems: this.getSelectedItems() });
      this.emit('bulk-delete', { deletedCount: removed, deletedIds: Array.from(idsToDelete) });
      return removed;
    } catch {
      return 0;
    } finally { this._confirmingDelete = false; }
  }

  /** Removes a card locally after its exit animation. */

  removeCard(target) {
    if (this._destroyed) return false;
    const card = typeof target === 'string' ? this.cardsContainer.querySelector(`[data-cge-id="${CSS.escape(target)}"]`) : target;
    if (!card || !this.cardsContainer.contains(card) || card.dataset.cgeRemoving) return false;
    const id = card.getAttribute('data-cge-id');
    const version = this._dataVersion;
    card.dataset.cgeRemoving = 'true';
    card.style.transition = 'all 250ms ease-out'; card.style.opacity = '0'; card.style.transform = 'scale(0.95)';
    delayCollection(this, () => {
      if (this._dataVersion !== version) return;
      const previousCount = this.data.length;
      card.remove(); this.selectedIds.delete(id);
      this.data = this.data.filter((item, idx) => this._getItemId(item, idx) !== id);
      this._refreshAfterRemoval(previousCount - this.data.length);
      this.emit('card-removed', { id, card });
    });
    return true;
  }

  /** Synchronizes visible selection state. */

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
    if (this._destroyed) return this;
    this.loading = Boolean(isLoading);
    this.root.setAttribute('aria-busy', String(this.loading));
    this.cardsContainer.setAttribute('aria-busy', String(this.loading));
    if (!this.loadingEl) return this;
    if (this._loadingTimer != null) {
      clearTimeout(this._loadingTimer); this._timers.delete(this._loadingTimer); this._loadingTimer = null;
    }
    if (this._loadingFrame != null) {
      cancelAnimationFrame(this._loadingFrame); this._frames.delete(this._loadingFrame); this._loadingFrame = null;
    }
    this.loadingEl.setAttribute('aria-hidden', String(!this.loading));
    this.loadingEl.style.removeProperty('display');
    if (this.loading) {
      this.loadingEl.classList.remove('hidden');
      this._loadingFrame = frameCollection(this, () => {
        this._loadingFrame = null;
        if (this.loading) this.loadingEl.classList.remove('opacity-0');
      });
    } else {
      this.loadingEl.classList.add('opacity-0');
      if (!this.loadingEl.classList.contains('hidden')) {
        this._loadingTimer = delayCollection(this, () => {
          this._loadingTimer = null;
          if (!this.loading) this.loadingEl.classList.add('hidden');
        }, 200);
      }
    }
    return this;
  }

  // --- Sub-module Event Handlers ---

  _onFilterChange() {
    this.pagination.resetPage(); // page 1 and no stale cursor
    this.refresh();
  }

  _onSortChange() {
    if (this.pagination.mode === 'cursor') this.pagination.resetPage();
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
    if (this._destroyed && event !== 'destroyed') return;
    const payload = { ...detail, instance: this };
    this._dispatch(event, payload);
    if (EVENT_ALIASES[event]) this._dispatch(EVENT_ALIASES[event], payload);
  }

  /** @private */
  _dispatch(event, payload) {
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
    if (this._destroyed) return;
    this._destroyed = true;
    cancelCollectionWork(this);
    this.emit('destroyed', { instance: this });
    for (const item of this._eventCleanups) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._eventCleanups = [];

    this.filter.destroy();
    this.sort.destroy();
    this.pagination.destroy();

    this._listeners.clear();
    CGEDataGrid.instances.delete(this.root);
    this.loading = false;
    this._restoreDOM();
  }
}

export default CGEDataGrid;
