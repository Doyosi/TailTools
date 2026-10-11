/**
 * Public types shared by CGEDataTable and CGEDataGrid.
 */

/** Escapes &, <, >, " and ' so a value can be interpolated into trusted formatter/renderer HTML. */
export declare function escapeHTML(value: unknown): string;

/** Server parameter names (defaults: page, per_page, sort_by, sort_dir, search, filters, cursor). */
export interface CGECollectionParamNames {
  page?: string;
  perPage?: string;
  sort?: string;
  direction?: string;
  search?: string;
  filters?: string;
  cursor?: string;
}

/** Return value of a custom `responseAdapter(response)`. */
export interface CGECollectionAdapterResult<T = any> {
  rows?: T[];
  /** Trusted Blade rows markup (CGEDataTable only). */
  html?: string | null;
  total?: number | null;
  page?: number | null;
  perPage?: number | string | null;
  lastPage?: number | null;
  /** simplePaginate-style APIs without a total. */
  hasMore?: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
  mode?: 'length' | 'simple' | 'cursor';
}

export type CGECollectionResponseAdapter<T = any> = (response: any) => CGECollectionAdapterResult<T>;
