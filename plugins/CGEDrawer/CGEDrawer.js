import { Lifecycle } from '../shared/lifecycle.js';
import { acquireOverlay, releaseOverlay, isTopOverlay, claimOverlayKey, claimFreeKey, trapTab } from '../shared/overlay.js';
import { prefersReducedMotion, destroyInstances, pruneInstances } from '../shared/dom.js';
/**
 * CGEDrawer - TailTools Plugin
 * High-performance, gesture-capable sliding drawer and off-canvas navigation plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
 * Features 4-direction positioning, configurable backdrop behavior, swipe-to-dismiss touch gestures, layout-push mode,
 * collapsed mini-rail mode, full keyboard/focus trapping, and seamless Laravel Blade declarative triggers.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEDrawer {
  /**
   * Registry of active CGEDrawer instances by drawer element.
   * @type {Map<HTMLElement, CGEDrawer>}
   */
  static instances = new Map();

  /**
   * Global event delegation initialized flag.
   * @private
   */
  static _delegationBound = false;

  /**
   * Document-level trigger listener (kept so destroyAll can remove it).
   * @private
   */
  static _delegationListener = null;

  /**
   * Sizing presets mapping to Tailwind CSS utility classes.
   */
  static SIZES = {
    side: {
      sm: 'w-64',
      md: 'w-80',
      lg: 'w-96',
      xl: 'w-1/2',
      full: 'w-screen'
    },
    vertical: {
      sm: 'h-48',
      md: 'h-80',
      lg: 'h-1/2',
      full: 'h-screen',
      auto: 'max-h-[90vh] h-auto'
    }
  };

  /**
   * Directional geometry and transition configuration.
   */
  static PLACEMENTS = {
    left: {
      dialogBase: 'fixed top-0 bottom-0 left-0 h-full',
      closedClass: '-translate-x-full',
      openClass: 'translate-x-0',
      animIn: 'animate-slide-in-left',
      animOut: 'animate-slide-out-left',
      bounceClass: 'cge-drawer-bounce-left',
      axis: 'x',
      dismissFactor: -1
    },
    right: {
      dialogBase: 'fixed top-0 bottom-0 right-0 h-full',
      closedClass: 'translate-x-full',
      openClass: 'translate-x-0',
      animIn: 'animate-slide-in-right',
      animOut: 'animate-slide-out-right',
      bounceClass: 'cge-drawer-bounce-right',
      axis: 'x',
      dismissFactor: 1
    },
    top: {
      dialogBase: 'fixed top-0 left-0 right-0 w-full',
      closedClass: '-translate-y-full',
      openClass: 'translate-y-0',
      animIn: 'animate-slide-in-top',
      animOut: 'animate-slide-out-top',
      bounceClass: 'cge-drawer-bounce-top',
      axis: 'y',
      dismissFactor: -1
    },
    bottom: {
      dialogBase: 'fixed bottom-0 left-0 right-0 w-full',
      closedClass: 'translate-y-full',
      openClass: 'translate-y-0',
      animIn: 'animate-slide-in-bottom',
      animOut: 'animate-slide-out-bottom',
      bounceClass: 'cge-drawer-bounce-bottom',
      axis: 'y',
      dismissFactor: 1
    }
  };

  /**
   * Default configuration options.
   */
  static defaults = {
    placement: 'left', // 'left' | 'right' | 'top' | 'bottom'
    size: 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto' | custom Tailwind class
    backdrop: true, // true | false (allows persistent non-modal sidebars)
    backdropClose: true, // true (dismiss) | false (static with bounce)
    escapeClose: true, // close on Escape key press
    animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
    swipeClose: true, // enable touch gesture swipe dismissal
    swipeThreshold: 0.3, // 30% of dimension or velocity > 0.5px/ms
    pushContentSelector: null, // CSS selector or HTMLElement to push when open
    mini: false, // collapsed dock rail mode
    miniWidth: 'w-16', // width of dock rail when closed in mini mode
    lockScroll: true, // lock body scroll when modal drawer is active
    focusTrap: true, // trap tab key navigation inside drawer
    autoFocus: true, // autofocus first focusable element
    restoreFocus: true, // return focus to trigger element
    duration: 300, // animation transition duration in ms
    translations: {
      'close-button': 'Close menu',
      'drawer-label': 'Off-canvas navigation'
    }
  };

  /**
   * Global localization dictionary.
   */
  static translations = { ...CGEDrawer.defaults.translations };

  /**
   * Sets global localization dictionary.
   * @param {Object} dict
   */
  static setTranslations(dict) {
    CGEDrawer.translations = { ...CGEDrawer.translations, ...dict };
  }

  /**
   * @param {string | HTMLElement} target - Drawer element or selector
   * @param {Object} [options={}] - Custom configuration
   */
  _eventController = new AbortController();
  _pushStyles = new Map();
  _lifecycle = new Lifecycle();
  _destroyed = false;

  constructor(target, options = {}) {
    this.drawer = CGEDrawer.resolveTarget(target);

    // A half-built instance would fail later with unrelated TypeErrors, so fail loudly here.
    if (!this.drawer) {
      throw new Error(`[CGEDrawer] Target element "${target}" not found.`);
    }

    // Return existing instance if already attached
    if (CGEDrawer.instances.has(this.drawer)) {
      return CGEDrawer.instances.get(this.drawer);
    }

    CGEDrawer._ensureBounceKeyframes();

    // Resolve options: defaults -> data attributes -> constructor options
    this.options = this._resolveOptions(options);

    this.id = this.drawer.id || `cge-drawer-${Math.random().toString(36).slice(2, 9)}`;
    if (!this.drawer.id) {
      this.drawer.id = this.id;
    }

    this.dialog = this.drawer.querySelector('[data-cge-drawer-dialog], .cge-drawer-dialog') || this.drawer.firstElementChild;
    this.backdrop = this.drawer.querySelector('[data-cge-drawer-backdrop], .cge-drawer-backdrop');

    this._isOpen = false;
    this._isAnimating = false;
    this._isMiniCollapsed = false;
    this._triggerElement = null;
    this._listeners = new Map();
    this._bounceTimeout = null;
    this._originalBodyPadding = '';
    this._originalBodyOverflow = '';
    this._pushElements = [];

    // Touch gesture state
    this._touchState = {
      tracking: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      currentDelta: 0
    };

    this.init();
    CGEDrawer.instances.set(this.drawer, this);
  }

  /**
   * Resolves options merging defaults, data-attributes, and user options.
   * @private
   */
  _resolveOptions(userOptions) {
    const dataset = this.drawer.dataset;
    const dataOptions = {};

    if ('cgePlacement' in dataset) {
      dataOptions.placement = dataset.cgePlacement;
    }
    if ('cgeSize' in dataset) {
      dataOptions.size = dataset.cgeSize;
    }
    if ('cgeBackdrop' in dataset) {
      dataOptions.backdrop = dataset.cgeBackdrop === 'static' ? 'static' : dataset.cgeBackdrop !== 'false';
    }
    if ('cgeBackdropClose' in dataset) {
      dataOptions.backdropClose = dataset.cgeBackdropClose !== 'false';
    }
    if ('cgeEscapeClose' in dataset) {
      dataOptions.escapeClose = dataset.cgeEscapeClose !== 'false';
    }
    if ('cgeAnimationDriver' in dataset) {
      dataOptions.animationDriver = dataset.cgeAnimationDriver;
    }
    if ('cgeSwipeClose' in dataset) {
      dataOptions.swipeClose = dataset.cgeSwipeClose !== 'false';
    }
    if ('cgeSwipeThreshold' in dataset) {
      dataOptions.swipeThreshold = parseFloat(dataset.cgeSwipeThreshold) || 0.3;
    }
    if ('cgePushContent' in dataset) {
      dataOptions.pushContentSelector = dataset.cgePushContent;
    }
    if ('cgeMini' in dataset) {
      dataOptions.mini = dataset.cgeMini !== 'false';
    }
    if ('cgeMiniWidth' in dataset) {
      dataOptions.miniWidth = dataset.cgeMiniWidth;
    }
    if ('cgeLockScroll' in dataset) {
      dataOptions.lockScroll = dataset.cgeLockScroll !== 'false';
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
    if ('cgeDuration' in dataset) {
      dataOptions.duration = Math.max(0, Number(dataset.cgeDuration) || 0);
    }

    const merged = {
      ...CGEDrawer.defaults,
      ...dataOptions,
      ...userOptions,
      translations: { ...CGEDrawer.translations, ...(userOptions.translations || {}) }
    };

    // Synchronize backdrop and backdropClose
    if (merged.backdrop === 'static') {
      merged.backdrop = true;
      merged.backdropClose = false;
    } else if (merged.backdrop === false) {
      merged.backdropClose = false;
    } else if (merged.backdropClose === false && merged.backdrop === true) {
      merged.backdrop = true;
    }

    return merged;
  }

  /**
   * Initializes geometry, accessibility attributes, backdrop, and event listeners.
   */
  init() {
    // 1. Accessibility attributes
    if (!this.drawer.hasAttribute('role')) {
      this.drawer.setAttribute('role', 'dialog');
    }
    if (!this.drawer.hasAttribute('aria-label') && !this.drawer.hasAttribute('aria-labelledby')) {
      this.drawer.setAttribute('aria-label', this.options.translations['drawer-label']);
    }

    if (this.options.backdrop) {
      this.drawer.setAttribute('aria-modal', 'true');
    } else {
      this.drawer.removeAttribute('aria-modal');
    }

    this.drawer.setAttribute('aria-hidden', 'true');

    // 2. Ensure Backdrop element exists if backdrop enabled
    if (this.options.backdrop && !this.backdrop) {
      const backdropEl = document.createElement('div');
      backdropEl.className = 'cge-drawer-backdrop fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto -z-10 opacity-0';
      backdropEl.setAttribute('data-cge-drawer-backdrop', '');
      this.drawer.insertBefore(backdropEl, this.drawer.firstChild);
      this.backdrop = backdropEl;
    }

    // 3. Ensure placement geometry classes on dialog
    this._applyPlacementGeometry();

    // 4. Initial layout state (open, closed, or mini collapsed)
    if (this.options.mini) {
      // In mini mode, the drawer is collapsed to dock rail initially
      this._setupMiniMode();
    } else {
      if (!this.drawer.classList.contains('hidden')) {
        this.drawer.classList.add('hidden');
      }
    }

    // 5. Bind events
    this._bindEvents();
    this._bindTouchGestures();
  }

  /**
   * Applies base position and size classes to dialog element.
   * @private
   */
  _applyPlacementGeometry() {
    if (!this.dialog) return;

    const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
    const isVertical = this.options.placement === 'top' || this.options.placement === 'bottom';

    // Base position class
    const baseClasses = placementConfig.dialogBase.split(' ');
    baseClasses.forEach((cls) => {
      if (cls && !this.dialog.classList.contains(cls)) {
        this.dialog.classList.add(cls);
      }
    });

    // Size preset
    const presetMap = isVertical ? CGEDrawer.SIZES.vertical : CGEDrawer.SIZES.side;
    const sizeClass = presetMap[this.options.size] || this.options.size;
    if (sizeClass) {
      sizeClass.split(' ').forEach((c) => {
        if (c && !this.dialog.classList.contains(c)) {
          this.dialog.classList.add(c);
        }
      });
    }

    // Smooth transform transition baseline
    this.dialog.classList.add('transition-transform', 'ease-in-out');
    this.dialog.style.transitionDuration = `${this.options.duration}ms`;

    // Apply initial closed transform
    if (!this.options.mini) {
      this.dialog.classList.add(placementConfig.closedClass);
    }
  }

  /**
   * Configures collapsed mini-rail mode.
   * @private
   */
  _setupMiniMode() {
    this._isMiniCollapsed = true;
    this.drawer.classList.remove('hidden');
    this.drawer.classList.add('cge-drawer-mini-rail', 'pointer-events-none');
    // The collapsed rail is visible, non-modal navigation: keep it in the accessibility tree.
    this.drawer.removeAttribute('aria-hidden');
    this.drawer.removeAttribute('aria-modal');
    
    if (this.backdrop) {
      this.backdrop.classList.add('hidden');
    }

    if (this.dialog) {
      this.dialog.classList.add('pointer-events-auto', 'is-mini');
      const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
      this.dialog.classList.remove(placementConfig.closedClass, placementConfig.animOut, placementConfig.animIn);
      this.dialog.classList.add(placementConfig.openClass);

      // Replace size with mini width
      const sizeClasses = (CGEDrawer.SIZES.side[this.options.size] || this.options.size).split(' ');
      sizeClasses.forEach((cls) => this.dialog.classList.remove(cls));
      this.options.miniWidth.split(' ').forEach((cls) => this.dialog.classList.add(cls));
    }
  }

  /**
   * Binds click, backdrop, and keyboard listeners.
   * @private
   */
  _bindEvents() {
    // Backdrop click handling
    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target !== this.backdrop) return;
        this._handleBackdropClick(e);
      }, { signal: this._eventController.signal });
    }

    // Drawer container click (handles outside click if backdrop is non-rendered or transparent)
    this.drawer.addEventListener('click', (e) => {
      if (e.target === this.drawer) {
        this._handleBackdropClick(e);
      }
    }, { signal: this._eventController.signal });

    // Close button delegation inside drawer
    this.drawer.addEventListener('click', (e) => {
      const closeTrigger = e.target.closest('[data-cge-drawer-close]');
      if (closeTrigger) {
        e.preventDefault();
        this.close();
      }
    }, { signal: this._eventController.signal });

    // Keydown handler (Escape & Focus Trap)
    this._handleKeyDown = (e) => {
      if (!this._isOpen) return;
      if (this._isModal()) {
        if (!claimOverlayKey(this, e)) return;
      } else if (e.key !== 'Escape' || !claimFreeKey(e)) {
        // Non-modal panels are not on the overlay stack; they only react to Escape when no modal is open.
        return;
      }

      if (e.key === 'Escape' && this.options.escapeClose) {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key === 'Tab' && this.options.focusTrap && this.options.backdrop) {
        this._handleFocusTrap(e);
      }
    };
    document.addEventListener('keydown', this._handleKeyDown, { signal: this._eventController.signal });
  }

  /**
   * Binds real-time touch swipe gesture listeners.
   * @private
   */
  _bindTouchGestures() {
    if (!this.options.swipeClose || !this.dialog) return;

    const el = this.dialog;
    const placement = this.options.placement;
    const config = CGEDrawer.PLACEMENTS[placement] || CGEDrawer.PLACEMENTS.left;
    const isX = config.axis === 'x';

    el.addEventListener('touchstart', (e) => {
      if (!this._isOpen || e.touches.length > 1) return;

      const touch = e.touches[0];
      this._touchState.tracking = true;
      this._touchState.startX = touch.clientX;
      this._touchState.startY = touch.clientY;
      this._touchState.startTime = Date.now();
      this._touchState.currentDelta = 0;

      // Temporarily disable CSS transition during active touch dragging
      el.style.transition = 'none';
    }, { passive: true, signal: this._eventController.signal });

    el.addEventListener('touchmove', (e) => {
      if (!this._touchState.tracking) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this._touchState.startX;
      const deltaY = touch.clientY - this._touchState.startY;
      const primaryDelta = isX ? deltaX : deltaY;

      // Calculate dismiss distance along valid orientation direction
      let dismissDelta = primaryDelta * config.dismissFactor;

      // Resisted drag in opening direction
      if (dismissDelta < 0) {
        dismissDelta = dismissDelta * 0.2;
      }

      this._touchState.currentDelta = dismissDelta;

      // Real-time transform
      if (isX) {
        const transX = config.dismissFactor === 1 ? Math.max(0, deltaX) : Math.min(0, deltaX);
        el.style.transform = `translateX(${transX}px)`;
      } else {
        const transY = config.dismissFactor === 1 ? Math.max(0, deltaY) : Math.min(0, deltaY);
        el.style.transform = `translateY(${transY}px)`;
      }

      // Compute progress & emit swipe hook
      const dimension = isX ? el.offsetWidth : el.offsetHeight;
      const progress = Math.min(1, Math.max(0, dismissDelta / (dimension || 1)));

      // Optional backdrop opacity damping
      if (this.backdrop) {
        this.backdrop.style.opacity = String(Math.max(0, 1 - progress * 0.75));
      }

      this._emit('swipe', {
        direction: placement,
        distance: dismissDelta,
        progress,
        event: e
      });
    }, { passive: true, signal: this._eventController.signal });

    const handleTouchEnd = () => {
      if (!this._touchState.tracking) return;
      this._touchState.tracking = false;

      // Restore transition
      el.style.transition = '';
      if (this.backdrop) {
        this.backdrop.style.opacity = '';
      }

      const elapsed = Math.max(1, Date.now() - this._touchState.startTime);
      const dismissDelta = this._touchState.currentDelta;
      const velocity = dismissDelta / elapsed; // px/ms
      const dimension = isX ? el.offsetWidth : el.offsetHeight;
      const thresholdDistance = dimension * this.options.swipeThreshold;

      // Snap shut if threshold exceeded
      if (dismissDelta > thresholdDistance || velocity > 0.45) {
        el.style.transform = '';
        this.close();
      } else {
        // Snap back open
        el.style.transform = '';
      }
    };

    el.addEventListener('touchend', handleTouchEnd, { passive: true, signal: this._eventController.signal });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true, signal: this._eventController.signal });
  }

  /**
   * Handles backdrop click behaviors (dismiss or static directional bounce).
   * @private
   */
  _handleBackdropClick(e) {
    if (!this._isModal() || !isTopOverlay(this)) return;
    this._emit('backdropClick', { drawer: this, event: e });

    if (this.options.backdropClose) {
      this.close();
    } else {
      this._triggerDirectionalBounce();
    }
  }

  /**
   * Executes tactile directional bounce along drawer edge.
   * @private
   */
  _triggerDirectionalBounce() {
    if (!this.dialog || prefersReducedMotion()) return;

    const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
    const bounceClass = placementConfig.bounceClass;

    this.dialog.classList.remove(bounceClass);
    // Force reflow
    void this.dialog.offsetWidth;
    this.dialog.classList.add(bounceClass);

    if (this._bounceTimeout) clearTimeout(this._bounceTimeout);
    this._bounceTimeout = this._lifecycle.timeout(() => {
      if (this.dialog) {
        this.dialog.classList.remove(bounceClass);
      }
    }, 450);
  }

  /**
   * Traps Tab and Shift+Tab key navigation within the drawer dialog.
   * @private
   */
  _handleFocusTrap(e) {
    // Also pulls focus back when it escaped the drawer or when there is nothing focusable.
    trapTab(this.dialog || this.drawer, e);
  }

  /**
   * Modal drawers (with a backdrop) join the shared overlay stack; non-modal panels do not.
   * @private
   */
  _isModal() {
    return Boolean(this.options.backdrop);
  }

  /**
   * Effective animation duration (0 when the user prefers reduced motion).
   * @private
   */
  _duration() {
    return prefersReducedMotion() ? 0 : this.options.duration;
  }

  /**
   * Retrieves all actionable, focusable elements within dialog.
   * @private
   */
  _getFocusableElements() {
    if (!this.dialog) return [];
    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.dialog.querySelectorAll(selector)).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  /**
   * Shifts external layout elements in push mode.
   * @private
   */
  _applyLayoutPush(open) {
    if (!this.options.pushContentSelector) return;

    if (this._pushElements.length === 0) {
      const targets = typeof this.options.pushContentSelector === 'string'
        ? Array.from(document.querySelectorAll(this.options.pushContentSelector))
        : (this.options.pushContentSelector instanceof HTMLElement ? [this.options.pushContentSelector] : []);
      this._pushElements = targets;
    }

    if (this._pushElements.length === 0) return;

    const placement = this.options.placement;
    const duration = this._duration();
    let shiftX = 0;
    let shiftY = 0;

    if (open && this.dialog) {
      const w = this.dialog.offsetWidth;
      const h = this.dialog.offsetHeight;
      if (placement === 'left') shiftX = w;
      if (placement === 'right') shiftX = -w;
      if (placement === 'top') shiftY = h;
      if (placement === 'bottom') shiftY = -h;
    }

    this._pushElements.forEach((el) => {
      if (!this._pushStyles.has(el)) this._pushStyles.set(el, { transition: el.style.transition, transform: el.style.transform });
      el.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.transform = open ? `translate3d(${shiftX}px, ${shiftY}px, 0)` : this._pushStyles.get(el).transform;
    });
  }

  /**
   * Opens the drawer.
   * @param {HTMLElement} [trigger] - Optional trigger element that activated the drawer.
   * @returns {Promise<void>}
   */
  async open(trigger = null) {
    if (this._destroyed || this._isOpen || this._isAnimating) return;

    this._isOpen = true;
    this._isAnimating = true;
    const previousTrigger = this._triggerElement;
    this._triggerElement = trigger || document.activeElement;

    const openEvent = this._emit('open', { drawer: this });
    if (this._destroyed) return;
    // `cge:drawer:open` is cancelable: preventDefault() keeps the drawer closed.
    if (openEvent.defaultPrevented) {
      this._isOpen = false;
      this._isAnimating = false;
      this._triggerElement = previousTrigger;
      return;
    }

    // Non-modal panels (backdrop: false) stay off the overlay stack so they never steal focus.
    if (this._isModal()) acquireOverlay(this, this.drawer, false);
    const duration = this._duration();
    if (this.dialog) this.dialog.style.transitionDuration = `${duration}ms`;

    // 1. Lock document body scroll
    if (this.options.lockScroll && this.options.backdrop) {
      this._lockScroll();
    }

    // 2. Prepare layout push
    this._applyLayoutPush(true);

    const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
    const driver = this._resolveAnimationDriver();

    // 3. Mini mode expansion
    if (this.options.mini && this._isMiniCollapsed) {
      this._isMiniCollapsed = false;
      this.drawer.classList.remove('cge-drawer-mini-rail', 'pointer-events-none');
      if (this.backdrop) {
        this.backdrop.classList.remove('hidden');
      }
      if (this.dialog) {
        this.dialog.classList.remove('is-mini');
        // Restore expanded size
        this.options.miniWidth.split(' ').forEach((cls) => this.dialog.classList.remove(cls));
        const fullSize = (CGEDrawer.SIZES.side[this.options.size] || this.options.size).split(' ');
        fullSize.forEach((cls) => this.dialog.classList.add(cls));
      }
    }

    // 4. Reveal drawer container
    this.drawer.classList.remove('hidden');
    this.drawer.setAttribute('aria-hidden', 'false');
    if (this._isModal()) this.drawer.setAttribute('aria-modal', 'true');

    if (!this.options.backdrop) {
      this.drawer.classList.add('pointer-events-none');
      if (this.dialog) {
        this.dialog.classList.add('pointer-events-auto');
      }
    }

    // 5. Trigger transition
    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      this._lifecycle.frame(() => {
        // Backdrop fade in
        if (this.backdrop) {
          this.backdrop.classList.remove('opacity-0');
          this.backdrop.classList.add('opacity-100');
        }

        // Dialog entry
        if (this.dialog) {
          if (driver === 'tailwind-animations') {
            this.dialog.classList.remove(placementConfig.closedClass, placementConfig.animOut);
            this.dialog.classList.add(placementConfig.openClass, placementConfig.animIn);
          } else {
            this.dialog.classList.remove(placementConfig.closedClass);
            this.dialog.classList.add(placementConfig.openClass);
          }
        }

        this._lifecycle.timeout(() => {
          this._isAnimating = false;

          // Autofocus management
          if (this.options.autoFocus) {
            this._applyAutoFocus();
          }

          this._emit('opened', { drawer: this });
          resolve();
        }, duration);
      });
    });
  }

  /**
   * Closes the drawer.
   * @returns {Promise<void>}
   */
  async close() {
    if (this._destroyed || !this._isOpen || this._isAnimating) return;

    this._isOpen = false;
    this._isAnimating = true;

    const closeEvent = this._emit('close', { drawer: this });
    if (this._destroyed) return;
    // `cge:drawer:close` is cancelable: preventDefault() keeps the drawer open.
    if (closeEvent.defaultPrevented) {
      this._isOpen = true;
      this._isAnimating = false;
      return;
    }
    const duration = this._duration();
    if (this.dialog) this.dialog.style.transitionDuration = `${duration}ms`;

    // 1. Revert layout push
    this._applyLayoutPush(false);

    const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
    const driver = this._resolveAnimationDriver();

    return new Promise((resolve) => {
      resolve = this._lifecycle.settle(resolve);
      // 2. Backdrop fade out
      if (this.backdrop) {
        this.backdrop.classList.remove('opacity-100');
        this.backdrop.classList.add('opacity-0');
      }

      // 3. Dialog exit
      if (this.dialog) {
        if (driver === 'tailwind-animations') {
          this.dialog.classList.remove(placementConfig.animIn);
          this.dialog.classList.add(placementConfig.animOut);
        } else {
          this.dialog.classList.remove(placementConfig.openClass);
          this.dialog.classList.add(placementConfig.closedClass);
        }
      }

      this._lifecycle.timeout(() => {
        // Clean up animation classes first so mini mode can re-open the rail afterwards
        if (this.dialog && driver === 'tailwind-animations') {
          this.dialog.classList.remove(placementConfig.animOut, placementConfig.openClass);
          this.dialog.classList.add(placementConfig.closedClass);
        }

        const focusWasInside = this.drawer.contains(document.activeElement);

        // Mini mode re-collapse vs Complete hide
        if (this.options.mini) {
          this._setupMiniMode();
        } else {
          this.drawer.classList.add('hidden');
          this.drawer.setAttribute('aria-hidden', 'true');
        }

        // Unlock body scroll
        if (this.options.lockScroll && this.options.backdrop) {
          this._unlockScroll();
        }

        // Restore focus to original trigger element
        if (this._isModal()) {
          releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null);
        } else if (this.options.restoreFocus && focusWasInside && this._triggerElement?.isConnected
          && typeof this._triggerElement.focus === 'function') {
          this._triggerElement.focus();
        }

        this._isAnimating = false;
        this._emit('closed', { drawer: this });
        resolve();
      }, duration);
    });
  }

  /**
   * Toggles the drawer between open and closed states.
   * @param {HTMLElement} [trigger]
   * @returns {Promise<void>}
   */
  async toggle(trigger = null) {
    if (this._isOpen) {
      return this.close();
    } else {
      return this.open(trigger);
    }
  }

  /**
   * Checks whether the drawer is currently open.
   * @returns {boolean}
   */
  isOpen() {
    return this._isOpen;
  }

  /**
   * Resolves whether to use tailwind-animations or fallback CSS transforms.
   * @private
   */
  _resolveAnimationDriver() {
    if (prefersReducedMotion()) return 'none';
    if (this.options.animationDriver === 'css') return 'css';
    if (this.options.animationDriver === 'tailwind-animations') return 'tailwind-animations';
    if (this.options.animationDriver === 'none') return 'none';

    // Auto detection
    if (typeof document !== 'undefined') {
      const placementConfig = CGEDrawer.PLACEMENTS[this.options.placement] || CGEDrawer.PLACEMENTS.left;
      const testEl = document.createElement('div');
      testEl.className = placementConfig.animIn;
      document.body.appendChild(testEl);
      const computedAnim = window.getComputedStyle(testEl).animationName;
      document.body.removeChild(testEl);
      if (computedAnim && computedAnim !== 'none') {
        return 'tailwind-animations';
      }
    }
    return 'css';
  }

  /**
   * Applies focus to the first actionable element or autofocus target.
   * @private
   */
  _applyAutoFocus() {
    if (!this.dialog) return;

    if (typeof this.options.autoFocus === 'string') {
      const customTarget = this.dialog.querySelector(this.options.autoFocus);
      if (customTarget && typeof customTarget.focus === 'function') {
        customTarget.focus();
        return;
      }
    }

    const explicitAutofocus = this.dialog.querySelector('[autofocus]');
    if (explicitAutofocus && typeof explicitAutofocus.focus === 'function') {
      explicitAutofocus.focus();
      return;
    }

    const focusable = this._getFocusableElements();
    if (focusable.length > 0 && typeof focusable[0].focus === 'function') {
      focusable[0].focus();
    }
  }

  /**
   * Locks body scroll with scrollbar-gutter jump compensation.
   * @private
   */
  _lockScroll() { acquireOverlay(this, this.drawer, true); }

  _unlockScroll() { releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null); }

  /**
   * Emits both instance callback and native DOM CustomEvents.
   * @private
   */
  _emit(eventName, detail = {}) {
    // 1. Instance listener callbacks
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach((cb) => {
        try {
          cb(detail);
        } catch (err) {
          console.error(`[CGEDrawer] Error in event listener "${eventName}":`, err);
        }
      });
    }

    // 2. Native DOM CustomEvents
    const domEventName = `cge:drawer:${eventName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    const customEvent = new CustomEvent(domEventName, {
      bubbles: true,
      cancelable: true,
      detail: { drawer: this, ...detail }
    });

    this.drawer.dispatchEvent(customEvent);
    if (!this.drawer.isConnected) {
      document.dispatchEvent(customEvent);
    }
    return customEvent;
  }

  /**
   * Registers an event callback.
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    this._listeners.get(eventName).push(callback);
    return this;
  }

  /**
   * Unregisters an event callback.
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    if (!this._listeners.has(eventName)) return this;
    const cbs = this._listeners.get(eventName).filter((cb) => cb !== callback);
    this._listeners.set(eventName, cbs);
    return this;
  }

  /**
   * Destroys instance, removes listeners, and cleans up DOM attributes.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._eventController.abort();
    this._lifecycle.cancel();
    releaseOverlay(this, this.options.restoreFocus ? this._triggerElement : null);
    this._isOpen = false;
    this._isAnimating = false;
    this._touchState.tracking = false;
    this._pushStyles.forEach((style, element) => Object.assign(element.style, style));
    this._pushStyles.clear();
    if (this.dialog) { this.dialog.style.transform = ''; this.dialog.style.transition = ''; }
    if (this.backdrop) this.backdrop.style.opacity = '';
    this.drawer.classList.add('hidden');
    this.drawer.setAttribute('aria-hidden', 'true');
    this._listeners.clear();
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }

    CGEDrawer.instances.delete(this.drawer);
  }

  // =========================================================================
  // Static Registry & Controller Methods
  // =========================================================================

  /**
   * Retrieves an instance by selector or DOM element.
   * @param {string | HTMLElement} target
   * @returns {CGEDrawer | null}
   */
  static get(target) {
    const el = CGEDrawer.resolveTarget(target);
    return (el && CGEDrawer.instances.get(el)) || null;
  }

  /**
   * Resolves an element, a CSS selector (`#id`, `.class`, `[data-x]`) or a bare element ID
   * (`"main-nav"` → `#main-nav`).
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
   * Opens a drawer by selector or element.
   * @param {string | HTMLElement} target
   * @param {Object} [options={}]
   * @returns {Promise<void>}
   */
  static open(target, options = {}) {
    const drawer = CGEDrawer.get(target) || new CGEDrawer(target, options);
    return drawer ? drawer.open() : Promise.resolve();
  }

  /**
   * Closes a drawer by selector or element.
   * @param {string | HTMLElement} target
   * @returns {Promise<void>}
   */
  static close(target) {
    const drawer = CGEDrawer.get(target);
    return drawer ? drawer.close() : Promise.resolve();
  }

  /**
   * Toggles a drawer by selector or element.
   * @param {string | HTMLElement} target
   * @param {Object} [options={}]
   * @returns {Promise<void>}
   */
  static toggle(target, options = {}, trigger = null) {
    const drawer = CGEDrawer.get(target) || new CGEDrawer(target, options);
    return drawer ? drawer.toggle(trigger) : Promise.resolve();
  }

  /**
   * Binds declarative triggers for Laravel Blade and HTML elements.
   * @param {Document | HTMLElement} [root=document]
   */
  static init(root = document) {
    // 0. Drop instances whose elements were removed (Livewire morph, Turbo) so they can be rebuilt.
    pruneInstances(CGEDrawer.instances);

    // 1. Global event delegation for open / toggle triggers
    if (!CGEDrawer._delegationBound && typeof document !== 'undefined') {
      const resolveTrigger = (button, attribute) => {
        const target = button.getAttribute(attribute);
        if (!target) return null;
        const el = CGEDrawer.resolveTarget(target);
        if (!el) console.warn(`[CGEDrawer] Target element "${target}" not found.`);
        return el;
      };
      CGEDrawer._delegationListener = (e) => {
        if (!(e.target instanceof Element)) return;
        // Toggle trigger
        const toggleBtn = e.target.closest('[data-cge-drawer-toggle]');
        if (toggleBtn) {
          e.preventDefault();
          const el = resolveTrigger(toggleBtn, 'data-cge-drawer-toggle');
          if (el) CGEDrawer.toggle(el, {}, toggleBtn);
          return;
        }

        // Open trigger
        const openBtn = e.target.closest('[data-cge-drawer-target]');
        if (openBtn) {
          e.preventDefault();
          const el = resolveTrigger(openBtn, 'data-cge-drawer-target');
          if (el) (CGEDrawer.get(el) || new CGEDrawer(el)).open(openBtn);
        }
      };
      document.addEventListener('click', CGEDrawer._delegationListener);

      CGEDrawer._delegationBound = true;
    }

    // 2. Discover and instantiate declarative drawers in root
    const drawers = root.querySelectorAll('.cge-drawer, [data-cge-drawer]');
    drawers.forEach((el) => {
      if (!CGEDrawer.instances.has(el)) {
        new CGEDrawer(el);
      }
    });
  }

  /**
   * Destroys drawer instances inside `root` (or already detached). Passing `document`
   * also removes the document-level trigger delegation.
   * @param {Document | HTMLElement} [root=document]
   * @returns {CGEDrawer[]} destroyed instances
   */
  static destroyAll(root = document) {
    const destroyed = destroyInstances(CGEDrawer.instances, root);
    if (root === document && CGEDrawer._delegationListener) {
      document.removeEventListener('click', CGEDrawer._delegationListener);
      CGEDrawer._delegationListener = null;
      CGEDrawer._delegationBound = false;
    }
    return destroyed;
  }

  /**
   * Injects keyframes for tactile directional bounce on static backdrop click.
   * @private
   */
  static _ensureBounceKeyframes() {
    if (typeof document === 'undefined') return;
    const styleId = 'cge-drawer-bounce-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes cge-drawer-bounce-left {
        0%, 100% { transform: translateX(0); }
        40% { transform: translateX(14px); }
        75% { transform: translateX(-4px); }
      }
      @keyframes cge-drawer-bounce-right {
        0%, 100% { transform: translateX(0); }
        40% { transform: translateX(-14px); }
        75% { transform: translateX(4px); }
      }
      @keyframes cge-drawer-bounce-top {
        0%, 100% { transform: translateY(0); }
        40% { transform: translateY(14px); }
        75% { transform: translateY(-4px); }
      }
      @keyframes cge-drawer-bounce-bottom {
        0%, 100% { transform: translateY(0); }
        40% { transform: translateY(-14px); }
        75% { transform: translateY(4px); }
      }
      .cge-drawer-bounce-left { animation: cge-drawer-bounce-left 0.4s cubic-bezier(0.25, 1, 0.5, 1) both !important; }
      .cge-drawer-bounce-right { animation: cge-drawer-bounce-right 0.4s cubic-bezier(0.25, 1, 0.5, 1) both !important; }
      .cge-drawer-bounce-top { animation: cge-drawer-bounce-top 0.4s cubic-bezier(0.25, 1, 0.5, 1) both !important; }
      .cge-drawer-bounce-bottom { animation: cge-drawer-bounce-bottom 0.4s cubic-bezier(0.25, 1, 0.5, 1) both !important; }
    `;
    document.head.appendChild(style);
  }
}
