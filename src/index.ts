/**
 * TailTools Core Library Entry Point
 * Designed for Tailwind CSS v4.3+ and Laravel (Blade & Vite)
 */

import './style.css';
import { CGEModal } from '../plugins/CGEModal';
import { CGEToast } from '../plugins/CGEToast';
import { CGEAlert } from '../plugins/CGEAlert';
import { CGEForm } from '../plugins/CGEForm';
import { CGEDrawer } from '../plugins/CGEDrawer';
import { CGELightbox } from '../plugins/CGELightbox';
import { CGEActionButton } from '../plugins/CGEActionButton';
import { CGESelect } from '../plugins/CGESelect';
import { CGEDropzone } from '../plugins/CGEDropzone';
import { CGEDataTable, CGEFilter, CGESort, CGEPagination, CGEResponsive } from '../plugins/CGEDataTable';
import { CGEDataGrid } from '../plugins/CGEDataGrid';

export {
  CGEModal,
  CGEToast,
  CGEAlert,
  CGEForm,
  CGEDrawer,
  CGELightbox,
  CGEActionButton,
  CGESelect,
  CGEDropzone,
  CGEDataTable,
  CGEDataGrid,
  CGEFilter,
  CGESort,
  CGEPagination,
  CGEResponsive,
};

/**
 * Automatically initializes all TailTools plugins on the page
 * based on declarative data-cge-* attributes.
 */
export function initTailTools(root: Document | HTMLElement = document): void {
  // Initialize CGEModal declarative triggers and containers
  CGEModal.init(root);

  // Initialize CGEToast declarative triggers and session flashes
  CGEToast.init(root);

  // Initialize CGEAlert declarative event delegation
  CGEAlert.init(root);

  // Initialize CGEForm declarative forms
  CGEForm.init(root);

  // Initialize CGEDrawer declarative triggers and containers
  CGEDrawer.init(root);

  // Initialize CGELightbox declarative triggers
  CGELightbox.init();

  // Initialize CGEActionButton declarative triggers
  CGEActionButton.init();

  // Initialize CGESelect declarative select elements
  CGESelect.init('select[data-cge-select]', {}, root);

  // Initialize CGEDropzone declarative dropzones
  CGEDropzone.init(root);

  // Initialize CGEDataTable declarative data tables
  CGEDataTable.init(root);

  // Initialize CGEDataGrid declarative data grids
  CGEDataGrid.init(root);

  console.log('[TailTools] Initialized plugins successfully');
}

export const init = initTailTools;

// Auto-initialize when loaded in browser environments if DOM is ready
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Expose plugins globally on window for inline scripts or Alpine.js
  (window as any).TailTools = {
    init: initTailTools,
    CGEModal,
    CGEToast,
    CGEAlert,
    CGEForm,
    CGEDrawer,
    CGELightbox,
    CGEActionButton,
    CGESelect,
    CGEDropzone,
    CGEDataTable,
    CGEDataGrid,
    CGEFilter,
    CGESort,
    CGEPagination,
    CGEResponsive,
  };
  (window as any).CGEModal = CGEModal;
  (window as any).CGEToast = CGEToast;
  (window as any).CGEAlert = CGEAlert;
  (window as any).CGEForm = CGEForm;
  (window as any).CGEDrawer = CGEDrawer;
  (window as any).CGELightbox = CGELightbox;
  (window as any).CGEActionButton = CGEActionButton;
  (window as any).CGESelect = CGESelect;
  (window as any).CGEDropzone = CGEDropzone;
  (window as any).CGEDataTable = CGEDataTable;
  (window as any).CGEDataGrid = CGEDataGrid;
  (window as any).CGEFilter = CGEFilter;
  (window as any).CGESort = CGESort;
  (window as any).CGEPagination = CGEPagination;
  (window as any).CGEResponsive = CGEResponsive;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTailTools());
  } else {
    initTailTools();
  }
}

export default {
  init: initTailTools,
  CGEModal,
  CGEToast,
  CGEAlert,
  CGEForm,
  CGEDrawer,
  CGELightbox,
  CGEActionButton,
  CGESelect,
  CGEDropzone,
  CGEDataTable,
  CGEDataGrid,
  CGEFilter,
  CGESort,
  CGEPagination,
  CGEResponsive,
};

