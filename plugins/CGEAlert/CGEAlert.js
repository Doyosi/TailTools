import { acquireOverlay, releaseOverlay, claimOverlayKey, trapTab } from '../shared/overlay.js';
import { submitConfirmedForm } from '../shared/form.js';
import { Lifecycle } from '../shared/lifecycle.js';
import { escapeHTML, prefersReducedMotion } from '../shared/dom.js';
/**
 * CGEAlert - TailTools Plugin
 * Promise-based native JavaScript alert, confirmation, and dialog plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
 * Features built-in archetypes (confirm, delete, restore, prompt), type-to-confirm safety verification,
 * focus-trapping accessibility, customizable i18n translation dictionary, and declarative data-attribute triggers.
 * Zero external runtime dependencies.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEAlert {
  /**
   * Currently active alert instance.
   * @type {CGEAlert | null}
   */
  static currentAlert = null;

  /**
   * Global portal container element.
   * @type {HTMLElement | null}
   */
  static portalContainer = null;

  /**
   * Default translations dictionary.
   */
  static translations = {
    'confirm-button': 'Confirm',
    'cancel-button': 'Cancel',
    'deny-button': "Don't Save",
    'delete-button': 'Delete',
    'restore-button': 'Restore',
    'ok-button': 'OK',
    'input-placeholder': 'Type here...',
    'input-required-error': 'This field is required.',
    'type-to-confirm-helper': 'Please type <strong class="font-semibold">:match</strong> to confirm.',
    'type-to-confirm-mismatch': 'The text entered does not match.'
  };

  /**
   * Global configuration defaults.
   */
  static defaults = {
    theme: 'light', // 'light' | 'dark' | 'auto'
    title: null,
    message: '',
    html: null,
    archetype: 'alert', // 'alert' | 'confirm' | 'delete' | 'restore' | 'info' | 'success' | 'warning' | 'error' | 'prompt' | 'custom'
    icon: true, // boolean | string (custom SVG/HTML)
    size: 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showConfirmButton: true,
    confirmButtonText: null,
    confirmButtonClass: '',
    showDenyButton: false,
    denyButtonText: null,
    denyButtonClass: '',
    showCancelButton: false,
    cancelButtonText: null,
    cancelButtonClass: '',
    showCloseButton: true,
    backdropClose: true, // if false, clicking backdrop shakes dialog
    allowEscapeKey: true,
    focusConfirm: true,
    trapFocus: true,
    input: null, // 'text' | 'textarea' | 'email' | 'password' | 'select' | 'number'
    inputValue: '',
    inputPlaceholder: '',
    inputOptions: null, // for select: { val: label } or [{ value, label }]
    inputValidator: null, // (val) => string | null | Promise<string | null>
    requireInput: null, // string to match for high security confirmation
    requireInputCaseSensitive: true,
    animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
    translations: {},
    beforeOpen: null,
    didOpen: null,
    willClose: null,
    preConfirm: null // (val) => any | Promise<any>
  };

  /**
   * Built-in default SVG icons for each archetype.
   */
  static ICONS = {
    info: `<svg class="w-5 h-5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    success: `<svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    error: `<svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    confirm: `<svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    delete: `<svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
    restore: `<svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>`,
    prompt: `<svg class="w-5 h-5 text-cyan-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`
  };

  /**
   * Sizing map for dialog width classes.
   */
  static SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-2xl'
  };

  /**
   * @param {Object} options
   */
  _lifecycle = new Lifecycle();

  constructor(options = {}) {
    // If another alert is currently open, dismiss it first
    if (CGEAlert.currentAlert && CGEAlert.currentAlert.isOpen) {
      CGEAlert.currentAlert.dismiss('close');
    }

    this.id = 'cge-alert-' + Math.random().toString(36).substring(2, 9);
    this.options = this._normalizeOptions(options);
    this.translations = { ...CGEAlert.translations, ...this.options.translations };

    this.isOpen = false;
    this.isLoadingState = false;
    this.previousActiveElement = document.activeElement;
    this._resolvePromise = null;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._scrollbarOffset = 0;

    // Elements
    this.overlayEl = null;
    this.dialogEl = null;
    this.inputEl = null;
    this.confirmBtn = null;
    this.denyBtn = null;
    this.cancelBtn = null;
    this.inputErrorEl = null;

    CGEAlert.currentAlert = this;
  }

  /**
   * Merges options with archetype defaults.
   * @private
   */
  _normalizeOptions(rawOptions) {
    const opts = { ...CGEAlert.defaults, ...rawOptions };
    const arch = opts.archetype || 'alert';
    // Per-instance translations win over the global dictionary for archetype button labels.
    const t = { ...CGEAlert.translations, ...(opts.translations || {}) };

    // Apply Archetype-specific intelligent defaults
    switch (arch) {
      case 'confirm':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = t['confirm-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = t['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs';
        break;

      case 'delete':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = t['delete-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = t['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs';
        break;

      case 'restore':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = t['restore-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = t['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs';
        break;

      case 'prompt':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.input) opts.input = 'text';
        if (!opts.confirmButtonText) opts.confirmButtonText = t['confirm-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = t['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs';
        break;

      case 'info':
      case 'success':
      case 'warning':
      case 'error':
      case 'alert':
      default:
        if (!opts.confirmButtonText) opts.confirmButtonText = t['ok-button'];
        if (!opts.confirmButtonClass) {
          if (arch === 'error') opts.confirmButtonClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs';
          else if (arch === 'success') opts.confirmButtonClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs';
          else if (arch === 'warning') opts.confirmButtonClass = 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold shadow-xs';
          else opts.confirmButtonClass = 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs';
        }
        break;
    }

    const isDark = this._resolveTheme(opts.theme) === 'dark';

    if (!opts.cancelButtonClass) {
      opts.cancelButtonClass = isDark
        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
        : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs';
    }
    if (!opts.denyButtonClass) {
      opts.denyButtonClass = isDark
        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs';
    }

    return opts;
  }

  /**
   * Resolves active theme ('light' or 'dark') taking 'auto' into account.
   * @param {string} [themeOption]
   * @returns {'light' | 'dark'}
   * @private
   */
  _resolveTheme(themeOption = this.options?.theme || CGEAlert.defaults.theme) {
    if (themeOption === 'auto') {
      if (typeof document !== 'undefined') {
        if (document.documentElement.classList.contains('dark')) return 'dark';
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      }
      return 'light';
    }
    return themeOption === 'dark' ? 'dark' : 'light';
  }

  /**
   * Lazily initializes and returns the global portal container.
   * @returns {HTMLElement}
   */
  static getPortal() {
    if (!CGEAlert.portalContainer || !document.body.contains(CGEAlert.portalContainer)) {
      let portal = document.getElementById('cge-alert-portal');
      if (!portal) {
        portal = document.createElement('div');
        portal.id = 'cge-alert-portal';
        portal.className = 'fixed inset-0 pointer-events-none select-none';
        portal.style.zIndex = '99999';
        document.body.appendChild(portal);
      }
      CGEAlert.portalContainer = portal;
    }
    return CGEAlert.portalContainer;
  }

  /**
   * Opens the alert dialog and returns a Promise.
   * @returns {Promise<Object>}
   */
  show() {
    return new Promise((resolve) => {
      this._resolvePromise = resolve;
      this._render();
      this._bind();
      this._animateOpen();
    });
  }

  /**
   * Renders the modal DOM structure.
   * @private
   */
  _render() {
    const portal = CGEAlert.getPortal();
    const sizeClass = CGEAlert.SIZES[this.options.size] || CGEAlert.SIZES.md;
    const activeTheme = this._resolveTheme(this.options.theme);
    const isDark = activeTheme === 'dark';

    // 1. Overlay (Backdrop)
    const overlay = document.createElement('div');
    const overlayBg = isDark ? 'bg-slate-950/80' : 'bg-slate-900/40';
    overlay.className = `cge-alert-overlay cge-alert-${activeTheme} fixed inset-0 ${overlayBg} backdrop-blur-xs pointer-events-auto flex items-center justify-center p-3 sm:p-5 overflow-y-auto`;
    this.overlayEl = overlay;

    // 2. Dialog Card
    const dialog = document.createElement('div');
    const cardBgClass = isDark
      ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl'
      : 'bg-white border border-slate-200/90 text-slate-900 shadow-2xl';

    dialog.className = `cge-alert-dialog cge-alert-${activeTheme} relative w-full ${sizeClass} rounded-xl ${cardBgClass} flex flex-col my-auto overflow-hidden`;
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('tabindex', '-1');
    this.dialogEl = dialog;

    // Close button (corner)
    let closeBtnHtml = '';
    if (this.options.showCloseButton) {
      const closeBtnClass = isDark
        ? 'text-slate-400 hover:text-white hover:bg-slate-800'
        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';
      closeBtnHtml = `
        <button type="button" data-cge-alert-action="close" class="cge-alert-close absolute top-3 right-3 w-8 h-8 rounded-md flex items-center justify-center ${closeBtnClass} transition cursor-pointer" aria-label="Close">
          <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      `;
    }

    // Icon slot
    let iconHtml = '';
    if (this.options.icon) {
      let iconSvg = '';
      if (typeof this.options.icon === 'string') {
        iconSvg = this.options.icon;
      } else {
        const arch = this.options.archetype;
        iconSvg = CGEAlert.ICONS[arch] || CGEAlert.ICONS.info;
      }
      const tones = {
        info: ['bg-sky-50 text-sky-600 ring-sky-100', 'bg-sky-400/10 text-sky-400 ring-sky-400/20'],
        success: ['bg-emerald-50 text-emerald-600 ring-emerald-100', 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'],
        restore: ['bg-emerald-50 text-emerald-600 ring-emerald-100', 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'],
        warning: ['bg-amber-50 text-amber-600 ring-amber-100', 'bg-amber-400/10 text-amber-400 ring-amber-400/20'],
        error: ['bg-rose-50 text-rose-600 ring-rose-100', 'bg-rose-400/10 text-rose-400 ring-rose-400/20'],
        delete: ['bg-rose-50 text-rose-600 ring-rose-100', 'bg-rose-400/10 text-rose-400 ring-rose-400/20'],
        confirm: ['bg-indigo-50 text-indigo-600 ring-indigo-100', 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/20'],
        prompt: ['bg-cyan-50 text-cyan-600 ring-cyan-100', 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/20']
      };
      const tone = tones[this.options.archetype] || tones.info;
      const iconContainerClass = tone[isDark ? 1 : 0];
      iconHtml = `
        <div data-cge-alert-icon aria-hidden="true" class="cge-alert-icon ${typeof this.options.icon === 'string' ? '' : 'cge-alert-icon-default'} w-10 h-10 rounded-lg ${iconContainerClass} ring-1 ring-inset flex items-center justify-center shrink-0">
          ${iconSvg}
        </div>
      `;
    }

    // Title & Message Content
    const titleText = this.options.title || '';
    const titleColor = isDark ? 'text-white' : 'text-slate-900';
    const messageColor = isDark ? 'text-slate-300' : 'text-slate-600';
    const titleHtml = titleText ? `<h2 id="${this.id}-title" class="cge-alert-title text-base font-semibold ${titleColor} ${this.options.showCloseButton ? 'pr-7' : ''} ${this.options.html || this.options.message ? 'mb-1.5' : 'mb-0'} leading-6 tracking-tight">${escapeHTML(titleText)}</h2>` : '';
    
    let messageHtml = '';
    if (this.options.html) {
      // `html` is the explicit trusted-HTML opt-in; every other string is rendered as text.
      messageHtml = `<div id="${this.id}-message" class="cge-alert-message text-[13px] ${messageColor} leading-5">${this.options.html}</div>`;
    } else if (this.options.message) {
      messageHtml = `<p id="${this.id}-message" class="cge-alert-message text-[13px] ${messageColor} leading-5">${escapeHTML(this.options.message)}</p>`;
    }

    // Input slot (Prompt or High Security RequireInput)
    let inputSlotHtml = '';
    if (this.options.requireInput) {
      // The translation string is trusted markup; the phrase itself is user data.
      const helper = String(this.translations['type-to-confirm-helper']).replace(':match', () => escapeHTML(this.options.requireInput));
      const helperColor = isDark ? 'text-slate-400' : 'text-slate-500';
      const inputClass = isDark
        ? 'bg-slate-950 border-slate-800 text-white'
        : 'bg-slate-50 border-slate-300 text-slate-900';
      inputSlotHtml = `
        <div class="cge-alert-input-slot mt-3.5 space-y-2">
          <p class="cge-alert-helper text-xs ${helperColor} leading-5">${helper}</p>
          <input type="text" data-cge-alert-input autocomplete="off" spellcheck="false" placeholder="${escapeHTML(this.options.inputPlaceholder || this.options.requireInput)}"
            class="w-full px-3 py-2 rounded-md border ${inputClass} text-[13px] font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition">
          <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
        </div>
      `;
    } else if (this.options.input) {
      inputSlotHtml = this._buildInputHtml();
    }

    // Button Cluster
    const borderSep = isDark ? 'border-slate-800/80 bg-slate-950/25' : 'border-slate-200/70 bg-slate-50/70';
    const buttonBase = 'cge-alert-button inline-flex items-center justify-center min-h-8 gap-1.5 px-3 py-1.5 rounded-md text-[13px] leading-[18px] font-medium transition cursor-pointer';
    let buttonsHtml = `<div class="cge-alert-actions px-4 py-3 sm:px-5 border-t ${borderSep} flex flex-wrap items-center justify-end gap-2">`;

    if (this.options.showCancelButton) {
      const cancelText = this.options.cancelButtonText || this.translations['cancel-button'];
      buttonsHtml += `
        <button type="button" data-cge-alert-action="cancel" class="${buttonBase} ${this.options.cancelButtonClass}">
          ${escapeHTML(cancelText)}
        </button>
      `;
    }

    if (this.options.showDenyButton) {
      const denyText = this.options.denyButtonText || this.translations['deny-button'];
      buttonsHtml += `
        <button type="button" data-cge-alert-action="deny" class="${buttonBase} ${this.options.denyButtonClass}">
          ${escapeHTML(denyText)}
        </button>
      `;
    }

    if (this.options.showConfirmButton) {
      const confirmText = this.options.confirmButtonText || this.translations['confirm-button'];
      const initialDisabled = Boolean(this.options.requireInput);
      buttonsHtml += `
        <button type="button" data-cge-alert-action="confirm" ${initialDisabled ? 'disabled' : ''} class="${buttonBase} font-semibold ${this.options.confirmButtonClass} ${initialDisabled ? 'opacity-40 cursor-not-allowed' : ''}">
          <span data-cge-alert-btn-text>${escapeHTML(confirmText)}</span>
          <span data-cge-alert-spinner style="display: none;" class="hidden shrink-0 w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        </button>
      `;
    }

    buttonsHtml += '</div>';
    if (!this.options.showCancelButton && !this.options.showDenyButton && !this.options.showConfirmButton) buttonsHtml = '';

    // Assemble Card Content
    dialog.innerHTML = `
      ${closeBtnHtml}
      <div class="cge-alert-body p-4 sm:p-5">
        <div class="cge-alert-header flex items-start gap-3">
          ${iconHtml}
          <div class="min-w-0 flex-1 ${!titleText && this.options.showCloseButton ? 'pr-8' : ''}">
            ${titleHtml}
            ${messageHtml}
          </div>
        </div>
        ${inputSlotHtml}
      </div>
      ${buttonsHtml}
    `;

    if (titleText) dialog.setAttribute('aria-labelledby', `${this.id}-title`);
    else dialog.setAttribute('aria-label', String(this.options.message || this.options.archetype || 'Alert').slice(0, 120));
    if (messageHtml) dialog.setAttribute('aria-describedby', `${this.id}-message`);

    overlay.appendChild(dialog);
    portal.appendChild(overlay);

    // Cache interactive elements
    this.confirmBtn = dialog.querySelector('[data-cge-alert-action="confirm"]');
    this.denyBtn = dialog.querySelector('[data-cge-alert-action="deny"]');
    this.cancelBtn = dialog.querySelector('[data-cge-alert-action="cancel"]');
    this.inputEl = dialog.querySelector('[data-cge-alert-input]');
    this.inputErrorEl = dialog.querySelector('[data-cge-alert-error]');
    this.closeBtn = dialog.querySelector('[data-cge-alert-action="close"]');
  }

  /**
   * Generates input field markup for prompts.
   * @private
   */
  _buildInputHtml() {
    const isDark = this._resolveTheme(this.options.theme) === 'dark';
    const type = this.options.input;
    const placeholder = escapeHTML(this.options.inputPlaceholder || this.translations['input-placeholder']);
    const rawValue = this.options.inputValue ?? '';
    const val = escapeHTML(rawValue);
    const inputType = ['text', 'email', 'password', 'number'].includes(type) ? type : 'text';
    const baseClass = isDark
      ? 'w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-white text-[13px] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition'
      : 'w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-300 text-slate-900 text-[13px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs';

    if (type === 'textarea') {
      return `
        <div class="cge-alert-input-slot mt-3.5 space-y-1.5">
          <textarea data-cge-alert-input rows="3" placeholder="${placeholder}"
            class="${baseClass} resize-y leading-relaxed">${val}</textarea>
          <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
        </div>
      `;
    }

    if (type === 'select') {
      let optionsHtml = '';
      const opts = this.options.inputOptions || {};
      if (Array.isArray(opts)) {
        opts.forEach((o) => {
          const isSelected = String(o.value) === String(rawValue) ? 'selected' : '';
          optionsHtml += `<option value="${escapeHTML(o.value)}" ${isSelected}>${escapeHTML(o.label)}</option>`;
        });
      } else {
        Object.entries(opts).forEach(([key, label]) => {
          const isSelected = String(key) === String(rawValue) ? 'selected' : '';
          optionsHtml += `<option value="${escapeHTML(key)}" ${isSelected}>${escapeHTML(label)}</option>`;
        });
      }
      return `
        <div class="cge-alert-input-slot mt-3.5 space-y-1.5">
          <select data-cge-alert-input class="${baseClass} cursor-pointer">
            ${optionsHtml}
          </select>
          <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
        </div>
      `;
    }

    // Standard inputs (text, email, password, number)
    return `
      <div class="cge-alert-input-slot mt-3.5 space-y-1.5">
        <input type="${inputType}" data-cge-alert-input value="${val}" placeholder="${placeholder}"
          class="${baseClass}">
        <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
      </div>
    `;
  }

  /**
   * Binds event listeners for clicks, backdrop, inputs, and keyboard.
   * @private
   */
  _bind() {
    // Action buttons inside dialog
    this.dialogEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-cge-alert-action]');
      if (!btn) return;
      e.preventDefault();

      const action = btn.getAttribute('data-cge-alert-action');
      // preConfirm / inputValidator in flight: the result is not settled yet, so it cannot be dismissed.
      if (this.isLoadingState && action !== 'confirm') return;
      if (action === 'confirm') {
        await this._handleConfirm();
      } else if (action === 'deny') {
        this._handleDeny();
      } else if (action === 'cancel') {
        this.dismiss('cancel');
      } else if (action === 'close') {
        this.dismiss('close');
      }
    });

    // Backdrop click
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        if (this.isLoadingState) return;
        if (this.options.backdropClose) {
          this.dismiss('backdrop');
        } else {
          this.shake();
        }
      }
    });

    // Type-to-confirm input listener
    if (this.options.requireInput && this.inputEl && this.confirmBtn) {
      this.inputEl.addEventListener('input', () => {
        const val = this.inputEl.value.trim();
        const expected = this.options.requireInput.trim();
        const isMatch = this.options.requireInputCaseSensitive
          ? val === expected
          : val.toLowerCase() === expected.toLowerCase();

        if (isMatch) {
          this.confirmBtn.removeAttribute('disabled');
          this.confirmBtn.classList.remove('opacity-40', 'cursor-not-allowed');
          if (this.inputErrorEl) this.inputErrorEl.classList.add('hidden');
        } else {
          this.confirmBtn.setAttribute('disabled', 'true');
          this.confirmBtn.classList.add('opacity-40', 'cursor-not-allowed');
        }
      });
    }

    // Global KeyDown listener
    document.addEventListener('keydown', this._boundKeyDown);
  }

  /**
   * Handles keyboard events (Tab trapping, Enter to confirm, Escape to cancel).
   * @private
   */
  _handleKeyDown(e) {
    if (!this.isOpen || !claimOverlayKey(this, e)) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.isLoadingState) return;
      if (this.options.allowEscapeKey) {
        this.dismiss('esc');
      } else {
        this.shake();
      }
      return;
    }

    if (e.key === 'Enter') {
      // A held key (e.g. the Enter that opened the dialog) must never confirm.
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      const fromInput = this.inputEl && active === this.inputEl && this.inputEl.tagName !== 'TEXTAREA';
      const fromDialog = active === this.dialogEl || active === this.overlayEl;
      // Focused buttons (cancel, deny, close, confirm) activate natively through their click handler.
      if (!fromInput && !fromDialog) return;
      if (this.confirmBtn && !this.confirmBtn.disabled) {
        e.preventDefault();
        this._handleConfirm();
      }
      return;
    }

    // Focus trapping (Tab & Shift+Tab), including focus that escaped the dialog.
    if (e.key === 'Tab' && this.options.trapFocus) {
      trapTab(this.dialogEl, e);
    }
  }

  /**
   * Handles Confirm action and async preConfirm / inputValidator validation.
   * @private
   */
  async _handleConfirm() {
    if (!this.isOpen || this.isLoadingState) return;
    let value = true;

    // 1. Process Input if present
    if (this.inputEl) {
      value = this.inputEl.value;

      // Handle Validator
      if (typeof this.options.inputValidator === 'function') {
        try {
          this.showLoading();
          const validationError = await this.options.inputValidator(value);
          if (!this.isOpen) return;
          this.hideLoading();

          if (validationError) {
            this._showInputError(validationError);
            this.inputEl.focus();
            this.shake();
            return;
          }
        } catch (err) {
          if (!this.isOpen) return;
          this.hideLoading();
          this._showInputError(err.message || 'Validation error');
          return;
        }
      }
    }

    // 2. Process preConfirm hook
    if (typeof this.options.preConfirm === 'function') {
      try {
        this.showLoading();
        const preResult = await this.options.preConfirm(value);
        if (!this.isOpen) return;
        this.hideLoading();

        // If preConfirm explicitly returns false, abort dismissal
        if (preResult === false) {
          return;
        }
        if (preResult !== undefined) {
          value = preResult;
        }
      } catch (err) {
        if (!this.isOpen) return;
        this.hideLoading();
        this._showInputError(err.message || 'Action failed');
        this.shake();
        return;
      }
    }

    if (!this.isOpen) return;
    this._dispatch('confirm', { value });
    this._closeWithResult({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
      value
    });
  }

  /**
   * Handles Deny action.
   * @private
   */
  _handleDeny() {
    this._dispatch('deny');
    this._closeWithResult({
      isConfirmed: false,
      isDenied: true,
      isDismissed: false
    });
  }

  /**
   * Displays an inline validation error message below the input field.
   * @private
   */
  _showInputError(message) {
    if (this.inputErrorEl) {
      this.inputErrorEl.textContent = message;
      this.inputErrorEl.classList.remove('hidden');
    }
  }

  /**
   * Executes entrance transition and locks body scroll.
   * @private
   */
  _animateOpen() {
    this._lockScroll();
    if (typeof this.options.beforeOpen === 'function') {
      this.options.beforeOpen(this.dialogEl);
    }

    const driver = prefersReducedMotion() ? 'none' : this.options.animationDriver;
    const hasAnimationsLib = document.documentElement.classList.contains('has-tailwind-animations') ||
      typeof window !== 'undefined' && Boolean(window.__TAILWIND_ANIMATIONS__);

    if (driver === 'tailwind-animations' || (driver === 'auto' && hasAnimationsLib)) {
      this.overlayEl.classList.add('animate-fade-in');
      this.dialogEl.classList.add('animate-zoom-in');

      // Clean up entrance animation after completion so subsequent animations (like shake) function cleanly
      const onAnimationEnd = () => {
        this.dialogEl.classList.remove('animate-zoom-in');
        this.overlayEl.classList.remove('animate-fade-in');
        this.dialogEl.removeEventListener('animationend', onAnimationEnd);
      };
      this.dialogEl.addEventListener('animationend', onAnimationEnd, { once: true });
    } else if (driver !== 'none') {
      // Standard Tailwind CSS transition fallback
      this.overlayEl.classList.add('transition-opacity', 'duration-200', 'opacity-0');
      this.dialogEl.classList.add('transition-all', 'duration-200', 'opacity-0', 'scale-95');

      this._lifecycle.frame(() => {
        this.overlayEl.classList.remove('opacity-0');
        this.overlayEl.classList.add('opacity-100');
        this.dialogEl.classList.remove('opacity-0', 'scale-95');
        this.dialogEl.classList.add('opacity-100', 'scale-100');
      });
    }

    this.isOpen = true;
    this._dispatch('open');

    // Initial Focus
    this._lifecycle.frame(() => {
      if (this.inputEl) {
        this.inputEl.focus();
      } else if (this.options.focusConfirm && this.confirmBtn) {
        this.confirmBtn.focus();
      } else if (this.dialogEl && !this.dialogEl.contains(document.activeElement)) {
        this.dialogEl.focus();
      }
    });

    if (typeof this.options.didOpen === 'function') {
      this.options.didOpen(this.dialogEl);
    }
  }

  /**
   * Shakes the alert card with tactile feedback.
   */
  shake() {
    if (!this.dialogEl || prefersReducedMotion()) return;
    this.dialogEl.classList.remove('animate-shake', 'cge-alert-shake');
    void this.dialogEl.offsetWidth; // Force DOM reflow
    this.dialogEl.classList.add('animate-shake', 'cge-alert-shake');

    setTimeout(() => {
      if (this.dialogEl) {
        this.dialogEl.classList.remove('animate-shake', 'cge-alert-shake');
      }
    }, 600);
  }

  /**
   * Puts confirm button into loading state.
   */
  showLoading() {
    this.isLoadingState = true;
    if (this.confirmBtn) {
      this.confirmBtn.setAttribute('disabled', 'true');
      this.confirmBtn.classList.add('opacity-80', 'cursor-wait', 'is-loading');
      const spinner = this.confirmBtn.querySelector('[data-cge-alert-spinner]');
      if (spinner) {
        spinner.classList.remove('hidden');
        spinner.classList.add('is-loading');
        spinner.style.display = 'inline-block';
      }
    }
    if (this.cancelBtn) this.cancelBtn.setAttribute('disabled', 'true');
    if (this.denyBtn) this.denyBtn.setAttribute('disabled', 'true');
    if (this.closeBtn) this.closeBtn.setAttribute('disabled', 'true');
  }

  /**
   * Restores confirm button from loading state.
   */
  hideLoading() {
    this.isLoadingState = false;
    if (this.confirmBtn) {
      this.confirmBtn.removeAttribute('disabled');
      this.confirmBtn.classList.remove('opacity-80', 'cursor-wait', 'is-loading');
      const spinner = this.confirmBtn.querySelector('[data-cge-alert-spinner]');
      if (spinner) {
        spinner.classList.remove('is-loading');
        spinner.classList.add('hidden');
        spinner.style.display = 'none';
      }
    }
    if (this.cancelBtn) this.cancelBtn.removeAttribute('disabled');
    if (this.denyBtn) this.denyBtn.removeAttribute('disabled');
    if (this.closeBtn) this.closeBtn.removeAttribute('disabled');
  }

  /**
   * Dismisses the alert dialog.
   * @param {'backdrop' | 'cancel' | 'close' | 'esc'} [reason='close']
   */
  dismiss(reason = 'close') {
    this._dispatch('cancel', { reason });
    this._closeWithResult({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
      dismissReason: reason
    });
  }

  /**
   * Executes closing animation, unbinds events, and resolves result.
   * @private
   */
  _closeWithResult(result) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._lifecycle.cancel();

    if (typeof this.options.willClose === 'function') {
      this.options.willClose(this.dialogEl);
    }

    document.removeEventListener('keydown', this._boundKeyDown);

    const cleanup = () => {
      this._unlockScroll();
      if (this.overlayEl && this.overlayEl.parentNode) {
        this.overlayEl.parentNode.removeChild(this.overlayEl);
      }

      this._dispatch('close', result);

      if (CGEAlert.currentAlert === this) {
        CGEAlert.currentAlert = null;
      }

      if (typeof this._resolvePromise === 'function') {
        this._resolvePromise(result);
        this._resolvePromise = null;
      }
    };

    const driver = prefersReducedMotion() ? 'none' : this.options.animationDriver;
    if (driver === 'tailwind-animations') {
      this.overlayEl.classList.add('animate-fade-out');
      this.dialogEl.classList.add('animate-zoom-out');
      setTimeout(cleanup, 220);
    } else if (driver !== 'none') {
      this.overlayEl.classList.remove('opacity-100');
      this.overlayEl.classList.add('opacity-0');
      this.dialogEl.classList.remove('opacity-100', 'scale-100');
      this.dialogEl.classList.add('opacity-0', 'scale-95');
      setTimeout(cleanup, 200);
    } else {
      cleanup();
    }
  }

  /**
   * Locks document scrolling with scrollbar layout-shift compensation.
   * @private
   */
  // The shared portal is the stacking context, so it receives the z-index bump above other overlays.
  _lockScroll() { acquireOverlay(this, this.overlayEl, true, CGEAlert.getPortal()); }

  _unlockScroll() { releaseOverlay(this, this.previousActiveElement); }

  /**
   * Dispatches DOM CustomEvents on document.
   * @private
   */
  _dispatch(name, detail = {}) {
    const event = new CustomEvent(`cge:alert:${name}`, {
      bubbles: true,
      cancelable: true,
      detail: {
        alert: this,
        archetype: this.options.archetype,
        ...detail
      }
    });
    document.dispatchEvent(event);
    return event;
  }

  // =========================================================================
  // Static Helper Methods
  // =========================================================================

  /**
   * Primary entry point: launches an alert with full options object.
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static fire(options = {}) {
    const instance = new CGEAlert(options);
    return instance.show();
  }

  /**
   * Launches a simple alert dialog.
   * @param {string} title
   * @param {string} [message='']
   * @param {Object} [options={}]
   * @returns {Promise<Object>}
   */
  static alert(title, message = '', options = {}) {
    return CGEAlert.fire({ title, message, archetype: 'alert', ...options });
  }

  /**
   * Launches a confirmation dialog with Confirm and Cancel buttons.
   * @param {string} title
   * @param {string} [message='']
   * @param {Object} [options={}]
   * @returns {Promise<Object>}
   */
  static confirm(title, message = '', options = {}) {
    return CGEAlert.fire({ title, message, archetype: 'confirm', ...options });
  }

  /**
   * Launches a destructive deletion confirmation dialog.
   * @param {string} title
   * @param {string} [message='']
   * @param {Object} [options={}]
   * @returns {Promise<Object>}
   */
  static delete(title, message = '', options = {}) {
    return CGEAlert.fire({ title, message, archetype: 'delete', ...options });
  }

  /**
   * Launches an item recovery / restore confirmation dialog.
   * @param {string} title
   * @param {string} [message='']
   * @param {Object} [options={}]
   * @returns {Promise<Object>}
   */
  static restore(title, message = '', options = {}) {
    return CGEAlert.fire({ title, message, archetype: 'restore', ...options });
  }

  /**
   * Launches a prompt input dialog.
   * @param {string} title
   * @param {Object} [inputOptions={}]
   * @returns {Promise<Object>}
   */
  static prompt(title, inputOptions = {}) {
    return CGEAlert.fire({ title, archetype: 'prompt', ...inputOptions });
  }

  /**
   * Programmatically closes the currently active alert.
   * @param {'backdrop' | 'cancel' | 'close' | 'esc'} [reason='close']
   */
  static close(reason = 'close') {
    if (CGEAlert.currentAlert && CGEAlert.currentAlert.isOpen) {
      CGEAlert.currentAlert.dismiss(reason);
    }
  }

  /**
   * Checks if an alert is currently in loading state.
   * @returns {boolean}
   */
  static isLoading() {
    return Boolean(CGEAlert.currentAlert && CGEAlert.currentAlert.isLoadingState);
  }

  /**
   * Puts active alert into loading state.
   */
  static showLoading() {
    if (CGEAlert.currentAlert) CGEAlert.currentAlert.showLoading();
  }

  /**
   * Restores active alert from loading state.
   */
  static hideLoading() {
    if (CGEAlert.currentAlert) CGEAlert.currentAlert.hideLoading();
  }

  /**
   * Sets global configuration defaults for all future alerts.
   * @param {Object} options
   */
  static setDefaultOptions(options = {}) {
    CGEAlert.defaults = { ...CGEAlert.defaults, ...options };
  }

  /**
   * Sets global translations dictionary.
   * @param {Object} dict
   */
  static setTranslations(dict = {}) {
    CGEAlert.translations = { ...CGEAlert.translations, ...dict };
  }

  /**
   * Triggers waiting for their confirmation dialog.
   * @type {WeakSet<Element>}
   */
  static _pendingTriggers = new WeakSet();

  /**
   * Triggers whose confirmed click is being replayed; the delegated gate lets it through.
   * @type {WeakSet<Element>}
   */
  static _confirmedTriggers = new WeakSet();

  /**
   * Bound delegation roots and their capture-phase listeners.
   * @type {Map<Document | HTMLElement, (e: MouseEvent) => void>}
   */
  static _delegations = new Map();

  /**
   * Reads declarative `data-cge-*` alert options. Attribute values are already decoded by the
   * browser (Blade `{{ }}` escaping is undone), so every value is passed on as plain text.
   * @param {Element} trigger
   * @returns {Object}
   */
  static optionsFromTrigger(trigger) {
    return {
      archetype: trigger.getAttribute('data-cge-alert') || 'confirm',
      theme: trigger.getAttribute('data-cge-theme') || CGEAlert.defaults.theme,
      title: trigger.getAttribute('data-cge-title') || 'Are you sure?',
      message: trigger.getAttribute('data-cge-message') || '',
      html: null,
      confirmButtonText: trigger.getAttribute('data-cge-confirm-text') || null,
      cancelButtonText: trigger.getAttribute('data-cge-cancel-text') || null,
      requireInput: trigger.getAttribute('data-cge-require') || null,
      size: trigger.getAttribute('data-cge-size') || 'md'
    };
  }

  /**
   * Replays the original click after confirmation so element handlers (wire:click, @click,
   * onclick) and native link/submit behavior run exactly once.
   * @private
   */
  static _proceed(trigger, result) {
    let allowed;
    CGEAlert._confirmedTriggers.add(trigger);
    try {
      allowed = trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window }));
    } finally {
      CGEAlert._confirmedTriggers.delete(trigger);
    }
    if (!allowed || !trigger.isConnected) return;
    const form = trigger.form || trigger.closest('form');
    const isLink = trigger.tagName === 'A' && trigger.hasAttribute('href');
    const isSubmitter = form && (trigger.type === 'submit' || trigger.type === 'image')
      && (trigger.tagName === 'BUTTON' || trigger.tagName === 'INPUT');
    // Links and real submit buttons were completed natively by the replayed click.
    if (isLink || isSubmitter) return;
    if (form) submitConfirmedForm(form, trigger);
    else trigger.dispatchEvent(new CustomEvent('cge:confirmed', { bubbles: true, detail: result }));
  }

  /**
   * Sets up click delegation for `[data-cge-alert]` inside `root`.
   * The listener runs in the capture phase and stops the click before element handlers
   * (wire:click, @click, onclick), links and form submission; after confirmation the click is replayed.
   * @param {Document | HTMLElement} [root=document]
   */
  static init(root = document) {
    for (const bound of Array.from(CGEAlert._delegations.keys())) {
      if (bound !== document && !bound.isConnected) CGEAlert._unbind(bound);
    }
    if (CGEAlert._delegations.has(root)) return;

    const onDelegatedClick = async (e) => {
      const trigger = e.target instanceof Element ? e.target.closest('[data-cge-alert]') : null;
      if (!trigger || (root !== document && !root.contains(trigger))) return;
      if (CGEAlert._confirmedTriggers.has(trigger)) return;

      // Intercept before any other handler, navigation or form submission.
      e.preventDefault();
      e.stopImmediatePropagation();
      if (CGEAlert._pendingTriggers.has(trigger)) return;

      CGEAlert._pendingTriggers.add(trigger);
      let result;
      try {
        result = await CGEAlert.fire(CGEAlert.optionsFromTrigger(trigger));
      } finally {
        CGEAlert._pendingTriggers.delete(trigger);
      }

      if (result.isConfirmed && trigger.isConnected) CGEAlert._proceed(trigger, result);
    };

    root.addEventListener('click', onDelegatedClick, true);
    CGEAlert._delegations.set(root, onDelegatedClick);
    root._cgeAlertBound = true;
  }

  /** @private */
  static _unbind(root) {
    const listener = CGEAlert._delegations.get(root);
    if (!listener) return;
    root.removeEventListener('click', listener, true);
    CGEAlert._delegations.delete(root);
    delete root._cgeAlertBound;
  }

  /**
   * Teardown for Livewire/Turbo: closes the active alert and removes click delegation bound to
   * `root`, to roots inside it, or to disconnected roots.
   * @param {Document | HTMLElement} [root=document]
   */
  static destroyAll(root = document) {
    if (CGEAlert.currentAlert?.isOpen) {
      CGEAlert.currentAlert.isLoadingState = false;
      CGEAlert.currentAlert.dismiss('close');
    }
    for (const bound of Array.from(CGEAlert._delegations.keys())) {
      const inside = root === document || bound === root || (bound !== document && root.contains(bound));
      if (inside || (bound !== document && !bound.isConnected)) CGEAlert._unbind(bound);
    }
  }
}

export default CGEAlert;
