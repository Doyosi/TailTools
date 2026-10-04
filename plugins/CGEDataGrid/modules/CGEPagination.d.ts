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
  grid: any;
  table: any;

  readonly lastPage: number;
  readonly from: number;
  readonly to: number;

  constructor(options?: CGEPaginationOptions);

  goToPage(targetPage: number | string): this;
  prevPage(): this;
  nextPage(): this;
  setPerPage(perPage: number | string): this;
  setTotal(total: number): this;
  getWindow(delta?: number | null): Array<number | string>;
  computeWindow(delta?: number | null): Array<number | string>;
  paginateData<T = any>(rows: T[]): T[];
  formatInfo(template?: string | null): string;
  serialize(): Record<string, any>;
  destroy(): void;
}

export default CGEPagination;
