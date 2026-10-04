/**
 * CGEFilter - Independent Data Grid & Table Filtering Sub-Module
 * TailTools Plugin Library
 *
 * Supports global debounced search, per-field/column filters, multi-mode matching
 * (substring, number range, regex, array/multi-select), and server-side query parameter serialization.
 * Can be used standalone or as part of CGEDataGrid and CGEDataTable.
 */

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
      input: null,
      onChange: null,
      ...options,
    };

    /** @type {string} */
    this.globalQuery = '';

    /** @type {Record<string, any>} */
    this.columnFilters = {};

    /** @type {NodeJS.Timeout | number | null} */
    this._debounceTimer = null;

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
    this.table = null;

    if (this.options.input) {
      this.attachSearchInput(this.options.input);
    }
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
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.apply(val);
      }, this.options.debounce);
    };

    el.addEventListener('input', handler);
    this._boundListeners.push({ element: el, event: 'input', handler });
    if (el.value) {
      this.globalQuery = el.value.trim();
    }
  }

  /**
   * Binds an input or select element to a specific field filter.
   * @param {string} fieldKey
   * @param {HTMLElement | string} element
   * @param {string} [eventType='input']
   */
  attachFieldFilter(fieldKey, element, eventType = 'input') {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el || !fieldKey) return;

    const evt = el.tagName === 'SELECT' ? 'change' : eventType;
    const handler = (e) => {
      let val;
      if (el.tagName === 'SELECT' && el.multiple) {
        val = Array.from(el.selectedOptions).map(opt => opt.value).filter(Boolean);
      } else {
        val = e.target.value;
      }
      this.setFilter(fieldKey, val);
    };

    el.addEventListener(evt, handler);
    this._boundListeners.push({ element: el, event: evt, handler });
  }

  /**
   * Applies global search query.
   * @param {string} query
   * @returns {this}
   */
  apply(query) {
    this.globalQuery = (query || '').trim();
    this._notifyChange();
    return this;
  }

  /**
   * Sets a specific field/column filter value.
   * @param {string} columnKey
   * @param {any} value
   * @returns {this}
   */
  setFilter(columnKey, value) {
    if (!columnKey) return this;
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete this.columnFilters[columnKey];
    } else {
      this.columnFilters[columnKey] = value;
    }
    this._notifyChange();
    return this;
  }

  /**
   * Clears all filters and global search.
   * @returns {this}
   */
  clear() {
    this.globalQuery = '';
    this.columnFilters = {};
    for (const item of this._boundListeners) {
      if ('value' in item.element) {
        item.element.value = '';
      }
    }
    this._notifyChange();
    return this;
  }

  /**
   * Serializes current filter state into URL query parameters object.
   * @returns {Record<string, any>}
   */
  serialize() {
    const params = {};
    if (this.globalQuery) {
      params[this.options.searchParam] = this.globalQuery;
    }
    if (Object.keys(this.columnFilters).length > 0) {
      for (const [col, val] of Object.entries(this.columnFilters)) {
        params[`${this.options.filtersParam}[${col}]`] = val;
      }
    }
    return params;
  }

  /**
   * Filters an array of in-memory objects based on active criteria.
   * @param {Array<any>} rows
   * @param {Array<string>} [colKeys] Optional specific keys to search across
   * @returns {Array<any>}
   */
  filterData(rows, colKeys = null) {
    if (!Array.isArray(rows)) return [];
    if (!this.globalQuery && Object.keys(this.columnFilters).length === 0) {
      return [...rows];
    }

    const globalQ = this.options.caseSensitive ? this.globalQuery : this.globalQuery.toLowerCase();

    return rows.filter((row) => {
      // 1. Column / field specific filters check
      for (const [colKey, filterVal] of Object.entries(this.columnFilters)) {
        const cellVal = this._getCellValue(row, colKey);
        if (!this._matchesFilter(cellVal, filterVal)) {
          return false;
        }
      }

      // 2. Global search check
      if (globalQ) {
        const keysToCheck = colKeys || Object.keys(row);
        let matched = false;
        for (const k of keysToCheck) {
          const val = this._getCellValue(row, k);
          if (val !== null && val !== undefined) {
            const str = this.options.caseSensitive ? String(val) : String(val).toLowerCase();
            if (str.includes(globalQ)) {
              matched = true;
              break;
            }
          }
        }
        if (!matched) return false;
      }

      return true;
    });
  }

  /**
   * Extracts cell value by key, supporting nested objects or cell elements.
   * @private
   */
  _getCellValue(row, key) {
    if (!row) return '';
    if (row.cells && typeof row.cells === 'object' && key in row.cells) {
      return row.cells[key];
    }
    if (key.includes('.')) {
      return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), row);
    }
    return row[key] !== undefined ? row[key] : '';
  }

  /**
   * Evaluates if a cell value matches a filter value (supports ranges, regex, substring, arrays).
   * @private
   */
  _matchesFilter(cellValue, filterValue) {
    if (filterValue === undefined || filterValue === null || filterValue === '') return true;
    if (cellValue === undefined || cellValue === null) return false;

    // Array mode: e.g. multi-select dropdown, checkbox group
    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) return true;
      return filterValue.some(v => this._matchesFilter(cellValue, v));
    }

    const cellStr = String(cellValue).trim();
    const filterStr = String(filterValue).trim();

    // Regex mode: /pattern/flags
    if (filterStr.startsWith('/') && filterStr.length > 2 && filterStr.lastIndexOf('/') > 0) {
      try {
        const lastSlash = filterStr.lastIndexOf('/');
        const pattern = filterStr.slice(1, lastSlash);
        const flags = filterStr.slice(lastSlash + 1);
        const rx = new RegExp(pattern, flags);
        return rx.test(cellStr);
      } catch {
        // Fall back to string check on regex error
      }
    }

    // Number Range mode: e.g. "10..50", ">= 100", "< 50"
    const num = parseFloat(cellStr.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      if (filterStr.includes('..')) {
        const [minStr, maxStr] = filterStr.split('..');
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        if (!isNaN(min) && num < min) return false;
        if (!isNaN(max) && num > max) return false;
        return true;
      }
      if (filterStr.startsWith('>=')) {
        const target = parseFloat(filterStr.slice(2));
        return !isNaN(target) && num >= target;
      }
      if (filterStr.startsWith('>')) {
        const target = parseFloat(filterStr.slice(1));
        return !isNaN(target) && num > target;
      }
      if (filterStr.startsWith('<=')) {
        const target = parseFloat(filterStr.slice(2));
        return !isNaN(target) && num <= target;
      }
      if (filterStr.startsWith('<')) {
        const target = parseFloat(filterStr.slice(1));
        return !isNaN(target) && num < target;
      }
    }

    // Default substring or equality check
    if (this.options.caseSensitive) {
      return cellStr.includes(filterStr);
    }
    return cellStr.toLowerCase().includes(filterStr.toLowerCase());
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
    }

    if (this.grid && typeof this.grid._onFilterChange === 'function') {
      this.grid._onFilterChange(payload);
    } else if (this.table && typeof this.table._onFilterChange === 'function') {
      this.table._onFilterChange(payload);
    }
  }

  /**
   * Teardown listeners and timers.
   */
  destroy() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    for (const item of this._boundListeners) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._boundListeners = [];
    this.grid = null;
    this.table = null;
  }
}

export default CGEFilter;
