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
