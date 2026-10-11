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
