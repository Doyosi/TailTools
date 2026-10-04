/**
 * CGEFilter - Independent Data Table Filtering Sub-Module
 * TailTools Plugin Library
 *
 * Supports global debounced search, per-column filters, multi-mode matching
 * (substring, number range, regex), and server-side query parameter serialization.
 * Can be used standalone or as part of CGEDataTable.
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

    /** @type {any} Reference to parent table if registered */
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

    // Sync initial value if present
    if (el.value) {
      this.globalQuery = el.value;
    }
  }

  /**
   * Attaches a column-specific filter input or select.
   * @param {string} colKey
   * @param {HTMLElement | string} input
   */
  attachColumnFilter(colKey, input) {
    const el = typeof input === 'string' ? document.querySelector(input) : input;
    if (!el) return;

    const handler = (e) => {
      let val;
      if (el.tagName === 'SELECT' && el.multiple) {
        val = Array.from(el.selectedOptions).map(o => o.value).filter(v => v && v !== 'all');
      } else {
        val = e.target.value;
      }
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.setColumnFilter(colKey, val);
      }, this.options.debounce);
    };

    const evtName = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evtName, handler);
    this._boundListeners.push({ element: el, event: evtName, handler });

    if (el.tagName === 'SELECT' && el.multiple) {
      const initial = Array.from(el.selectedOptions).map(o => o.value).filter(v => v && v !== 'all');
      if (initial.length > 0) this.columnFilters[colKey] = initial;
    } else if (el.value && el.value !== 'all') {
      this.columnFilters[colKey] = el.value;
    }
  }

  /**
   * Applies a global search query.
   * @param {string} query
   * @returns {this}
   */
  apply(query) {
    this.globalQuery = String(query || '').trim();
    this._notifyChange();
    return this;
  }

  /**
   * Sets a column-specific filter.
   * @param {string} colKey
   * @param {any} value
   * @returns {this}
   */
  setColumnFilter(colKey, value) {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'all' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete this.columnFilters[colKey];
    } else {
      this.columnFilters[colKey] = value;
    }
    this._notifyChange();
    return this;
  }

  /**
   * Retrieves active filter for a specific column.
   * @param {string} colKey
   * @returns {any}
   */
  getColumnFilter(colKey) {
    return this.columnFilters[colKey];
  }

  /**
   * Clears all global and column filters.
   * @returns {this}
   */
  clear() {
    this.globalQuery = '';
    this.columnFilters = {};

    // Clear bound input values
    for (const item of this._boundListeners) {
      if ('value' in item.element) {
        item.element.value = '';
      }
    }

    this._notifyChange();
    return this;
  }

  /**
   * Serializes active filters into query parameters for server requests.
   * e.g. { search: 'foo', 'filters[role]': 'admin' }
   * @returns {Record<string, string>}
   */
  serialize() {
    const params = {};
    if (this.globalQuery) {
      params[this.options.searchParam] = this.globalQuery;
    }
    for (const [key, val] of Object.entries(this.columnFilters)) {
      if (val !== undefined && val !== null && val !== '') {
        params[`${this.options.filtersParam}[${key}]`] = String(val);
      }
    }
    return params;
  }

  /**
   * Filters an in-memory array of row objects or DOM row items.
   * @param {Array<any>} rows Array of row records
   * @param {Array<{ key: string, [key: string]: any }>} [columns=[]] Column definitions
   * @returns {Array<any>} Filtered rows
   */
  filterRows(rows, columns = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    if (!this.globalQuery && Object.keys(this.columnFilters).length === 0) {
      return [...rows];
    }

    const colKeys = columns.length > 0 ? columns.map(c => c.key) : null;
    const globalQ = this.options.caseSensitive ? this.globalQuery : this.globalQuery.toLowerCase();

    return rows.filter((row) => {
      // 1. Column filters check
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
   * Evaluates if a cell value matches a filter value (supports ranges, regex, substring).
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

    if (this.table && typeof this.table._onFilterChange === 'function') {
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
    this.table = null;
  }
}

export default CGEFilter;
