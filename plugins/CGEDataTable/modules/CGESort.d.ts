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
