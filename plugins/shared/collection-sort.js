/**
 * CGESort - Shared Data Table & Data Grid Sorting Core
 * TailTools Plugin Library
 *
 * Single and multi-column sorting with direction cycle (asc -> desc -> none), one type per
 * column (number/currency, date, text), Turkish/EU number and DD.MM.YYYY date parsing, empty
 * values always last, stable ordering, header indicators, `<select data-cge-sort>` binding and
 * server-side query parameter serialization.
 * Re-exported by plugins/CGEDataTable/modules/CGESort.js and plugins/CGEDataGrid/modules/CGESort.js.
 */

import { defaultLocale, detectColumnType, detectDecimal, isEmptyValue, parseDate, parseNumber, readValue, safeLocale } from './collection-core.js';

const TYPE_ALIASES = { currency: 'number', numeric: 'number', integer: 'number', float: 'number', datetime: 'date', text: 'string' };

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
      locale: null,
      dateOrder: 'dmy',
      types: {},
      onChange: null,
      ...options,
    };

    /**
     * Active sort rules: Array of { key: string, direction: 'asc' | 'desc' }
     * @type {Array<{ key: string, direction: 'asc' | 'desc' }>}
     */
    this.rules = [];

    /** @type {Array<{ element: HTMLElement, key: string, handler: EventListener, keyHandler: EventListener, original: any }>} */
    this._boundHeaders = [];

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
    this.table = null;
  }

  /** Locale used for text collation: explicit option, then `<html lang>`. */
  get locale() {
    return safeLocale(this.options.locale || defaultLocale());
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

    const dir = String(direction || this.options.defaultDirection).toLowerCase() === 'desc' ? 'desc'
      : String(direction).toLowerCase() === 'none' ? 'none' : 'asc';
    const isMulti = multi || this.options.multiSort;

    if (!isMulti) {
      this.rules = dir === 'none' ? [] : [{ key: columnKey, direction: dir }];
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
    const cycle = this.options.cycle;
    const nextIdx = (cycle.indexOf(this.getDirection(columnKey)) + 1) % cycle.length;
    return this.sortBy(columnKey, cycle[nextIdx], multi);
  }

  /** Grid alias of cycleSort. */
  toggleSort(fieldKey, multi = false) {
    return this.cycleSort(fieldKey, multi);
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

  /** Grid alias of reset. */
  clear() {
    return this.reset();
  }

  /**
   * Serializes active sort state for server requests: { sort_by: 'name', sort_dir: 'asc' };
   * multiple rules are comma separated ('name,email' / 'asc,desc').
   * Validate both against a whitelist on the server.
   * @returns {Record<string, string>}
   */
  serialize() {
    const params = {};
    if (this.rules.length > 0) {
      params[this.options.sortByParam] = this.rules.map(r => r.key).join(',');
      params[this.options.sortDirParam] = this.rules.map(r => r.direction).join(',');
    }
    return params;
  }

  /**
   * Sorts an array of in-memory rows. The type of each sorted column is resolved once
   * (column.type, options.types[key], or detected from all values), empty values stay last
   * in both directions, and equal values keep their original order.
   * @param {Array<any>} rows
   * @param {Array<{ key: string, type?: string, [key: string]: any }>} [columns=[]]
   * @returns {Array<any>} Sorted rows
   */
  sortRows(rows, columns = []) {
    if (!Array.isArray(rows)) return [];
    if (rows.length <= 1 || this.rules.length === 0) return [...rows];

    const colMap = new Map();
    for (const c of columns || []) {
      if (c && c.key) colMap.set(c.key, c);
    }

    const locale = this.locale;
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    const plans = this.rules.map((rule) => {
      const raw = rows.map(row => readValue(row, rule.key));
      const declared = String(colMap.get(rule.key)?.type || this.options.types?.[rule.key] || 'auto').toLowerCase();
      const type = TYPE_ALIASES[declared] || (['number', 'date', 'string'].includes(declared) ? declared
        : detectColumnType(raw, this.options.dateOrder));
      const decimal = type === 'number' ? detectDecimal(raw.filter(value => !isEmptyValue(value)), locale) : '.';
      const keys = raw.map((value) => {
        if (isEmptyValue(value)) return null;
        if (type === 'number') { const number = parseNumber(value, decimal); return Number.isNaN(number) ? null : number; }
        if (type === 'date') {
          let time = parseDate(value, this.options.dateOrder);
          // Explicit date columns also accept other formats the browser parses ("Oct 12, 2025").
          if (Number.isNaN(time) && declared !== 'auto' && typeof value === 'string') time = Date.parse(value);
          if (Number.isNaN(time) && typeof value === 'number') time = value;
          return Number.isNaN(time) ? null : time;
        }
        return String(value);
      });
      return { type, keys, desc: rule.direction === 'desc' };
    });

    return rows.map((row, index) => ({ row, index }))
      .sort((a, b) => {
        for (const plan of plans) {
          const x = plan.keys[a.index];
          const y = plan.keys[b.index];
          if (x === null || y === null) {
            if (x === y) continue;
            return x === null ? 1 : -1; // empty values last regardless of direction
          }
          const cmp = plan.type === 'string' ? collator.compare(x, y) : x - y;
          if (cmp !== 0) return plan.desc ? -cmp : cmp;
        }
        return a.index - b.index;
      })
      .map(item => item.row);
  }

  /** Grid alias of sortRows (types come from options.types or detection). */
  sortData(rows, columns = []) {
    return this.sortRows(rows, columns);
  }

  /**
   * Attaches click handlers and sort indicators to table header cells.
   * @param {NodeList | Array<HTMLTableCellElement> | HTMLElement | string} headers
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
        this.cycleSort(key, e.shiftKey || this.options.multiSort);
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
   * Binds a `<select data-cge-sort>` whose options are formatted as "field:dir" (e.g. "date:desc").
   * The selected option is applied as the initial sort.
   * @param {HTMLSelectElement | string} select
   */
  attachSortSelect(select) {
    const el = typeof select === 'string' ? document.querySelector(select) : select;
    if (!el) return;

    const handler = (e) => {
      const val = e.target.value;
      if (!val || val === 'none') {
        this.reset();
        return;
      }
      const [field, dir] = val.split(':');
      this.sortBy(field, dir || 'asc');
    };

    el.addEventListener('change', handler);
    this._boundListeners.push({ element: el, event: 'change', handler });

    if (el.value && el.value !== 'none') {
      const [field, dir] = el.value.split(':');
      if (field) this.rules = [{ key: field, direction: dir === 'desc' ? 'desc' : 'asc' }];
    }
  }

  /**
   * Updates indicator arrows and ARIA attributes on bound headers and syncs bound sort selects.
   */
  updateIndicators() {
    for (const item of this._boundHeaders) {
      const dir = this.getDirection(item.key);
      const th = item.element;

      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none');
      th.classList.toggle('cge-sorted-asc', dir === 'asc');
      th.classList.toggle('cge-sorted-desc', dir === 'desc');

      let icon = th.querySelector('.cge-sort-indicator');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'cge-sort-indicator inline-flex items-center ml-1.5 align-middle transition-transform duration-200';
        th.appendChild(icon);
      }

      icon.innerHTML = this._getSortIconSvg(dir);
    }

    const rule = this.rules[0];
    const value = rule ? `${rule.key}:${rule.direction}` : 'none';
    for (const { element } of this._boundListeners) {
      if (element.tagName !== 'SELECT' || element.value === value) continue;
      const option = Array.from(element.options).find(o => o.value === value || (!rule && o.value === ''));
      if (option) element.value = option.value;
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
    return `<svg class="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
    </svg>`;
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
   * Cleanup event listeners, header indicators and attributes.
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
    for (const item of this._boundListeners) {
      item.element.removeEventListener(item.event, item.handler);
    }
    this._boundListeners = [];
    this.grid = null;
    this.table = null;
  }
}

export default CGESort;
