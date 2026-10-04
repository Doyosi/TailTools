/**
 * CGEToast - TailTools Plugin
 * Lightweight, high-performance notification and toast alert system engineered for Tailwind CSS v4.3+ and Laravel Blade.
 * Features 8 standard floating positions + 2 full-width banner modes, automated z-index portal isolation,
 * semantic variants, animated progress bar with hover-pause, touch swipe gestures, and i18n support.
 * Zero external runtime dependencies.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEToast {
  /**
   * Active toasts registry.
   * @type {Set<CGEToast>}
   */
  static activeToasts = new Set();

  /**
   * Portal containers by position key.
   * @type {Map<string, HTMLElement>}
   */
  static containers = new Map();
  static _processedFlashes = new WeakSet();
  static _handledTriggerEvents = new WeakSet();

  /**
   * Default translations dictionary.
   */
  static translations = {
    close: 'Close notification',
    undo: 'Undo',
    'success-title': 'Success',
    'error-title': 'Error',
    'warning-title': 'Warning',
    'info-title': 'Notice',
    'neutral-title': 'Notification'
  };

  /**
   * Global configuration defaults.
   */
  static defaults = {
    theme: 'light', // 'light' | 'dark' | 'auto'
    title: null,
    message: '',
    variant: 'neutral', // 'success' | 'error' | 'warning' | 'info' | 'neutral'
    position: 'top-right', // 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center' | 'top-full' | 'bottom-full'
    duration: 5000, // ms, or false / 0 for persistent
    progressBar: true,
    pauseOnHover: true,
    dismissOnClick: false,
    dismissible: true,
    swipeToDismiss: true,
    icon: true, // boolean | string (custom SVG/HTML)
    image: null, // { src: string, alt?: string, class?: string }
    actions: [], // [{ label: string, class?: string, onClick: Function }]
    newestOnTop: true,
    maxToasts: 5,
    animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
    translations: {},
    onOpen: null,
    onClose: null,
    onClick: null
  };

  /**
   * Built-in default SVG icons for light mode.
   */
  static LIGHT_ICONS = {
    success: `<svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    info: `<svg class="w-5 h-5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    neutral: `<svg class="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`
  };

  /**
   * Built-in default SVG icons for dark mode.
   */
  static DARK_ICONS = {
    success: `<svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    info: `<svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    neutral: `<svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`
  };

  static ICONS = CGEToast.LIGHT_ICONS;

  /**
   * Color palettes for light mode semantic variants.
   */
  static LIGHT_VARIANTS = {
    success: {
      border: 'border-emerald-200/90',
      progress: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    },
    error: {
      border: 'border-rose-200/90',
      progress: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border border-rose-200'
    },
    warning: {
      border: 'border-amber-200/90',
      progress: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-800 border border-amber-200'
    },
    info: {
      border: 'border-sky-200/90',
      progress: 'bg-sky-500',
      badge: 'bg-sky-50 text-sky-700 border border-sky-200'
    },
    neutral: {
      border: 'border-slate-200/90',
      progress: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-700 border border-slate-200'
    }
  };

  /**
   * Color palettes for dark mode semantic variants.
   */
  static DARK_VARIANTS = {
    success: {
      border: 'border-emerald-500/30',
      progress: 'bg-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    },
    error: {
      border: 'border-rose-500/30',
      progress: 'bg-rose-500',
      badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    },
    warning: {
      border: 'border-amber-500/30',
      progress: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    },
    info: {
      border: 'border-sky-500/30',
      progress: 'bg-sky-500',
      badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
    },
    neutral: {
      border: 'border-slate-800',
      progress: 'bg-slate-500',
      badge: 'bg-slate-800 text-slate-300 border border-slate-700'
    }
  };

  static VARIANTS = CGEToast.LIGHT_VARIANTS;

  /**
   * @param {Object} options - Toast configuration options
   */
  constructor(options = {}) {
    this.options = { ...CGEToast.defaults, ...options };
    this.translations = { ...CGEToast.translations, ...(this.options.translations || {}) };

    this.id = `cge-toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.isOpen = false;
    this.isPaused = false;
    this.remainingTime = typeof this.options.duration === 'number' ? this.options.duration : 0;
    this._timer = null;
    this._lastTick = 0;
    this._progressBarEl = null;

    this.container = CGEToast._getOrCreateContainer(this.options.position);
    this.el = this._buildDOM();

    this._mount();
  }

  /**
   * Resolves active theme ('light' or 'dark') taking 'auto' into account.
   * @param {string} [themeOption]
   * @returns {'light' | 'dark'}
   * @private
   */
  _resolveTheme(themeOption = this.options?.theme || CGEToast.defaults.theme) {
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
   * Builds the toast HTML DOM element.
   * @private
   */
  _buildDOM() {
    const isBanner = this.options.position === 'top-full' || this.options.position === 'bottom-full';
    const activeTheme = this._resolveTheme(this.options.theme);
    const isDark = activeTheme === 'dark';
    const variantStyle = (isDark ? CGEToast.DARK_VARIANTS : CGEToast.LIGHT_VARIANTS)[this.options.variant] || (isDark ? CGEToast.DARK_VARIANTS.neutral : CGEToast.LIGHT_VARIANTS.neutral);
    const title = this.options.title || this._getDefaultTitle(this.options.variant);

    const toastEl = document.createElement('div');
    toastEl.id = this.id;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');

    if (isBanner) {
      // Full-width banner mode
      const bgClass = isDark
        ? 'bg-slate-900/95 text-slate-100 border-slate-800 shadow-2xl'
        : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-lg';
      toastEl.className = `cge-toast cge-toast-banner cge-toast-${activeTheme} pointer-events-auto relative w-full px-4 py-3 backdrop-blur-sm ${bgClass} border-y ${variantStyle.border} transition-all duration-300`;
    } else {
      // Floating card mode
      const bgClass = isDark
        ? 'bg-slate-900/95 text-slate-100 border-slate-800 shadow-2xl'
        : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-xl';
      toastEl.className = `cge-toast cge-toast-${activeTheme} pointer-events-auto relative w-full max-w-sm rounded-sm backdrop-blur-sm p-3 ${bgClass} border ${variantStyle.border} overflow-hidden transition-all duration-300`;
    }

    // 1. Icon or Avatar image
    let visualSlot = '';
    if (this.options.image && this.options.image.src) {
      const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
      const imgClass = this.options.image.class || `w-8 h-8 rounded-sm object-cover shrink-0 border ${borderClass}`;
      visualSlot = `<img src="${this.options.image.src}" alt="${this.options.image.alt || 'Avatar'}" class="${imgClass}" />`;
    } else if (this.options.icon) {
      const iconSet = isDark ? CGEToast.DARK_ICONS : CGEToast.LIGHT_ICONS;
      visualSlot = typeof this.options.icon === 'string' && this.options.icon !== 'true'
        ? `<div class="cge-toast-custom-icon shrink-0">${this.options.icon}</div>`
        : `<div class="cge-toast-icon w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${variantStyle.badge}" aria-hidden="true">${iconSet[this.options.variant] || iconSet.neutral}</div>`;
    }

    // 2. Action buttons
    let actionsHTML = '';
    if (Array.isArray(this.options.actions) && this.options.actions.length > 0) {
      const containerClass = `cge-toast-actions flex flex-wrap items-center gap-1.5${isBanner ? '' : ' mt-2'}`;
      const baseBtnClass = 'cge-toast-action-btn';
      const defaultBtnClass = 'cge-toast-btn-secondary';

      actionsHTML = `<div class="${containerClass}">
        ${this.options.actions.map((act, idx) => `
          <button type="button" data-cge-action="${idx}" class="${baseBtnClass} ${act.class || defaultBtnClass}">
            ${act.label}
          </button>
        `).join('')}
      </div>`;
    }

    // 3. Dismiss button
    const closeBtnClass = isDark
      ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';
    const closeBtnHTML = this.options.dismissible ? `
      <button type="button" data-cge-toast-close class="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-sm flex items-center justify-center ${closeBtnClass} transition cursor-pointer" aria-label="${this.translations.close}">
        <svg class="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    ` : '';

    // 4. Inner layout
    const msgColor = isDark ? 'text-slate-200' : 'text-slate-600';
    const titleColor = isDark ? 'text-white' : 'text-slate-900';

    if (isBanner) {
      toastEl.innerHTML = `
        <div class="max-w-7xl mx-auto w-full flex items-start gap-2.5">
          ${visualSlot}
          <div class="cge-toast-banner-main flex-1 min-w-0">
            <div class="cge-toast-copy min-w-0">
              ${title ? `<h4 class="cge-toast-title ${titleColor}">${title}</h4>` : ''}
              <div class="cge-toast-message ${msgColor}">${this.options.message}</div>
            </div>
            ${actionsHTML}
          </div>
          ${closeBtnHTML}
        </div>
      `;
    } else {
      toastEl.innerHTML = `
        <div class="flex items-start gap-2.5">
          ${visualSlot}
          <div class="flex-1 min-w-0">
            ${title ? `<h4 class="cge-toast-title ${titleColor}">${title}</h4>` : ''}
            <div class="cge-toast-message ${msgColor}">${this.options.message}</div>
            ${actionsHTML}
          </div>
          ${closeBtnHTML}
        </div>
      `;
    }

    // 5. Progress bar if enabled & duration is set
    if (this.options.progressBar && this.options.duration && this.options.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = `cge-toast-progress absolute bottom-0 left-0 h-0.5 ${variantStyle.progress} transition-none`;
      progressBar.style.width = '100%';
      toastEl.appendChild(progressBar);
      this._progressBarEl = progressBar;
    }

    return toastEl;
  }

  /**
   * Returns localized default title for variant.
   * @private
   */
  _getDefaultTitle(variant) {
    if (variant === 'success') return this.translations['success-title'];
    if (variant === 'error') return this.translations['error-title'];
    if (variant === 'warning') return this.translations['warning-title'];
    if (variant === 'info') return this.translations['info-title'];
    return null;
  }

  /**
   * Mounts the toast into DOM portal container and begins lifecycle.
   * @private
   */
  _mount() {
    this._enforceMaxToasts();

    // Position insertion (newest on top or append)
    if (this.options.newestOnTop && this.container.firstChild) {
      this.container.insertBefore(this.el, this.container.firstChild);
    } else {
      this.container.appendChild(this.el);
    }

    CGEToast.activeToasts.add(this);
    this.isOpen = true;

    this._bindEvents();
    this._animateIn();

    // Start auto-dismiss timer
    if (this.options.duration && this.options.duration > 0) {
      this._startTimer();
    }

    // Trigger hooks & CustomEvent
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this);
    }
    this._dispatch('open');
  }

  /**
   * Binds interaction listeners (hover-pause, dismiss, swipe, action buttons).
   * @private
   */
  _bindEvents() {
    // Hover pause
    if (this.options.pauseOnHover && this.options.duration) {
      this.el.addEventListener('mouseenter', () => this.pause());
      this.el.addEventListener('mouseleave', () => this.resume());
    }

    // Close button
    const closeBtn = this.el.querySelector('[data-cge-toast-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss();
      });
    }

    // Click to dismiss
    if (this.options.dismissOnClick) {
      this.el.addEventListener('click', () => this.dismiss());
    }

    // Action buttons callback binding
    const actionBtns = this.el.querySelectorAll('[data-cge-action]');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-cge-action'), 10);
        if (this.options.actions[idx] && typeof this.options.actions[idx].onClick === 'function') {
          this.options.actions[idx].onClick(this, e);
        }
      });
    });

    // Touch swipe-to-dismiss gesture
    if (this.options.swipeToDismiss) {
      this._bindSwipe();
    }

    // Global click callback
    this.el.addEventListener('click', (e) => {
      if (typeof this.options.onClick === 'function') {
        this.options.onClick(this, e);
      }
      this._dispatch('click', { event: e });
    });
  }

  /**
   * Mobile touch swipe-to-dismiss implementation.
   * @private
   */
  _bindSwipe() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isSwiping = false;

    this.el.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      isSwiping = false;
    }, { passive: true });

    this.el.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - startX;
      const dy = y - startY;

      // Determine horizontal intent
      if (!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isSwiping = true;
        this.pause();
      }

      if (isSwiping) {
        currentX = x;
        this.el.style.transform = `translate3d(${dx}px, 0, 0)`;
        this.el.style.opacity = `${Math.max(0, 1 - Math.abs(dx) / 250)}`;
      }
    }, { passive: true });

    this.el.addEventListener('touchend', () => {
      if (!isSwiping) return;
      const dx = currentX - startX;

      if (Math.abs(dx) > 75) {
        // Swiped away
        const direction = dx > 0 ? 300 : -300;
        this.el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        this.el.style.transform = `translate3d(${direction}px, 0, 0)`;
        this.el.style.opacity = '0';
        setTimeout(() => this.dismiss(), 200);
      } else {
        // Snap back
        this.el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        this.el.style.transform = 'translate3d(0, 0, 0)';
        this.el.style.opacity = '1';
        setTimeout(() => {
          this.el.style.transition = '';
          this.resume();
        }, 200);
      }
    });
  }

  /**
   * Enforces maxToasts threshold by dismissing oldest toasts.
   * @private
   */
  _enforceMaxToasts() {
    const positionToasts = Array.from(CGEToast.activeToasts).filter(
      (t) => t.options.position === this.options.position && t.isOpen
    );

    if (positionToasts.length >= this.options.maxToasts) {
      const excess = positionToasts.length - this.options.maxToasts + 1;
      for (let i = 0; i < excess; i++) {
        positionToasts[i]?.dismiss();
      }
    }
  }

  /**
   * Starts or resumes countdown timer.
   * @private
   */
  _startTimer() {
    this._lastTick = performance.now();

    const tick = (now) => {
      if (!this.isOpen) return;

      if (!this.isPaused) {
        const delta = now - this._lastTick;
        this.remainingTime -= delta;

        if (this._progressBarEl) {
          const pct = Math.max(0, (this.remainingTime / this.options.duration) * 100);
          this._progressBarEl.style.width = `${pct}%`;
        }

        if (this.remainingTime <= 0) {
          this.dismiss();
          return;
        }
      }

      this._lastTick = now;
      this._timer = requestAnimationFrame(tick);
    };

    this._timer = requestAnimationFrame(tick);
  }

  /**
   * Pauses the countdown timer (e.g. on mouseenter).
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resumes the countdown timer (e.g. on mouseleave).
   */
  resume() {
    this.isPaused = false;
    this._lastTick = performance.now();
  }

  /**
   * Plays entry animation.
   * @private
   */
  _animateIn() {
    const isTop = this.options.position.startsWith('top');
    const isFull = this.options.position === 'top-full' || this.options.position === 'bottom-full';

    // Initial state
    this.el.classList.add('opacity-0');
    if (!isFull) {
      this.el.classList.add(isTop ? '-translate-y-4' : 'translate-y-4', 'scale-95');
    } else {
      this.el.classList.add(isTop ? '-translate-y-full' : 'translate-y-full');
    }

    // Next frame: transition to natural state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.el.classList.remove('opacity-0', '-translate-y-4', 'translate-y-4', '-translate-y-full', 'translate-y-full', 'scale-95');
        this.el.classList.add('opacity-100', 'translate-y-0', 'scale-100');
      });
    });
  }

  /**
   * Plays exit animation and removes DOM node.
   * @returns {Promise<boolean>}
   */
  dismiss() {
    if (!this.isOpen) return Promise.resolve(false);
    this.isOpen = false;

    if (this._timer) {
      cancelAnimationFrame(this._timer);
    }

    return new Promise((resolve) => {
      const isTop = this.options.position.startsWith('top');
      const isFull = this.options.position === 'top-full' || this.options.position === 'bottom-full';

      this.el.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
      this.el.classList.add('opacity-0');

      if (!isFull) {
        this.el.classList.add(isTop ? '-translate-y-2' : 'translate-y-2', 'scale-95');
      } else {
        this.el.classList.add(isTop ? '-translate-y-full' : 'translate-y-full');
      }

      setTimeout(() => {
        if (this.el.parentNode) {
          this.el.parentNode.removeChild(this.el);
        }
        CGEToast.activeToasts.delete(this);

        if (typeof this.options.onClose === 'function') {
          this.options.onClose(this);
        }
        this._dispatch('close');
        resolve(true);
      }, 250);
    });
  }

  /**
   * Dispatches CustomEvent on document.
   * @private
   */
  _dispatch(eventName, detail = {}) {
    if (typeof document === 'undefined') return;
    const event = new CustomEvent(`cge:toast:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: {
        toast: this,
        variant: this.options.variant,
        message: this.options.message,
        position: this.options.position,
        ...detail
      }
    });
    document.dispatchEvent(event);
    return event;
  }

  // -------------------------------------------------------------------------
  // Static Helper Methods
  // -------------------------------------------------------------------------

  /**
   * Retrieves or creates the portal container for a given position.
   * @private
   */
  static _getOrCreateContainer(position = 'top-right') {
    if (CGEToast.containers.has(position)) {
      const existing = CGEToast.containers.get(position);
      if (document.body.contains(existing)) {
        return existing;
      }
    }

    const container = document.createElement('div');
    container.id = `cge-toast-portal-${position}`;
    container.setAttribute('aria-live', 'polite');

    const baseClasses = 'fixed z-[99999] pointer-events-none flex flex-col gap-2 max-w-full';

    switch (position) {
      case 'top-left':
        container.className = `${baseClasses} top-4 left-4 items-start`;
        break;
      case 'top-center':
        container.className = `${baseClasses} top-4 left-1/2 -translate-x-1/2 items-center`;
        break;
      case 'bottom-right':
        container.className = `${baseClasses} bottom-4 right-4 items-end`;
        break;
      case 'bottom-left':
        container.className = `${baseClasses} bottom-4 left-4 items-start`;
        break;
      case 'bottom-center':
        container.className = `${baseClasses} bottom-4 left-1/2 -translate-x-1/2 items-center`;
        break;
      case 'center':
        container.className = `${baseClasses} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center`;
        break;
      case 'top-full':
        container.className = `fixed z-[99999] pointer-events-none top-0 inset-x-0 w-full p-0 flex flex-col gap-0 items-stretch`;
        break;
      case 'bottom-full':
        container.className = `fixed z-[99999] pointer-events-none bottom-0 inset-x-0 w-full p-0 flex flex-col gap-0 items-stretch`;
        break;
      case 'top-right':
      default:
        container.className = `${baseClasses} top-4 right-4 items-end`;
        break;
    }

    document.body.appendChild(container);
    CGEToast.containers.set(position, container);
    return container;
  }

  /**
   * Shows a generic toast notification.
   * @param {Object} options
   * @returns {CGEToast}
   */
  static show(options = {}) {
    return new CGEToast(options);
  }

  /**
   * Shortcut for success toast.
   * @param {string} message
   * @param {Object} [options={}]
   * @returns {CGEToast}
   */
  static success(message, options = {}) {
    return new CGEToast({ message, variant: 'success', ...options });
  }

  /**
   * Shortcut for error toast.
   * @param {string} message
   * @param {Object} [options={}]
   * @returns {CGEToast}
   */
  static error(message, options = {}) {
    return new CGEToast({ message, variant: 'error', ...options });
  }

  /**
   * Shortcut for warning toast.
   * @param {string} message
   * @param {Object} [options={}]
   * @returns {CGEToast}
   */
  static warning(message, options = {}) {
    return new CGEToast({ message, variant: 'warning', ...options });
  }

  /**
   * Shortcut for info toast.
   * @param {string} message
   * @param {Object} [options={}]
   * @returns {CGEToast}
   */
  static info(message, options = {}) {
    return new CGEToast({ message, variant: 'info', ...options });
  }

  /**
   * Dismisses all active toasts or toasts in a specific position.
   * @param {string} [position]
   */
  static dismissAll(position = null) {
    CGEToast.activeToasts.forEach((toast) => {
      if (!position || toast.options.position === position) {
        toast.dismiss();
      }
    });
  }

  /**
   * Updates global configuration defaults for all future toasts.
   * @param {Object} options
   */
  static setDefaultOptions(options = {}) {
    CGEToast.defaults = { ...CGEToast.defaults, ...options };
  }

  /**
   * Updates global translation dictionary.
   * @param {Object} dict
   */
  static setTranslations(dict = {}) {
    CGEToast.translations = { ...CGEToast.translations, ...dict };
  }

  /**
   * Scans document for declarative triggers and session flash templates.
   * @param {Document | HTMLElement} [root=document]
   */
  static init(root = document) {
    // 1. Process Laravel Session Flash Toasts: <div data-cge-toast-flash data-cge-variant="success" data-cge-message="...">
    const flashElements = root.querySelectorAll('[data-cge-toast-flash]');
    flashElements.forEach((el) => {
      if (CGEToast._processedFlashes.has(el)) return;
      const message = el.getAttribute('data-cge-message') || el.innerHTML.trim();
      const variant = el.getAttribute('data-cge-variant') || 'success';
      const theme = el.getAttribute('data-cge-toast-theme') || el.getAttribute('data-cge-theme') || CGEToast.defaults.theme;
      const title = el.getAttribute('data-cge-title') || null;
      const position = el.getAttribute('data-cge-position') || 'top-right';
      const rawDuration = el.getAttribute('data-cge-duration');
      const parsedDuration = Number.parseInt(rawDuration, 10);
      const duration = rawDuration === 'false' ? false : (Number.isNaN(parsedDuration) ? 5000 : parsedDuration);

      if (message) {
        CGEToast.show({ message, variant, theme, title, position, duration });
        CGEToast._processedFlashes.add(el);
        el.style.display = 'none'; // hide placeholder
      }
    });

    // 2. Delegated click triggers: <button data-cge-toast="Order Placed!" data-cge-toast-variant="success">
    const onTriggerClick = (e) => {
      if (CGEToast._handledTriggerEvents.has(e)) return;
      const trigger = e.target.closest('[data-cge-toast]');
      if (!trigger) return;

      const message = trigger.getAttribute('data-cge-toast');
      if (!message) return;
      CGEToast._handledTriggerEvents.add(e);

      e.preventDefault();
      const variant = trigger.getAttribute('data-cge-toast-variant') || 'neutral';
      const theme = trigger.getAttribute('data-cge-toast-theme') || trigger.getAttribute('data-cge-theme') || CGEToast.defaults.theme;
      const title = trigger.getAttribute('data-cge-toast-title') || null;
      const position = trigger.getAttribute('data-cge-toast-position') || 'top-right';
      const rawDuration = trigger.getAttribute('data-cge-toast-duration');
      const parsedDuration = Number.parseInt(rawDuration, 10);
      const duration = rawDuration === 'false' ? false : (Number.isNaN(parsedDuration) ? 5000 : parsedDuration);

      CGEToast.show({ message, variant, theme, title, position, duration });
    };

    if (!root._cgeToastBound) {
      root.addEventListener('click', onTriggerClick);
      root._cgeToastBound = true;
    }
  }
}

export default CGEToast;
