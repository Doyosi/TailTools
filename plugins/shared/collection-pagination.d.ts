/**
 * CGEPagination - TypeScript Definitions (shared by CGEDataTable and CGEDataGrid)
 */

export interface CGEPaginationTranslations {
  info?: string;
  'info-simple'?: string;
  'per-page'?: string;
  prev?: string;
  next?: string;
  'go-to-page'?: string;
  all?: string;
  jump?: string;
  [key: string]: string | undefined;
}

export type CGEPaginationMode = 'length' | 'simple' | 'cursor';

export interface CGEPaginationMetrics {
  page?: number | null;
  perPage?: number | string | null;
  total?: number | null;
  lastPage?: number | null;
  hasMore?: boolean | null;
  nextCursor?: string | null;
  prevCursor?: string | null;
  mode?: CGEPaginationMode;
  /** Rows on the current server page (used for from/to when the total is unknown). */
  count?: number | null;
}

export interface CGEPaginationOptions {
  page?: number;
  perPage?: number | string;
  total?: number;
  perPageOptions?: Array<number | string>;
  windowDelta?: number;
  pageParam?: string;
  perPageParam?: string;
  cursorParam?: string;
  /** per_page value sent when "All" is selected (default -1). */
  allValue?: number | string;
  onChange?: ((payload: CGEPaginationChangePayload) => void) | null;
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
  mode: CGEPaginationMode;
  totalKnown: boolean;
  hasMore: boolean | null;
  cursor: string | null;
  nextCursor: string | null;
  prevCursor: string | null;
  count: number | null;
  grid: any;
  table: any;

  readonly lastPage: number;
  readonly from: number;
  readonly to: number;

  constructor(options?: CGEPaginationOptions);

  goTo(page: number | string): this;
  goToPage(targetPage: number | string): this;
  next(): this;
  nextPage(): this;
  prev(): this;
  prevPage(): this;
  first(): this;
  last(): this;
  resetPage(): this;
  setPerPage(limit: number | string): this;
  setMetrics(metrics?: CGEPaginationMetrics): this;
  setTotal(total: number): this;
  computeWindow(delta?: number | null): Array<number | string>;
  getWindow(delta?: number | null): Array<number | string>;
  paginateRows<T = any>(rows: T[]): T[];
  paginateData<T = any>(rows: T[]): T[];
  formatInfo(template?: string | null): string;
  getMetricsString(): string;
  serialize(): Record<string, string | number>;
  destroy(): void;
}

export default CGEPagination;
