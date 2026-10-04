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
  toggleSelectRow(rowId: string, forceState?: boolean): this;
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
