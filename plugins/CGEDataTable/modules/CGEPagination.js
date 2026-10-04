/**
 * CGEPagination - Independent Data Table Pagination Sub-Module
 * TailTools Plugin Library
 *
 * Computes sliding numerical windows, direct page jump input with boundary validation,
 * per-page selector ([10, 25, 50, 100, 'All']), counter metrics generator,
 * and server-side query parameter synchronization.
 */

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
      onChange: null,
      translations: {
        info: 'Showing :from to :to of :total entries',
        'per-page': 'Show :count entries',
        prev: 'Previous',
        next: 'Next',
        'go-to-page': 'Go to page',
        all: 'All',
        jump: 'Go',
      },
      ...options,
    };

    /** @type {number} Current 1-based page */
    this.page = Math.max(1, parseInt(this.options.page, 10) || 1);

    /** @type {number} Per-page limit (0 or negative means 'All') */
    this.perPage = this._normalizePerPage(this.options.perPage);

    /** @type {number} Total count of items */
    this.total = Math.max(0, parseInt(this.options.total, 10) || 0);

    /** @type {any} Reference to parent table if registered */
    this.table = null;

    /** @type {Array<{ element: HTMLElement, event: string, handler: EventListener }>} */
    this._boundListeners = [];
  }

  /**
   * Total number of pages based on total count and per-page limit.
   * @type {number}
   */
  get lastPage() {
    if (this.perPage <= 0 || this.total <= 0) return 1;
    return Math.max(1, Math.ceil(this.total / this.perPage));
  }

  /**
   * 1-based start index of currently visible items.
   * @type {number}
   */
  get from() {
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return 1;
    return (this.page - 1) * this.perPage + 1;
  }

  /**
   * 1-based end index of currently visible items.
   * @type {number}
   */
  get to() {
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return this.total;
    return Math.min(this.total, this.page * this.perPage);
  }

  /**
   * Navigates to a specific page with boundary clamping.
   * @param {number | string} page
   * @returns {this}
   */
  goTo(page) {
    let target = parseInt(page, 10);
    if (isNaN(target)) target = 1;
    target = Math.max(1, Math.min(target, this.lastPage));

    if (target !== this.page) {
      this.page = target;
      this._notifyChange();
    }
    return this;
  }

  /**
   * Advances to next page if available.
   * @returns {this}
   */
  next() {
    if (this.page < this.lastPage) {
      this.goTo(this.page + 1);
    }
    return this;
  }

  /**
   * Goes back to previous page if available.
   * @returns {this}
   */
  prev() {
    if (this.page > 1) {
      this.goTo(this.page - 1);
    }
    return this;
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

  /**
   * Updates per-page limit and resets current page to 1.
   * @param {number | string} limit
   * @returns {this}
   */
  setPerPage(limit) {
    const norm = this._normalizePerPage(limit);
    if (norm !== this.perPage) {
      this.perPage = norm;
      this.page = 1;
      this._notifyChange();
    }
    return this;
  }

  /**
   * Updates multiple metrics at once (typically from Ajax / Laravel paginator response).
   * @param {{ page?: number, perPage?: number | string, total?: number, lastPage?: number }} metrics
   * @returns {this}
   */
  setMetrics(metrics = {}) {
    let changed = false;

    if (metrics.total !== undefined) {
      const newTotal = Math.max(0, parseInt(metrics.total, 10) || 0);
      if (newTotal !== this.total) {
        this.total = newTotal;
        changed = true;
      }
    }

    if (metrics.perPage !== undefined) {
      const newPP = this._normalizePerPage(metrics.perPage);
      if (newPP !== this.perPage) {
        this.perPage = newPP;
        changed = true;
      }
    }

    if (metrics.page !== undefined) {
      const newPage = Math.max(1, Math.min(parseInt(metrics.page, 10) || 1, this.lastPage));
      if (newPage !== this.page) {
        this.page = newPage;
        changed = true;
      }
    }

    return this;
  }

  /**
   * Computes sliding numerical window of page numbers and ellipses.
   * Example: [1, '...', 4, 5, 6, '...', 50]
   * @param {number} [delta] Window radius around current page (default: options.windowDelta)
   * @returns {Array<number | string>}
   */
  computeWindow(delta = this.options.windowDelta) {
    const current = this.page;
    const last = this.lastPage;

    if (last <= 1) return [1];
    if (last <= (delta * 2 + 5)) {
      // If total pages are small, display all page numbers directly
      return Array.from({ length: last }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - delta);
    const right = Math.min(last - 1, current + delta);

    const pages = [1];

    if (left > 3) {
      pages.push('...');
    } else if (left === 3) {
      pages.push(2);
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < last - 2) {
      pages.push('...');
    } else if (right === last - 2) {
      pages.push(last - 1);
    }

    pages.push(last);
    return pages;
  }

  /**
   * Slices an array of in-memory rows for the current page.
   * @param {Array<any>} rows
   * @returns {Array<any>} Sliced rows
   */
  paginateRows(rows) {
    if (!Array.isArray(rows)) return [];
    if (this.perPage <= 0) return [...rows];

    const start = (this.page - 1) * this.perPage;
    return rows.slice(start, start + this.perPage);
  }

  /**
   * Generates formatted counter metrics string.
   * e.g. "Showing 1 to 15 of 180 entries"
   * @returns {string}
   */
  getMetricsString() {
    const template = this.options.translations?.info || 'Showing :from to :to of :total entries';
    return template
      .replace(':from', String(this.from))
      .replace(':to', String(this.to))
      .replace(':total', String(this.total));
  }

  /**
   * Serializes current pagination state into query parameters for server requests.
   * e.g. { page: 2, per_page: 25 }
   * @returns {Record<string, string | number>}
   */
  serialize() {
    const params = {
      [this.options.pageParam]: this.page,
    };
    if (this.perPage > 0) {
      params[this.options.perPageParam] = this.perPage;
    }
    return params;
  }

  /**
   * Internal perPage value normalizer.
   * @private
   */
  _normalizePerPage(val) {
    if (typeof val === 'string' && val.toLowerCase() === 'all') return 0;
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
    }

    if (this.table && typeof this.table._onPaginationChange === 'function') {
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
    this.table = null;
  }
}

export default CGEPagination;
