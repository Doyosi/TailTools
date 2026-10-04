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
