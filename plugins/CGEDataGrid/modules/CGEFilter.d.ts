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
  grid: any;
  table: any;

  constructor(options?: CGEFilterOptions);

  attachSearchInput(input: HTMLInputElement | string): void;
  attachFieldFilter(fieldKey: string, element: HTMLElement | string, eventType?: string): void;
  apply(query: string): this;
  setFilter(columnKey: string, value: any): this;
  clear(): this;
  serialize(): Record<string, any>;
  filterData<T = any>(rows: T[], colKeys?: string[] | null): T[];
  destroy(): void;
}

export default CGEFilter;
