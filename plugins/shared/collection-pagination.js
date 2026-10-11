/**
 * CGEPagination - Shared Data Table & Data Grid Pagination Core
 * TailTools Plugin Library
 *
 * Sliding page windows, boundary-clamped navigation, per-page limits with a configurable
 * "All" value, counter metrics and Laravel paginator support: LengthAwarePaginator / API
 * Resource meta (total + last_page), simplePaginate (hasMore) and cursorPaginate (cursors).
 * Re-exported by plugins/CGEDataTable/modules/CGEPagination.js and
 * plugins/CGEDataGrid/modules/CGEPagination.js.
 */

const toInt = (value, fallback = 0) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

export const DEFAULT_PAGINATION_TRANSLATIONS = {
  info: 'Showing :from to :to of :total entries',
  'info-simple': 'Showing :from to :to',
  'per-page': 'Show :count entries',
  prev: 'Previous',
  next: 'Next',
  'go-to-page': 'Go to page',
  all: 'All',
  jump: 'Go',
};

export class CGEPagination {
  /**
   * @param {Object} [options={}] Configuration options
   */
  constructor(options = {}) {
    this.options = {
      page: 1,
      perPage: 10,
      total: 0,
      perPageOptions: [10, 25, 50, 100, 'All'],
      windowDelta: 2,
      pageParam: 'page',
      perPageParam: 'per_page',
      cursorParam: 'cursor',
      allValue: -1,
      onChange: null,
      ...options,
      translations: { ...DEFAULT_PAGINATION_TRANSLATIONS, ...(options.translations || {}) },
    };

    /** @type {'length' | 'simple' | 'cursor'} Paginator kind reported by the server */
    this.mode = 'length';

    /** @type {boolean} False for simplePaginate/cursorPaginate responses without a total */
    this.totalKnown = true;

    /** @type {boolean | null} Whether another page exists (simple/cursor paginators) */
    this.hasMore = null;

    /** @type {string | null} Cursor sent with the next request (cursor paginator) */
    this.cursor = null;
    this.nextCursor = null;
    this.prevCursor = null;

    /** @type {number | null} Rows on the current server page (used when the total is unknown) */
    this.count = null;

    /** @type {number | null} Server-reported last page */
    this._lastPage = null;

    /** @type {number} Current 1-based page */
    this.page = Math.max(1, toInt(this.options.page, 1));

    /** @type {number} Per-page limit (0 means 'All') */
    this.perPage = this._normalizePerPage(this.options.perPage);

    /** @type {number} Total count of items */
    this.total = Math.max(0, toInt(this.options.total));

    this.page = Math.min(this.page, this.lastPage);

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
    this.table = null;

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];
  }

  /**
   * Total number of pages. Uses the server last_page when reported; simple and cursor
   * paginators expose one page beyond the current page while hasMore is true.
   * @type {number}
   */
  get lastPage() {
    if (this.mode !== 'length') return this.hasMore ? this.page + 1 : this.page;
    if (this._lastPage !== null) return Math.max(1, this._lastPage);
    if (this.perPage <= 0 || this.total <= 0) return 1;
    return Math.max(1, Math.ceil(this.total / this.perPage));
  }

  /**
   * 1-based start index of currently visible items.
   * @type {number}
   */
  get from() {
    if (this.mode !== 'length') {
      if (!this.count) return 0;
      return this.perPage > 0 ? (this.page - 1) * this.perPage + 1 : 1;
    }
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return 1;
    return Math.min(this.total, (this.page - 1) * this.perPage + 1);
  }

  /**
   * 1-based end index of currently visible items.
   * @type {number}
   */
  get to() {
    if (this.mode !== 'length') return this.count ? this.from + this.count - 1 : 0;
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return this.total;
    return Math.min(this.total, this.page * this.perPage);
  }

  /**
   * Navigates to a specific page with boundary clamping. Cursor paginators can only move
   * one page forward/back or return to the first page.
   * @param {number | string} page
   * @returns {this}
   */
  goTo(page) {
    let target = toInt(page, 1);
    if (this.mode === 'cursor') {
      let cursor;
      if (target === this.page + 1 && this.nextCursor) cursor = this.nextCursor;
      else if (target === this.page - 1 && this.prevCursor) cursor = this.prevCursor;
      else if (target <= 1 && this.page !== 1) { target = 1; cursor = null; }
      else return this;
      this.cursor = cursor;
      this.page = Math.max(1, target);
      this._notifyChange();
      return this;
    }
    target = Math.max(1, Math.min(target, this.lastPage));
    if (target !== this.page) {
      this.page = target;
      this._notifyChange();
    }
    return this;
  }

  /** Grid alias of goTo. */
  goToPage(targetPage) {
    return this.goTo(targetPage);
  }

  /**
   * Advances to next page if available.
   * @returns {this}
   */
  next() {
    if (this.page < this.lastPage) this.goTo(this.page + 1);
    return this;
  }

  /** Grid alias of next. */
  nextPage() {
    return this.next();
  }

  /**
   * Goes back to previous page if available.
   * @returns {this}
   */
  prev() {
    if (this.page > 1) this.goTo(this.page - 1);
    return this;
  }

  /** Grid alias of prev. */
  prevPage() {
    return this.prev();
  }

  /**
   * Navigates to first page (page 1).
   * @returns {this}
   */
  first() {
    return this.goTo(1);
  }

  /**
   * Navigates to last page.
   * @returns {this}
   */
  last() {
    return this.goTo(this.lastPage);
  }

  /** Returns to page 1 (and drops the cursor) without notifying, e.g. after a filter change. */
  resetPage() {
    this.page = 1;
    this.cursor = null;
    return this;
  }

  /**
   * Updates per-page limit and resets current page to 1.
   * @param {number | string} limit Number, 'All' or the configured allValue
   * @returns {this}
   */
  setPerPage(limit) {
    const norm = this._normalizePerPage(limit);
    if (norm !== this.perPage) {
      this.perPage = norm;
      this._lastPage = null;
      this.resetPage();
      this._notifyChange();
    }
    return this;
  }

  /**
   * Updates metrics at once (typically from a Laravel paginator response).
   * `total` selects length-aware mode, `hasMore` simple mode, cursors (or mode: 'cursor') cursor mode.
   * When "All" is active and the server answers with per_page >= total, "All" is kept.
   * @param {{ page?: number, perPage?: number | string, total?: number, lastPage?: number, hasMore?: boolean,
   *   nextCursor?: string | null, prevCursor?: string | null, mode?: 'length' | 'simple' | 'cursor', count?: number }} metrics
   * @returns {this}
   */
  setMetrics(metrics = {}) {
    const has = key => metrics[key] !== undefined && metrics[key] !== null;
    const cursorMode = metrics.mode === 'cursor' || has('nextCursor') || has('prevCursor');

    if (cursorMode) {
      this.mode = 'cursor';
      this.totalKnown = false;
      this.nextCursor = metrics.nextCursor ?? null;
      this.prevCursor = metrics.prevCursor ?? null;
      this.hasMore = Boolean(this.nextCursor);
      this._lastPage = null;
    } else if (has('total')) {
      this.mode = 'length';
      this.totalKnown = true;
      this.hasMore = null;
      this.total = Math.max(0, toInt(metrics.total));
      this._lastPage = has('lastPage') ? Math.max(1, toInt(metrics.lastPage, 1)) : null;
    } else if (metrics.mode === 'simple' || has('hasMore')) {
      this.mode = 'simple';
      this.totalKnown = false;
      this.hasMore = Boolean(metrics.hasMore);
      this._lastPage = null;
    } else if (has('lastPage')) {
      this._lastPage = Math.max(1, toInt(metrics.lastPage, 1));
    }

    if (has('count')) this.count = Math.max(0, toInt(metrics.count));

    if (has('perPage')) {
      const next = this._normalizePerPage(metrics.perPage);
      const keepAll = this.perPage <= 0 && (next <= 0 || (this.totalKnown && next >= this.total));
      if (!keepAll) this.perPage = next;
      if (keepAll) this._lastPage = null;
    }

    if (has('page')) this.page = Math.max(1, toInt(metrics.page, 1));
    if (this.mode === 'length') this.page = Math.max(1, Math.min(this.page, this.lastPage));
    if (!this.totalKnown) this.total = this.to;
    return this;
  }

  /**
   * Updates the total count (local data) and clamps the current page.
   * @param {number} total
   * @returns {this}
   */
  setTotal(total) {
    return this.setMetrics({ total });
  }

  /**
   * Computes a sliding window of page numbers with ellipses. A single hidden page is shown
   * as its number instead of '...': [1, 2, 3, ...]. Cursor paginators return only the current page.
   * Example: [1, '...', 4, 5, 6, '...', 50]
   * @param {number | null} [delta] Window radius around current page (default: options.windowDelta)
   * @returns {Array<number | string>}
   */
  computeWindow(delta = null) {
    const d = delta === null || delta === undefined ? this.options.windowDelta : delta;
    const current = this.page;
    const last = this.lastPage;

    if (this.mode === 'cursor') return [current];
    if (last <= 1) return [1];
    if (last <= (d * 2 + 5)) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - d);
    const right = Math.min(last - 1, current + d);
    const pages = [1];

    if (left > 3) pages.push('...');
    else if (left === 3) pages.push(2);

    for (let i = left; i <= right; i++) pages.push(i);

    if (right < last - 2) pages.push('...');
    else if (right === last - 2) pages.push(last - 1);

    pages.push(last);
    return pages;
  }

  /** Grid alias of computeWindow. */
  getWindow(delta = null) {
    return this.computeWindow(delta);
  }

  /**
   * Slices an array of in-memory rows for the current page.
   * @param {Array<any>} rows
   * @returns {Array<any>}
   */
  paginateRows(rows) {
    if (!Array.isArray(rows)) return [];
    if (this.perPage <= 0) return [...rows];
    const start = (this.page - 1) * this.perPage;
    return rows.slice(start, start + this.perPage);
  }

  /**
   * Sets the total from the rows and slices the current page (Grid API).
   * @param {Array<any>} rows
   * @returns {Array<any>}
   */
  paginateData(rows) {
    if (!Array.isArray(rows)) return [];
    this.setTotal(rows.length);
    return this.paginateRows(rows);
  }

  /**
   * Formats the counter text; uses 'info-simple' when the server total is unknown.
   * @param {string | null} [template]
   * @returns {string}
   */
  formatInfo(template = null) {
    const key = this.totalKnown ? 'info' : 'info-simple';
    const tpl = template || this.options.translations?.[key] || DEFAULT_PAGINATION_TRANSLATIONS[key];
    return tpl
      .replace(':from', String(this.from))
      .replace(':to', String(this.to))
      .replace(':total', String(this.total));
  }

  /** Table alias of formatInfo. */
  getMetricsString() {
    return this.formatInfo();
  }

  /**
   * Serializes pagination for server requests: { page: 2, per_page: 25 }. "All" is sent as
   * options.allValue (default -1); cursor paginators send { cursor, per_page } instead of page.
   * @returns {Record<string, string | number>}
   */
  serialize() {
    const params = {};
    if (this.mode === 'cursor') {
      if (this.cursor) params[this.options.cursorParam] = this.cursor;
    } else {
      params[this.options.pageParam] = this.page;
    }
    params[this.options.perPageParam] = this.perPage > 0 ? this.perPage : this.options.allValue;
    return params;
  }

  /**
   * Internal perPage value normalizer ('All', allValue, 0 and negatives mean All).
   * @private
   */
  _normalizePerPage(val) {
    if (typeof val === 'string' && val.trim().toLowerCase() === 'all') return 0;
    if (val !== null && val !== undefined && String(val) === String(this.options.allValue)) return 0;
    const n = parseInt(val, 10);
    return isNaN(n) || n <= 0 ? 0 : n;
  }

  /**
   * Internal change notifier.
   * @private
   */
  _notifyChange() {
    const payload = {
      page: this.page,
      perPage: this.perPage,
      total: this.total,
      lastPage: this.lastPage,
      from: this.from,
      to: this.to,
      serialized: this.serialize(),
    };

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(payload);
    } else if (this.grid && typeof this.grid._onPaginationChange === 'function') {
      this.grid._onPaginationChange(payload);
    } else if (this.table && typeof this.table._onPaginationChange === 'function') {
      this.table._onPaginationChange(payload);
    }
  }

  /**
   * Cleanup event listeners.
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

export default CGEPagination;
