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

export { CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone };

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
};

