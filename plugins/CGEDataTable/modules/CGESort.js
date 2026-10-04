/**
 * CGESort - Independent Data Table Sorting Sub-Module
 * TailTools Plugin Library
 *
 * Supports single and multi-column sorting, direction cycle (asc -> desc -> none),
 * natural data-type detection (numbers, currency, dates, strings), SVG indicator injection,
 * and server-side query parameter serialization.
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

    /** @type {Array<{ element: HTMLElement, key: string, handler: EventListener }>} */
    this._boundHeaders = [];

    /** @type {any} Reference to parent table if registered */
    this.table = null;
  }

  /**
   * Sets sorting for a specific column.
   * @param {string} columnKey
   * @param {'asc' | 'desc' | 'none'} [direction='asc']
   * @param {boolean} [multi=false] Whether to append rule or replace
   * @returns {this}
   */
  sortBy(columnKey, direction = 'asc', multi = false) {
    if (!columnKey) return this;

    const dir = direction.toLowerCase();
    const isMulti = multi || this.options.multiSort;

    if (!isMulti) {
      if (dir === 'none') {
        this.rules = [];
      } else {
        this.rules = [{ key: columnKey, direction: dir }];
      }
    } else {
      const idx = this.rules.findIndex(r => r.key === columnKey);
      if (dir === 'none') {
        if (idx !== -1) this.rules.splice(idx, 1);
      } else if (idx !== -1) {
        this.rules[idx].direction = dir;
      } else {
        this.rules.push({ key: columnKey, direction: dir });
      }
    }

    this.updateIndicators();
    this._notifyChange();
    return this;
  }

  /**
   * Cycles direction for a column: asc -> desc -> none.
   * @param {string} columnKey
   * @param {boolean} [multi=false]
   * @returns {this}
   */
  cycleSort(columnKey, multi = false) {
    const current = this.getDirection(columnKey);
    const cycle = this.options.cycle;
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    const nextDir = cycle[nextIdx];
    return this.sortBy(columnKey, nextDir, multi);
  }

  /**
   * Retrieves active sort direction for a column ('asc' | 'desc' | 'none').
   * @param {string} columnKey
   * @returns {'asc' | 'desc' | 'none'}
   */
  getDirection(columnKey) {
    const found = this.rules.find(r => r.key === columnKey);
    return found ? found.direction : 'none';
  }

  /**
   * Resets all active sorts.
   * @returns {this}
   */
  reset() {
    this.rules = [];
    this.updateIndicators();
    this._notifyChange();
    return this;
  }

  /**
   * Serializes active sort state for server requests.
   * e.g. { sort_by: 'name', sort_dir: 'asc' }
   * @returns {Record<string, string>}
   */
  serialize() {
    const params = {};
    if (this.rules.length > 0) {
      if (this.rules.length === 1) {
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
   * Sorts an array of in-memory rows.
   * @param {Array<any>} rows
   * @param {Array<{ key: string, type?: string, [key: string]: any }>} [columns=[]]
   * @returns {Array<any>} Sorted rows
   */
  sortRows(rows, columns = []) {
    if (!Array.isArray(rows) || rows.length <= 1 || this.rules.length === 0) {
      return [...(rows || [])];
    }

    const colMap = new Map();
    for (const c of columns) {
      if (c && c.key) colMap.set(c.key, c);
    }

    return [...rows].sort((a, b) => {
      for (const rule of this.rules) {
        const colDef = colMap.get(rule.key) || {};
        const valA = this._getCellValue(a, rule.key);
        const valB = this._getCellValue(b, rule.key);

        const cmp = this._compareValues(valA, valB, colDef.type || this._detectType(valA, valB));
        if (cmp !== 0) {
          return rule.direction === 'desc' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  /**
   * Attaches click handlers and sort indicators to table header cells.
   * @param {NodeList | Array<HTMLTableCellElement> | HTMLTableElement | string} headers
   */
  attachHeaders(headers) {
    let elements = [];
    if (typeof headers === 'string') {
      elements = Array.from(document.querySelectorAll(headers));
    } else if (headers instanceof HTMLElement) {
      elements = Array.from(headers.querySelectorAll('th[data-cge-key], th[data-cge-sortable]'));
    } else if (headers instanceof NodeList || Array.isArray(headers)) {
      elements = Array.from(headers);
    }

    for (const th of elements) {
      const key = th.getAttribute('data-cge-key') || th.getAttribute('data-key') || th.dataset.cgeKey;
      if (!key || key === '_select' || th.getAttribute('data-cge-sortable') === 'false' || this._boundHeaders.some(item => item.element === th)) continue;

      const original = { tabindex: th.getAttribute('tabindex'), role: th.getAttribute('role'),
        sort: th.getAttribute('aria-sort'), classes: th.className };
      th.classList.add('cge-th-sortable', 'cursor-pointer', 'select-none');
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'columnheader');

      const handler = (e) => {
        const isMulti = e.shiftKey || this.options.multiSort;
        this.cycleSort(key, isMulti);
      };

      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.cycleSort(key, e.shiftKey);
        }
      };

      th.addEventListener('click', handler);
      th.addEventListener('keydown', keyHandler);

      this._boundHeaders.push({ element: th, key, handler, keyHandler, original });
    }

    this.updateIndicators();
  }

  /**
   * Updates indicator arrows and ARIA attributes on all bound header cells.
   */
  updateIndicators() {
    for (const item of this._boundHeaders) {
      const dir = this.getDirection(item.key);
      const th = item.element;

      // Update ARIA sort
      if (dir === 'asc') th.setAttribute('aria-sort', 'ascending');
      else if (dir === 'desc') th.setAttribute('aria-sort', 'descending');
      else th.setAttribute('aria-sort', 'none');

      // Update classes
      th.classList.toggle('cge-sorted-asc', dir === 'asc');
      th.classList.toggle('cge-sorted-desc', dir === 'desc');

      // Ensure sort indicator container
      let icon = th.querySelector('.cge-sort-indicator');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'cge-sort-indicator inline-flex items-center ml-1.5 align-middle transition-transform duration-200';
        th.appendChild(icon);
      }

      icon.innerHTML = this._getSortIconSvg(dir);
    }
  }

  /**
   * Generates SVG for sort indicator based on active direction.
   * @private
   */
  _getSortIconSvg(direction) {
    if (direction === 'asc') {
      return `<svg class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>`;
    }
    if (direction === 'desc') {
      return `<svg class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>`;
    }
    // Neutral unsorted icon
    return `<svg class="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
    </svg>`;
  }

  /**
   * Internal cell value reader.
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
   * Compares two values naturally according to resolved data type.
   * @private
   */
  _compareValues(a, b, type) {
    if (a === b) return 0;
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;

    switch (type) {
      case 'number': {
        const numA = typeof a === 'number' ? a : parseFloat(String(a).replace(/[^0-9.-]/g, ''));
        const numB = typeof b === 'number' ? b : parseFloat(String(b).replace(/[^0-9.-]/g, ''));
        return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
      }
      case 'currency': {
        // Strip any currency symbols ($, €, £, ₺, ¥) and parse standard or european notation
        const cleanA = this._normalizeCurrency(a);
        const cleanB = this._normalizeCurrency(b);
        const numA = parseFloat(cleanA);
        const numB = parseFloat(cleanB);
        return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
      }
      case 'date': {
        const timeA = new Date(a).getTime();
        const timeB = new Date(b).getTime();
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }
      default: {
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      }
    }
  }

  /**
   * Auto-detects data type from sample values.
   * @private
   */
  _normalizeCurrency(value) {
    const clean = String(value).replace(/[^\d.,-]/g, '');
    const decimal = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','));
    if (decimal >= 0 && clean.length - decimal - 1 <= 2) {
      return clean.slice(0, decimal).replace(/[.,]/g, '') + '.' + clean.slice(decimal + 1);
    }
    return clean.replace(/[.,]/g, '');
  }

  _detectType(a, b) {
    const val = (a !== null && a !== undefined && a !== '') ? a : b;
    if (val === null || val === undefined) return 'string';
    if (typeof val === 'number') return 'number';

    const str = String(val).trim();
    // Currency check ($1,200.00, €45.00, etc.)
    if (/^[\$€£¥₺]/.test(str) || /[\$€£¥₺]$/.test(str)) return 'currency';

    // Pure number string
    if (/^-?\d+(\.\d+)?$/.test(str)) return 'number';

    // ISO or Date string check
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str) || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)) {
      if (!isNaN(Date.parse(str))) return 'date';
    }

    return 'string';
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
    } else if (this.table && typeof this.table._onSortChange === 'function') {
      this.table._onSortChange(payload);
    }
  }

  /**
   * Cleanup event listeners and indicators.
   */
  destroy() {
    for (const item of this._boundHeaders) {
      item.element.removeEventListener('click', item.handler);
      item.element.removeEventListener('keydown', item.keyHandler);
      for (const [attr, value] of [['tabindex', item.original.tabindex], ['role', item.original.role], ['aria-sort', item.original.sort]]) {
        if (value === null) item.element.removeAttribute(attr); else item.element.setAttribute(attr, value);
      }
      const icon = item.element.querySelector('.cge-sort-indicator');
      if (icon) icon.remove();
      item.element.className = item.original.classes;
    }
    this._boundHeaders = [];
    this.table = null;
  }
}

export default CGESort;
