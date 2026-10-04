/**
 * CGEResponsive - Independent Data Table Responsive Sub-Module
 * TailTools Plugin Library
 *
 * Provides adaptive table layouts:
 * - Mode 1 ('collapse'): Priority-based column collapse with interactive child-row accordion (+/-).
 * - Mode 2 ('scroll'): Enforces smooth horizontal scrolling with sticky header and shadow indicators.
 */

export class CGEResponsive {
  /**
   * @param {Object} [options={}]
   */
  constructor(options = {}) {
    this.options = {
      mode: 'collapse', // 'collapse' | 'scroll'
      breakpoint: 640,
      table: null,
      container: null,
      collapseDetailsText: 'Details',
      onChange: null,
      ...options,
    };

    /** @type {'collapse' | 'scroll'} */
    this.mode = this.options.mode === 'scroll' ? 'scroll' : 'collapse';

    /** @type {HTMLTableElement | null} */
    this.tableElement = null;

    /** @type {HTMLElement | null} */
    this.containerElement = null;

    /** @type {ResizeObserver | null} */
    this._resizeObserver = null;

    /** @type {Set<string>} Set of hidden column keys in collapse mode */
    this.hiddenColumns = new Set();

    /** @type {Set<HTMLTableRowElement>} Set of currently expanded rows in collapse mode */
    this.expandedRows = new Set();

    /** @type {any} Reference to parent table instance if registered */
    this.table = null;

    if (this.options.table) {
      this.attach(this.options.table, this.options.container);
    }
  }

  /**
   * Attaches responsive behavior to a table and its container.
   * @param {HTMLTableElement | string} table
   * @param {HTMLElement | string} [container]
   */
  attach(table, container = null) {
    this.tableElement = typeof table === 'string' ? document.querySelector(table) : table;
    if (!this.tableElement) return;

    if (container) {
      this.containerElement = typeof container === 'string' ? document.querySelector(container) : container;
    } else {
      this.containerElement = this.tableElement.closest('.cge-table-container') || this.tableElement.parentElement;
    }

    this._applyModeClass();
    this._setupObserver();
    this.refresh();
  }

  /**
   * Sets the responsive mode ('collapse' | 'scroll').
   * @param {'collapse' | 'scroll'} mode
   * @returns {this}
   */
  setMode(mode) {
    const validMode = mode === 'scroll' ? 'scroll' : 'collapse';
    if (this.mode === validMode) return this;
    this._cleanupMode();
    this.mode = validMode;
    this._applyModeClass();
    this.refresh();
    return this;
  }

  /**
   * Recalculates layout, priorities, or scroll views based on current dimensions.
   * @returns {this}
   */
  refresh() {
    if (!this.tableElement) return this;

    const width = this._getContainerWidth();

    if (this.mode === 'scroll') {
      this._updateScrollMode();
    } else {
      this._updateCollapseMode(width);
    }

    if (typeof this.options.onChange === 'function') {
      this.options.onChange({
        mode: this.mode,
        width,
        hiddenColumns: Array.from(this.hiddenColumns),
      });
    }

    return this;
  }

  /**
   * Toggles child-row expansion for a specific row in collapse mode.
   * @param {HTMLTableRowElement} tr
   */
  toggleRow(tr) {
    if (!tr || tr.classList.contains('cge-child-row')) return;

    if (this.expandedRows.has(tr)) {
      this.collapseRow(tr);
    } else {
      this.expandRow(tr);
    }
  }

  /**
   * Expands child row showing hidden columns.
   * @param {HTMLTableRowElement} tr
   */
  expandRow(tr) {
    if (!tr || this.expandedRows.has(tr)) return;

    this.expandedRows.add(tr);
    tr.classList.add('cge-row-expanded');

    // Update toggle icon
    const toggleBtn = tr.querySelector('.cge-responsive-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = this._getMinusIconSvg();
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    // Build child row
    const hiddenData = this._extractHiddenRowData(tr);
    const colSpan = 100;

    const childTr = document.createElement('tr');
    childTr.className = 'cge-child-row bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-700/60';
    childTr.setAttribute('data-parent-row', tr.dataset.rowId || '');

    const childTd = document.createElement('td');
    childTd.colSpan = colSpan;
    childTd.className = 'p-3 text-xs';

    let dlHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 py-1 px-2">`;
    for (const item of hiddenData) {
      dlHtml += `
        <div class="flex items-start justify-between sm:justify-start gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-1.5 last:border-b-0">
          <span class="font-semibold text-slate-500 dark:text-slate-400 shrink-0">${item.label}:</span>
          <span class="text-slate-900 dark:text-slate-100 break-words font-medium">${item.html}</span>
        </div>`;
    }
    dlHtml += `</div>`;

    childTd.innerHTML = dlHtml;
    childTr.appendChild(childTd);

    // Insert directly after tr
    tr.after(childTr);
  }

  /**
   * Collapses child row.
   * @param {HTMLTableRowElement} tr
   */
  collapseRow(tr) {
    if (!tr || !this.expandedRows.has(tr)) return;

    this.expandedRows.delete(tr);
    tr.classList.remove('cge-row-expanded');

    const toggleBtn = tr.querySelector('.cge-responsive-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = this._getPlusIconSvg();
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    // Remove child tr
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('cge-child-row')) {
      next.remove();
    }
  }

  /**
   * Collapses all currently expanded child rows.
   */
  collapseAll() {
    for (const tr of Array.from(this.expandedRows)) {
      this.collapseRow(tr);
    }
  }

  /**
   * Sets up ResizeObserver for container or table.
   * @private
   */
  _setupObserver() {
    const target = this.containerElement || this.tableElement?.parentElement;
    if (!target) return;

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        this.refresh();
      });
      this._resizeObserver.observe(target);
    } else {
      window.addEventListener('resize', () => this.refresh());
    }
  }

  /**
   * Resolves current container width.
   * @private
   */
  _getContainerWidth() {
    if (this.containerElement) {
      const w = this.containerElement.clientWidth || this.containerElement.getBoundingClientRect().width;
      if (w > 0) return w;
    }
    return (typeof window !== 'undefined' ? window.innerWidth : 1200) || 1200;
  }

  /**
   * Updates collapse mode column visibility based on priority and width.
   * @private
   */
  _updateCollapseMode(width) {
    if (!this.tableElement) return;

    const ths = Array.from(this.tableElement.querySelectorAll('thead th'));
    if (ths.length === 0) return;

    // Collect column priority definitions (1 = highest priority, kept longest)
    const columns = ths.map((th, index) => {
      const key = th.getAttribute('data-cge-key') || `col_${index}`;
      const prioAttr = th.getAttribute('data-cge-priority');
      const priority = prioAttr ? parseInt(prioAttr, 10) : (index === 0 ? 1 : 2);
      return { th, index, key, priority };
    });

    // Determine how many columns can fit:
    // On desktop (width >= 768), priority 1, 2, 3 columns are NEVER hidden.
    // width < 480: keep priority 1 (mobile portrait)
    // width < 640: keep priority 1 & 2 (mobile landscape)
    // width < 768: keep priority 1, 2 & 3 (tablets)
    // width >= 768: all standard columns fit comfortably
    const shouldHide = (priority) => {
      if (priority <= 1) return false; // Priority 1 is never hidden
      if (width < 480 && priority >= 2) return true;
      if (width < 640 && priority >= 3) return true;
      if (width < 768 && priority >= 4) return true;
      return false;
    };

    this.hiddenColumns.clear();

    columns.forEach(({ th, index, key, priority }) => {
      const hide = shouldHide(priority);
      if (hide) {
        this.hiddenColumns.add(key);
      }

      th.classList.toggle('cge-col-hidden', hide);

      // Hide/show corresponding td in tbody rows
      const tds = this.tableElement.querySelectorAll(`tbody tr:not(.cge-child-row) > td:nth-child(${index + 1})`);
      tds.forEach(td => td.classList.toggle('cge-col-hidden', hide));
    });

    // Invert/inject toggle buttons on first cell of each row if there are hidden columns
    const hasHidden = this.hiddenColumns.size > 0;
    const bodyRows = this.tableElement.querySelectorAll('tbody tr:not(.cge-child-row)');

    bodyRows.forEach(tr => {
      let toggle = tr.querySelector('.cge-responsive-toggle');
      if (hasHidden) {
        // Target the first content cell, skipping the checkbox cell (_select)
        const targetTd = tr.querySelector('td:not([data-cge-key="_select"]):not(.cge-col-hidden)') || tr.querySelector('td:not(.cge-col-hidden)');
        if (targetTd) {
          const mountTarget = targetTd.querySelector('.flex') || targetTd;
          if (!toggle) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'cge-responsive-toggle inline-flex items-center justify-center w-5 h-5 mr-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs font-bold transition-transform cursor-pointer shrink-0 align-middle';
            toggle.innerHTML = this.expandedRows.has(tr) ? this._getMinusIconSvg() : this._getPlusIconSvg();
            toggle.setAttribute('aria-label', this.options.collapseDetailsText);
            toggle.setAttribute('aria-expanded', this.expandedRows.has(tr) ? 'true' : 'false');
            toggle.addEventListener('click', (e) => {
              e.stopPropagation();
              this.toggleRow(tr);
            });
            mountTarget.prepend(toggle);
          } else {
            toggle.classList.remove('hidden');
            if (toggle.parentElement !== mountTarget) {
              mountTarget.prepend(toggle);
            }
          }
        }
      } else {
        if (toggle) {
          toggle.remove();
        }
        this.collapseRow(tr);
      }
    });

    // Update expanded child row contents
    for (const tr of this.expandedRows) {
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('cge-child-row')) {
        const hiddenData = this._extractHiddenRowData(tr);
        const childTd = next.querySelector('td');
        if (childTd) {
          let dlHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 py-1 px-2">`;
          for (const item of hiddenData) {
            dlHtml += `
              <div class="flex items-start justify-between sm:justify-start gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-1.5 last:border-b-0">
                <span class="font-semibold text-slate-500 dark:text-slate-400 shrink-0">${item.label}:</span>
                <span class="text-slate-900 dark:text-slate-100 break-words font-medium">${item.html}</span>
              </div>`;
          }
          dlHtml += `</div>`;
          childTd.innerHTML = dlHtml;
        }
      }
    }
  }

  /**
   * Enforces scroll mode with sticky header and container styling.
   * @private
   */
  _updateScrollMode() {
    if (!this.containerElement) return;
    this.containerElement.classList.add('cge-table-scroll-container', 'overflow-x-auto');
    const thead = this.tableElement?.querySelector('thead');
    if (thead) {
      thead.classList.add('sticky', 'top-0', 'z-10', 'bg-slate-50', 'dark:bg-slate-900');
    }
  }

  /**
   * Extracts hidden column data for a row.
   * @private
   */
  _extractHiddenRowData(tr) {
    const items = [];
    const ths = Array.from(this.tableElement?.querySelectorAll('thead th') || []);

    ths.forEach((th, idx) => {
      const key = th.getAttribute('data-cge-key') || `col_${idx}`;
      if (this.hiddenColumns.has(key)) {
        const label = th.innerText.trim() || key;
        const td = tr.children[idx];
        const html = td ? td.innerHTML : '';
        items.push({ key, label, html });
      }
    });

    return items;
  }

  /**
   * Mode class management on container/table.
   * @private
   */
  _applyModeClass() {
    if (!this.tableElement) return;
    this.tableElement.classList.remove('cge-responsive-collapse', 'cge-responsive-scroll');
    this.tableElement.classList.add(`cge-responsive-${this.mode}`);

    if (this.containerElement) {
      this.containerElement.classList.remove('cge-responsive-collapse', 'cge-responsive-scroll');
      this.containerElement.classList.add(`cge-responsive-${this.mode}`);
    }
  }

  /**
   * Resets active mode modifications.
   * @private
   */
  _cleanupMode() {
    this.collapseAll();
    this.hiddenColumns.clear();

    if (this.tableElement) {
      this.tableElement.querySelectorAll('.cge-col-hidden').forEach(el => el.classList.remove('cge-col-hidden'));
      this.tableElement.querySelectorAll('.cge-responsive-toggle').forEach(el => el.remove());
    }

    if (this.containerElement) {
      this.containerElement.classList.remove('cge-table-scroll-container');
    }
  }

  /**
   * Plus SVG icon.
   * @private
   */
  _getPlusIconSvg() {
    return `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
    </svg>`;
  }

  /**
   * Minus SVG icon.
   * @private
   */
  _getMinusIconSvg() {
    return `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/>
    </svg>`;
  }

  /**
   * Teardown observer and cleanup.
   */
  destroy() {
    this._cleanupMode();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.tableElement = null;
    this.containerElement = null;
    this.table = null;
  }
}

export default CGEResponsive;
