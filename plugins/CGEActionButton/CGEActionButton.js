import { Lifecycle } from '../shared/lifecycle.js';
import { laravelHeaders, resolveAxios, HttpError, parseBody, errorMessage, wasRedirected } from '../shared/http.js';
import { destroyInstances, pruneInstances } from '../shared/dom.js';
import { submitConfirmedForm } from '../shared/form.js';
/**
 * CGEActionButton - TailTools Plugin
 * High-performance, declarative action button and confirmation interceptor plugin
 * designed specifically for Laravel Blade and Tailwind CSS v4.3+.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEActionButton {
  /**
   * Static registry mapping DOM elements to CGEActionButton instances.
   * @type {WeakMap<HTMLElement, CGEActionButton>}
   */
  static instances = new WeakMap();

  /**
   * Flag indicating whether global event delegation has been bound.
   * @private
   */
  static _delegationBound = false;

  /** Selector used by the delegated capture-phase click listener. @private */
  static _selector = '[data-cge-action], [data-cge-confirm]';

  /** Elements whose next click is a post-confirmation replay and must not be intercepted. @private */
  static _bypass = new WeakSet();

  /** Weak references used to enumerate instances for destroyAll()/init() pruning. @private */
  static _refs = new Set();

  /**
   * Default configuration options.
   */
  static defaults = {
    action: 'confirm', // 'delete' | 'restore' | 'confirm' | 'danger' | 'warning' | 'direct' | 'link'
    title: null,
    message: null,
    confirmText: null,
    cancelText: null,
    requireInput: null,
    url: null,
    method: 'POST',
    form: null,
    ajax: false,
    loadingText: null,
    lockGroup: null, // null | 'row' | selector string
    successToast: null,
    errorToast: null,
    redirect: null,
    followRedirects: true,
    redirectTimeout: 5000,
    instant: false,
    simulate: 0,
    headers: {},
    axiosInstance: null,
    translations: {
      loading: 'Processing...',
      'confirm-title': 'Are you sure?',
      'confirm-message': 'Are you sure you want to proceed with this action?',
      'delete-title': 'Delete Confirmation',
      'delete-message': 'Are you sure you want to delete this item? This action cannot be undone.',
      'restore-title': 'Restore Confirmation',
      'restore-message': 'Are you sure you want to restore this item?',
      'confirm-btn': 'Confirm',
      'delete-btn': 'Delete',
      'restore-btn': 'Restore',
      'cancel-btn': 'Cancel',
      'csrf-error': 'Security token expired. Please refresh the page.',
      'server-error': 'An unexpected server error occurred.'
    }
  };

  /**
   * Global localization dictionary.
   */
  static translations = { ...CGEActionButton.defaults.translations };

  /**
   * Updates global default translations.
   * @param {Object} dict
   */
  static setTranslations(dict) {
    CGEActionButton.translations = { ...CGEActionButton.translations, ...dict };
  }

  /**
   * @param {HTMLElement} element - Target button or trigger element
   * @param {Object} [options={}] - Custom configuration options
   */
  _destroyed = false;
  _lifecycle = new Lifecycle();

  constructor(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('[CGEActionButton] A valid DOM HTMLElement is required.');
    }

    this.element = element;
    this.options = this._resolveOptions(options);

    this.isExecuting = false;
    this._isConfirming = false;
    this._originalHtml = null;
    this._originalMinWidth = null;
    this._lockedSiblings = [];
    this._listeners = new Map();

    CGEActionButton.instances.set(element, this);
    if (typeof WeakRef === 'function') CGEActionButton._refs.add(new WeakRef(element));
  }

  /**
   * Resolves options by merging static defaults, translations, instance options, and data attributes.
   * @private
   */
  _resolveOptions(options) {
    const el = this.element;
    const ds = el.dataset;
    const ajax = ds.cgeAjax !== undefined ? ds.cgeAjax === 'true' || ds.cgeAjax === '' : (options.ajax || false);
    const explicitMethod = ds.cgeMethod || options.method;
    const href = el.getAttribute('href');
    // Plain anchors navigate; their href is only an AJAX endpoint with data-cge-ajax or an explicit method.
    const hrefUrl = el.tagName === 'A' ? (ajax || explicitMethod ? href : null) : href;

    const dataOpts = {
      action: ds.cgeAction || options.action || (ds.cgeConfirm ? 'confirm' : CGEActionButton.defaults.action),
      title: ds.cgeTitle || options.title || null,
      message: ds.cgeMessage || ds.cgeConfirm || options.message || null,
      confirmText: ds.cgeConfirmText || options.confirmText || null,
      cancelText: ds.cgeCancelText || options.cancelText || null,
      requireInput: ds.cgeRequire || ds.cgeRequireInput || options.requireInput || null,
      url: ds.cgeUrl || options.url || hrefUrl || null,
      method: (explicitMethod || 'POST').toUpperCase(),
      form: ds.cgeForm || options.form || null,
      ajax,
      loadingText: ds.cgeLoadingText || options.loadingText || null,
      lockGroup: ds.cgeLockGroup || options.lockGroup || null,
      successToast: ds.cgeSuccessToast || options.successToast || null,
      errorToast: ds.cgeErrorToast || options.errorToast || null,
      redirect: ds.cgeRedirect || options.redirect || null,
      instant: ds.cgeInstant === 'true' || ds.cgeInstant === '' || options.instant || false,
      simulate: ds.cgeSimulate !== undefined ? parseInt(ds.cgeSimulate, 10) : (options.simulate || 0)
    };

    return {
      ...CGEActionButton.defaults,
      ...options,
      ...dataOpts,
      translations: { ...CGEActionButton.translations, ...(options.translations || {}) }
    };
  }

  /**
   * Executes the action button workflow (confirmation gatekeeper + execution).
   * @param {Event} [event=null] - Triggering event
   * @returns {Promise<any>}
   */
  async execute(event = null) {
    if (this._destroyed || this.isExecuting || this._isConfirming || this.element.disabled || this.element.getAttribute('aria-busy') === 'true') {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    const action = this.options.action.toLowerCase();
    const isDirect = this.options.instant || action === 'direct';
    // A previous navigation that never left the page (download, target=_blank) must not block this run.
    this._clearRedirecting();
    this._triggerEvent = event;

    // 1. Confirmation Gatekeeper (if not direct)
    if (!isDirect) {
      this._isConfirming = true;
      let confirmed;
      try {
        confirmed = await this._promptConfirmation();
      } finally {
        this._isConfirming = false;
      }
      if (this._destroyed) return;
      if (!confirmed) {
        this._emit('cancel', { element: this.element, action });
        return;
      }
      this._emit('confirm', { element: this.element, action });
    }

    // 2. Lock state and show loading spinner
    const form = this._resolveForm();
    this._formData = form && !this.options.url ? new FormData(form) : null;
    if (this._formData && this.element.name && !this.element.disabled) this._formData.append(this.element.name, this.element.value);
    this._requestController = new AbortController();
    this.freeze();
    this._emit('start', { element: this.element, action });

    try {
      // 3. Dispatch execution to target engine
      const result = await this._runTargetAction();
      if (this._destroyed) return;
      this._handleSuccess(result);
      this._emit('success', { element: this.element, action, result });
      return result;
    } catch (error) {
      if (this._destroyed || error?.name === "AbortError" || error?.code === "ERR_CANCELED") return;
      this._handleError(error);
      this._emit('error', { element: this.element, action, error });
      throw error;
    } finally {
      // 4. Restore button state (unless page is redirecting)
      this._formData = null;
      this._requestController = null;
      this._triggerEvent = null;
      if (!this._destroyed && !this._isRedirecting) {
        this.unfreeze();
        this._emit('complete', { element: this.element, action });
      }
    }
  }

  /**
   * Keeps the button busy while the page navigates. If the page is still alive after
   * redirectTimeout (download, new tab, blocked navigation) the button recovers.
   * @private
   */
  _markRedirecting() {
    this._isRedirecting = true;
    clearTimeout(this._redirectResetTimer);
    const delay = Number(this.options.redirectTimeout);
    if (!(delay > 0)) return;
    this._redirectResetTimer = setTimeout(() => {
      if (this._destroyed || !this._isRedirecting) return;
      this._isRedirecting = false;
      this.unfreeze();
      this._emit('complete', { element: this.element, action: this.options.action.toLowerCase() });
    }, delay);
  }

  /** @private */
  _clearRedirecting() {
    this._isRedirecting = false;
    clearTimeout(this._redirectResetTimer);
    clearTimeout(this._redirectTimer);
  }

  /**
   * Replays the intercepted click once after confirmation so inline onclick, Alpine @click,
   * Livewire wire:click and native anchor behavior run exactly one time.
   * @private
   * @returns {{ notPrevented: boolean, returned: any }}
   */
  _replayClick() {
    const el = this.element;
    const source = this._triggerEvent;
    const original = el.onclick;
    const wasDisabled = el.disabled === true;
    let returned;
    if (typeof original === 'function') {
      el.onclick = function (event) { returned = original.call(this, event); return returned; };
    }
    CGEActionButton._bypass.add(el);
    let notPrevented = true;
    try {
      if (wasDisabled) el.disabled = false;
      const init = { bubbles: true, cancelable: true, view: typeof window !== 'undefined' ? window : null };
      if (source) for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'button']) init[key] = source[key];
      notPrevented = el.dispatchEvent(new MouseEvent('click', init));
    } finally {
      CGEActionButton._bypass.delete(el);
      if (typeof original === 'function') el.onclick = original;
      if (wasDisabled) el.disabled = true;
    }
    return { notPrevented, returned };
  }

  /**
   * Prompts user confirmation via CGEAlert or fallback browser confirm.
   * @private
   * @returns {Promise<boolean>}
   */
  async _promptConfirmation() {
    const action = this.options.action.toLowerCase();
    const t = this.options.translations;

    // Resolve dialog title and message
    let defaultTitle = t['confirm-title'];
    let defaultMsg = t['confirm-message'];
    let defaultConfirmBtn = t['confirm-btn'];

    if (action === 'delete' || action === 'danger') {
      defaultTitle = t['delete-title'];
      defaultMsg = t['delete-message'];
      defaultConfirmBtn = t['delete-btn'];
    } else if (action === 'restore') {
      defaultTitle = t['restore-title'];
      defaultMsg = t['restore-message'];
      defaultConfirmBtn = t['restore-btn'];
    }

    const title = this.options.title || defaultTitle;
    const message = this.options.message || defaultMsg;
    const confirmButtonText = this.options.confirmText || defaultConfirmBtn;
    const cancelButtonText = this.options.cancelText || t['cancel-btn'];
    const requireInput = this.options.requireInput;

    // Use CGEAlert if available
    const CGEAlert = typeof window !== 'undefined' ? window.CGEAlert : null;

    if (CGEAlert && typeof CGEAlert.fire === 'function') {
      let result;
      if (requireInput) {
        result = await CGEAlert.delete(title, message, {
          requireInput: String(requireInput),
          confirmButtonText,
          cancelButtonText
        });
      } else if (action === 'delete' || action === 'danger') {
        result = await CGEAlert.delete(title, message, {
          confirmButtonText,
          cancelButtonText
        });
      } else if (action === 'restore') {
        result = await CGEAlert.restore(title, message, {
          confirmButtonText,
          cancelButtonText
        });
      } else {
        result = await CGEAlert.confirm(title, message, {
          confirmButtonText,
          cancelButtonText
        });
      }
      return Boolean(result && result.isConfirmed);
    }

    // Fallback: Browser native window.confirm / prompt
    if (requireInput) {
      const input = window.prompt(`${title}\n${message}\nType "${requireInput}" to confirm:`);
      return input === requireInput;
    }
    return window.confirm(`${title}\n${message}`);
  }

  /**
   * Executes the target action based on element context (form, async URL, or link).
   * @private
   */
  _wait(delay) {
    return new Promise(resolve => this._lifecycle.timeout(this._lifecycle.settle(resolve), delay));
  }

  async _runTargetAction() {
    if (this._destroyed) return;
    const el = this.element;
    const action = this.options.action.toLowerCase();
    const simulateMs = parseInt(
      this.options.simulate !== undefined ? this.options.simulate : (el.dataset.cgeSimulate || 0),
      10
    );

    // Target 1: Form Submitter
    const formEl = this._resolveForm();
    if (formEl && !this.options.url) {
      return this._executeForm(formEl);
    }

    // Target 2: Browser Navigation Link
    if (action === 'link' || (el.tagName === 'A' && !this.options.url && !this.options.ajax)) {
      if (simulateMs > 0) {
        await this._wait(simulateMs);
        if (this._destroyed) return;
      }
      const dest = el.getAttribute('href');
      const realUrl = dest && !dest.startsWith('#') && !/^\s*javascript:/i.test(dest);
      if (el.tagName === 'A') {
        // Replaying the click keeps target, download, rel and inline handlers intact.
        const { notPrevented } = this._replayClick();
        const sameTab = !el.target || el.target === '_self';
        if (realUrl && notPrevented && sameTab && !el.hasAttribute('download')) this._markRedirecting();
        return realUrl ? { redirect: dest } : { action: 'link', href: dest || '#' };
      }
      if (realUrl) {
        this._markRedirecting();
        window.location.href = dest;
        return { redirect: dest };
      }
      return { action: 'link', href: dest || '#' };
    }

    // Target 3: Direct Async HTTP Request
    const url = this.options.url || (el.tagName === 'A' ? null : el.getAttribute('href'));
    if (url && url !== '#' && !url.startsWith('javascript:')) {
      if (simulateMs > 0) {
        await this._wait(simulateMs);
        if (this._destroyed) return;
      }
      return this._executeAsyncRequest(url);
    }

    // Target 4: Custom Callback or Programmatic Action
    if (typeof this.options.onExecute === 'function') {
      if (simulateMs > 0) {
        await this._wait(simulateMs);
        if (this._destroyed) return;
      }
      return await this.options.onExecute(this);
    }

    // Target 5: Replay the intercepted click once (inline onclick, Alpine, Livewire listeners)
    const { returned } = this._replayClick();
    if (returned && typeof returned.then === 'function') {
      const res = await returned;
      if (this._destroyed) return;
      return res || { success: true };
    }

    // Target 6: Simulated latency or default fallback
    if (simulateMs > 0) {
      await this._wait(simulateMs);
      if (this._destroyed) return;
      return { success: true, simulated: true, duration: simulateMs };
    }

    // Minimum visual feedback duration (300ms) if successToast is defined and no latency specified
    // to prevent instant unfreezing before the browser paints the spinner
    if (this.options.successToast) {
      await this._wait(300);
      if (this._destroyed) return;
    }

    return { success: true };
  }

  /**
   * Resolves the target form element if applicable.
   * @private
   */
  _resolveForm() {
    if (this.options.form) {
      return document.querySelector(this.options.form);
    }
    if (this.element.getAttribute('form')) {
      return document.getElementById(this.element.getAttribute('form'));
    }
    // Anchors never submit their enclosing form; type="button" controls only with data-cge-ajax.
    const el = this.element;
    if (el.tagName === 'A') return null;
    const nonSubmit = (el.tagName === 'BUTTON' && el.type !== 'submit')
      || (el.tagName === 'INPUT' && !['submit', 'image'].includes(el.type));
    if (nonSubmit && !this.options.ajax) return null;
    return el.closest('form');
  }

  /**
   * Submits through requestSubmit (submit event + submitter) and reports whether the
   * browser is about to navigate (event not prevented by CGEForm, Livewire, etc.).
   * @private
   */
  _submitForm(form) {
    let dispatched = false;
    let prevented = false;
    const onForm = event => { if (event.target === form) { dispatched = true; prevented = event.defaultPrevented; } };
    const onWindow = event => { if (event.target === form) prevented = event.defaultPrevented; };
    form.addEventListener('submit', onForm);
    window.addEventListener('submit', onWindow);
    try {
      submitConfirmedForm(form, this.element);
    } finally {
      form.removeEventListener('submit', onForm);
      window.removeEventListener('submit', onWindow);
    }
    if (typeof form.requestSubmit !== 'function') return true;
    const target = form.getAttribute('target');
    return dispatched && !prevented && (!target || target === '_self');
  }

  /**
   * Submits the target form (with method spoofing if needed).
   * @private
   */
  async _executeForm(form) {
    const method = this.options.method;

    if (this._destroyed) return;
    const simulateMs = parseInt(
      this.options.simulate !== undefined ? this.options.simulate : (this.element.dataset.cgeSimulate || 0),
      10
    );
    if (simulateMs > 0) {
      await this._wait(simulateMs);
      if (this._destroyed) return;
      return { submitted: true, method, spoofed: true };
    }

    if (this.options.ajax) {
      const data = this._formData || new FormData(form);
      const url = form.getAttribute('action') || window.location.href;
      return this._sendHttpRequest(url, method, data);
    }

    // Inject Laravel method spoofing for DELETE, PUT, PATCH
    if (['DELETE', 'PUT', 'PATCH'].includes(method)) {
      let methodInput = form.querySelector('input[name="_method"]');
      if (!methodInput) {
        methodInput = document.createElement('input');
        methodInput.type = 'hidden';
        methodInput.name = '_method';
        form.appendChild(methodInput);
      }
      methodInput.value = method;
    }

    // Native form submit through requestSubmit: fires the submit event (CGEForm, Livewire)
    // and keeps the submitter name/value. The submitter must be enabled while the form data is built.
    this.unfreeze();
    const navigating = this._submitForm(form);
    if (navigating && !this._destroyed) {
      this.freeze();
      this._markRedirecting();
    }
    return { submitted: true, navigating };
  }

  /**
   * Dispatches direct asynchronous HTTP request (Axios or Fetch).
   * @private
   */
  async _executeAsyncRequest(url) {
    const method = this.options.method;
    return this._sendHttpRequest(url, method, null);
  }

  /**
   * Core HTTP request engine (supports Axios and Fetch with automated CSRF attachment).
   * @private
   */
  async _sendHttpRequest(url, method, body = null) {
    if (this._destroyed) return;
    method = method.toUpperCase();
    if (body instanceof FormData && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
      body.set('_method', method); method = 'POST';
    }
    if (body instanceof FormData && method === 'GET') {
      const params = new URLSearchParams();
      for (const [key, value] of body) params.append(key, value);
      const target = new URL(url, window.location.href);
      for (const [key, value] of params) target.searchParams.append(key, value);
      url = target.href; body = null;
    }
    // Plain tokens go out as X-CSRF-TOKEN; the encrypted XSRF-TOKEN cookie only as X-XSRF-TOKEN.
    const headers = laravelHeaders(this.options.headers, { form: this._resolveForm() });

    if (body instanceof FormData) for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'content-type') delete headers[key];
    }

    // Driver 1: configured axiosInstance, then Laravel's window.axios
    const axiosLib = resolveAxios(this.options.axiosInstance);
    if (axiosLib) {
      const res = await axiosLib.request({
        url,
        method: method.toLowerCase(),
        headers,
        data: body,
        signal: this._requestController?.signal
      });
      const finalUrl = res?.request?.responseURL;
      if (this.options.followRedirects && finalUrl && wasRedirected({ responseURL: finalUrl }, url)) {
        return { redirect: finalUrl, redirected: true };
      }
      return res?.data;
    }

    // Driver 2: Native fetch()
    const fetchConfig = {
      method,
      signal: this._requestController?.signal,
      headers
    };
    if (body && method !== 'GET' && method !== 'HEAD') fetchConfig.body = body;

    const res = await fetch(url, fetchConfig);
    const data = parseBody(await res.text(), res.headers?.get?.('content-type') || '');

    if (!res.ok) {
      const error = new HttpError(res.status, res.statusText, data);
      error.response = { status: res.status, data };
      throw error;
    }

    // A Laravel redirect() was followed transparently: navigate to the final page.
    if (this.options.followRedirects && wasRedirected(res, url)) {
      return { redirect: res.url, redirected: true };
    }

    return data && typeof data === 'object' ? data : { success: true };
  }

  /**
   * Handles successful response, triggers notifications or redirects.
   * @private
   */
  _handleSuccess(data) {
    const payload = data && typeof data === 'object' ? data : null;

    // 1. Success Toast Notification (only explicit strings; `{ success: true }` is not a message)
    const toastMsg = this.options.successToast
      || (payload && typeof payload.message === 'string' && payload.message.trim() ? payload.message : null);

    if (toastMsg && typeof window !== 'undefined' && window.CGEToast) {
      window.CGEToast.success(toastMsg);
    }

    // 2. Automated Redirect Handling (explicit `redirect` / `redirect_url` keys only)
    const pick = value => (typeof value === 'string' && value ? value : null);
    const redirectUrl = this.options.redirect
      || (payload ? pick(payload.redirect) || pick(payload.redirect_url) : null);

    if (redirectUrl) {
      this._markRedirecting();
      this._redirectTimer = setTimeout(() => {
        if (this._destroyed) return;
        window.location.href = redirectUrl;
      }, 400);
    }
  }

  /**
   * Handles server or network errors, displays toasts or alerts.
   * @private
   */
  _handleError(error) {
    console.error('[CGEActionButton] Action failed:', error);

    const status = error?.status ?? error?.response?.status ?? 0;
    const t = this.options.translations;

    let errorMsg = this.options.errorToast;

    if (!errorMsg) {
      if (status === 419) {
        errorMsg = t['csrf-error'];
      } else {
        const message = errorMessage(error);
        errorMsg = message && message !== 'Request failed.' ? message : t['server-error'];
      }
    }

    if (typeof window !== 'undefined' && window.CGEToast) {
      window.CGEToast.error(errorMsg);
    } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`Error: ${errorMsg}`);
    }
  }

  /**
   * Freezes the button: sets disabled, adds loading spinner, preserves layout dimensions,
   * and optionally locks sibling buttons in a group.
   */
  freeze() {
    if (this.isExecuting) return;
    this.isExecuting = true;

    const el = this.element;

    // 1. Preserve dimensions to prevent layout shift
    this._originalMinWidth = el.style.minWidth;
    const currentWidth = el.offsetWidth;
    if (currentWidth > 0) {
      el.style.minWidth = `${currentWidth}px`;
    }

    // 2. Cache original innerHTML
    this._originalHtml = el.innerHTML;

    // 3. Set disabled & accessibility flags
    el.disabled = true;
    el.setAttribute('aria-busy', 'true');
    el.setAttribute('aria-disabled', 'true');
    el.classList.add('cge-action-btn-busy', 'pointer-events-none');

    // 4. Resolve loading text
    const loadingText = this.options.loadingText || this.options.translations.loading;

    // 5. Swap content with SVG spinner
    el.innerHTML = `
      <span class="inline-flex items-center justify-center gap-1.5 pointer-events-none">
        <svg class="animate-spin cge-action-spinner w-3.5 h-3.5 text-current shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span class="truncate">${loadingText}</span>
      </span>
    `;

    // 6. Lock sibling action buttons in group
    this._lockSiblingGroup();
  }

  /**
   * Restores original HTML, unfreezes button, and unlocks siblings.
   */
  unfreeze() {
    if (!this.isExecuting) return;
    this.isExecuting = false;

    const el = this.element;

    // 1. Restore original innerHTML & dimensions
    if (this._originalHtml !== null) {
      el.innerHTML = this._originalHtml;
      this._originalHtml = null;
    }
    el.style.minWidth = this._originalMinWidth || '';

    // 2. Remove disabled & accessibility flags
    el.disabled = false;
    el.removeAttribute('aria-busy');
    el.removeAttribute('aria-disabled');
    el.classList.remove('cge-action-btn-busy', 'pointer-events-none');

    // 3. Unlock sibling buttons
    this._unlockSiblingGroup();
  }

  /**
   * Locks sibling buttons if lockGroup option is configured.
   * @private
   */
  _lockSiblingGroup() {
    this._lockedSiblings = [];
    const groupOpt = this.options.lockGroup;
    if (!groupOpt) return;

    let container = null;
    if (groupOpt === 'row') {
      container = this.element.closest('tr, [data-cge-action-group], li, .cge-action-group');
    } else if (typeof groupOpt === 'string') {
      container = this.element.closest(groupOpt);
    }

    if (!container) return;

    const siblings = Array.from(
      container.querySelectorAll('button:not([disabled]), [data-cge-action]:not([disabled])')
    ).filter((btn) => btn !== this.element);

    siblings.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add('cge-action-sibling-locked', 'opacity-50', 'pointer-events-none');
      this._lockedSiblings.push(btn);
    });
  }

  /**
   * Unlocks previously locked sibling buttons.
   * @private
   */
  _unlockSiblingGroup() {
    if (!this._lockedSiblings || this._lockedSiblings.length === 0) return;

    this._lockedSiblings.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('cge-action-sibling-locked', 'opacity-50', 'pointer-events-none');
    });
    this._lockedSiblings = [];
  }

  /**
   * Emits instance callbacks and native DOM CustomEvents.
   * @private
   */
  _emit(eventName, detail = {}) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach((cb) => {
        try {
          cb(detail);
        } catch (err) {
          console.error(`[CGEActionButton] Error in event listener "${eventName}":`, err);
        }
      });
    }

    const domEventName = `cge:action:${eventName.toLowerCase()}`;
    const customEvent = new CustomEvent(domEventName, {
      bubbles: true,
      cancelable: true,
      detail: { instance: this, ...detail }
    });

    this.element.dispatchEvent(customEvent);
    if (!this.element.isConnected) {
      document.dispatchEvent(customEvent);
    }
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
   * Destroys instance and restores original element state.
   */
  destroy() {
    this._destroyed = true;
    this._lifecycle.cancel();
    this._requestController?.abort();
    clearTimeout(this._redirectTimer);
    clearTimeout(this._redirectResetTimer);
    this._isRedirecting = false;
    this.unfreeze();
    this._listeners.clear();
    CGEActionButton.instances.delete(this.element);
  }

  // =========================================================================
  // Static Registry & Controller Methods
  // =========================================================================

  /**
   * Live element -> instance entries (the public registry is a WeakMap and cannot be iterated).
   * @private
   * @returns {Map<HTMLElement, CGEActionButton>}
   */
  static _entries() {
    const entries = new Map();
    for (const ref of CGEActionButton._refs) {
      const el = ref.deref();
      const instance = el && CGEActionButton.instances.get(el);
      if (instance) entries.set(el, instance);
      else CGEActionButton._refs.delete(ref);
    }
    return entries;
  }

  /**
   * Destroys instances whose element is inside root or no longer connected
   * (Livewire morphing, Turbo visits, innerHTML swaps).
   * @param {Document | Element} [root=document]
   * @returns {CGEActionButton[]}
   */
  static destroyAll(root = document) {
    return destroyInstances(CGEActionButton._entries(), root);
  }

  /**
   * Retrieves an existing instance by DOM element or selector.
   * @param {string | HTMLElement} target
   * @returns {CGEActionButton | null}
   */
  static get(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    return el ? CGEActionButton.instances.get(el) || null : null;
  }

  /**
   * Retrieves or creates an instance for the specified target.
   * @param {string | HTMLElement} target
   * @param {Object} [options={}]
   * @returns {CGEActionButton}
   */
  static getOrCreate(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      throw new Error(`[CGEActionButton] Target element not found: ${target}`);
    }
    return CGEActionButton.instances.get(el) || new CGEActionButton(el, options);
  }

  /**
   * Programmatically executes an action button.
   * @param {string | HTMLElement} target
   * @param {Object} [options={}]
   * @returns {Promise<any>}
   */
  static execute(target, options = {}) {
    const btn = CGEActionButton.getOrCreate(target, options);
    return btn.execute();
  }

  /**
   * Capture-phase delegated click handler. It runs before inline onclick, Alpine @click and
   * wire:click so nothing executes before confirmation; the confirmed click is replayed once.
   * @private
   */
  static _onDocumentClick(event) {
    const origin = event.target instanceof Element ? event.target : event.target?.parentElement;
    const trigger = origin?.closest?.(CGEActionButton._selector);
    if (!trigger) return;

    // Post-confirmation replay: let the click reach the element's own handlers.
    if (CGEActionButton._bypass.has(trigger)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    // Ignore already disabled or busy buttons
    if (trigger.disabled || trigger.getAttribute('aria-busy') === 'true') return;

    CGEActionButton.getOrCreate(trigger).execute(event).catch(() => {
      // Errors are already handled inside execute()
    });
  }

  /**
   * Initializes global event delegation for declarative triggers (capture phase).
   * Accepts a custom trigger selector or a root (Document/Element) used to prune
   * instances whose elements were removed. Safe to call repeatedly.
   * @param {string | Document | Element} [target='[data-cge-action], [data-cge-confirm]']
   */
  static init(target) {
    if (typeof document === 'undefined') return;
    if (typeof target === 'string' && target.trim()) CGEActionButton._selector = target;
    pruneInstances(CGEActionButton._entries());
    if (CGEActionButton._delegationBound) return;
    document.addEventListener('click', CGEActionButton._onDocumentClick, true);
    CGEActionButton._delegationBound = true;
  }
}
