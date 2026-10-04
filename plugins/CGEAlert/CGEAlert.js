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
    'type-to-confirm-helper': 'Please type <strong class="text-white">:match</strong> to confirm.',
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
    info: `<svg class="w-7 h-7 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    success: `<svg class="w-7 h-7 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg class="w-7 h-7 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    error: `<svg class="w-7 h-7 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    confirm: `<svg class="w-7 h-7 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    delete: `<svg class="w-7 h-7 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
    restore: `<svg class="w-7 h-7 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>`,
    prompt: `<svg class="w-7 h-7 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`
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

    // Apply Archetype-specific intelligent defaults
    switch (arch) {
      case 'confirm':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = CGEAlert.translations['confirm-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = CGEAlert.translations['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20';
        break;

      case 'delete':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = CGEAlert.translations['delete-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = CGEAlert.translations['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20';
        break;

      case 'restore':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.confirmButtonText) opts.confirmButtonText = CGEAlert.translations['restore-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = CGEAlert.translations['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20';
        break;

      case 'prompt':
        if (opts.showCancelButton === false && !('showCancelButton' in rawOptions)) opts.showCancelButton = true;
        if (!opts.input) opts.input = 'text';
        if (!opts.confirmButtonText) opts.confirmButtonText = CGEAlert.translations['confirm-button'];
        if (!opts.cancelButtonText) opts.cancelButtonText = CGEAlert.translations['cancel-button'];
        if (!opts.confirmButtonClass) opts.confirmButtonClass = 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20';
        break;

      case 'info':
      case 'success':
      case 'warning':
      case 'error':
      case 'alert':
      default:
        if (!opts.confirmButtonText) opts.confirmButtonText = CGEAlert.translations['ok-button'];
        if (!opts.confirmButtonClass) {
          if (arch === 'error') opts.confirmButtonClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20';
          else if (arch === 'success') opts.confirmButtonClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20';
          else if (arch === 'warning') opts.confirmButtonClass = 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-600/20';
          else opts.confirmButtonClass = 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20';
        }
        break;
    }

    const isDark = this._resolveTheme(opts.theme) === 'dark';

    if (!opts.cancelButtonClass) {
      opts.cancelButtonClass = isDark
        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs';
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
    overlay.className = `cge-alert-overlay cge-alert-${activeTheme} fixed inset-0 ${overlayBg} backdrop-blur-xs pointer-events-auto flex items-center justify-center p-4 sm:p-6 overflow-y-auto`;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${this.id}-title`);
    this.overlayEl = overlay;

    // 2. Dialog Card
    const dialog = document.createElement('div');
    const cardBgClass = isDark
      ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl'
      : 'bg-white border border-slate-200/90 text-slate-900 shadow-2xl';

    dialog.className = `cge-alert-dialog cge-alert-${activeTheme} relative w-full ${sizeClass} rounded-sm ${cardBgClass} p-6 sm:p-7 flex flex-col justify-between my-auto`;
    this.dialogEl = dialog;

    // Close button (corner)
    let closeBtnHtml = '';
    if (this.options.showCloseButton) {
      const closeBtnClass = isDark
        ? 'text-slate-400 hover:text-white hover:bg-slate-800'
        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';
      closeBtnHtml = `
        <button type="button" data-cge-alert-action="close" class="absolute top-4 right-4 w-8 h-8 rounded-sm flex items-center justify-center ${closeBtnClass} transition cursor-pointer" aria-label="Close">
          ✕
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
      const iconContainerClass = isDark
        ? 'bg-slate-800/80 border border-slate-700/60 shadow-inner'
        : 'bg-slate-50 border border-slate-200/90 shadow-2xs';
      iconHtml = `
        <div class="w-12 h-12 rounded-sm ${iconContainerClass} flex items-center justify-center mb-4 shrink-0">
          ${iconSvg}
        </div>
      `;
    }

    // Title & Message Content
    const titleText = this.options.title || '';
    const titleColor = isDark ? 'text-white' : 'text-slate-900';
    const messageColor = isDark ? 'text-slate-300' : 'text-slate-600';
    const titleHtml = titleText ? `<h2 id="${this.id}-title" class="text-lg sm:text-xl font-bold ${titleColor} mb-2 tracking-tight">${titleText}</h2>` : '';
    
    let messageHtml = '';
    if (this.options.html) {
      messageHtml = `<div class="text-xs sm:text-sm ${messageColor} leading-relaxed">${this.options.html}</div>`;
    } else if (this.options.message) {
      messageHtml = `<p class="text-xs sm:text-sm ${messageColor} leading-relaxed">${this.options.message}</p>`;
    }

    // Input slot (Prompt or High Security RequireInput)
    let inputSlotHtml = '';
    if (this.options.requireInput) {
      const helper = this.translations['type-to-confirm-helper'].replace(':match', this.options.requireInput);
      const helperColor = isDark ? 'text-slate-400' : 'text-slate-500';
      const inputClass = isDark
        ? 'bg-slate-950 border-slate-800 text-white'
        : 'bg-slate-50 border-slate-300 text-slate-900';
      inputSlotHtml = `
        <div class="mt-4 space-y-2">
          <p class="text-xs ${helperColor}">${helper}</p>
          <input type="text" data-cge-alert-input autocomplete="off" spellcheck="false" placeholder="${this.options.inputPlaceholder || this.options.requireInput}"
            class="w-full px-3.5 py-2.5 rounded-sm border ${inputClass} text-xs font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition">
          <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
        </div>
      `;
    } else if (this.options.input) {
      inputSlotHtml = this._buildInputHtml();
    }

    // Button Cluster
    const borderSep = isDark ? 'border-slate-800/80' : 'border-slate-100';
    let buttonsHtml = `<div class="mt-6 pt-4 border-t ${borderSep} flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">`;

    if (this.options.showCancelButton) {
      const cancelText = this.options.cancelButtonText || this.translations['cancel-button'];
      buttonsHtml += `
        <button type="button" data-cge-alert-action="cancel" class="px-4 py-2.5 rounded-sm text-xs font-medium transition cursor-pointer ${this.options.cancelButtonClass}">
          ${cancelText}
        </button>
      `;
    }

    if (this.options.showDenyButton) {
      const denyText = this.options.denyButtonText || this.translations['deny-button'];
      buttonsHtml += `
        <button type="button" data-cge-alert-action="deny" class="px-4 py-2.5 rounded-sm text-xs font-medium transition cursor-pointer ${this.options.denyButtonClass}">
          ${denyText}
        </button>
      `;
    }

    if (this.options.showConfirmButton) {
      const confirmText = this.options.confirmButtonText || this.translations['confirm-button'];
      const initialDisabled = Boolean(this.options.requireInput);
      buttonsHtml += `
        <button type="button" data-cge-alert-action="confirm" ${initialDisabled ? 'disabled' : ''} class="inline-flex items-center justify-center px-5 py-2.5 rounded-sm text-xs font-semibold transition cursor-pointer ${this.options.confirmButtonClass} ${initialDisabled ? 'opacity-40 cursor-not-allowed' : ''}">
          <span data-cge-alert-btn-text>${confirmText}</span>
          <span data-cge-alert-spinner style="display: none;" class="hidden ml-2 w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        </button>
      `;
    }

    buttonsHtml += '</div>';

    // Assemble Card Content
    dialog.innerHTML = `
      ${closeBtnHtml}
      <div>
        ${iconHtml}
        ${titleHtml}
        ${messageHtml}
        ${inputSlotHtml}
      </div>
      ${buttonsHtml}
    `;

    overlay.appendChild(dialog);
    portal.appendChild(overlay);

    // Cache interactive elements
    this.confirmBtn = dialog.querySelector('[data-cge-alert-action="confirm"]');
    this.denyBtn = dialog.querySelector('[data-cge-alert-action="deny"]');
    this.cancelBtn = dialog.querySelector('[data-cge-alert-action="cancel"]');
    this.inputEl = dialog.querySelector('[data-cge-alert-input]');
    this.inputErrorEl = dialog.querySelector('[data-cge-alert-error]');
  }

  /**
   * Generates input field markup for prompts.
   * @private
   */
  _buildInputHtml() {
    const isDark = this._resolveTheme(this.options.theme) === 'dark';
    const type = this.options.input;
    const placeholder = this.options.inputPlaceholder || this.translations['input-placeholder'];
    const val = this.options.inputValue || '';
    const baseClass = isDark
      ? 'w-full px-3.5 py-2.5 rounded-sm bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition'
      : 'w-full px-3.5 py-2.5 rounded-sm bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs';

    if (type === 'textarea') {
      return `
        <div class="mt-4 space-y-1.5">
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
          const isSelected = String(o.value) === String(val) ? 'selected' : '';
          optionsHtml += `<option value="${o.value}" ${isSelected}>${o.label}</option>`;
        });
      } else {
        Object.entries(opts).forEach(([key, label]) => {
          const isSelected = String(key) === String(val) ? 'selected' : '';
          optionsHtml += `<option value="${key}" ${isSelected}>${label}</option>`;
        });
      }
      return `
        <div class="mt-4 space-y-1.5">
          <select data-cge-alert-input class="${baseClass} cursor-pointer">
            ${optionsHtml}
          </select>
          <div data-cge-alert-error class="text-[11px] text-rose-500 font-medium hidden"></div>
        </div>
      `;
    }

    // Standard inputs (text, email, password, number)
    return `
      <div class="mt-4 space-y-1.5">
        <input type="${type}" data-cge-alert-input value="${val}" placeholder="${placeholder}"
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
    if (!this.isOpen) return;

    if (e.key === 'Escape') {
      if (this.options.allowEscapeKey) {
        e.preventDefault();
        this.dismiss('esc');
      } else {
        this.shake();
      }
      return;
    }

    if (e.key === 'Enter') {
      // Don't auto-confirm if user is writing in a multiline textarea
      if (this.inputEl && this.inputEl.tagName === 'TEXTAREA' && document.activeElement === this.inputEl) {
        return;
      }
      if (this.confirmBtn && !this.confirmBtn.disabled) {
        e.preventDefault();
        this._handleConfirm();
      }
      return;
    }

    // Focus trapping (Tab & Shift+Tab)
    if (e.key === 'Tab' && this.options.trapFocus) {
      const focusables = this.dialogEl.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  /**
   * Handles Confirm action and async preConfirm / inputValidator validation.
   * @private
   */
  async _handleConfirm() {
    let value = true;

    // 1. Process Input if present
    if (this.inputEl) {
      value = this.inputEl.value;

      // Handle Validator
      if (typeof this.options.inputValidator === 'function') {
        try {
          this.showLoading();
          const validationError = await this.options.inputValidator(value);
          this.hideLoading();

          if (validationError) {
            this._showInputError(validationError);
            this.inputEl.focus();
            this.shake();
            return;
          }
        } catch (err) {
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
        this.hideLoading();

        // If preConfirm explicitly returns false, abort dismissal
        if (preResult === false) {
          return;
        }
        if (preResult !== undefined) {
          value = preResult;
        }
      } catch (err) {
        this.hideLoading();
        this._showInputError(err.message || 'Action failed');
        this.shake();
        return;
      }
    }

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

    const driver = this.options.animationDriver;
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

      requestAnimationFrame(() => {
        this.overlayEl.classList.remove('opacity-0');
        this.overlayEl.classList.add('opacity-100');
        this.dialogEl.classList.remove('opacity-0', 'scale-95');
        this.dialogEl.classList.add('opacity-100', 'scale-100');
      });
    }

    this.isOpen = true;
    this._dispatch('open');

    // Initial Focus
    requestAnimationFrame(() => {
      if (this.inputEl) {
        this.inputEl.focus();
      } else if (this.options.focusConfirm && this.confirmBtn) {
        this.confirmBtn.focus();
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
    if (!this.dialogEl) return;
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

    if (typeof this.options.willClose === 'function') {
      this.options.willClose(this.dialogEl);
    }

    document.removeEventListener('keydown', this._boundKeyDown);

    const cleanup = () => {
      this._unlockScroll();
      if (this.overlayEl && this.overlayEl.parentNode) {
        this.overlayEl.parentNode.removeChild(this.overlayEl);
      }
      if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
        this.previousActiveElement.focus();
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

    const driver = this.options.animationDriver;
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
  _lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add('overflow-hidden');
  }

  /**
   * Unlocks document scrolling.
   * @private
   */
  _unlockScroll() {
    document.body.classList.remove('overflow-hidden');
    document.body.style.paddingRight = '';
  }

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
   * Scans document and sets up global click event delegation for `[data-cge-alert]`.
   * Intercepts form submissions and link clicks until confirmed.
   * @param {Document | HTMLElement} [root=document]
   */
  static init(root = document) {
    if (root._cgeAlertBound) return;

    const onDelegatedClick = async (e) => {
      const trigger = e.target.closest('[data-cge-alert]');
      if (!trigger) return;

      // Extract declarative parameters
      const archetype = trigger.getAttribute('data-cge-alert') || 'confirm';
      const theme = trigger.getAttribute('data-cge-theme') || CGEAlert.defaults.theme;
      const title = trigger.getAttribute('data-cge-title') || 'Are you sure?';
      const message = trigger.getAttribute('data-cge-message') || '';
      const confirmText = trigger.getAttribute('data-cge-confirm-text') || null;
      const cancelText = trigger.getAttribute('data-cge-cancel-text') || null;
      const requireInput = trigger.getAttribute('data-cge-require') || null;
      const size = trigger.getAttribute('data-cge-size') || 'md';

      // Intercept navigation or form submission
      e.preventDefault();
      e.stopPropagation();

      const result = await CGEAlert.fire({
        archetype,
        theme,
        title,
        message,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        requireInput,
        size
      });

      if (result.isConfirmed) {
        // If confirmed, proceed with original action:
        const form = trigger.closest('form');
        if (trigger.tagName === 'A' && trigger.href) {
          window.location.href = trigger.href;
        } else if (form) {
          // If trigger has a name/value (submit button), append it temporarily
          if (trigger.name) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = trigger.name;
            hidden.value = trigger.value;
            form.appendChild(hidden);
          }
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit(trigger.name ? undefined : trigger);
          } else {
            form.submit();
          }
        } else {
          // Dispatch custom confirmed action event on trigger
          trigger.dispatchEvent(new CustomEvent('cge:confirmed', { bubbles: true, detail: result }));
        }
      }
    };

    root.addEventListener('click', onDelegatedClick);
    root._cgeAlertBound = true;
  }
}

export default CGEAlert;
