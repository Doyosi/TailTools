import { Lifecycle } from '../shared/lifecycle.js';
import { acquireOverlay, releaseOverlay, isTopOverlay, claimOverlayKey, trapTab } from '../shared/overlay.js';
import { prefersReducedMotion, destroyInstances, pruneInstances } from '../shared/dom.js';
/**
 * CGEModal - TailTools Plugin
 * High-performance, accessible native JavaScript modal plugin for Tailwind CSS v4.3+ and Laravel Blade.
 * Supports dual-mode animations (tailwind-animations & standard Tailwind CSS), static backdrop shake,
 * sizing presets, keyboard navigation, and focus trapping. Zero runtime dependencies.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEModal {
  /**
   * Registry of active CGEModal instances by modal element or selector ID.
   * @type {Map<HTMLElement, CGEModal>}
   */
  static instances = new Map();

  /**
   * Sizing presets mapping to Tailwind CSS utility classes.
   */
  static SIZES = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full h-[calc(100dvh-2rem)] m-4'
  };

  /**
   * Default configuration options.
   */
  static defaults = {
    backdrop: true, // true, false, or 'static'
    backdropClose: true, // alias for backdrop dismissal
    escapeClose: true, // close on Escape key press
    size: 'lg', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'
    animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
    animation: 'zoom', // 'zoom' | 'fade' | 'slide-up' | 'slide-down'
    focusTrap: true, // trap tab key navigation inside modal
    autoFocus: true, // focus first focusable element or selector
    restoreFocus: true, // restore focus to prior trigger on close
    lockScroll: true, // prevent background document scroll while open
    duration: 250 // animation transition duration in ms
  };

  /**
   * @param {string | HTMLElement} target - Modal element or selector
   * @param {Object} [options={}] - Custom configuration
   */
  _lifecycle = new Lifecycle();
  _destroyed = false;

  constructor(target, options = {}) {
    this.modal = CGEModal.resolveTarget(target);

    // A half-built instance would fail later with unrelated TypeErrors, so fail loudly here.
    if (!this.modal) {
      throw new Error(`[CGEModal] Target element "${target}" not found.`);
    }

    // Return existing instance if already attached
    if (CGEModal.instances.has(this.modal)) {
      return CGEModal.instances.get(this.modal);
    }

    CGEModal._ensureShakeKeyframes();

    // Merge options: defaults -> data attributes -> constructor options
    this.options = this._resolveOptions(options);

    this.dialog = this.modal.querySelector('[data-cge-modal-dialog], .cge-modal-dialog') || this.modal.firstElementChild;
    this.backdrop = this.modal.querySelector('[data-cge-modal-backdrop], .cge-modal-backdrop');

    this._isOpen = false;
    this._isAnimating = false;
    this._triggerElement = null;
    this._listeners = [];
    this._shakeTimeout = null;
    this._originalBodyPadding = '';

    this.init();
    CGEModal.instances.set(this.modal, this);
  }

  /**
   * Resolves options merging defaults, data-attributes, and user options.
   * @private
   */
  _resolveOptions(userOptions) {
    const dataset = this.modal.dataset;
    const dataOptions = {};

    if ('cgeBackdrop' in dataset) {
      dataOptions.backdrop = dataset.cgeBackdrop === 'static' ? 'static' : dataset.cgeBackdrop !== 'false';
    }
    if ('cgeBackdropClose' in dataset) {
      dataOptions.backdropClose = dataset.cgeBackdropClose !== 'false';
    }
    if ('cgeEscapeClose' in dataset) {
      dataOptions.escapeClose = dataset.cgeEscapeClose !== 'false';
    }
    if ('cgeSize' in dataset) {
      dataOptions.size = dataset.cgeSize;
    }
    if ('cgeAnimationDriver' in dataset) {
      dataOptions.animationDriver = dataset.cgeAnimationDriver;
    }
    if ('cgeAnimation' in dataset) {
      dataOptions.animation = dataset.cgeAnimation;
    }
    if ('cgeFocusTrap' in dataset) {
      dataOptions.focusTrap = dataset.cgeFocusTrap !== 'false';
    }
    if ('cgeAutofocus' in dataset) {
      dataOptions.autoFocus = dataset.cgeAutofocus === 'false' ? false : (dataset.cgeAutofocus === 'true' ? true : dataset.cgeAutofocus);
    }
    if ('cgeRestoreFocus' in dataset) {
      dataOptions.restoreFocus = dataset.cgeRestoreFocus !== 'false';
    }
    if ('cgeLockScroll' in dataset) {
      dataOptions.lockScroll = dataset.cgeLockScroll !== 'false';
    }
    if ('cgeDuration' in dataset) {
      dataOptions.duration = parseInt(dataset.cgeDuration, 10) || 250;
    }

    const merged = { ...CGEModal.defaults, ...dataOptions, ...userOptions };

    // Synchronize backdrop and backdropClose aliases
    if (merged.backdrop === 'static') {
      merged.backdropClose = false;
    } else if (merged.backdrop === false) {
      merged.backdropClose = false;
    } else if (merged.backdropClose === false && merged.backdrop === true) {
      merged.backdrop = 'static';
    }

    return merged;
  }

  /**
   * Initializes accessibility attributes, size classes, and listeners.
   */
  init() {
    // Accessibility attributes
    if (!this.modal.hasAttribute('role')) {
      this.modal.setAttribute('role', 'dialog');
    }
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-hidden', 'true');

    // Dialog card reference setup
    if (this.dialog) {
      this.dialog.setAttribute('tabindex', '-1');
      this.dialog.classList.add('outline-none');
      this._applySize(this.options.size);
    }

    this._bindEvents();
    this._dispatch('init');
  }

  /**
   * Attaches DOM event listeners.
   * @private
   */
  _bindEvents() {
    // Backdrop click handling
    const onModalClick = (e) => {
      if (!isTopOverlay(this)) return;
      // If click target is inside dialog, ignore
      if (this.dialog && (this.dialog === e.target || this.dialog.contains(e.target))) {
        return;
      }

      // Any click inside this.modal that is outside this.dialog is a backdrop click
      if (this.options.backdrop === 'static' || !this.options.backdropClose) {
        this.shake();
      } else {
        this.close();
      }
    };

    // Close button triggers inside modal
    const onCloseClick = (e) => {
      const closeBtn = e.target.closest('[data-cge-modal-close]');
      if (closeBtn && this.modal.contains(closeBtn)) {
        e.preventDefault();
        this.close();
      }
    };

    // Keyboard handlers (Escape & Focus Trap)
    const onKeyDown = (e) => {
      if (!this._isOpen || !claimOverlayKey(this, e)) return;

      if (e.key === 'Escape') {
        if (this.options.escapeClose) {
          e.preventDefault();
          this.close();
        } else if (this.options.backdrop === 'static' || !this.options.backdropClose) {
          e.preventDefault();
          this.shake();
        }
        return;
      }

      if (e.key === 'Tab' && this.options.focusTrap) {
        this._handleFocusTrap(e);
      }
    };

    this.modal.addEventListener('click', onModalClick);
    this.modal.addEventListener('click', onCloseClick);
    document.addEventListener('keydown', onKeyDown);

    this._listeners.push(
      { target: this.modal, event: 'click', handler: onModalClick },
      { target: this.modal, event: 'click', handler: onCloseClick },
      { target: document, event: 'keydown', handler: onKeyDown }
    );
  }

  /**
   * Focus trap management keeping Tab inside the active dialog, including focus that
   * escaped the dialog (e.g. clicked backdrop or page content) and dialogs without focusables.
   * @private
   */
  _handleFocusTrap(e) {
    trapTab(this.dialog || this.modal, e);
  }

  /**
   * Finds all visible, focusable elements inside the dialog.
   * @private
   */
  _getFocusableElements() {
    if (!this.dialog) return [];
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
    return Array.from(this.dialog.querySelectorAll(selector)).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  /**
   * Applies size class to the dialog container.
   * @private
   */
  _applySize(size) {
    if (!this.dialog) return;

    // Remove existing preset size classes
    Object.values(CGEModal.SIZES).forEach((cls) => {
      cls.split(' ').forEach((c) => this.dialog.classList.remove(c));
    });

    if (CGEModal.SIZES[size]) {
      CGEModal.SIZES[size].split(' ').forEach((c) => this.dialog.classList.add(c));
    } else if (size) {
      // Custom class string provided
      size.split(' ').forEach((c) => this.dialog.classList.add(c));
    }
  }

  /**
   * Updates dialog size dynamically.
   * @param {string} newSize - Size key ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' or class)
   */
  setSize(newSize) {
    this.options.size = newSize;
    this._applySize(newSize);
    return this;
  }

  /**
   * Determines active animation mode.
   * @private
   */
  _resolveDriver() {
    // Users who prefer reduced motion get instant state changes.
    if (prefersReducedMotion()) return 'none';
    if (this.options.animationDriver === 'tailwind-animations') return 'tailwind-animations';
    if (this.options.animationDriver === 'css') return 'css';
    if (this.options.animationDriver === 'none') return 'none';

    // Auto detection: check if tailwind-animations utility class animate-fade-in or animate-zoom-in is active
    if (typeof window !== 'undefined') {
      const testEl = document.createElement('div');
      testEl.className = 'animate-fade-in';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const hasAnimation = computed.animationName && computed.animationName !== 'none';
      document.body.removeChild(testEl);
      if (hasAnimation) {
        return 'tailwind-animations';
      }
    }

    return 'css';
  }

  /**
   * Opens the modal dialog.
   * @param {HTMLElement} [triggerElement] - The button or element that triggered the open action
   * @returns {Promise<boolean>}
   */
  async open(triggerElement = null) {
    if (this._destroyed || this._isOpen || this._isAnimating) return false;

    // Capture trigger element for focus restoration
    this._triggerElement = triggerElement || (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    // Dispatch cancelable 'cge:modal:open' event
    const openEvent = this._dispatch('open', { trigger: this._triggerElement });
    if (openEvent.defaultPrevented || this._destroyed) return false;

    this._isAnimating = true;
    this._isOpen = true;

    acquireOverlay(this, this.modal, false);

    // Scroll lock handling
    if (this.options.lockScroll) {
      this._lockScroll();
    }

    // Reveal modal container in layout
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.modal.setAttribute('aria-hidden', 'false');

    const driver = this._resolveDriver();

    if (driver === 'tailwind-animations') {
      await this._animateOpenTailwindAnimations();
    } else if (driver === 'css') {
      await this._animateOpenCSS();
    }

    if (this._destroyed) return false;
    this._isAnimating = false;

    // Set initial focus
    this._applyInitialFocus();

    this._dispatch('opened', { trigger: this._triggerElement });
    return true;
  }

  /**
   * Closes the modal dialog.
   * @returns {Promise<boolean>}
   */
  async close() {
    if (this._destroyed || !this._isOpen || this._isAnimating) return false;

    // Dispatch cancelable 'cge:modal:close' event
    const closeEvent = this._dispatch('close');
    if (closeEvent.defaultPrevented || this._destroyed) return false;

    this._isAnimating = true;

    const driver = this._resolveDriver();

    if (driver === 'tailwind-animations') {
      await this._animateCloseTailwindAnimations();
    } else if (driver === 'css') {
      await this._animateCloseCSS();
    }

    if (this._destroyed) return false;

    // Hide container
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.modal.setAttribute('aria-hidden', 'true');

    // Unlock background scrolling
    if (this.options.lockScroll) {
      this._unlockScroll();
    }

    this._isOpen = false;
    this._isAnimating = false;

    // Restore focus to trigger
    releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null);

    this._dispatch('closed');
    return true;
  }

  /**
   * Toggles the modal between open and closed states.
   * @param {HTMLElement} [triggerElement]
   * @returns {Promise<boolean>}
   */
  toggle(triggerElement = null) {
    return this._isOpen ? this.close() : this.open(triggerElement);
  }

  /**
   * Triggers a tactile shake animation on the dialog (used for static backdrop clicks or restricted actions).
   */
  shake() {
    if (!this.dialog) return;
    if (prefersReducedMotion()) {
      this._dispatch('shake');
      return;
    }

    CGEModal._ensureShakeKeyframes();

    if (this._shakeTimeout) {
      clearTimeout(this._shakeTimeout);
      this.dialog.classList.remove('animate-shake', 'cge-modal-shake');
      this.dialog.style.animation = '';
    }

    // Remove any classes that could conflict or override keyframe animations
    this.dialog.classList.remove(
      'animate-zoom-in',
      'animate-fade-in',
      'animate-slide-in-bottom',
      'animate-slide-in-top',
      'transition-all',
      'animate-shake',
      'cge-modal-shake'
    );

    // Force browser layout reflow to restart animation from beginning
    void this.dialog.offsetWidth;

    // Apply shake classes
    this.dialog.classList.add('cge-modal-shake', 'animate-shake');

    // Also set inline style animation as an unconditional guarantee
    this.dialog.style.animation = 'cge-modal-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';

    this._dispatch('shake');

    this._shakeTimeout = this._lifecycle.timeout(() => {
      if (this.dialog) {
        this.dialog.classList.remove('animate-shake', 'cge-modal-shake');
        this.dialog.style.animation = '';
      }
      this._shakeTimeout = null;
    }, 450);
  }

  /**
   * Animation: Open with tailwind-animations classes.
   * @private
   */
  _animateOpenTailwindAnimations() {
    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      // Backdrop
      if (this.backdrop) {
        this.backdrop.classList.remove('animate-fade-out');
        this.backdrop.classList.add('animate-fade-in');
      }

      // Dialog
      if (this.dialog) {
        const anim = this.options.animation;
        let animClass = 'animate-zoom-in';

        if (anim === 'fade') animClass = 'animate-fade-in';
        else if (anim === 'slide-up') animClass = 'animate-slide-in-bottom';
        else if (anim === 'slide-down') animClass = 'animate-slide-in-top';
        else if (anim && anim !== 'zoom') animClass = anim;

        this.dialog.classList.remove('animate-zoom-out', 'animate-fade-out', 'animate-slide-out-bottom', 'animate-slide-out-top');
        this.dialog.classList.add(animClass);
      }

      this._lifecycle.timeout(() => {
        // Clean up entry animation classes so they do not block subsequent animations (like shake)
        if (this.dialog) {
          this.dialog.classList.remove(
            'animate-zoom-in',
            'animate-fade-in',
            'animate-slide-in-bottom',
            'animate-slide-in-top'
          );
        }
        resolve();
      }, this.options.duration);
    });
  }

  /**
   * Animation: Close with tailwind-animations classes.
   * @private
   */
  _animateCloseTailwindAnimations() {
    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      // Backdrop
      if (this.backdrop) {
        this.backdrop.classList.remove('animate-fade-in');
        this.backdrop.classList.add('animate-fade-out');
      }

      // Dialog
      if (this.dialog) {
        const anim = this.options.animation;
        let exitClass = 'animate-zoom-out';

        if (anim === 'fade') exitClass = 'animate-fade-out';
        else if (anim === 'slide-up') exitClass = 'animate-slide-out-bottom';
        else if (anim === 'slide-down') exitClass = 'animate-slide-out-top';

        this.dialog.classList.remove('animate-zoom-in', 'animate-fade-in', 'animate-slide-in-bottom', 'animate-slide-in-top');
        this.dialog.classList.add(exitClass);
      }

      this._lifecycle.timeout(() => {
        // Clean up classes after animation
        if (this.backdrop) this.backdrop.classList.remove('animate-fade-out');
        if (this.dialog) this.dialog.classList.remove('animate-zoom-out', 'animate-fade-out', 'animate-slide-out-bottom', 'animate-slide-out-top');
        resolve();
      }, this.options.duration);
    });
  }

  /**
   * Animation: Open with standard Tailwind CSS transitions.
   * @private
   */
  _animateOpenCSS() {
    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      // Initial state
      if (this.backdrop) {
        this.backdrop.classList.add('transition-opacity', 'duration-200', 'opacity-0');
        this.backdrop.classList.remove('opacity-100');
      }

      if (this.dialog) {
        this.dialog.classList.add('transition-all', 'duration-200', 'ease-out', 'opacity-0', 'scale-95');
        this.dialog.classList.remove('opacity-100', 'scale-100');
      }

      // Trigger transition on next animation frame
      this._lifecycle.frame(() => {
        this._lifecycle.frame(() => {
          if (this.backdrop) {
            this.backdrop.classList.remove('opacity-0');
            this.backdrop.classList.add('opacity-100');
          }
          if (this.dialog) {
            this.dialog.classList.remove('opacity-0', 'scale-95');
            this.dialog.classList.add('opacity-100', 'scale-100');
          }
          this._lifecycle.timeout(() => {
            if (this.dialog) {
              this.dialog.classList.remove('transition-all', 'duration-200', 'ease-out');
            }
            resolve();
          }, this.options.duration);
        });
      });
    });
  }

  /**
   * Animation: Close with standard Tailwind CSS transitions.
   * @private
   */
  _animateCloseCSS() {
    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      if (this.backdrop) {
        this.backdrop.classList.add('transition-opacity', 'duration-200');
        this.backdrop.classList.remove('opacity-100');
        this.backdrop.classList.add('opacity-0');
      }

      if (this.dialog) {
        this.dialog.classList.add('transition-all', 'duration-200', 'ease-in');
        this.dialog.classList.remove('opacity-100', 'scale-100');
        this.dialog.classList.add('opacity-0', 'scale-95');
      }

      this._lifecycle.timeout(resolve, this.options.duration);
    });
  }

  /**
   * Locks scroll on body and prevents layout shift from scrollbar disappearing.
   * @private
   */
  _lockScroll() { acquireOverlay(this, this.modal, true); }

  _unlockScroll() { releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null); }

  /**
   * Places focus onto designated autofocus element or first focusable element.
   * @private
   */
  _applyInitialFocus() {
    if (!this.options.autoFocus) return;

    if (typeof this.options.autoFocus === 'string') {
      const customFocus = this.dialog?.querySelector(this.options.autoFocus);
      if (customFocus && typeof customFocus.focus === 'function') {
        customFocus.focus();
        return;
      }
    }

    const explicitAutofocus = this.dialog?.querySelector('[data-cge-modal-autofocus], [autofocus]');
    if (explicitAutofocus && typeof explicitAutofocus.focus === 'function') {
      explicitAutofocus.focus();
      return;
    }

    const focusables = this._getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else if (this.dialog && typeof this.dialog.focus === 'function') {
      this.dialog.focus();
    }
  }

  /**
   * Dispatches custom event with standard detail payload.
   * @private
   */
  _dispatch(eventName, detail = {}) {
    const event = new CustomEvent(`cge:modal:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: {
        instance: this,
        modal: this.modal,
        dialog: this.dialog,
        ...detail
      }
    });
    this.modal.dispatchEvent(event);
    return event;
  }

  /**
   * Getter indicating whether modal is currently visible.
   * @type {boolean}
   */
  get isOpen() {
    return this._isOpen;
  }

  /**
   * Cleans up all listeners, resets DOM attributes and unlocks scroll.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._lifecycle.cancel();
    releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null);
    this._isOpen = false;
    this._isAnimating = false;
    if (this._shakeTimeout) {
      clearTimeout(this._shakeTimeout);
    }

    this._listeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this._listeners = [];

    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.modal.removeAttribute('aria-modal');
    this.modal.removeAttribute('aria-hidden');

    CGEModal.instances.delete(this.modal);
    this._dispatch('destroy');
  }

  // -------------------------------------------------------------------------
  // Static Helper Methods
  // -------------------------------------------------------------------------

  /**
   * Returns existing CGEModal instance for a target element.
   * @param {string | HTMLElement} target
   * @returns {CGEModal | undefined}
   */
  static getInstance(target) {
    const el = CGEModal.resolveTarget(target);
    return el ? CGEModal.instances.get(el) : undefined;
  }

  /**
   * Resolves an element, a CSS selector (`#id`, `.class`, `[data-x]`) or a bare element ID.
   * @param {string | HTMLElement | null} target
   * @returns {HTMLElement | null}
   */
  static resolveTarget(target) {
    if (!target) return null;
    if (typeof target !== 'string') return target instanceof Element ? target : null;
    const value = target.trim();
    if (/^[A-Za-z][\w-]*$/.test(value)) {
      const byId = document.getElementById(value);
      if (byId) return byId;
    }
    try { return document.querySelector(value); } catch { return null; }
  }

  /**
   * Returns existing instance or creates a new CGEModal instance.
   * @param {string | HTMLElement} target
   * @param {Object} [options={}]
   * @returns {CGEModal}
   */
  static getOrCreateInstance(target, options = {}) {
    return CGEModal.getInstance(target) || new CGEModal(target, options);
  }

  /**
   * Closes all currently opened CGEModal instances.
   */
  static closeAll() {
    CGEModal.instances.forEach((instance) => {
      if (instance.isOpen) {
        instance.close();
      }
    });
  }

  /**
   * Scans document for declarative triggers and modals and attaches click behaviors.
   * @param {Document | HTMLElement} [root=document]
   */
  static _handledClicks = new WeakSet();

  /**
   * Delegated trigger listeners by root.
   * @type {Map<Document | HTMLElement, (e: MouseEvent) => void>}
   */
  static _delegations = new Map();

  static init(root = document) {
    // 0. Drop instances whose elements were removed (Livewire morph, Turbo) so they can be rebuilt.
    pruneInstances(CGEModal.instances);

    // 1. Initialize all modals found with .cge-modal or [data-cge-modal]
    const modalElements = root.querySelectorAll('.cge-modal, [data-cge-modal]');
    modalElements.forEach((el) => {
      CGEModal.getOrCreateInstance(el);
    });

    // 2. Global delegated click handler for triggers:
    // data-cge-modal-target="#modalId" or data-cge-target="#modalId"
    const onTriggerClick = (e) => {
      const trigger = e.target.closest('[data-cge-modal-target], [data-cge-target]');
      if (!trigger || CGEModal._handledClicks.has(e)) return;

      const targetSelector = trigger.getAttribute('data-cge-modal-target') || trigger.getAttribute('data-cge-target');
      if (!targetSelector) return;

      const modalEl = CGEModal.resolveTarget(targetSelector);
      if (modalEl && modalEl.matches('.cge-modal, [data-cge-modal]')) {
        CGEModal._handledClicks.add(e);
        e.preventDefault();
        const instance = CGEModal.getOrCreateInstance(modalEl);
        instance.toggle(trigger);
      }
    };

    // Attach to root if not already attached
    if (!CGEModal._delegations.has(root)) {
      root.addEventListener('click', onTriggerClick);
      CGEModal._delegations.set(root, onTriggerClick);
      root._cgeModalGlobalBound = true;
    }
  }

  /**
   * Destroys modal instances inside `root` (or already detached) and removes trigger
   * delegation bound to `root` or to roots inside it. Use before Livewire/Turbo swaps.
   * @param {Document | HTMLElement} [root=document]
   * @returns {CGEModal[]} destroyed instances
   */
  static destroyAll(root = document) {
    const destroyed = destroyInstances(CGEModal.instances, root);
    for (const [bound, listener] of Array.from(CGEModal._delegations.entries())) {
      const inside = root === document || bound === root || (bound !== document && (root.contains(bound) || !bound.isConnected));
      if (!inside) continue;
      bound.removeEventListener('click', listener);
      CGEModal._delegations.delete(bound);
      delete bound._cgeModalGlobalBound;
    }
    return destroyed;
  }

  /**
   * Ensures shake animation keyframes are registered in document
   * @private
   */
  static _ensureShakeKeyframes() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cge-modal-keyframes')) return;

    const style = document.createElement('style');
    style.id = 'cge-modal-keyframes';
    style.textContent = `
      @keyframes cge-modal-shake {
        0%, 100% { transform: translate3d(0, 0, 0); }
        15%, 45%, 75% { transform: translate3d(-14px, 0, 0); }
        30%, 60%, 90% { transform: translate3d(14px, 0, 0); }
      }
      .cge-modal-shake {
        animation: cge-modal-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
        transition: none !important;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }
}

export default CGEModal;
