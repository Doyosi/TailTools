/**
 * CGEDataTable - Modular High-Performance Data Grid Engine
 * TailTools Plugin Library
 *
 * Designed for Tailwind CSS v4.3+ and Laravel Blade environments.
 * Decoupled sub-module architecture connecting independent standalone modules:
 * - CGEFilter (filtering)
 * - CGESort (sorting)
 * - CGEPagination (pagination & metrics)
 * - CGEResponsive (adaptive collapse, cards, scroll)
 *
 * Supports multi-format data ingestion (DOM table, in-memory JSON, Laravel LengthAwarePaginator Ajax,
 * flat Ajax, and server-rendered Blade HTML rows), headless UI styling, and automated CGEActionButton binding.
 */

import { CGEFilter } from './modules/CGEFilter.js';
import { CGESort } from './modules/CGESort.js';
import { CGEPagination } from './modules/CGEPagination.js';
import { CGEResponsive } from './modules/CGEResponsive.js';

export class CGEDataTable {
  /**
   * Static registry of all active CGEDataTable instances
   * @type {Map<HTMLElement, CGEDataTable>}
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
    columns: [], // Array of column definitions: { key, label, sortable, type, priority, formatter, align }
    serverSide: false, // true = remote filter/sort/pagination; false = client-side
    perPage: 10,
    perPageOptions: [10, 25, 50, 100, 'All'],
    responsiveMode: 'collapse', // 'collapse' | 'cards' | 'scroll'
    autoBindActions: true, // Automatically bind CGEActionButton on render
    selectable: false, // Enable row selection checkboxes and bulk actions
    ui: {
      wrapper: 'cge-datatable-wrapper flex flex-col gap-3 font-sans text-slate-900 dark:text-slate-100',
      headerWrapper: 'cge-datatable-header flex flex-col sm:flex-row items-center justify-between gap-3',
      searchWrapper: 'relative flex-1 sm:max-w-xs w-full',
      searchInput: 'w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition',
      searchIcon: 'absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
      perPageWrapper: 'flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400',
      perPageSelect: 'px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
      tableWrapper: 'cge-table-container relative overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs',
      table: 'w-full text-left text-xs text-slate-600 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800',
      thead: 'bg-slate-50/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-semibold text-[11px] tracking-wider select-none',
      th: 'px-4 py-3',
      tbody: 'divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900',
      tr: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
      td: 'px-4 py-3 align-middle',
      emptyRow: 'px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic',
      loadingOverlay: 'absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-20 transition-opacity',
      footerWrapper: 'cge-datatable-footer flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400',
      infoWrapper: 'text-xs text-slate-500 dark:text-slate-400',
      paginationWrapper: 'flex items-center gap-1',
      pageButton: 'inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none',
      pageButtonActive: '!bg-indigo-600 !border-indigo-600 !text-white font-semibold shadow-xs',
      pageButtonDisabled: 'opacity-40 cursor-not-allowed pointer-events-none',
      jumpWrapper: 'flex items-center gap-1.5 ml-2',
      jumpInput: 'w-12 px-1.5 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500',
    },
    translations: {
      'search-placeholder': 'Search records...',
      'per-page': 'Show :count entries',
      info: 'Showing :from to :to of :total entries',
      'no-data': 'No matching records found',
      loading: 'Loading data...',
      prev: 'Previous',
      next: 'Next',
      'go-to-page': 'Go to page',
      all: 'All',
      jump: 'Go',
      'collapse-details': 'Details',
      'clear-selection': 'Clear All',
      'delete-selected': 'Delete Selected',
      'selected-count': ':count selected',
      'delete-selected-confirm': 'Are you sure you want to delete :count selected records?',
    },
  };

  /**
   * @param {HTMLTableElement | HTMLElement | string} element Target table or container element
   * @param {Object} [options={}] Configuration options
   */
  constructor(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) {
      throw new Error(`[CGEDataTable] Target element not found: ${element}`);
    }

    if (CGEDataTable.instances.has(el)) {
      return CGEDataTable.instances.get(el);
    }

    this.rawElement = el;

    // Resolve table, wrapper, thead, tbody
    if (el.tagName === 'TABLE') {
      this.tableElement = el;
      this.wrapperElement = null; // Created dynamically if not wrapping
    } else {
      this.wrapperElement = el;
      this.tableElement = el.querySelector('table');
      if (!this.tableElement) {
        this.tableElement = document.createElement('table');
        this.wrapperElement.appendChild(this.tableElement);
      }
    }

    // Merge declarative data-attributes with default and passed options
    this.options = this._mergeOptions(options);

    /** @type {Array<any>} Ingested raw row objects */
    this.rawRows = [];

    /** @type {Array<any>} Rows after filtering */
    this.filteredRows = [];

    /** @type {Array<any>} Rows after sorting */
    this.sortedRows = [];

    /** @type {Array<any>} Current page rows */
    this.pagedRows = [];

    /** @type {Array<{ key: string, label: string, sortable?: boolean, type?: string, priority?: number, formatter?: Function, align?: string, visible?: boolean }>} */
    this.columns = [];

    /** @type {Set<string>} Selected row IDs */
    this.selectedRowIds = new Set();

    /** @type {boolean} */
    this.loading = false;

    /** @type {Map<string, Set<Function>>} Event listeners map */
    this._listeners = new Map();

    /** @type {HTMLElement | null} */
    this.thead = null;

    /** @type {HTMLElement | null} */
    this.tbody = null;

    /** @type {HTMLElement | null} */
    this.selectionBar = null;

    /** @type {HTMLElement | null} */
    this.loadingOverlay = null;

    /** @type {CGEFilter} */
    this.filter = null;

    /** @type {CGESort} */
    this.sort = null;

    /** @type {CGEPagination} */
    this.pagination = null;

    /** @type {CGEResponsive} */
    this.responsive = null;

    // Initialize sub-modules & pipeline
    this._init();

    CGEDataTable.instances.set(this.rawElement, this);
    CGEDataTable.instances.set(this.tableElement, this);
  }

  /**
   * Merges options with declarative data-attributes.
   * @private
   */
  _mergeOptions(passedOptions) {
    const el = this.tableElement || this.rawElement;
    const attrOpts = {};

    if (el.hasAttribute('data-cge-source')) attrOpts.source = el.getAttribute('data-cge-source');
    if (el.hasAttribute('data-cge-url')) attrOpts.url = el.getAttribute('data-cge-url');
    if (el.hasAttribute('data-cge-method')) attrOpts.method = el.getAttribute('data-cge-method');
    if (el.hasAttribute('data-cge-driver')) attrOpts.driver = el.getAttribute('data-cge-driver');
    if (el.hasAttribute('data-cge-server-side')) attrOpts.serverSide = el.getAttribute('data-cge-server-side') !== 'false';
    if (el.hasAttribute('data-cge-per-page')) attrOpts.perPage = el.getAttribute('data-cge-per-page');
    if (el.hasAttribute('data-cge-responsive')) attrOpts.responsiveMode = el.getAttribute('data-cge-responsive');
    if (el.hasAttribute('data-cge-selectable')) attrOpts.selectable = el.getAttribute('data-cge-selectable') !== 'false';

    return {
      ...CGEDataTable.defaults,
      ...attrOpts,
      ...passedOptions,
      ui: { ...CGEDataTable.defaults.ui, ...(passedOptions.ui || {}) },
      translations: { ...CGEDataTable.defaults.translations, ...(passedOptions.translations || {}) },
    };
  }

  /**
   * Initializes component structure, sub-modules, and data pipeline.
   * @private
   */
  _init() {
    this._setupDOMStructure();
    this._parseColumns();
    this._initSubModules();
    this._bindTableEvents();


    // Ingest data based on source configuration
    if (this.options.source === 'dom') {
      this._ingestFromDOM();
      this.refresh();
    } else if (this.options.source === 'json') {
      if (Array.isArray(this.options.data)) {
        this.setData(this.options.data);
      } else {
        this.refresh();
      }
    } else if (this.options.source === 'ajax') {
      this.fetch();
    }

    this._emit('init', { instance: this });
  }

  /**
   * Prepares container wrappers, header/footer controls, and loading overlays.
   * @private
   */
  _setupDOMStructure() {
    // Wrap table in responsive container and main wrapper if not present
    if (!this.wrapperElement) {
      this.wrapperElement = document.createElement('div');
      this.wrapperElement.className = this.options.ui.wrapper;
      this.tableElement.parentNode.insertBefore(this.wrapperElement, this.tableElement);

      this.tableContainer = document.createElement('div');
      this.tableContainer.className = this.options.ui.tableWrapper;

      this.wrapperElement.appendChild(this.tableContainer);
      this.tableContainer.appendChild(this.tableElement);
    } else {
      this.wrapperElement.className = `${this.options.ui.wrapper} ${this.wrapperElement.className}`.trim();

      this.tableContainer = this.tableElement.closest('.cge-table-container');
      if (!this.tableContainer) {
        this.tableContainer = document.createElement('div');
        this.tableContainer.className = this.options.ui.tableWrapper;
        this.tableElement.parentNode.insertBefore(this.tableContainer, this.tableElement);
        this.tableContainer.appendChild(this.tableElement);
      }
    }

    this.tableElement.className = `${this.options.ui.table} ${this.tableElement.className}`.trim();

    // Ensure thead & tbody
    this.thead = this.tableElement.querySelector('thead');
    if (!this.thead) {
      this.thead = document.createElement('thead');
      this.tableElement.appendChild(this.thead);
    }
    this.thead.className = `${this.options.ui.thead} ${this.thead.className}`.trim();

    this.tbody = this.tableElement.querySelector('tbody');
    if (!this.tbody) {
      this.tbody = document.createElement('tbody');
      this.tableElement.appendChild(this.tbody);
    }
    this.tbody.className = `${this.options.ui.tbody} ${this.tbody.className}`.trim();

    // Top Header Bar (Search & Per Page Limit)
    this.headerBar = this.wrapperElement.querySelector('.cge-datatable-header');
    if (!this.headerBar) {
      this.headerBar = document.createElement('div');
      this.headerBar.className = this.options.ui.headerWrapper;
      this.wrapperElement.insertBefore(this.headerBar, this.tableContainer);

      // Search Box
      const searchBox = document.createElement('div');
      searchBox.className = this.options.ui.searchWrapper;
      searchBox.innerHTML = `
        <svg class="${this.options.ui.searchIcon}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" class="${this.options.ui.searchInput}" placeholder="${this.t('search-placeholder')}" aria-label="Search" data-cge-filter-input />
      `;
      this.headerBar.appendChild(searchBox);

      // Per Page Selector
      const perPageWrapper = document.createElement('div');
      perPageWrapper.className = this.options.ui.perPageWrapper;
      const selectHtml = this.options.perPageOptions
        .map(opt => `<option value="${opt}" ${String(opt) === String(this.options.perPage) ? 'selected' : ''}>${opt === 'All' ? this.t('all') : opt}</option>`)
        .join('');
      perPageWrapper.innerHTML = `
        <label class="flex items-center gap-1.5 cursor-pointer">
          <span>${this.t('per-page').replace(':count', '')}</span>
          <select class="${this.options.ui.perPageSelect}" data-cge-per-page-select>
            ${selectHtml}
          </select>
        </label>
      `;
      this.headerBar.appendChild(perPageWrapper);
    }

    // Bottom Footer Bar (Info & Pagination)
    this.footerBar = this.wrapperElement.querySelector('.cge-datatable-footer');
    if (!this.footerBar) {
      this.footerBar = document.createElement('div');
      this.footerBar.className = this.options.ui.footerWrapper;
      this.wrapperElement.appendChild(this.footerBar);

      // Counter Metrics
      this.infoEl = document.createElement('div');
      this.infoEl.className = this.options.ui.infoWrapper;
      this.footerBar.appendChild(this.infoEl);

      // Pagination Controls Container
      this.paginationControls = document.createElement('div');
      this.paginationControls.className = 'w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 flex-wrap';
      this.footerBar.appendChild(this.paginationControls);
    } else {
      this.infoEl = this.footerBar.querySelector('.cge-datatable-info') || this.footerBar.firstElementChild;
      this.paginationControls = this.footerBar.querySelector('.cge-datatable-pagination-controls') || this.footerBar.lastElementChild;
    }

    // Loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = `${this.options.ui.loadingOverlay} hidden opacity-0`;
    this.loadingOverlay.innerHTML = `
      <div class="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <svg class="w-4 h-4 text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span>${this.t('loading')}</span>
      </div>
    `;
    this.tableContainer.appendChild(this.loadingOverlay);
  }

  /**
   * Initializes decoupled sub-modules.
   * @private
   */
  _initSubModules() {
    // 1. CGEFilter
    const searchInput = this.headerBar?.querySelector('[data-cge-filter-input]');
    this.filter = new CGEFilter({
      input: searchInput,
      onChange: () => this._onFilterChange(),
    });
    this.filter.table = this;

    // Auto-bind declarative column filter elements (select or input with data-cge-filter or data-cge-filter-column)
    const colFilterEls = this.wrapperElement?.querySelectorAll('select[data-cge-filter], input[data-cge-filter], select[data-cge-filter-column], input[data-cge-filter-column]');
    colFilterEls?.forEach(el => {
      if (el === searchInput) return;
      const colKey = el.getAttribute('data-cge-filter') || el.getAttribute('data-cge-filter-column');
      if (colKey) {
        this.filter.attachColumnFilter(colKey, el);
      }
    });

    // 2. CGESort
    this.sort = new CGESort({
      onChange: () => this._onSortChange(),
    });
    this.sort.table = this;
    this.sort.attachHeaders(this.thead);

    // 3. CGEPagination
    this.pagination = new CGEPagination({
      page: 1,
      perPage: this.options.perPage,
      total: 0,
      perPageOptions: this.options.perPageOptions,
      translations: this.options.translations,
      onChange: () => this._onPaginationChange(),
    });
    this.pagination.table = this;

    // Hook per-page select
    const perPageSel = this.headerBar?.querySelector('[data-cge-per-page-select]');
    if (perPageSel) {
      perPageSel.addEventListener('change', (e) => {
        this.pagination.setPerPage(e.target.value);
      });
    }

    // 4. CGEResponsive
    this.responsive = new CGEResponsive({
      mode: this.options.responsiveMode,
      table: this.tableElement,
      container: this.tableContainer,
      collapseDetailsText: this.t('collapse-details'),
    });
    this.responsive.table = this;
  }

  /**
   * Pluggable middleware registration.
   * @param {any} PluginClass
   * @param {Object} [pluginOptions={}]
   * @returns {this}
   */
  use(PluginClass, pluginOptions = {}) {
    if (typeof PluginClass === 'function') {
      const instance = new PluginClass(pluginOptions);
      instance.table = this;
      if (instance instanceof CGEFilter) this.filter = instance;
      else if (instance instanceof CGESort) this.sort = instance;
      else if (instance instanceof CGEPagination) this.pagination = instance;
      else if (instance instanceof CGEResponsive) this.responsive = instance;
    }
    return this;
  }

  /**
   * Parses column definitions from thead or options.
   * @private
   */
  _parseColumns() {
    if (Array.isArray(this.options.columns) && this.options.columns.length > 0) {
      this.columns = this.options.columns.map((c, idx) => ({
        key: c.key || `col_${idx}`,
        label: c.label || c.key || `Column ${idx + 1}`,
        sortable: c.sortable !== false,
        type: c.type || 'string',
        priority: c.priority !== undefined ? c.priority : (idx === 0 ? 1 : 2),
        formatter: c.formatter || null,
        align: c.align || 'left',
        visible: c.visible !== false,
      }));

      if (this.options.selectable && !this.columns.some(c => c.key === '_select')) {
        this.columns.unshift({
          key: '_select',
          label: '',
          sortable: false,
          type: 'checkbox',
          priority: 1,
          align: 'center',
          visible: true,
        });
      }

      this._renderTheadFromColumns();
      return;
    }

    // Parse existing thead th elements
    const ths = Array.from(this.thead.querySelectorAll('th'));
    if (ths.length > 0) {
      this.columns = ths.map((th, idx) => {
        const key = th.getAttribute('data-cge-key') || `col_${idx}`;
        const label = th.innerText.trim() || key;
        const sortable = th.hasAttribute('data-cge-sortable') || th.classList.contains('sortable') || true;
        const type = th.getAttribute('data-cge-type') || 'string';
        const prioAttr = th.getAttribute('data-cge-priority');
        const priority = prioAttr ? parseInt(prioAttr, 10) : (idx === 0 ? 1 : 2);

        // Apply attributes to th
        th.setAttribute('data-cge-key', key);
        th.setAttribute('data-cge-priority', String(priority));
        th.setAttribute('data-cge-type', type);
        if (sortable) th.setAttribute('data-cge-sortable', '');

        return { key, label, sortable, type, priority, visible: true };
      });

      if (this.options.selectable && !this.columns.some(c => c.key === '_select')) {
        this.columns.unshift({
          key: '_select',
          label: '',
          sortable: false,
          type: 'checkbox',
          priority: 1,
          align: 'center',
          visible: true,
        });

        const firstTh = this.thead.querySelector('th');
        if (firstTh && !firstTh.querySelector('[data-cge-select-all]')) {
          const th = document.createElement('th');
          th.className = `${this.options.ui.th} w-10 text-center`;
          th.setAttribute('data-cge-key', '_select');
          th.setAttribute('data-cge-priority', '1');
          th.innerHTML = `<input type="checkbox" data-cge-select-all class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" aria-label="Select all" />`;
          firstTh.parentElement.prepend(th);
        }
      }
    }
  }

  /**
   * Renders thead from configured columns.
   * @private
   */
  _renderTheadFromColumns() {
    if (!this.thead) return;
    this.thead.innerHTML = '';
    const tr = document.createElement('tr');

    for (const col of this.columns) {
      if (col.visible === false) continue;
      const th = document.createElement('th');
      th.className = this.options.ui.th;
      th.setAttribute('data-cge-key', col.key);
      th.setAttribute('data-cge-priority', String(col.priority || 2));
      th.setAttribute('data-cge-type', col.type || 'string');
      if (col.sortable) th.setAttribute('data-cge-sortable', '');

      if (col.key === '_select') {
        th.className = `${this.options.ui.th} w-10 text-center`;
        th.innerHTML = `<input type="checkbox" data-cge-select-all class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" aria-label="Select all" />`;
      } else {
        th.textContent = col.label;
      }
      tr.appendChild(th);
    }

    this.thead.appendChild(tr);
    if (this.sort) this.sort.attachHeaders(this.thead);
  }

  /**
   * Ingests existing DOM table rows from tbody.
   * @private
   */
  _ingestFromDOM() {
    const trs = Array.from(this.tbody.querySelectorAll('tr:not(.cge-child-row)'));
    this.rawRows = trs.map((tr, rowIdx) => {
      const rowId = tr.getAttribute('data-cge-id') || tr.id || `row_${rowIdx}`;
      const rowData = {
        _id: rowId,
        _element: tr,
        cells: {},
      };

      if (this.options.selectable) {
        let cbTd = tr.querySelector('td[data-cge-key="_select"]');
        if (!cbTd) {
          cbTd = document.createElement('td');
          cbTd.className = `${this.options.ui.td} w-10 text-center`;
          cbTd.setAttribute('data-cge-key', '_select');
          cbTd.innerHTML = `<input type="checkbox" data-cge-select-row data-row-id="${rowId}" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />`;
          tr.prepend(cbTd);
        }
      }

      // Filter out _select td when mapping data columns
      const tds = Array.from(tr.querySelectorAll('td:not([data-cge-key="_select"])'));
      const dataCols = this.columns.filter(c => c.key !== '_select');

      tds.forEach((td, colIdx) => {
        const colDef = dataCols[colIdx];
        const key = colDef ? colDef.key : `col_${colIdx}`;
        const val = td.getAttribute('data-cge-val') !== null ? td.getAttribute('data-cge-val') : td.innerText.trim();
        rowData.cells[key] = val;
        rowData[key] = val;
      });

      return rowData;
    });

    this.pagination.setMetrics({ total: this.rawRows.length });
  }


  /**
   * Sets in-memory dataset and triggers pipeline re-run.
   * @param {Array<any>} data
   * @returns {this}
   */
  setData(data) {
    if (!Array.isArray(data)) return this;

    this.rawRows = data.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          _id: item.id || item._id || `item_${idx}`,
          ...item,
        };
      }
      return { _id: `item_${idx}`, value: item };
    });

    this.pagination.setMetrics({ total: this.rawRows.length, page: 1 });
    this.refresh();
    return this;
  }

  /**
   * Primary pipeline executor: Filter -> Sort -> Paginate -> Render.
   */
  refresh() {
    if (this.options.serverSide && this.options.source === 'ajax') {
      this.fetch();
      return;
    }

    // 1. Filtering stage
    this.filteredRows = this.filter ? this.filter.filterRows(this.rawRows, this.columns) : [...this.rawRows];

    // 2. Sorting stage
    this.sortedRows = this.sort ? this.sort.sortRows(this.filteredRows, this.columns) : [...this.filteredRows];

    // 3. Pagination stage
    this.pagination.setMetrics({ total: this.sortedRows.length });
    this.pagedRows = this.pagination ? this.pagination.paginateRows(this.sortedRows) : [...this.sortedRows];

    // 4. Render rows to tbody
    this._renderRows(this.pagedRows);

    // 5. Render pagination controls and counter metrics
    this._renderPaginationUI();

    // 6. Refresh responsive view (collapse / cards / scroll)
    if (this.responsive) {
      this.responsive.refresh();
    }

    // 7. Auto-bind CGEActionButton
    this._autoBindActionButtons();

    this._emit('rendered', { rows: this.pagedRows, total: this.pagination.total });
  }

  /**
   * Fetches data via Ajax (Laravel LengthAwarePaginator, flat array, or Blade HTML rows).
   * @param {Object} [extraParams={}]
   * @returns {Promise<any>}
   */
  async fetch(extraParams = {}) {
    if (!this.options.url) return;

    this.setLoading(true);
    this._emit('loading', { loading: true });

    // Compile query parameters from sub-modules
    const params = {
      ...(this.filter ? this.filter.serialize() : {}),
      ...(this.sort ? this.sort.serialize() : {}),
      ...(this.pagination ? this.pagination.serialize() : {}),
      ...extraParams,
    };

    try {
      let data = null;

      // Auto-detect Axios or Fetch
      if (this.options.driver === 'axios' || (this.options.driver === 'auto' && typeof window !== 'undefined' && window.axios)) {
        const client = window.axios;
        const res = await client.request({
          url: this.options.url,
          method: this.options.method,
          params: this.options.method.toUpperCase() === 'GET' ? params : undefined,
          data: this.options.method.toUpperCase() !== 'GET' ? params : undefined,
          headers: this.options.headers,
        });
        data = res.data;
      } else {
        const urlObj = new URL(this.options.url, window.location.href);
        if (this.options.method.toUpperCase() === 'GET') {
          for (const [k, v] of Object.entries(params)) {
            urlObj.searchParams.set(k, String(v));
          }
        }
        const res = await fetch(urlObj.toString(), {
          method: this.options.method,
          headers: {
            Accept: 'application/json, text/html',
            ...this.options.headers,
          },
          body: this.options.method.toUpperCase() !== 'GET' ? JSON.stringify(params) : undefined,
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
        }
      }

      this._handleServerResponse(data);
      this.setLoading(false);
      this._emit('loading', { loading: false });
      return data;
    } catch (err) {
      this.setLoading(false);
      this._emit('loading', { loading: false });
      this._emit('error', { error: err });
      console.error('[CGEDataTable] Fetch error:', err);
      throw err;
    }
  }

  /**
   * Handles server response across all supported formats.
   * @private
   */
  _handleServerResponse(res) {
    if (!res) return;

    // Format 1: Blade HTML monolithic string (res.full or string response)
    if (typeof res === 'string' && (res.includes('<tr') || res.includes('<td'))) {
      this.tbody.innerHTML = res;
      this._finalizeRender();
      return;
    }

    if (res.full && typeof res.full === 'string') {
      this.tbody.innerHTML = res.full;
      if (res.total !== undefined) {
        this.pagination.setMetrics({
          total: res.total,
          page: res.current_page || res.page,
          perPage: res.per_page || res.perPage,
          lastPage: res.last_page || res.lastPage,
        });
      }
      this._finalizeRender();
      return;
    }

    // Format 2: Blade HTML row map: res.html: { 1: "<tr>...</tr>", 2: "<tr>...</tr>" }
    if (res.html && typeof res.html === 'object') {
      this.tbody.innerHTML = Object.values(res.html).join('');
      if (res.total !== undefined) {
        this.pagination.setMetrics({
          total: res.total,
          page: res.current_page || res.page,
          perPage: res.per_page || res.perPage,
        });
      }
      this._finalizeRender();
      return;
    }

    // Format 3: Laravel LengthAwarePaginator: { data: [...], current_page: 1, last_page: 5, total: 100, per_page: 20 }
    if (res.data && Array.isArray(res.data) && res.total !== undefined) {
      this.rawRows = res.data;
      this.pagedRows = res.data;
      this.pagination.setMetrics({
        page: res.current_page || res.page || 1,
        perPage: res.per_page || res.perPage || this.options.perPage,
        total: res.total || 0,
        lastPage: res.last_page || res.lastPage || 1,
      });
      this._renderRows(this.pagedRows);
      this._finalizeRender();
      return;
    }

    // Format 4: Flat array without metadata: res = [...] or res.data = [...]
    const rowsArray = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
    if (this.options.serverSide) {
      this.rawRows = rowsArray;
      this.pagedRows = rowsArray;
      this._renderRows(this.pagedRows);
    } else {
      this.setData(rowsArray);
    }

    this._finalizeRender();
  }

  /**
   * Finalizes render pipeline (controls, responsive layout, and action binding).
   * @private
   */
  _finalizeRender() {
    this._renderPaginationUI();
    this._updateSelectionUI();
    if (this.responsive) {
      this.responsive.refresh();
    }
    this._autoBindActionButtons();
    this._emit('rendered', { rows: this.pagedRows, total: this.pagination.total });
  }

  /**
   * Renders array of row objects into tbody HTML.
   * @private
   */
  _renderRows(rows) {
    if (!this.tbody) return;

    if (!Array.isArray(rows) || rows.length === 0) {
      const colSpan = Math.max(1, this.columns.length);
      this.tbody.innerHTML = `<tr><td colspan="${colSpan}" class="${this.options.ui.emptyRow}">${this.t('no-data')}</td></tr>`;
      return;
    }

    this.tbody.innerHTML = '';

    rows.forEach((row, rowIdx) => {
      const rowId = String(row._id || (row._element && row._element.getAttribute('data-cge-id')) || rowIdx);

      // If row has pre-existing DOM element, clone or re-append
      if (row._element instanceof HTMLTableRowElement) {
        if (this.options.selectable) {
          let cbTd = row._element.querySelector('td[data-cge-key="_select"]');
          if (!cbTd) {
            cbTd = document.createElement('td');
            cbTd.className = `${this.options.ui.td} w-10 text-center`;
            cbTd.setAttribute('data-cge-key', '_select');
            cbTd.innerHTML = `<input type="checkbox" data-cge-select-row data-row-id="${rowId}" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />`;
            row._element.prepend(cbTd);
          }
          const isSelected = this.selectedRowIds.has(rowId);
          const cb = cbTd.querySelector('input[type="checkbox"]');
          if (cb) cb.checked = isSelected;
          row._element.classList.toggle('cge-row-selected', isSelected);
        }
        this.tbody.appendChild(row._element);
        return;
      }

      const tr = document.createElement('tr');
      tr.className = this.options.ui.tr;
      tr.setAttribute('data-cge-id', rowId);

      const isSelected = this.selectedRowIds.has(rowId);
      if (isSelected) tr.classList.add('cge-row-selected');

      this.columns.forEach((col, colIdx) => {
        if (col.visible === false) return;

        const td = document.createElement('td');
        td.className = this.options.ui.td;
        td.setAttribute('data-cge-key', col.key);

        if (col.key === '_select') {
          td.className = `${this.options.ui.td} w-10 text-center`;
          td.innerHTML = `<input type="checkbox" data-cge-select-row data-row-id="${rowId}" ${isSelected ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />`;
          tr.appendChild(td);
          return;
        }

        let cellContent = row[col.key] !== undefined ? row[col.key] : '';

        // Run custom formatter if defined
        if (typeof col.formatter === 'function') {
          cellContent = col.formatter(cellContent, row, colIdx);
        }

        if (cellContent instanceof HTMLElement) {
          td.appendChild(cellContent);
        } else {
          td.innerHTML = String(cellContent);
        }

        tr.appendChild(td);
      });

      this.tbody.appendChild(tr);
    });
  }


  /**
   * Renders bottom pagination controls (Prev, Window, Next, Jump) and metrics info.
   * @private
   */
  _renderPaginationUI() {
    if (this.infoEl) {
      this.infoEl.textContent = this.pagination.getMetricsString();
    }

    if (!this.paginationControls) return;

    const pageWindow = this.pagination.computeWindow();
    const currPage = this.pagination.page;
    const lastPage = this.pagination.lastPage;

    const prevDisabled = currPage <= 1 ? this.options.ui.pageButtonDisabled : '';
    const nextDisabled = currPage >= lastPage ? this.options.ui.pageButtonDisabled : '';

    // Mobile / sm screen compact layout (< current / total > + go to page)
    const compactHtml = `
      <div class="cge-pagination-compact flex sm:hidden items-center justify-between w-full gap-2 py-1">
        <div class="flex items-center gap-1">
          <button type="button" class="${this.options.ui.pageButton} px-2 h-7 ${prevDisabled}" data-cge-page-action="prev" ${currPage <= 1 ? 'disabled' : ''} aria-label="${this.t('prev')}">
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/></svg>
          </button>
          <span class="inline-flex items-center justify-center px-2.5 h-7 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 select-none">
            ${currPage} / ${lastPage}
          </span>
          <button type="button" class="${this.options.ui.pageButton} px-2 h-7 ${nextDisabled}" data-cge-page-action="next" ${currPage >= lastPage ? 'disabled' : ''} aria-label="${this.t('next')}">
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400 text-[11px]">${this.t('go-to-page')}:</span>
          <input type="number" min="1" max="${lastPage}" value="${currPage}" class="${this.options.ui.jumpInput} w-11 text-center text-xs h-7" data-cge-jump-input aria-label="${this.t('go-to-page')}" />
          <button type="button" class="${this.options.ui.pageButton} px-2 h-7" data-cge-jump-btn>${this.t('jump')}</button>
        </div>
      </div>
    `;

    // Desktop layout: Prev, Window buttons, Next, Jump
    let desktopHtml = `<div class="cge-pagination-desktop hidden sm:flex items-center gap-1 flex-wrap">`;
    desktopHtml += `
      <button type="button" class="${this.options.ui.pageButton} ${prevDisabled}" data-cge-page-action="prev" ${currPage <= 1 ? 'disabled' : ''}>
        ${this.t('prev')}
      </button>
    `;

    for (const item of pageWindow) {
      if (item === '...') {
        desktopHtml += `<span class="px-1 text-slate-400 select-none">...</span>`;
      } else {
        const isActive = item === currPage ? this.options.ui.pageButtonActive : '';
        desktopHtml += `
          <button type="button" class="${this.options.ui.pageButton} ${isActive}" data-cge-page="${item}">
            ${item}
          </button>
        `;
      }
    }

    desktopHtml += `
      <button type="button" class="${this.options.ui.pageButton} ${nextDisabled}" data-cge-page-action="next" ${currPage >= lastPage ? 'disabled' : ''}>
        ${this.t('next')}
      </button>
    `;

    if (lastPage > 5) {
      desktopHtml += `
        <div class="${this.options.ui.jumpWrapper}">
          <span class="text-slate-400 text-[11px]">${this.t('go-to-page')}:</span>
          <input type="number" min="1" max="${lastPage}" value="${currPage}" class="${this.options.ui.jumpInput}" data-cge-jump-input />
          <button type="button" class="${this.options.ui.pageButton} px-1.5" data-cge-jump-btn>${this.t('jump')}</button>
        </div>
      `;
    }

    desktopHtml += `</div>`;
    this.paginationControls.innerHTML = compactHtml + desktopHtml;

    // Attach click events on pagination buttons
    this.paginationControls.querySelectorAll('[data-cge-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.getAttribute('data-cge-page'), 10);
        this.pagination.goTo(p);
      });
    });

    this.paginationControls.querySelectorAll('[data-cge-page-action="prev"]').forEach(btn => {
      btn.addEventListener('click', () => this.pagination.prev());
    });

    this.paginationControls.querySelectorAll('[data-cge-page-action="next"]').forEach(btn => {
      btn.addEventListener('click', () => this.pagination.next());
    });

    // Jump handlers
    this.paginationControls.querySelectorAll('[data-cge-jump-btn]').forEach(jumpBtn => {
      const container = jumpBtn.parentElement;
      const jumpInput = container ? container.querySelector('[data-cge-jump-input]') : null;
      if (jumpInput) {
        const handleJump = () => {
          const val = parseInt(jumpInput.value, 10);
          if (!isNaN(val)) this.pagination.goTo(val);
        };
        jumpBtn.addEventListener('click', handleJump);
        jumpInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleJump();
          }
        });
      }
    });
  }

  /**
   * Automatically initializes CGEActionButton on newly injected row elements.
   * @private
   */
  _autoBindActionButtons() {
    if (!this.options.autoBindActions) return;

    if (typeof window !== 'undefined' && window.CGEActionButton && typeof window.CGEActionButton.init === 'function') {
      try {
        window.CGEActionButton.init(this.tbody || this.tableElement);
      } catch (e) {
        // Suppress or log non-fatal binding error
      }
    }
  }

  /**
   * Internal filter change callback.
   * @private
   */
  _onFilterChange() {
    this.pagination.page = 1; // Reset to page 1 on filter
    this.refresh();
    this._emit('filter', { query: this.filter.globalQuery, columns: this.filter.columnFilters });
  }

  /**
   * Internal sort change callback.
   * @private
   */
  _onSortChange() {
    this.refresh();
    this._emit('sort', { rules: this.sort.rules });
  }

  /**
   * Internal pagination change callback.
   * @private
   */
  _onPaginationChange() {
    this.refresh();
    this._emit('page', { page: this.pagination.page, perPage: this.pagination.perPage });
  }

  /**
   * Toggles loading overlay state.
   * @param {boolean} isLoading
   * @returns {this}
   */
  setLoading(isLoading) {
    this.loading = Boolean(isLoading);
    if (!this.loadingOverlay) return this;

    if (this.loading) {
      this.loadingOverlay.classList.remove('hidden');
      requestAnimationFrame(() => this.loadingOverlay?.classList.remove('opacity-0'));
    } else {
      this.loadingOverlay.classList.add('opacity-0');
      setTimeout(() => {
        if (!this.loading) this.loadingOverlay?.classList.add('hidden');
      }, 200);
    }
    return this;
  }

  /**
   * Localization translator helper with token substitution.
   * @param {string} key
   * @param {Record<string, any>} [replacements={}]
   * @returns {string}
   */
  t(key, replacements = {}) {
    let str = this.options.translations[key] || CGEDataTable.defaults.translations[key] || key;
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(`:${k}`, String(v));
    }
    return str;
  }

  /**
   * Registers an event callback.
   * @param {string} event
   * @param {Function} handler
   * @returns {this}
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  /**
   * Removes an event callback.
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
   * Internal event emitter.
   * Dispatches both instance callback and native DOM CustomEvent.
   * @private
   */
  _emit(eventName, detail = {}) {
    const fullDetail = { ...detail, instance: this };

    // 1. Instance callbacks
    if (this._listeners.has(eventName)) {
      for (const fn of this._listeners.get(eventName)) {
        try { fn(fullDetail); } catch (err) { console.error(err); }
      }
    }

    // 2. DOM CustomEvent
    const target = this.rawElement || this.tableElement || document;
    target.dispatchEvent(new CustomEvent(`cge:datatable:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: fullDetail,
    }));
  }

  /**
   * Binds table-level DOM event listeners (actions, selection, and bulk controls).
   * @private
   */
  _bindTableEvents() {
    // 1. Listen for CGEActionButton success on delete/revoke actions
    this.tableElement.addEventListener('cge:action:success', (e) => {
      const btn = e.target.closest('[data-cge-action]');
      if (!btn) return;
      const action = (btn.getAttribute('data-cge-action') || '').toLowerCase();
      if (['delete', 'revoke', 'destroy', 'remove', 'cancel', 'forcedelete'].includes(action) || btn.hasAttribute('data-cge-delete-row')) {
        const tr = btn.closest('tr');
        if (tr && !tr.classList.contains('cge-child-row')) {
          this.removeRow(tr);
        } else if (tr && tr.classList.contains('cge-child-row')) {
          const parentRowId = tr.getAttribute('data-parent-row');
          const parentTr = this.tbody.querySelector(`tr[data-cge-id="${parentRowId}"]`);
          if (parentTr) this.removeRow(parentTr);
        }
      }
    });

    // 2. Selection: Select-All Checkbox change & Row Checkbox change
    this.tableElement.addEventListener('change', (e) => {
      if (e.target.matches('[data-cge-select-all]')) {
        const isChecked = e.target.checked;
        const visibleRows = this.pagedRows.length > 0 ? this.pagedRows : this.rawRows;

        visibleRows.forEach(row => {
          const id = String(row._id || row.id || '');
          if (id) {
            if (isChecked) this.selectedRowIds.add(id);
            else this.selectedRowIds.delete(id);
          }
        });

        // If DOM table with raw tr elements
        this.tbody.querySelectorAll('tr:not(.cge-child-row)').forEach(tr => {
          const id = tr.getAttribute('data-cge-id');
          if (id) {
            if (isChecked) this.selectedRowIds.add(id);
            else this.selectedRowIds.delete(id);
          }
          const cb = tr.querySelector('[data-cge-select-row]');
          if (cb) cb.checked = isChecked;
          tr.classList.toggle('cge-row-selected', isChecked);
        });

        this._updateSelectionUI();
        this._emit('selection:change', {
          selectedIds: this.getSelectedIds(),
          count: this.selectedRowIds.size,
        });
      } else if (e.target.matches('[data-cge-select-row]')) {
        const cb = e.target;
        const tr = cb.closest('tr');
        const rowId = cb.getAttribute('data-row-id') || tr?.getAttribute('data-cge-id');
        if (rowId) {
          if (cb.checked) {
            this.selectedRowIds.add(String(rowId));
          } else {
            this.selectedRowIds.delete(String(rowId));
          }
          if (tr) tr.classList.toggle('cge-row-selected', cb.checked);
        }
        this._updateSelectionUI();
        this._emit('selection:change', {
          selectedIds: this.getSelectedIds(),
          count: this.selectedRowIds.size,
        });
      }
    });

    // 3. Selection Bar Actions (Clear Selection & Delete Selected)
    if (this.selectionBar) {
      const clearBtn = this.selectionBar.querySelector('[data-cge-clear-selection]');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearSelection());
      }

      const deleteBtn = this.selectionBar.querySelector('[data-cge-delete-selected]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          const count = this.selectedRowIds.size;
          if (count === 0) return;

          let confirmed = true;
          if (typeof window !== 'undefined' && window.CGEAlert && typeof window.CGEAlert.delete === 'function') {
            confirmed = await window.CGEAlert.delete(
              this.t('delete-selected'),
              this.t('delete-selected-confirm', { count })
            );
          } else if (typeof window !== 'undefined') {
            confirmed = window.confirm(this.t('delete-selected-confirm', { count }));
          }

          if (confirmed) {
            this.deleteSelected();
            if (typeof window !== 'undefined' && window.CGEToast) {
              window.CGEToast.success(`${count} records deleted successfully!`);
            }
          }
        });
      }
    }
  }

  /**
   * Synchronizes select-all checkbox, selection toolbar count, and row classes.
   * @private
   */
  _updateSelectionUI() {
    const count = this.selectedRowIds.size;
    const selectAllCb = this.thead?.querySelector('[data-cge-select-all]');

    // Calculate total rows in current view
    const visibleTrs = Array.from(this.tbody?.querySelectorAll('tr:not(.cge-child-row)') || []);
    let checkedCount = 0;
    visibleTrs.forEach(tr => {
      const cb = tr.querySelector('[data-cge-select-row]');
      const id = cb?.getAttribute('data-row-id') || tr.getAttribute('data-cge-id');
      const isSelected = id ? this.selectedRowIds.has(String(id)) : false;
      if (cb) cb.checked = isSelected;
      tr.classList.toggle('cge-row-selected', isSelected);
      if (isSelected) checkedCount++;
    });

    if (selectAllCb) {
      if (visibleTrs.length > 0 && checkedCount === visibleTrs.length) {
        selectAllCb.checked = true;
        selectAllCb.indeterminate = false;
      } else if (checkedCount > 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = true;
      } else {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
      }
    }

    if (this.selectionBar) {
      const countEl = this.selectionBar.querySelector('[data-cge-selection-count]');
      if (countEl) countEl.textContent = this.t('selected-count', { count });
      if (count > 0) {
        this.selectionBar.classList.remove('hidden');
      } else {
        this.selectionBar.classList.add('hidden');
      }
    }
  }

  /**
   * Retrieves array of all selected row IDs.
   * @returns {string[]}
   */
  getSelectedIds() {
    return Array.from(this.selectedRowIds);
  }

  /**
   * Retrieves array of all selected row data objects.
   * @returns {Array<any>}
   */
  getSelectedRows() {
    const ids = this.selectedRowIds;
    return this.rawRows.filter(r => ids.has(String(r._id || r.id)));
  }

  /**
   * Selects all rows in current page / table.
   * @returns {this}
   */
  selectAll() {
    const targetRows = this.pagedRows.length > 0 ? this.pagedRows : this.rawRows;
    targetRows.forEach(r => {
      const id = String(r._id || r.id || '');
      if (id) this.selectedRowIds.add(id);
    });
    this.tbody.querySelectorAll('tr:not(.cge-child-row)').forEach(tr => {
      const id = tr.getAttribute('data-cge-id');
      if (id) this.selectedRowIds.add(id);
    });
    this._updateSelectionUI();
    this._emit('selection:change', { selectedIds: this.getSelectedIds(), count: this.selectedRowIds.size });
    return this;
  }

  /**
   * Clears selection and unchecks all row checkboxes.
   * @returns {this}
   */
  clearSelection() {
    this.selectedRowIds.clear();
    this._updateSelectionUI();
    this._emit('selection:change', { selectedIds: [], count: 0 });
    return this;
  }

  /**
   * Toggles selection state of a specific row.
   * @param {string} rowId
   * @param {boolean} [forceState]
   * @returns {this}
   */
  toggleSelectRow(rowId, forceState) {
    const id = String(rowId);
    const shouldSelect = forceState !== undefined ? forceState : !this.selectedRowIds.has(id);
    if (shouldSelect) this.selectedRowIds.add(id);
    else this.selectedRowIds.delete(id);
    this._updateSelectionUI();
    this._emit('selection:change', { selectedIds: this.getSelectedIds(), count: this.selectedRowIds.size });
    return this;
  }

  /**
   * Deletes all currently selected rows.
   * @returns {this}
   */
  deleteSelected() {
    const idsToDelete = new Set(this.selectedRowIds);
    if (idsToDelete.size === 0) return this;

    // Animate selected rows out
    this.tbody.querySelectorAll('tr:not(.cge-child-row)').forEach(tr => {
      const id = tr.getAttribute('data-cge-id');
      if (id && idsToDelete.has(id)) {
        tr.style.transition = 'all 0.25s ease';
        tr.style.opacity = '0';
        tr.style.transform = 'scale(0.96)';
      }
    });

    setTimeout(() => {
      this.rawRows = this.rawRows.filter(r => !idsToDelete.has(String(r._id || r.id)));

      // Also remove any direct tr in DOM
      idsToDelete.forEach(id => {
        const tr = this.tbody.querySelector(`tr[data-cge-id="${id}"]`);
        if (tr) {
          const next = tr.nextElementSibling;
          if (next && next.classList.contains('cge-child-row')) next.remove();
          tr.remove();
        }
      });

      this.selectedRowIds.clear();
      this.pagination.setMetrics({ total: this.rawRows.length });
      this.refresh();
      this._emit('rows:deleted', { ids: Array.from(idsToDelete) });
    }, 250);

    return this;
  }

  /**
   * Removes a single row by element or row ID.
   * @param {string | HTMLElement} target
   * @returns {this}
   */
  removeRow(target) {
    let rowId = null;
    let trEl = null;

    if (typeof target === 'string') {
      rowId = target;
      trEl = this.tbody?.querySelector(`tr[data-cge-id="${rowId}"]`);
    } else if (target instanceof HTMLElement) {
      trEl = target.closest('tr');
      rowId = trEl?.getAttribute('data-cge-id');
    }

    if (trEl) {
      trEl.style.transition = 'all 0.25s ease';
      trEl.style.opacity = '0';
      trEl.style.transform = 'scale(0.96)';
    }

    setTimeout(() => {
      if (rowId) {
        this.rawRows = this.rawRows.filter(r => String(r._id || r.id) !== String(rowId) && r._element !== trEl);
        this.selectedRowIds.delete(String(rowId));
      } else if (trEl) {
        this.rawRows = this.rawRows.filter(r => r._element !== trEl);
      }

      if (trEl && trEl.parentElement) {
        const next = trEl.nextElementSibling;
        if (next && next.classList.contains('cge-child-row')) {
          next.remove();
        }
        trEl.remove();
      }

      this.pagination.setMetrics({ total: Math.max(0, this.rawRows.length > 0 ? this.rawRows.length : this.pagination.total - 1) });
      this.refresh();
      this._emit('row:deleted', { rowId, element: trEl });
    }, 250);

    return this;
  }

  /**
   * Tears down sub-modules, event listeners, and DOM modifications.
   */
  destroy() {

    this._emit('destroy');

    if (this.filter) this.filter.destroy();
    if (this.sort) this.sort.destroy();
    if (this.pagination) this.pagination.destroy();
    if (this.responsive) this.responsive.destroy();

    CGEDataTable.instances.delete(this.rawElement);
    CGEDataTable.instances.delete(this.tableElement);

    this._listeners.clear();
  }

  // =========================================================================
  // Static Helper Methods
  // =========================================================================

  /**
   * Scans and auto-initializes all tables with [data-cge-datatable] in the root.
   * @param {Document | HTMLElement} [root=document]
   * @returns {CGEDataTable[]}
   */
  static init(root = document) {
    const selector = '[data-cge-datatable]';
    const elements = root.querySelectorAll ? Array.from(root.querySelectorAll(selector)) : [];
    if (root.matches && root.matches(selector)) {
      elements.unshift(root);
    }

    return elements.map(el => CGEDataTable.getOrCreateInstance(el));
  }

  /**
   * Retrieves an existing instance by element or selector.
   * @param {HTMLElement | string} target
   * @returns {CGEDataTable | null}
   */
  static get(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    return el ? (CGEDataTable.instances.get(el) || null) : null;
  }

  /**
   * Alias for CGEDataTable.get()
   */
  static getInstance(target) {
    return CGEDataTable.get(target);
  }

  /**
   * Retrieves or creates a new CGEDataTable instance.
   * @param {HTMLElement | string} target
   * @param {Object} [options={}]
   * @returns {CGEDataTable}
   */
  static getOrCreateInstance(target, options = {}) {
    const existing = CGEDataTable.get(target);
    if (existing) return existing;
    return new CGEDataTable(target, options);
  }

  /**
   * Updates global default configuration options.
   * @param {Object} options
   */
  static setDefaultOptions(options) {
    CGEDataTable.defaults = {
      ...CGEDataTable.defaults,
      ...options,
      ui: { ...CGEDataTable.defaults.ui, ...(options.ui || {}) },
      translations: { ...CGEDataTable.defaults.translations, ...(options.translations || {}) },
    };
  }

  /**
   * Updates global translations dictionary.
   * @param {Record<string, string>} translations
   */
  static setTranslations(translations) {
    CGEDataTable.defaults.translations = {
      ...CGEDataTable.defaults.translations,
      ...translations,
    };
  }
}

export default CGEDataTable;
