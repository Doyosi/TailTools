# CGEDataGrid API Reference

Complete TypeScript definitions and contracts for `CGEDataGrid`.

```typescript
/**
 * CGEDataGrid - TypeScript Definitions
 * Type definitions for TailTools CGEDataGrid modular card grid & list engine.
 */

import { CGEFilter } from './modules/CGEFilter.js';
import { CGESort } from './modules/CGESort.js';
import { CGEPagination } from './modules/CGEPagination.js';

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
  'search-placeholder'?: string;
  'sort-by'?: string;
  'per-page'?: string;
  info?: string;
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
  cardRendererGrid?: ((item: any, index: number) => string | HTMLElement) | null;
  cardRendererList?: ((item: any, index: number) => string | HTMLElement) | null;
  cardRenderer?: ((item: any, index: number, viewMode: CGEDataGridViewMode) => string | HTMLElement) | null;
  htmlCardKey?: string;
  htmlListKey?: string;
  selectable?: boolean;
  selectOnClick?: boolean;
  autoBindActions?: boolean;
  ui?: CGEDataGridUIConfig;
  translations?: CGEDataGridTranslations;
}

export interface CGEDataGridEventMap {
  init: { instance: CGEDataGrid };
  render: { items: any[]; total: number; instance: CGEDataGrid };
  viewmode: { viewMode: CGEDataGridViewMode; instance: CGEDataGrid };
  'selection-change': { selectedIds: string[]; selectedItems: any[]; instance: CGEDataGrid };
  'data-loaded': { data: any[]; raw: any; instance: CGEDataGrid };
  'bulk-delete': { deletedCount: number; deletedIds: string[]; instance: CGEDataGrid };
  'card-removed': { id: string | null; card: HTMLElement; instance: CGEDataGrid };
  'fetch-error': { error: any; instance: CGEDataGrid };
  destroyed: { instance: CGEDataGrid };
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
  selectedIds: Set<string | number>;
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

  static init(root?: Document | HTMLElement): CGEDataGrid[];
}

export default CGEDataGrid;
```
