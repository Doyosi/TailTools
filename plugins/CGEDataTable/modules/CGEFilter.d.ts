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
