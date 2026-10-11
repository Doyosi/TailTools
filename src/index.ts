/**
 * TailTools Core Library Entry Point
 * Designed for Tailwind CSS v4.3+ and Laravel (Blade & Vite)
 *
 * This entry has no side effects: it neither touches window nor initializes plugins.
 * Import 'tailtools/auto' for globals, automatic initialization and Livewire/Turbo hooks.
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
import { CGETabs } from '../plugins/CGETabs';
import { CGEAccordion, CGECollapse } from '../plugins/CGEAccordion';
import { escapeHTML } from '../plugins/shared/dom.js';

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
  CGETabs,
  CGEAccordion,
  CGECollapse,
  CGEFilter,
  CGESort,
  CGEPagination,
  CGEResponsive,
  escapeHTML,
};

type Lifecycle = { destroyAll?: (root?: Document | HTMLElement) => unknown };

const plugins = {
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
  CGETabs,
  CGEAccordion,
  CGECollapse,
};

/**
 * Initializes all TailTools plugins inside root based on declarative data-cge-* attributes.
 * Safe to call repeatedly (after AJAX, Livewire or Turbo updates): existing instances are
 * reused and instances whose elements were removed from the DOM are destroyed first.
 */
export function initTailTools(root: Document | HTMLElement = document): void {
  CGEModal.init(root);
  CGEToast.init(root);
  CGEAlert.init(root);
  CGEForm.init(root);
  CGEDrawer.init(root);
  CGELightbox.init();
  CGEActionButton.init();
  CGESelect.init('select[data-cge-select]', {}, root);
  CGEDropzone.init(root);
  CGEDataTable.init(root);
  CGEDataGrid.init(root);
  CGETabs.init(root);
  CGEAccordion.init(root);
  CGECollapse.init(root);
}

/**
 * Destroys every TailTools instance whose element is inside root (or already detached).
 * Call before replacing a subtree, e.g. on livewire:navigating or turbo:before-render.
 */
export function destroyTailTools(root: Document | HTMLElement = document): void {
  for (const plugin of Object.values(plugins) as Lifecycle[]) plugin.destroyAll?.(root);
}

export const init = initTailTools;
export const destroy = destroyTailTools;

export default {
  init: initTailTools,
  destroy: destroyTailTools,
  ...plugins,
  CGEFilter,
  CGESort,
  CGEPagination,
  CGEResponsive,
};
