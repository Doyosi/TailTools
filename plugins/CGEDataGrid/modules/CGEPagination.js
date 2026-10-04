/**
 * CGEPagination - Independent Data Grid & Table Pagination Sub-Module
 * TailTools Plugin Library
 *
 * Computes sliding numerical windows, direct page jump input with boundary validation,
 * per-page selector ([6, 12, 24, 48, 'All']), counter metrics generator,
 * and server-side query parameter synchronization.
 * Can be used standalone or as part of CGEDataGrid and CGEDataTable.
 */

export class CGEPagination {
  /**
   * @param {Object} [options={}] Configuration options
   */
  constructor(options = {}) {
    this.options = {
      page: 1,
      perPage: 12,
      total: 0,
      perPageOptions: [6, 12, 24, 48, 'All'],
      windowDelta: 2,
      pageParam: 'page',
      perPageParam: 'per_page',
      onChange: null,
      translations: {
        info: 'Showing :from to :to of :total items',
        'per-page': 'Show :count items',
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

    /** @type {any} Reference to parent grid or table if registered */
    this.grid = null;
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
   * Start index (1-based) of the current page's slice.
   * @type {number}
   */
  get from() {
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return 1;
    return (this.page - 1) * this.perPage + 1;
  }

  /**
   * End index (1-based) of the current page's slice.
   * @type {number}
   */
  get to() {
    if (this.total === 0) return 0;
    if (this.perPage <= 0) return this.total;
    return Math.min(this.page * this.perPage, this.total);
  }

  /**
   * Normalizes per-page input value.
   * @private
   */
  _normalizePerPage(val) {
    if (typeof val === 'string' && val.toLowerCase() === 'all') return 0;
    const num = parseInt(val, 10);
    return isNaN(num) || num <= 0 ? 0 : num;
  }

  /**
   * Navigates to a specific page number.
   * @param {number} targetPage
   * @returns {this}
   */
  goToPage(targetPage) {
    const validTarget = Math.max(1, Math.min(parseInt(targetPage, 10) || 1, this.lastPage));
    if (validTarget !== this.page) {
      this.page = validTarget;
      this._notifyChange();
    }
    return this;
  }

  /**
   * Navigates to previous page if available.
   * @returns {this}
   */
  prevPage() {
    if (this.page > 1) {
      this.goToPage(this.page - 1);
    }
    return this;
  }

  /**
   * Navigates to next page if available.
   * @returns {this}
   */
  nextPage() {
    if (this.page < this.lastPage) {
      this.goToPage(this.page + 1);
    }
    return this;
  }

  /**
   * Updates per-page limit and resets to page 1.
   * @param {number | string} perPage
   * @returns {this}
   */
  setPerPage(perPage) {
    const normalized = this._normalizePerPage(perPage);
    if (normalized !== this.perPage) {
      this.perPage = normalized;
      this.page = 1;
      this._notifyChange();
    }
    return this;
  }

  /**
   * Updates total count of items.
   * @param {number} total
   * @returns {this}
   */
  setTotal(total) {
    this.total = Math.max(0, parseInt(total, 10) || 0);
    if (this.page > this.lastPage) {
      this.page = Math.max(1, this.lastPage);
    }
    return this;
  }

  /**
   * Computes sliding numerical window array with ellipsis indicators.
   * e.g. [1, 2] or [1, '...', 4, 5, 6, '...', 20]
   * @param {number} [delta]
   * @returns {Array<number | string>}
   */
  getWindow(delta = null) {
    const totalPages = this.lastPage;
    if (totalPages <= 1) return [1];

    const d = delta !== null ? delta : this.options.windowDelta;
    if (totalPages <= (d * 2 + 5)) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const current = this.page;
    const left = Math.max(2, current - d);
    const right = Math.min(totalPages - 1, current + d);

    const pages = [1];
    if (left > 2) {
      pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  }

  /**
   * Alias for getWindow for compatibility with CGEDataTable CGEPagination.
   * @param {number} [delta]
   * @returns {Array<number | string>}
   */
  computeWindow(delta = null) {
    return this.getWindow(delta);
  }

  /**
   * Slices in-memory rows for current page.
   * @param {Array<any>} rows
   * @returns {Array<any>}
   */
  paginateData(rows) {
    if (!Array.isArray(rows)) return [];
    this.setTotal(rows.length);
    if (this.perPage <= 0) return [...rows];
    const start = (this.page - 1) * this.perPage;
    return rows.slice(start, start + this.perPage);
  }

  /**
   * Formats counter info string using template.
   * @param {string} [template]
   * @returns {string}
   */
  formatInfo(template = null) {
    const tpl = template || this.options.translations.info || 'Showing :from to :to of :total items';
    return tpl
      .replace(':from', String(this.from))
      .replace(':to', String(this.to))
      .replace(':total', String(this.total));
  }

  /**
   * Serializes current pagination state into URL query parameters object.
   * @returns {Record<string, any>}
   */
  serialize() {
    return {
      [this.options.pageParam]: this.page,
      [this.options.perPageParam]: this.perPage <= 0 ? 'All' : this.perPage,
    };
  }

  /**
   * Internal change dispatcher.
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

    if (this.grid && typeof this.grid._onPaginationChange === 'function') {
      this.grid._onPaginationChange(payload);
    } else if (this.table && typeof this.table._onPaginationChange === 'function') {
      this.table._onPaginationChange(payload);
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

export default CGEPagination;
