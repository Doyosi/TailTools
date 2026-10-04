/**
 * CGESort - Independent Data Grid & Table Sorting Sub-Module
 * TailTools Plugin Library
 *
 * Supports single and multi-field sorting, direction cycle (asc -> desc -> none),
 * natural data-type detection (numbers, currency, dates, strings), selector dropdown binding,
 * and server-side query parameter serialization.
 * Can be used standalone or as part of CGEDataGrid and CGEDataTable.
 */

export class CGESort {
  /**
   * @param {Object} [options={}]
   */
  constructor(options = {}) {
    this.options = {
      multiSort: false,
      sortByParam: 'sort_by',
      sortDirParam: 'sort_dir',
      cycle: ['asc', 'desc', 'none'],
      defaultDirection: 'asc',
      onChange: null,
      ...options,
    };

    /**
     * Active sort rules: Array of { key: string, direction: 'asc' | 'desc' }
     * @type {Array<{ key: string, direction: 'asc' | 'desc' }>}
     */
    this.rules = [];

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
    this.table = null;
  }

  /**
   * Sets sorting for a specific field/column.
   * @param {string} fieldKey
   * @param {'asc' | 'desc' | 'none'} [direction='asc']
   * @param {boolean} [multi=false] Whether to append rule or replace
   * @returns {this}
   */
  sortBy(fieldKey, direction = 'asc', multi = false) {
    if (!fieldKey) return this;

    const dir = direction.toLowerCase();
    const isMulti = multi || this.options.multiSort;

    if (!isMulti) {
      if (dir === 'none') {
        this.rules = [];
      } else {
        this.rules = [{ key: fieldKey, direction: dir }];
      }
    } else {
      const idx = this.rules.findIndex(r => r.key === fieldKey);
      if (dir === 'none') {
        if (idx !== -1) this.rules.splice(idx, 1);
      } else if (idx !== -1) {
        this.rules[idx].direction = dir;
      } else {
        this.rules.push({ key: fieldKey, direction: dir });
      }
    }

    this._notifyChange();
    return this;
  }

  /**
   * Toggles through sort cycle for a specific key.
   * @param {string} fieldKey
   * @param {boolean} [multi=false]
   * @returns {this}
   */
  toggleSort(fieldKey, multi = false) {
    const current = this.getDirection(fieldKey);
    const cycle = this.options.cycle;
    const currentIdx = cycle.indexOf(current);
    const nextIdx = (currentIdx + 1) % cycle.length;
    return this.sortBy(fieldKey, cycle[nextIdx], multi);
  }

  /**
   * Gets current sort direction for a field.
   * @param {string} fieldKey
   * @returns {'asc' | 'desc' | 'none'}
   */
  getDirection(fieldKey) {
    const rule = this.rules.find(r => r.key === fieldKey);
    return rule ? rule.direction : 'none';
  }

  /**
   * Clears all active sort rules.
   * @returns {this}
   */
  clear() {
    this.rules = [];
    this._notifyChange();
    return this;
  }

  /**
   * Serializes current sort state into URL query parameters object.
   * @returns {Record<string, any>}
   */
  serialize() {
    const params = {};
    if (this.rules.length > 0) {
      if (!this.options.multiSort) {
        params[this.options.sortByParam] = this.rules[0].key;
        params[this.options.sortDirParam] = this.rules[0].direction;
      } else {
        params[this.options.sortByParam] = this.rules.map(r => r.key).join(',');
        params[this.options.sortDirParam] = this.rules.map(r => r.direction).join(',');
      }
    }
    return params;
  }

  /**
   * Binds a `<select data-cge-sort>` element whose options are formatted as "field:dir" (e.g. "date:desc").
   * @param {HTMLSelectElement | string} select
   */
  attachSortSelect(select) {
    const el = typeof select === 'string' ? document.querySelector(select) : select;
    if (!el) return;

    const handler = (e) => {
      const val = e.target.value;
      if (!val || val === 'none') {
        this.clear();
        return;
      }
      const [field, dir] = val.split(':');
      this.sortBy(field, dir || 'asc');
    };

    el.addEventListener('change', handler);
    this._boundListeners.push({ element: el, event: 'change', handler });

    if (el.value && el.value !== 'none') {
      const [field, dir] = el.value.split(':');
      if (field) {
        this.rules = [{ key: field, direction: dir || 'asc' }];
      }
    }
  }

  /**
   * Sorts an array of objects based on active sort rules.
   * @param {Array<any>} rows
   * @returns {Array<any>}
   */
  sortData(rows) {
    if (!Array.isArray(rows) || this.rules.length === 0) {
      return [...(rows || [])];
    }

    return [...rows].sort((a, b) => {
      for (const rule of this.rules) {
        const valA = this._getValue(a, rule.key);
        const valB = this._getValue(b, rule.key);

        const comparison = this._compareValues(valA, valB);
        if (comparison !== 0) {
          return rule.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Helper to retrieve value supporting nested keys.
   * @private
   */
  _getValue(obj, key) {
    if (!obj) return null;
    if (obj.cells && typeof obj.cells === 'object' && key in obj.cells) {
      return obj.cells[key];
    }
    if (key.includes('.')) {
      return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
    }
    return obj[key] !== undefined ? obj[key] : null;
  }

  /**
   * Natural type comparator (numbers, currency, dates, strings).
   * @private
   */
  _compareValues(a, b) {
    if (a === b) return 0;
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;

    // Number check
    const numA = typeof a === 'number' ? a : parseFloat(String(a).replace(/[^0-9.-]/g, ''));
    const numB = typeof b === 'number' ? b : parseFloat(String(b).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numA) && !isNaN(numB) && !isNaN(a) && !isNaN(b)) {
      return numA - numB;
    }

    // Date check
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);
    if (!isNaN(dateA) && !isNaN(dateB) && (String(a).includes('-') || String(a).includes('/'))) {
      return dateA - dateB;
    }

    // Default locale string comparison
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  /**
   * Internal change dispatcher.
   * @private
   */
  _notifyChange() {
    const payload = {
      rules: [...this.rules],
      serialized: this.serialize(),
    };

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(payload);
    } else if (this.grid && typeof this.grid._onSortChange === 'function') {
      this.grid._onSortChange(payload);
    } else if (this.table && typeof this.table._onSortChange === 'function') {
      this.table._onSortChange(payload);
    }
  }

  /**
   * Teardown listeners and bindings.
   */
  destroy() {
    for (const item of this._boundListeners) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._boundListeners = [];
    this.grid = null;
    this.table = null;
  }
}

export default CGESort;
