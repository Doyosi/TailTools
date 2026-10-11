# CGEDataGrid API Reference

Complete TypeScript definitions and contracts for `CGEDataGrid`. The barrel also exports `escapeHTML`.

```typescript
/**
 * CGEDataGrid - TypeScript Definitions
 * Type definitions for TailTools CGEDataGrid modular card grid & list engine.
 */

import { CGEFilter } from './modules/CGEFilter.js';
import { CGESort } from './modules/CGESort.js';
import { CGEPagination } from './modules/CGEPagination.js';
import type { CGECollectionParamNames, CGECollectionResponseAdapter } from '../shared/collection.js';

export { escapeHTML } from '../shared/collection.js';
export type { CGECollectionParamNames, CGECollectionAdapterResult, CGECollectionResponseAdapter } from '../shared/collection.js';

export type CGEDataGridSource = 'dom' | 'json' | 'ajax';
export type CGEDataGridDriver = 'auto' | 'axios' | 'fetch';
export type CGEDataGridLayoutMode = 'grid' | 'list' | 'both';
export type CGEDataGridViewMode = 'grid' | 'list';

export interface CGEDataGridUIConfig {
  wrapper?: string;
  headerWrapper?: string;
  searchWrapper?: string;
  searchInput?: string;
  searchIcon?: string;
  controlsWrapper?: string;
  sortSelect?: string;
  viewModeWrapper?: string;
  viewModeButton?: string;
  viewModeButtonActive?: string;
  perPageSelect?: string;
  selectionBar?: string;
  selectionCount?: string;
  selectionActions?: string;
  selectionButton?: string;
  selectionDeleteButton?: string;
  cardsContainer?: string;
  cardItem?: string;
  cardSelected?: string;
  cardCheckboxWrapper?: string;
  cardCheckbox?: string;
  emptyState?: string;
  loadingOverlay?: string;
  footerWrapper?: string;
  infoWrapper?: string;
  paginationWrapper?: string;
  pageButton?: string;
  pageButtonActive?: string;
  pageButtonDisabled?: string;
  jumpWrapper?: string;
  jumpInput?: string;
  jumpButton?: string;
}

export interface CGEDataGridTranslations {
  loading?: string;
  prev?: string;
  next?: string;
  'go-to-page'?: string;
  jump?: string;
  pagination?: string;
  'view-grid'?: string;
  'view-list'?: string;
  'search-placeholder'?: string;
  'sort-by'?: string;
  'per-page'?: string;
  info?: string;
  'info-simple'?: string;
  'no-data'?: string;
  'selected-count'?: string;
  'select-all'?: string;
  'clear-selection'?: string;
  'delete-selected'?: string;
  'confirm-bulk-delete'?: string;
  [key: string]: string | undefined;
}

export interface CGEDataGridOptions {
  source?: CGEDataGridSource;
  data?: any[] | null;
  url?: string | null;
  method?: string;
  headers?: Record<string, string>;
  driver?: CGEDataGridDriver;
  serverSide?: boolean;
  perPage?: number | string;
  perPageOptions?: Array<number | string>;
  layoutMode?: CGEDataGridLayoutMode;
  viewMode?: CGEDataGridViewMode;
  gridCols?: string;
  listGap?: string;
  /** Renderer output is trusted HTML: escape item values with escapeHTML. */
  cardRendererGrid?: ((item: any, index: number) => string | HTMLElement) | null;
  cardRendererList?: ((item: any, index: number) => string | HTMLElement) | null;
  cardRenderer?: ((item: any, index: number, viewMode: CGEDataGridViewMode) => string | HTMLElement) | null;
  htmlCardKey?: string;
  htmlListKey?: string;
  selectable?: boolean;
  selectOnClick?: boolean;
  autoBindActions?: boolean;
  /** Fields searched by the global query (default: primitive fields except _* and html_*). */
  searchKeys?: string[] | null;
  /** Search/sort locale (e.g. 'tr'); defaults to <html lang>. */
  locale?: string | null;
  /** per_page value sent for "All" (default -1). */
  allValue?: number | string;
  paramNames?: CGECollectionParamNames;
  responseAdapter?: CGECollectionResponseAdapter | null;
  /** Configured axios instance; falls back to window.axios. */
  axiosInstance?: { request: (config: any) => Promise<any> } | null;
  ui?: CGEDataGridUIConfig;
  translations?: CGEDataGridTranslations;
}

export interface CGEDataGridEventMap {
  init: { instance: CGEDataGrid };
  render: { items: any[]; total: number; instance: CGEDataGrid };
  /** Alias of render (CGEDataTable name). */
  rendered: { items: any[]; total: number; instance: CGEDataGrid };
  viewmode: { viewMode: CGEDataGridViewMode; instance: CGEDataGrid };
  'selection-change': { selectedIds: string[]; selectedItems: any[]; instance: CGEDataGrid };
  /** Alias of selection-change (CGEDataTable name). */
  'selection:change': { selectedIds: string[]; selectedItems: any[]; instance: CGEDataGrid };
  'data-loaded': { data: any[]; raw: any; instance: CGEDataGrid };
  'bulk-delete': { deletedCount: number; deletedIds: string[]; instance: CGEDataGrid };
  'card-removed': { id: string | null; card: HTMLElement; instance: CGEDataGrid };
  /** fetch() also rejects with the error (an HttpError for HTTP failures). */
  'fetch-error': { error: any; instance: CGEDataGrid };
  /** Alias of fetch-error (CGEDataTable name). */
  error: { error: any; instance: CGEDataGrid };
  destroyed: { instance: CGEDataGrid };
  /** Alias of destroyed (CGEDataTable name). */
  destroy: { instance: CGEDataGrid };
}

export declare class CGEDataGrid {
  static instances: Map<HTMLElement, CGEDataGrid>;
  static defaults: CGEDataGridOptions;

  root: HTMLElement;
  headerEl: HTMLElement;
  controlsWrap: HTMLElement;
  cardsContainer: HTMLElement;
  selectionBar: HTMLElement | null;
  loadingEl: HTMLElement;
  footerEl: HTMLElement;
  infoEl: HTMLElement | null;
  paginationEl: HTMLElement | null;

  options: Required<CGEDataGridOptions>;
  viewMode: CGEDataGridViewMode;
  layoutMode: CGEDataGridLayoutMode;
  selectedIds: Set<string>;
  data: any[];
  processedData: any[];
  loading: boolean;

  filter: CGEFilter;
  sort: CGESort;
  pagination: CGEPagination;

  constructor(element: HTMLElement | string, options?: CGEDataGridOptions);

  setData(data: any[]): this;
  fetch(extraParams?: Record<string, any>): Promise<any>;
  refresh(): this;
  setViewMode(mode: CGEDataGridViewMode): this;
  toggleSelect(id: string | number, force?: boolean | null): this;
  selectAll(): this;
  clearSelection(): this;
  getSelectedIds(): string[];
  getSelectedItems(): any[];
  deleteSelected(): Promise<number>;
  removeCard(target: HTMLElement | string): boolean;
  setLoading(isLoading: boolean): this;
  on<K extends keyof CGEDataGridEventMap>(event: K, handler: (detail: CGEDataGridEventMap[K]) => void): this;
  off<K extends keyof CGEDataGridEventMap>(event: K, handler: (detail: CGEDataGridEventMap[K]) => void): this;
  emit(event: string, detail?: any): void;
  destroy(): void;

  /** Prunes detached instances, then initializes [data-cge-datagrid] elements inside root. */
  static init(root?: Document | HTMLElement): CGEDataGrid[];
  /** Destroys instances inside root or detached from the document (Livewire/Turbo teardown). */
  static destroyAll(root?: Document | HTMLElement): CGEDataGrid[];
  static get(target: HTMLElement | string): CGEDataGrid | null;
}

export default CGEDataGrid;
```

## Event names

Grid and Table emit each other's event names as aliases with the same payload: `render`/`rendered`,
`selection-change`/`selection:change`, `destroyed`/`destroy`, `fetch-error`/`error`. A failed `fetch()`
emits both error events and rejects with an `HttpError`; the automatic fetch from `init`/`refresh()` handles the
rejection. DOM events are prefixed with `cge:datagrid:`.

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

Lifecycle and DOM contracts are documented in [usage](usage.md#data-ownership-and-lifecycle).

The footer navigation exposes `aria-current="page"` on the active numbered page and an accessible pagination label. The mobile jump accepts button clicks and Enter. Loading uses a `role="status"` element, `aria-live="polite"`, `aria-hidden` and container `aria-busy`; no new public method is needed. See [responsive footer/loading contracts](usage.md#responsive-footer-and-loading-feedback).
