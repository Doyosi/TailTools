/**
 * CGEFilter - Shared Data Table & Data Grid Filtering Core
 * TailTools Plugin Library
 *
 * Supports debounced global search (one timer per bound element), per-column/field filters,
 * multi-mode matching (substring, number range, regex, arrays) with locale-aware, accent- and
 * case-insensitive text matching, and server-side query parameter serialization.
 * Re-exported by plugins/CGEDataTable/modules/CGEFilter.js and plugins/CGEDataGrid/modules/CGEFilter.js.
 */

import { defaultLocale, foldText, isClearFilter, readValue, safeLocale, searchableKeys } from './collection-core.js';

const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'tel', 'url', 'number', 'password']);

export class CGEFilter {
  /**
   * @param {Object} [options={}] Configuration options
   */
  constructor(options = {}) {
    this.options = {
      debounce: 300,
      searchParam: 'search',
      filtersParam: 'filters',
      caseSensitive: false,
      locale: null,
      searchKeys: null,
      excludeKeys: [],
      input: null,
      onChange: null,
      ...options,
    };

    /** @type {string} */
    this.globalQuery = '';

    /** @type {Record<string, any>} */
    this.columnFilters = {};

    /** @type {Map<EventTarget, ReturnType<typeof setTimeout>>} One debounce timer per bound element */
    this._timers = new Map();

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
    this.table = null;

    if (this.options.input) {
      this.attachSearchInput(this.options.input);
    }
  }

  /** Locale used for case folding: explicit option, then `<html lang>`. */
  get locale() {
    return safeLocale(this.options.locale || defaultLocale());
  }

  /**
   * Attaches a global search input element with debouncing.
   * @param {HTMLInputElement | string} input
   */
  attachSearchInput(input) {
    const el = typeof input === 'string' ? document.querySelector(input) : input;
    if (!el) return;

    const handler = (e) => {
      const val = e.target.value;
      this._debounce(el, () => this.apply(val));
    };

    el.addEventListener('input', handler);
    this._boundListeners.push({ element: el, event: 'input', handler });

    // Sync initial value (e.g. Blade old('search') or browser restore)
    if (el.value) {
      this.globalQuery = String(el.value).trim();
    }
  }

  /**
   * Binds an input, select, checkbox or radio to a column/field filter. Text inputs are
   * debounced with their own timer; selects and toggles apply immediately. The current value
   * (Blade `old()` / `selected`) is applied as the initial filter.
   * @param {string} colKey
   * @param {HTMLElement | string} input
   * @param {string} [eventType='input'] Event used for text inputs
   */
  attachColumnFilter(colKey, input, eventType = 'input') {
    const el = typeof input === 'string' ? document.querySelector(input) : input;
    if (!el || !colKey) return;

    const isSelect = el.tagName === 'SELECT';
    const isToggle = el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio');
    const isText = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && TEXT_INPUT_TYPES.has(el.type || ''));
    const read = () => {
      if (isSelect && el.multiple) return Array.from(el.selectedOptions).map(o => o.value).filter(v => v && v !== 'all');
      if (isToggle) return el.checked ? el.value : '';
      return el.value;
    };

    const handler = () => {
      const val = read();
      if (isText) this._debounce(el, () => this.setColumnFilter(colKey, val));
      else this.setColumnFilter(colKey, val);
    };

    const evtName = isText ? (eventType || 'input') : 'change';
    el.addEventListener(evtName, handler);
    this._boundListeners.push({ element: el, event: evtName, handler });

    const initial = read();
    if (!isClearFilter(initial)) this.columnFilters[colKey] = initial;
  }

  /** Grid alias of attachColumnFilter. */
  attachFieldFilter(fieldKey, element, eventType = 'input') {
    return this.attachColumnFilter(fieldKey, element, eventType);
  }

  /**
   * Applies a global search query.
   * @param {string} query
   * @returns {this}
   */
  apply(query) {
    this.globalQuery = String(query ?? '').trim();
    this._notifyChange();
    return this;
  }

  /** Alias of apply(). */
  search(query) {
    return this.apply(query);
  }

  /**
   * Sets a column-specific filter; '', 'all', null and [] clear it.
   * @param {string} colKey
   * @param {any} value
   * @returns {this}
   */
  setColumnFilter(colKey, value) {
    if (!colKey) return this;
    if (isClearFilter(value)) {
      delete this.columnFilters[colKey];
    } else {
      this.columnFilters[colKey] = value;
    }
    this._notifyChange();
    return this;
  }

  /** Grid alias of setColumnFilter. */
  setFilter(columnKey, value) {
    return this.setColumnFilter(columnKey, value);
  }

  /**
   * Retrieves active filter for a specific column.
   * @param {string} colKey
   * @returns {any}
   */
  getColumnFilter(colKey) {
    return this.columnFilters[colKey];
  }

  /** Grid alias of getColumnFilter. */
  getFilter(colKey) {
    return this.getColumnFilter(colKey);
  }

  /**
   * Clears all global and column filters and resets bound controls.
   * @returns {this}
   */
  clear() {
    this.globalQuery = '';
    this.columnFilters = {};
    this._clearTimers();

    for (const { element } of this._boundListeners) {
      if (element.tagName === 'SELECT') {
        if (element.multiple) Array.from(element.options).forEach(option => { option.selected = false; });
        else {
          const empty = Array.from(element.options).findIndex(option => option.value === '' || option.value === 'all');
          element.selectedIndex = empty >= 0 ? empty : 0;
        }
      } else if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = false;
      } else if ('value' in element) {
        element.value = '';
      }
    }

    this._notifyChange();
    return this;
  }

  /** Alias of clear(). */
  reset() {
    return this.clear();
  }

  /**
   * Serializes active filters for server requests, keeping arrays as arrays:
   * { search: 'foo', 'filters[role]': 'admin', 'filters[tags]': ['a', 'b'] }.
   * GET requests send arrays as filters[tags][]=a; JSON bodies are nested ({ filters: { role } }).
   * @returns {Record<string, any>}
   */
  serialize() {
    const params = {};
    if (this.globalQuery) {
      params[this.options.searchParam] = this.globalQuery;
    }
    for (const [key, val] of Object.entries(this.columnFilters)) {
      if (!isClearFilter(val)) {
        params[`${this.options.filtersParam}[${key}]`] = Array.isArray(val) ? [...val] : val;
      }
    }
    return params;
  }

  /**
   * Filters an in-memory array of records.
   * @param {Array<any>} rows
   * @param {Array<string | { key: string }> | null} [columns] Keys searched by the global query.
   *   Defaults to options.searchKeys, then every primitive, non-underscore, non-html_* field.
   * @returns {Array<any>}
   */
  filterRows(rows, columns = null) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    if (!this.globalQuery && Object.keys(this.columnFilters).length === 0) {
      return [...rows];
    }

    const configured = Array.isArray(columns) && columns.length > 0 ? columns
      : Array.isArray(this.options.searchKeys) && this.options.searchKeys.length > 0 ? this.options.searchKeys : null;
    const keys = configured
      ? configured.map(column => typeof column === 'string' ? column : column?.key).filter(key => key && key !== '_select')
      : null;
    const locale = this.locale;
    const query = this.options.caseSensitive ? this.globalQuery : foldText(this.globalQuery, locale);

    return rows.filter((row) => {
      // 1. Column filters
      for (const [colKey, filterVal] of Object.entries(this.columnFilters)) {
        if (!this._matchesFilter(readValue(row, colKey), filterVal, locale)) return false;
      }

      // 2. Global search
      if (query) {
        const keysToCheck = keys || searchableKeys(row, this.options.excludeKeys || []);
        const matched = keysToCheck.some((key) => {
          const val = readValue(row, key);
          if (val === null || val === undefined || typeof val === 'object') return false;
          const text = this.options.caseSensitive ? String(val) : foldText(val, locale);
          return text.includes(query);
        });
        if (!matched) return false;
      }

      return true;
    });
  }

  /** Grid alias of filterRows. */
  filterData(rows, colKeys = null) {
    if (!Array.isArray(rows)) return [];
    return this.filterRows(rows, colKeys);
  }

  /**
   * Evaluates if a cell value matches a filter value (ranges, regex, substring, arrays).
   * @private
   */
  _matchesFilter(cellValue, filterValue, locale = this.locale) {
    if (filterValue === undefined || filterValue === null || filterValue === '') return true;
    if (cellValue === undefined || cellValue === null) return false;

    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) return true;
      return filterValue.some(v => this._matchesFilter(cellValue, v, locale));
    }

    const cellStr = String(cellValue).trim();
    const filterStr = String(filterValue).trim();

    // Regex mode: /pattern/flags
    if (filterStr.startsWith('/') && filterStr.length > 2 && filterStr.lastIndexOf('/') > 0) {
      try {
        const lastSlash = filterStr.lastIndexOf('/');
        return new RegExp(filterStr.slice(1, lastSlash), filterStr.slice(lastSlash + 1)).test(cellStr);
      } catch {
        // Fall back to string check on regex error
      }
    }

    // Number range mode: "10..50", ">= 100", "< 50"
    const num = parseFloat(cellStr.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      if (filterStr.includes('..')) {
        const [min, max] = filterStr.split('..').map(parseFloat);
        if (!isNaN(min) && num < min) return false;
        if (!isNaN(max) && num > max) return false;
        return true;
      }
      for (const [operator, test] of [['>=', (a, b) => a >= b], ['<=', (a, b) => a <= b], ['>', (a, b) => a > b], ['<', (a, b) => a < b]]) {
        if (filterStr.startsWith(operator)) {
          const target = parseFloat(filterStr.slice(operator.length));
          return !isNaN(target) && test(num, target);
        }
      }
    }

    if (this.options.caseSensitive) return cellStr.includes(filterStr);
    return foldText(cellStr, locale).includes(foldText(filterStr, locale));
  }

  /** @private */
  _debounce(element, callback) {
    clearTimeout(this._timers.get(element));
    this._timers.set(element, setTimeout(() => {
      this._timers.delete(element);
      callback();
    }, Math.max(0, Number(this.options.debounce) || 0)));
  }

  /** @private */
  _clearTimers() {
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
  }

  /**
   * Internal change dispatcher.
   * @private
   */
  _notifyChange() {
    const payload = {
      global: this.globalQuery,
      columns: { ...this.columnFilters },
      serialized: this.serialize(),
    };

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(payload);
    } else if (this.grid && typeof this.grid._onFilterChange === 'function') {
      this.grid._onFilterChange(payload);
    } else if (this.table && typeof this.table._onFilterChange === 'function') {
      this.table._onFilterChange(payload);
    }
  }

  /**
   * Teardown listeners and timers.
   */
  destroy() {
    this._clearTimers();
    for (const item of this._boundListeners) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._boundListeners = [];
    this.grid = null;
    this.table = null;
  }
}

export default CGEFilter;
