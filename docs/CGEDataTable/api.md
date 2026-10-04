# CGEDataTable API Reference

This reference mirrors the shipped [declaration](../../plugins/CGEDataTable/CGEDataTable.d.ts). Both named and default class imports are supported by the plugin barrel.

`CGEDataTable` connects decoupled sub-modules:
- `CGEFilter`: independent filtering engine.
- `CGESort`: independent sorting engine.
- `CGEPagination`: independent pagination engine.
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

export type CGEDataTableSource = 'dom' | 'json' | 'ajax';
export type CGEDataTableDriver = 'auto' | 'axios' | 'fetch';
export type CGEDataTableResponsiveMode = 'collapse' | 'scroll';

export interface CGEDataTableColumn {
  key: string;
  label?: string;
  sortable?: boolean;
  type?: 'string' | 'number' | 'currency' | 'date';
  priority?: number;
  formatter?: (value: any, row: any, colIndex: number) => any;
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
  ui?: CGEDataTableUIConfig;
  translations?: CGEDataTableTranslations;
}

export interface CGEDataTableEventMap {
  init: { instance: CGEDataTable };
  loading: { loading: boolean; instance: CGEDataTable };
  rendered: { rows: any[]; total: number; instance: CGEDataTable };
  filter: { query: string; columns: Record<string, any>; instance: CGEDataTable };
  sort: { rules: any[]; instance: CGEDataTable };
  page: { page: number; perPage: number; instance: CGEDataTable };
  'selection:change': { selectedIds: string[]; count: number; instance: CGEDataTable };
  'row:deleted': { rowId: string | null; element: HTMLElement | null; instance: CGEDataTable };
  'rows:deleted': { ids: string[]; instance: CGEDataTable };
  refresh: { instance: CGEDataTable };
  error: { error: any; instance: CGEDataTable };
  destroy: { instance: CGEDataTable };
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

  static init(root?: Document | HTMLElement): CGEDataTable[];
  static get(target: HTMLElement | string): CGEDataTable | null;
  static getInstance(target: HTMLElement | string): CGEDataTable | null;
  static getOrCreateInstance(target: HTMLElement | string, options?: CGEDataTableOptions): CGEDataTable;
  static setDefaultOptions(options: CGEDataTableOptions): void;
  static setTranslations(translations: CGEDataTableTranslations): void;
}

export default CGEDataTable;
```

## Standalone module declarations

These paths use their own exported types; Grid and Table modules have different method names.

### CGEFilter.d.ts

```typescript
/**
 * CGEFilter - TypeScript Definitions
 */

export interface CGEFilterOptions {
  debounce?: number;
  searchParam?: string;
  filtersParam?: string;
  caseSensitive?: boolean;
  input?: HTMLInputElement | string | null;
  onChange?: (payload: CGEFilterChangePayload) => void;
}

export interface CGEFilterChangePayload {
  global: string;
  columns: Record<string, any>;
  serialized: Record<string, string>;
}

export declare class CGEFilter {
  options: Required<CGEFilterOptions>;
  globalQuery: string;
  columnFilters: Record<string, any>;
  table: any;

  constructor(options?: CGEFilterOptions);

  attachSearchInput(input: HTMLInputElement | string): void;
  attachColumnFilter(colKey: string, input: HTMLElement | string): void;
  apply(query: string): this;
  setColumnFilter(colKey: string, value: any): this;
  getColumnFilter(colKey: string): any;
  clear(): this;
  serialize(): Record<string, string>;
  filterRows<T = any>(rows: T[], columns?: Array<{ key: string; [key: string]: any }>): T[];
  destroy(): void;
}

export default CGEFilter;
```

### CGEPagination.d.ts

```typescript
/**
 * CGEPagination - TypeScript Definitions
 */

export interface CGEPaginationTranslations {
  info?: string;
  'per-page'?: string;
  prev?: string;
  next?: string;
  'go-to-page'?: string;
  all?: string;
  jump?: string;
  [key: string]: string | undefined;
}

export interface CGEPaginationOptions {
  page?: number;
  perPage?: number | string;
  total?: number;
  perPageOptions?: Array<number | string>;
  windowDelta?: number;
  pageParam?: string;
  perPageParam?: string;
  onChange?: (payload: CGEPaginationChangePayload) => void;
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
  table: any;

  readonly lastPage: number;
  readonly from: number;
  readonly to: number;

  constructor(options?: CGEPaginationOptions);

  goTo(page: number | string): this;
  next(): this;
  prev(): this;
  first(): this;
  last(): this;
  setPerPage(limit: number | string): this;
  setMetrics(metrics?: { page?: number; perPage?: number | string; total?: number; lastPage?: number }): this;
  computeWindow(delta?: number): Array<number | string>;
  paginateRows<T = any>(rows: T[]): T[];
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
  breakpoint?: number;
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

### CGESort.d.ts

```typescript
/**
 * CGESort - TypeScript Definitions
 */

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
  onChange?: (payload: CGESortChangePayload) => void;
}

export interface CGESortChangePayload {
  rules: CGESortRule[];
  serialized: Record<string, string>;
}

export declare class CGESort {
  options: Required<CGESortOptions>;
  rules: CGESortRule[];
  table: any;

  constructor(options?: CGESortOptions);

  sortBy(columnKey: string, direction?: 'asc' | 'desc' | 'none', multi?: boolean): this;
  cycleSort(columnKey: string, multi?: boolean): this;
  getDirection(columnKey: string): 'asc' | 'desc' | 'none';
  reset(): this;
  serialize(): Record<string, string>;
  sortRows<T = any>(rows: T[], columns?: Array<{ key: string; type?: string; [key: string]: any }>): T[];
  attachHeaders(headers: NodeList | Array<HTMLTableCellElement> | HTMLElement | string): void;
  updateIndicators(): void;
  destroy(): void;
}

export default CGESort;
```

Lifecycle and DOM contracts are documented in [usage](usage.md#data-ownership-and-lifecycle).
