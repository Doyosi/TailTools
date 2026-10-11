/**
 * CGEPagination - CGEDataGrid sub-module entry point.
 * TailTools Plugin Library
 *
 * Shares plugins/shared/collection-pagination.js with CGEDataTable and only changes the
 * grid defaults (12 per page, [6, 12, 24, 48, 'All'], "items" wording).
 */

import { CGEPagination as CollectionPagination } from '../../shared/collection-pagination.js';

export class CGEPagination extends CollectionPagination {
  /**
   * @param {Object} [options={}] Configuration options
   */
  constructor(options = {}) {
    super({
      perPage: 12,
      perPageOptions: [6, 12, 24, 48, 'All'],
      ...options,
      translations: {
        info: 'Showing :from to :to of :total items',
        'info-simple': 'Showing :from to :to items',
        'per-page': 'Show :count items',
        ...(options.translations || {}),
      },
    });
  }
}

export default CGEPagination;
