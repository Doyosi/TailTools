/**
 * CGEPagination - TypeScript Definitions
 * Shared with CGEDataTable (see plugins/shared/collection-pagination.d.ts) with grid defaults:
 * 12 per page, [6, 12, 24, 48, 'All'] and "items" wording.
 */

import { CGEPagination as CollectionPagination } from '../../shared/collection-pagination.js';

export type {
  CGEPaginationTranslations, CGEPaginationMode, CGEPaginationMetrics, CGEPaginationOptions, CGEPaginationChangePayload,
} from '../../shared/collection-pagination.js';

export declare class CGEPagination extends CollectionPagination {}

export default CGEPagination;
