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
  serialized: Record<string, any>;
}

export declare class CGESort {
  options: Required<CGESortOptions>;
  rules: CGESortRule[];
  grid: any;
  table: any;

  constructor(options?: CGESortOptions);

  sortBy(fieldKey: string, direction?: 'asc' | 'desc' | 'none', multi?: boolean): this;
  toggleSort(fieldKey: string, multi?: boolean): this;
  getDirection(fieldKey: string): 'asc' | 'desc' | 'none';
  clear(): this;
  serialize(): Record<string, any>;
  attachSortSelect(select: HTMLSelectElement | string): void;
  sortData<T = any>(rows: T[]): T[];
  destroy(): void;
}

export default CGESort;
