# CGEDataTable API Reference

This reference mirrors the shipped [declaration](../../plugins/CGEDataTable/CGEDataTable.d.ts). Both named and default class imports are supported by the plugin barrel, which also exports `escapeHTML`.

`CGEDataTable` connects decoupled sub-modules:
- `CGEFilter`: independent filtering engine (shared with CGEDataGrid).
- `CGESort`: independent sorting engine (shared with CGEDataGrid).
- `CGEPagination`: independent pagination engine (shared with CGEDataGrid).
- `CGEResponsive`: independent responsive engine (collapse, scroll).

```typescript
/**
 * CGEDataTable - TypeScript Definitions
 * Type definitions for TailTools CGEDataTable modular data grid engine.
 */

import { CGEFilter } from './modules/CGEFilter.js';
import { CGESort } from './modules/CGESort.js';
import { CGEPagination } from './modules/CGEPagination.js';
import { CGEResponsive } from './modules/CGEResponsive.js';
import type { CGECollectionParamNames, CGECollectionResponseAdapter } from '../shared/collection.js';

export { escapeHTML } from '../shared/collection.js';
export type { CGECollectionParamNames, CGECollectionAdapterResult, CGECollectionResponseAdapter } from '../shared/collection.js';

export type CGEDataTableSource = 'dom' | 'json' | 'ajax';
export type CGEDataTableDriver = 'auto' | 'axios' | 'fetch';
export type CGEDataTableResponsiveMode = 'collapse' | 'scroll';

export interface CGEDataTableColumn {
  key: string;
  label?: string;
  sortable?: boolean;
  /** Sort type; 'auto' (default) detects one type for the whole column. */
  type?: 'auto' | 'string' | 'text' | 'number' | 'currency' | 'date';
  priority?: number;
  /** Returned strings are trusted HTML (use escapeHTML for values); Nodes are appended. Without a formatter values render as text. */
  formatter?: (value: any, row: any, colIndex: number) => string | Node | number | null | undefined;
  /** Render the raw value as trusted HTML (server-rendered Blade markup such as action buttons). Off by default; also `data-cge-html` on the th. HTML columns are excluded from global search. */
  html?: boolean;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
}

export interface CGEDataTableUIConfig {
  wrapper?: string;
  headerWrapper?: string;
  searchWrapper?: string;
  searchInput?: string;
  searchIcon?: string;
  perPageWrapper?: string;
  perPageSelect?: string;
  tableWrapper?: string;
  table?: string;
  thead?: string;
  th?: string;
  tbody?: string;
  tr?: string;
  td?: string;
  emptyRow?: string;
  loadingOverlay?: string;
  footerWrapper?: string;
  infoWrapper?: string;
  paginationWrapper?: string;
  pageButton?: string;
  pageButtonActive?: string;
  pageButtonDisabled?: string;
  jumpWrapper?: string;
  jumpInput?: string;
}

export interface CGEDataTableTranslations {
  'clear-selection'?: string;
  'delete-selected'?: string;
  'selected-count'?: string;
  'delete-selected-confirm'?: string;
  'deleted-success'?: string;
  'search-placeholder'?: string;
  'per-page'?: string;
  info?: string;
  'info-simple'?: string;
  'no-data'?: string;
  loading?: string;
  prev?: string;
  next?: string;
  'go-to-page'?: string;
  all?: string;
  jump?: string;
  'collapse-details'?: string;
  [key: string]: string | undefined;
}

export interface CGEDataTableOptions {
  source?: CGEDataTableSource;
  data?: any[] | null;
  url?: string | null;
  method?: string;
  headers?: Record<string, string>;
  driver?: CGEDataTableDriver;
  columns?: CGEDataTableColumn[];
  serverSide?: boolean;
  perPage?: number | string;
  perPageOptions?: Array<number | string>;
  responsiveMode?: CGEDataTableResponsiveMode;
  autoBindActions?: boolean;
  selectable?: boolean;
  /** Search/sort locale (e.g. 'tr'); defaults to <html lang>. */
  locale?: string | null;
  /** per_page value sent for "All" (default -1). */
  allValue?: number | string;
  paramNames?: CGECollectionParamNames;
  responseAdapter?: CGECollectionResponseAdapter | null;
  /** Configured axios instance; falls back to window.axios. */
  axiosInstance?: { request: (config: any) => Promise<any> } | null;
  /** CGEResponsive breakpoint (number or [phone, landscape, tablet]). */
  responsiveBreakpoint?: number | [number, number, number] | null;
  ui?: CGEDataTableUIConfig;
  translations?: CGEDataTableTranslations;
}

export interface CGEDataTableEventMap {
  init: { instance: CGEDataTable };
  loading: { loading: boolean; instance: CGEDataTable };
  rendered: { rows: any[]; total: number; instance: CGEDataTable };
  /** Alias of rendered (CGEDataGrid name). */
  render: { rows: any[]; total: number; instance: CGEDataTable };
  filter: { query: string; columns: Record<string, any>; instance: CGEDataTable };
  sort: { rules: any[]; instance: CGEDataTable };
  page: { page: number; perPage: number; instance: CGEDataTable };
  'selection:change': { selectedIds: string[]; count: number; instance: CGEDataTable };
  /** Alias of selection:change (CGEDataGrid name). */
  'selection-change': { selectedIds: string[]; count: number; instance: CGEDataTable };
  'row:deleted': { rowId: string | null; element: HTMLElement | null; instance: CGEDataTable };
  'rows:deleted': { ids: string[]; instance: CGEDataTable };
  refresh: { instance: CGEDataTable };
  error: { error: any; instance: CGEDataTable };
  /** Emitted with error when fetch() fails (CGEDataGrid name); the error is an HttpError for HTTP failures. */
  'fetch-error': { error: any; instance: CGEDataTable };
  destroy: { instance: CGEDataTable };
  /** Alias of destroy (CGEDataGrid name). */
  destroyed: { instance: CGEDataTable };
}

export declare class CGEDataTable {
  static instances: Map<HTMLElement, CGEDataTable>;
  static defaults: CGEDataTableOptions;

  rawElement: HTMLElement;
  tableElement: HTMLTableElement;
  wrapperElement: HTMLElement | null;
  tableContainer: HTMLElement;
  thead: HTMLTableSectionElement;
  tbody: HTMLTableSectionElement;
  selectionBar: HTMLElement | null;
  loadingOverlay: HTMLElement;

  options: Required<CGEDataTableOptions>;
  rawRows: any[];
  filteredRows: any[];
  sortedRows: any[];
  pagedRows: any[];
  columns: CGEDataTableColumn[];
  selectedRowIds: Set<string>;
  loading: boolean;

  filter: CGEFilter;
  sort: CGESort;
  pagination: CGEPagination;
  responsive: CGEResponsive;

  constructor(element: HTMLTableElement | HTMLElement | string, options?: CGEDataTableOptions);

  use(PluginClass: any, pluginOptions?: Record<string, any>): this;
  setData(data: any[]): this;
  refresh(): void;
  fetch(extraParams?: Record<string, any>): Promise<any>;
  setLoading(isLoading: boolean): this;
  getSelectedIds(): string[];
  getSelectedRows(): any[];
  selectAll(): this;
  clearSelection(): this;
  toggleSelectRow(rowId: string | number, forceState?: boolean): this;
  deleteSelected(): this;
  removeRow(target: string | HTMLElement): this;
  t(key: string, replacements?: Record<string, any>): string;
  on<K extends keyof CGEDataTableEventMap>(event: K, handler: (detail: CGEDataTableEventMap[K]) => void): this;
  off<K extends keyof CGEDataTableEventMap>(event: K, handler: (detail: CGEDataTableEventMap[K]) => void): this;
  destroy(): void;

  /** Prunes detached instances, then initializes [data-cge-datatable] elements inside root. */
  static init(root?: Document | HTMLElement): CGEDataTable[];
  /** Destroys instances inside root or detached from the document (Livewire/Turbo teardown). */
  static destroyAll(root?: Document | HTMLElement): CGEDataTable[];
  static get(target: HTMLElement | string): CGEDataTable | null;
  static getInstance(target: HTMLElement | string): CGEDataTable | null;
  static getOrCreateInstance(target: HTMLElement | string, options?: CGEDataTableOptions): CGEDataTable;
  static setDefaultOptions(options: CGEDataTableOptions): void;
  static setTranslations(translations: CGEDataTableTranslations): void;
}

export default CGEDataTable;
```

## Event names

Table and Grid emit each other's event names as aliases with the same payload: `rendered`/`render`,
`selection:change`/`selection-change`, `destroy`/`destroyed`. A failed `fetch()` emits `error` and
`fetch-error` and rejects with an `HttpError` (`status`, `data`, `errors`). DOM events are prefixed with
`cge:datatable:`.

## Shared declarations

The filter, sort and pagination modules are one shared implementation (`plugins/shared/collection-*.js`).
The Table and Grid module paths re-export it, so every method alias (`goTo`/`goToPage`, `next`/`nextPage`,
`computeWindow`/`getWindow`, `filterRows`/`filterData`, `setColumnFilter`/`setFilter`,
`attachColumnFilter`/`attachFieldFilter`, `cycleSort`/`toggleSort`, `reset`/`clear`, `sortRows`/`sortData`,
`getMetricsString`/`formatInfo`) works on both. Grid's `CGEPagination` only changes defaults (12 per page, "items").

### plugins/shared/collection.d.ts

```typescript
/**
 * Public types shared by CGEDataTable and CGEDataGrid.
 */

/** Escapes &, <, >, " and ' so a value can be interpolated into trusted formatter/renderer HTML. */
export declare function escapeHTML(value: unknown): string;

/** Server parameter names (defaults: page, per_page, sort_by, sort_dir, search, filters, cursor). */
export interface CGECollectionParamNames {
  page?: string;
  perPage?: string;
  sort?: string;
  direction?: string;
  search?: string;
  filters?: string;
  cursor?: string;
}

/** Return value of a custom `responseAdapter(response)`. */
export interface CGECollectionAdapterResult<T = any> {
  rows?: T[];
  /** Trusted Blade rows markup (CGEDataTable only). */
  html?: string | null;
  total?: number | null;
  page?: number | null;
  perPage?: number | string | null;
  lastPage?: number | null;
  /** simplePaginate-style APIs without a total. */
  hasMore?: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
  mode?: 'length' | 'simple' | 'cursor';
}

export type CGECollectionResponseAdapter<T = any> = (response: any) => CGECollectionAdapterResult<T>;
```

### CGEFilter.d.ts (plugins/shared/collection-filter.d.ts)

```typescript
/**
 * CGEFilter - TypeScript Definitions (shared by CGEDataTable and CGEDataGrid)
 */

export interface CGEFilterOptions {
  /** Debounce in ms for the search input and text column filters (one timer per element). */
  debounce?: number;
  searchParam?: string;
  filtersParam?: string;
  caseSensitive?: boolean;
  /** Locale for case folding; defaults to `<html lang>`. Matching also ignores accents and ı/i. */
  locale?: string | null;
  /** Keys searched by the global query when filterRows() receives no columns. */
  searchKeys?: string[] | null;
  /** Keys never searched by default (underscore and html_* keys are always skipped). */
  excludeKeys?: string[];
  input?: HTMLInputElement | string | null;
  onChange?: ((payload: CGEFilterChangePayload) => void) | null;
}

export interface CGEFilterChangePayload {
  global: string;
  columns: Record<string, any>;
  serialized: Record<string, any>;
}

export declare class CGEFilter {
  options: Required<CGEFilterOptions>;
  globalQuery: string;
  columnFilters: Record<string, any>;
  grid: any;
  table: any;
  readonly locale: string | undefined;

  constructor(options?: CGEFilterOptions);

  attachSearchInput(input: HTMLInputElement | string): void;
  attachColumnFilter(colKey: string, input: HTMLElement | string, eventType?: string): void;
  attachFieldFilter(fieldKey: string, element: HTMLElement | string, eventType?: string): void;
  apply(query: string): this;
  search(query: string): this;
  setColumnFilter(colKey: string, value: any): this;
  setFilter(columnKey: string, value: any): this;
  getColumnFilter(colKey: string): any;
  getFilter(colKey: string): any;
  clear(): this;
  reset(): this;
  serialize(): Record<string, any>;
  filterRows<T = any>(rows: T[], columns?: Array<string | { key: string; [key: string]: any }> | null): T[];
  filterData<T = any>(rows: T[], colKeys?: string[] | null): T[];
  destroy(): void;
}

export default CGEFilter;
```

### CGESort.d.ts (plugins/shared/collection-sort.d.ts)

```typescript
/**
 * CGESort - TypeScript Definitions (shared by CGEDataTable and CGEDataGrid)
 */

export type CGESortType = 'auto' | 'string' | 'text' | 'number' | 'currency' | 'date';

export interface CGESortRule {
  key: string;
  direction: 'asc' | 'desc';
}

export interface CGESortOptions {
  multiSort?: boolean;
  sortByParam?: string;
  sortDirParam?: string;
  cycle?: Array<'asc' | 'desc' | 'none'>;
  defaultDirection?: 'asc' | 'desc';
  /** Locale for text collation and ambiguous decimals; defaults to `<html lang>`. */
  locale?: string | null;
  /** Order of slash/dash dates such as 03/04/2026 ('dmy' default; dotted dates are always day-first). */
  dateOrder?: 'dmy' | 'mdy';
  /** Explicit types per key (used when columns do not declare one). */
  types?: Record<string, CGESortType>;
  onChange?: ((payload: CGESortChangePayload) => void) | null;
}

export interface CGESortChangePayload {
  rules: CGESortRule[];
  serialized: Record<string, string>;
}

export declare class CGESort {
  options: Required<CGESortOptions>;
  rules: CGESortRule[];
  grid: any;
  table: any;
  readonly locale: string | undefined;

  constructor(options?: CGESortOptions);

  sortBy(columnKey: string, direction?: 'asc' | 'desc' | 'none', multi?: boolean): this;
  cycleSort(columnKey: string, multi?: boolean): this;
  toggleSort(fieldKey: string, multi?: boolean): this;
  getDirection(columnKey: string): 'asc' | 'desc' | 'none';
  reset(): this;
  clear(): this;
  serialize(): Record<string, string>;
  sortRows<T = any>(rows: T[], columns?: Array<{ key: string; type?: CGESortType | string; [key: string]: any }>): T[];
  sortData<T = any>(rows: T[], columns?: Array<{ key: string; type?: CGESortType | string; [key: string]: any }>): T[];
  attachHeaders(headers: NodeList | Array<HTMLTableCellElement> | HTMLElement | string): void;
  attachSortSelect(select: HTMLSelectElement | string): void;
  updateIndicators(): void;
  destroy(): void;
}

export default CGESort;
```

### CGEPagination.d.ts (plugins/shared/collection-pagination.d.ts)

```typescript
/**
 * CGEPagination - TypeScript Definitions (shared by CGEDataTable and CGEDataGrid)
 */

export interface CGEPaginationTranslations {
  info?: string;
  'info-simple'?: string;
  'per-page'?: string;
  prev?: string;
  next?: string;
  'go-to-page'?: string;
  all?: string;
  jump?: string;
  [key: string]: string | undefined;
}

export type CGEPaginationMode = 'length' | 'simple' | 'cursor';

export interface CGEPaginationMetrics {
  page?: number | null;
  perPage?: number | string | null;
  total?: number | null;
  lastPage?: number | null;
  hasMore?: boolean | null;
  nextCursor?: string | null;
  prevCursor?: string | null;
  mode?: CGEPaginationMode;
  /** Rows on the current server page (used for from/to when the total is unknown). */
  count?: number | null;
}

export interface CGEPaginationOptions {
  page?: number;
  perPage?: number | string;
  total?: number;
  perPageOptions?: Array<number | string>;
  windowDelta?: number;
  pageParam?: string;
  perPageParam?: string;
  cursorParam?: string;
  /** per_page value sent when "All" is selected (default -1). */
  allValue?: number | string;
  onChange?: ((payload: CGEPaginationChangePayload) => void) | null;
  translations?: CGEPaginationTranslations;
}

export interface CGEPaginationChangePayload {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number;
  to: number;
  serialized: Record<string, string | number>;
}

export declare class CGEPagination {
  options: Required<CGEPaginationOptions>;
  page: number;
  perPage: number;
  total: number;
  mode: CGEPaginationMode;
  totalKnown: boolean;
  hasMore: boolean | null;
  cursor: string | null;
  nextCursor: string | null;
  prevCursor: string | null;
  count: number | null;
  grid: any;
  table: any;

  readonly lastPage: number;
  readonly from: number;
  readonly to: number;

  constructor(options?: CGEPaginationOptions);

  goTo(page: number | string): this;
  goToPage(targetPage: number | string): this;
  next(): this;
  nextPage(): this;
  prev(): this;
  prevPage(): this;
  first(): this;
  last(): this;
  resetPage(): this;
  setPerPage(limit: number | string): this;
  setMetrics(metrics?: CGEPaginationMetrics): this;
  setTotal(total: number): this;
  computeWindow(delta?: number | null): Array<number | string>;
  getWindow(delta?: number | null): Array<number | string>;
  paginateRows<T = any>(rows: T[]): T[];
  paginateData<T = any>(rows: T[]): T[];
  formatInfo(template?: string | null): string;
  getMetricsString(): string;
  serialize(): Record<string, string | number>;
  destroy(): void;
}

export default CGEPagination;
```

### CGEResponsive.d.ts

```typescript
/**
 * CGEResponsive - TypeScript Definitions
 */

export interface CGEResponsiveOptions {
  mode?: 'collapse' | 'scroll';
  /**
   * Collapse tiers. A number is the landscape tier and scales the defaults (640 => 480 / 640 / 768);
   * an array sets [phone, landscape, tablet] widths explicitly.
   */
  breakpoint?: number | [number, number, number];
  table?: HTMLTableElement | string | null;
  container?: HTMLElement | string | null;
  collapseDetailsText?: string;
  onChange?: (payload: { mode: string; width: number; hiddenColumns: string[] }) => void;
}

export declare class CGEResponsive {
  options: Required<CGEResponsiveOptions>;
  mode: 'collapse' | 'scroll';
  tableElement: HTMLTableElement | null;
  containerElement: HTMLElement | null;
  hiddenColumns: Set<string>;
  expandedRows: Set<HTMLTableRowElement>;
  table: any;

  constructor(options?: CGEResponsiveOptions);

  attach(table: HTMLTableElement | string, container?: HTMLElement | string | null): void;
  setMode(mode: 'collapse' | 'scroll'): this;
  refresh(): this;
  toggleRow(tr: HTMLTableRowElement): void;
  expandRow(tr: HTMLTableRowElement): void;
  collapseRow(tr: HTMLTableRowElement): void;
  collapseAll(): void;
  destroy(): void;
}

export default CGEResponsive;
```
