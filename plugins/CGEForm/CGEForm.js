/**
 * CGEForm - TailTools Plugin
 * High-performance, reactive AJAX form handling plugin designed specifically for Laravel Blade and modern Tailwind CSS v4+ frontends.
 * Features automated Laravel 422 JSON validation error binding with support for complex nested/array inputs,
 * pluggable notification drivers (CGEToast, CGEAlert, native dialogs, and external SweetAlert2),
 * multi-driver HTTP requests (Axios default, Fetch, XHR), redirect interceptors,
 * dual event binding (instance .on() + DOM CustomEvents), button loading spinners/states,
 * intelligent field lock preservation, and an HTML-aware localization (i18n) engine.
 * Zero mandatory external runtime dependencies.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEForm {
  /**
   * Registry of initialized form instances mapped to their HTMLFormElement.
   * @type {Map<HTMLFormElement, CGEForm>}
   */
  static instances = new Map();

  /**
   * Active global locale.
   * @type {string}
   */
  static currentLocale = 'en';

  /**
   * Global translations registry supporting multi-language dictionaries.
   */
  static translations = {
    en: {
      'success': 'Success!',
      'success-message': 'Operation completed successfully.',
      'error': 'Error!',
      'error-message': 'Please fix the highlighted errors and try again.',
      'server-error': 'An unexpected server error occurred. Please try again later.',
      'network-error': 'Network connection error. Check your internet connection.',
      'save-button': 'Save',
      'update-button': 'Update',
      'delete-button': 'Delete',
      'loading-indicator': '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Loading...',
    }
  };

  /**
   * Default configuration options for CGEForm instances.
   */
  static defaults = {
    driver: 'axios', // 'axios' | 'fetch' | 'xhr'
    url: null, // string | null (defaults to form.action or current URL)
    method: null, // string | null (defaults to form.method or _method input)
    headers: {},
    feedback: {
      type: 'toast', // 'toast' | 'alert' | 'native' | 'sweetalert' | 'custom' | 'none'
      options: {},
      onSuccess: null,
      onError: null,
      onValidationError: null
    },
    autoClearErrors: true,
    invalidClass: 'border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500 dark:border-rose-500 dark:text-rose-400',
    validClass: '',
    groupErrorClass: 'has-error',
    showLoadingIndicator: true,
    loadingText: null,
    freezeInputs: true,
    resetOnSuccess: false,
    redirectDelay: 0,
    onRedirect: null,
    translations: {},
    beforeSubmit: null,
    onSubmit: null,
    onSuccess: null,
    onError: null,
    onInvalid: null,
    onComplete: null
  };

  /**
   * Set or update translations for a specific locale, or the current locale.
   * @param {string | Record<string, string>} localeOrTranslations
   * @param {Record<string, string>} [translations]
   */
  static setTranslations(localeOrTranslations, translations) {
    if (typeof localeOrTranslations === 'string' && translations) {
      const loc = localeOrTranslations;
      CGEForm.translations[loc] = {
        ...(CGEForm.translations[loc] || {}),
        ...translations
      };
    } else if (typeof localeOrTranslations === 'object') {
      const loc = CGEForm.currentLocale;
      CGEForm.translations[loc] = {
        ...(CGEForm.translations[loc] || {}),
        ...localeOrTranslations
      };
    }
  }

  /**
   * Set active locale code and optional dictionary.
   * @param {string} locale
   * @param {Record<string, string>} [translations]
   */
  static setLocale(locale, translations) {
    CGEForm.currentLocale = locale;
    if (translations) {
      CGEForm.setTranslations(locale, translations);
    }
  }

  /**
   * Global static translation resolver with placeholder replacement.
   * @param {string} key
   * @param {Record<string, string | number>} [placeholders]
   * @param {string} [locale]
   * @returns {string}
   */
  static t(key, placeholders = {}, locale = CGEForm.currentLocale) {
    const locDict = CGEForm.translations[locale] || {};
    const fallbackDict = CGEForm.translations['en'] || {};
    let text = locDict[key] ?? fallbackDict[key] ?? key;

    if (placeholders && typeof placeholders === 'object') {
      for (const [k, v] of Object.entries(placeholders)) {
        text = text.replace(new RegExp(`:${k}|\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  /**
   * Retrieve an initialized CGEForm instance for a given element.
   * @param {HTMLFormElement | string} element
   * @returns {CGEForm | null}
   */
  static getInstance(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el instanceof HTMLFormElement) {
      return CGEForm.instances.get(el) || null;
    }
    return null;
  }

  /**
   * Get an existing instance or initialize a new one.
   * @param {HTMLFormElement | string} element
   * @param {Partial<typeof CGEForm.defaults>} [options]
   * @returns {CGEForm}
   */
  static getOrCreateInstance(element, options = {}) {
    const existing = CGEForm.getInstance(element);
    if (existing) return existing;
    return new CGEForm(element, options);
  }

  /**
   * Automatically initializes all forms matching [data-cge-form] within a container root.
   * @param {Document | HTMLElement} [root=document]
   * @returns {CGEForm[]}
   */
  static init(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return [];
    const forms = root.querySelectorAll('form[data-cge-form]');
    const initialized = [];

    forms.forEach((formEl) => {
      if (formEl instanceof HTMLFormElement && !CGEForm.instances.has(formEl)) {
        // Parse declarative attributes
        const dataset = formEl.dataset;
        const options = {};

        if (dataset.cgeDriver) options.driver = dataset.cgeDriver;
        if (dataset.cgeUrl) options.url = dataset.cgeUrl;
        if (dataset.cgeMethod) options.method = dataset.cgeMethod;
        if (dataset.cgeFeedback) {
          try {
            options.feedback = dataset.cgeFeedback.startsWith('{')
              ? JSON.parse(dataset.cgeFeedback)
              : { type: dataset.cgeFeedback };
          } catch {
            options.feedback = { type: dataset.cgeFeedback };
          }
        }
        if (dataset.cgeLoadingText) options.loadingText = dataset.cgeLoadingText;
        if (dataset.cgeResetOnSuccess !== undefined) {
          options.resetOnSuccess = dataset.cgeResetOnSuccess !== 'false';
        }
        if (dataset.cgeI18n) {
          try {
            options.translations = JSON.parse(dataset.cgeI18n);
          } catch (e) {
            console.warn('[CGEForm] Failed to parse data-cge-i18n JSON:', e);
          }
        }

        initialized.push(new CGEForm(formEl, options));
      }
    });

    return initialized;
  }

  /**
   * Constructs and attaches a new CGEForm instance.
   * @param {HTMLFormElement | string} target
   * @param {Partial<typeof CGEForm.defaults>} [options]
   */
  constructor(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || !(el instanceof HTMLFormElement)) {
      throw new Error(`[CGEForm] Invalid target element: Expected an HTMLFormElement, got ${target}`);
    }

    if (CGEForm.instances.has(el)) {
      return CGEForm.instances.get(el);
    }

    this.form = el;

    // Merge options: defaults -> declarative dataset -> constructor options
    this.options = this._mergeOptions(options);

    // Event listener registry for fluent .on() / .off()
    this._listeners = new Map();

    // Registry of inputs pre-disabled before submission (State Memory Guard)
    this._previouslyDisabled = new Set();

    // Track inputs with active error listeners to avoid listener duplicates
    this._errorBoundInputs = new Set();

    // Submit button state memory
    this._submitButtonOriginalHTML = null;
    this._submitButtonOriginalDisabled = false;
    this._isSubmitting = false;
    this._destroyed = false;
    this._requestController = null;
    this._addedNoValidate = !this.form.hasAttribute('novalidate');

    // Internal bound handler
    this._handleSubmit = this._handleSubmit.bind(this);

    // Initialize
    this._init();

    // Register instance
    CGEForm.instances.set(this.form, this);
  }

  /**
   * Internal initialization: attach submit listener and setup field listeners.
   * @private
   */
  _init() {
    this.form.addEventListener('submit', this._handleSubmit);

    // Set novalidate by default so server-side and custom AJAX validation take precedence
    if (!this.form.hasAttribute('novalidate')) {
      this.form.setAttribute('novalidate', '');
    }

    // Attach immediate live clearing on inputs if autoClearErrors is active
    if (this.options.autoClearErrors) {
      this._handleClearError = (e) => {
        const input = e.target;
        if (input instanceof HTMLElement && input.hasAttribute('name')) {
          this._clearInputError(input);
        }
      };
      this.form.addEventListener('input', this._handleClearError);
      this.form.addEventListener('change', this._handleClearError);
    }
  }

  /**
   * Merges options with dataset attributes and defaults.
   * @private
   */
  _mergeOptions(userOptions) {
    const dataset = this.form.dataset;
    const dataOpts = {};

    if (dataset.cgeDriver) dataOpts.driver = dataset.cgeDriver;
    if (dataset.cgeUrl) dataOpts.url = dataset.cgeUrl;
    if (dataset.cgeMethod) dataOpts.method = dataset.cgeMethod;
    if (dataset.cgeFeedback) {
      try {
        dataOpts.feedback = dataset.cgeFeedback.startsWith('{')
          ? JSON.parse(dataset.cgeFeedback)
          : { type: dataset.cgeFeedback };
      } catch {
        dataOpts.feedback = { type: dataset.cgeFeedback };
      }
    }
    if (dataset.cgeLoadingText) dataOpts.loadingText = dataset.cgeLoadingText;
    if (dataset.cgeResetOnSuccess !== undefined) {
      dataOpts.resetOnSuccess = dataset.cgeResetOnSuccess !== 'false';
    }
    if (dataset.cgeI18n) {
      try {
        dataOpts.translations = JSON.parse(dataset.cgeI18n);
      } catch {}
    }

    // Normalize feedback option if passed as string shorthand
    let feedbackConfig = { ...CGEForm.defaults.feedback };
    if (typeof userOptions.feedback === 'string') {
      feedbackConfig.type = userOptions.feedback;
    } else if (typeof userOptions.feedback === 'object' && userOptions.feedback !== null) {
      feedbackConfig = { ...feedbackConfig, ...userOptions.feedback };
    } else if (typeof dataOpts.feedback === 'object' && dataOpts.feedback !== null) {
      feedbackConfig = { ...feedbackConfig, ...dataOpts.feedback };
    }

    return {
      ...CGEForm.defaults,
      ...dataOpts,
      ...userOptions,
      feedback: feedbackConfig,
      headers: {
        ...CGEForm.defaults.headers,
        ...(dataOpts.headers || {}),
        ...(userOptions.headers || {})
      },
      translations: {
        ...(dataOpts.translations || {}),
        ...(userOptions.translations || {})
      }
    };
  }

  /**
   * Instance-level translation resolver following the strict precedence hierarchy:
   * 1. Form data-cge-i18n attribute
   * 2. Instance options.translations
   * 3. Global CGEForm.translations[currentLocale]
   * 4. Base default dictionary ('en')
   * 5. Fallback key
   *
   * @param {string} key
   * @param {Record<string, string | number>} [placeholders]
   * @returns {string}
   */
  t(key, placeholders = {}) {
    // 1. Form data attribute
    let text = null;
    if (this.form.dataset.cgeI18n) {
      try {
        const parsed = JSON.parse(this.form.dataset.cgeI18n);
        if (parsed && parsed[key] !== undefined) {
          text = parsed[key];
        }
      } catch {}
    }

    // 2. Instance options
    if (text === null && this.options.translations && this.options.translations[key] !== undefined) {
      text = this.options.translations[key];
    }

    // 3 & 4. Global static translations
    if (text === null) {
      text = CGEForm.t(key, {}, CGEForm.currentLocale);
    }

    // Interpolate placeholders
    if (text && placeholders && typeof placeholders === 'object') {
      for (const [k, v] of Object.entries(placeholders)) {
        text = text.replace(new RegExp(`:${k}|\\{${k}\\}`, 'g'), String(v));
      }
    }

    return text ?? key;
  }

  /**
   * Primary form submission orchestrator.
   * @param {SubmitEvent} [event]
   * @returns {Promise<any>}
   * @private
   */
  async _handleSubmit(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (this._isSubmitting || this._destroyed) return;

    // Clear previous errors before fresh submission
    this.clearErrors();

    // Construct FormData from the form BEFORE freezing inputs
    const formData = new FormData(this.form, event?.submitter);
    this._requestController = new AbortController();
    this._isSubmitting = true;

    // Freeze inputs and transition submit button to loading state immediately
    this._freezeForm();

    let response = null;
    let ok = false;

    try {
      // Run beforeSubmit hook if defined
      let mockResponse = null;
      if (typeof this.options.beforeSubmit === 'function') {
        const hookResult = await this.options.beforeSubmit(formData, this);
        if (hookResult === false) {
          this._unfreezeForm();
          return;
        }
        if (hookResult && typeof hookResult === 'object' && ('status' in hookResult || 'data' in hookResult || 'response' in hookResult)) {
          mockResponse = hookResult;
        }
      }

      if (this._destroyed) return;

      // Determine target URL and HTTP method
      const targetUrl = this._resolveUrl();
      const targetMethod = this._resolveMethod();

      // Prepare headers
      const headers = this._buildHeaders();

      // Dispatch submit event
      const submitPayload = { form: this, formData, url: targetUrl, method: targetMethod };
      this._emit('submit', submitPayload);
      this._dispatchDOMEvent('submit', submitPayload);
      if (this._destroyed) return;

      if (mockResponse) {
        response = mockResponse;
      } else {
        response = await this._sendRequest(targetUrl, targetMethod, formData, headers);
      }
      if (this._destroyed) return;
      ok = true;

      // Check for server-guided redirect
      const redirectUrl = this._extractRedirect(response);
      if (redirectUrl) {
        const redirectPayload = { form: this, url: redirectUrl, response };
        let allowRedirect = true;

        if (typeof this.options.onRedirect === 'function') {
          const hookResult = this.options.onRedirect(redirectUrl, response);
          if (hookResult === false) allowRedirect = false;
        }

        this._emit('redirect', redirectPayload);
        this._dispatchDOMEvent('redirect', redirectPayload);

        if (allowRedirect) {
          const delay = Number(this.options.redirectDelay) || 0;
          if (delay > 0) {
            this._redirectTimer = setTimeout(() => { if (!this._destroyed) window.location.href = redirectUrl; }, delay);
          } else {
            window.location.href = redirectUrl;
          }
          return response;
        }
      }

      // Success payload processing
      const successPayload = { form: this, response, data: response?.data ?? response };
      this._emit('success', successPayload);
      this._dispatchDOMEvent('success', successPayload);

      // Trigger feedback notification
      const successMsg = this._extractMessage(response, this.t('success-message'));
      this._triggerFeedback('success', successMsg, response);

      // Display in-form success container if present
      this._displayFormSuccess(successMsg);

      // Reset form if option enabled
      if (this.options.resetOnSuccess) {
        this.reset();
      }

    } catch (err) {
      if (this._destroyed || err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      ok = false;
      const res = err?.response || (err?.status ? err : null);

      if (res && res.status === 422) {
        // Laravel 422 Unprocessable Entity - Validation Errors
        const errors = res.data?.errors || {};
        this.bindErrors(errors);

        const validationMsg = this._extractMessage(res, this.t('error-message'));
        const invalidPayload = { form: this, errors, response: res, error: err };

        this._emit('invalid', invalidPayload);
        this._dispatchDOMEvent('invalid', invalidPayload);

        this._triggerFeedback('validation', validationMsg, res);
      } else {
        // General or Server Error
        const isNetworkError = !res || err?.code === 'ERR_NETWORK' || err?.message?.includes('Network');
        const fallbackMsg = isNetworkError ? this.t('network-error') : this.t('server-error');
        const errorMsg = this._extractMessage(res, fallbackMsg);

        const errorPayload = { form: this, error: err, response: res };
        this._emit('error', errorPayload);
        this._dispatchDOMEvent('error', errorPayload);

        this._triggerFeedback('error', errorMsg, res);
      }
    } finally {
      // Re-enable fields respecting State Memory Guard
      if (!this._destroyed) this._unfreezeForm();
      this._isSubmitting = false;
      this._requestController = null;
      if (this._destroyed) return;

      const completePayload = { form: this, ok, response };
      this._emit('complete', completePayload);
      this._dispatchDOMEvent('complete', completePayload);
    }

    return response;
  }

  /**
   * Resolves the target endpoint URL.
   * @private
   */
  _resolveUrl() {
    return this.options.url || this.form.getAttribute('action') || window.location.href;
  }

  /**
   * Resolves HTTP method, honoring Laravel method spoofing (<input name="_method" value="PUT">).
   * @private
   */
  _resolveMethod() {
    if (this.options.method) {
      return this.options.method.toUpperCase();
    }

    const spoofedInput = this.form.querySelector('input[name="_method"]');
    if (spoofedInput && spoofedInput.value) {
      return spoofedInput.value.toUpperCase();
    }

    const formMethod = this.form.getAttribute('method');
    return formMethod ? formMethod.toUpperCase() : 'POST';
  }

  /**
   * Builds automated Laravel headers including CSRF token, X-Requested-With, and Accept.
   * @private
   */
  _buildHeaders() {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...this.options.headers
    };

    // Extract CSRF Token
    let csrfToken = null;
    const metaCsrf = document.querySelector('meta[name="csrf-token"]');
    if (metaCsrf) {
      csrfToken = metaCsrf.getAttribute('content');
    }

    if (!csrfToken) {
      const tokenInput = this.form.querySelector('input[name="_token"]');
      if (tokenInput && tokenInput.value) {
        csrfToken = tokenInput.value;
      }
    }

    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    return headers;
  }

  /**
   * Sends HTTP request using the configured driver (axios, fetch, xhr).
   * @private
   */
  async _sendRequest(url, method, formData, headers) {
    const driver = (this.options.driver || 'axios').toLowerCase();

    if (driver === 'axios') {
      return this._sendAxios(url, method, formData, headers);
    } else if (driver === 'xhr') {
      return this._sendXHR(url, method, formData, headers);
    } else {
      return this._sendFetch(url, method, formData, headers);
    }
  }

  /**
   * Axios Request Driver. Automatically falls back to Fetch if Axios is not available.
   * @private
   */
  async _sendAxios(url, method, formData, headers) {
    const axiosLib = window.axios || this.options.axiosInstance;

    if (!axiosLib) {
      console.warn('[CGEForm] Axios not found on window or options. Falling back cleanly to Fetch driver.');
      return this._sendFetch(url, method, formData, headers);
    }

    // If method is GET, serialize formData into URL params
    if (method === 'GET') {
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        params.append(key, value);
      }
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = params.toString() ? `${url}${separator}${params.toString()}` : url;

      return axiosLib.request({
        url: finalUrl,
        method: 'GET',
        signal: this._requestController?.signal,
        headers
      });
    }

    // In Laravel, if sending PUT/PATCH with file uploads via FormData,
    // PHP doesn't populate $_FILES for non-POST requests.
    // Ensure method spoofing _method is present if method is PUT/PATCH/DELETE
    if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
      formData.set('_method', method);
    }

    // When sending FormData with axios, let axios set multipart boundary automatically
    const reqHeaders = { ...headers };
    delete reqHeaders['Content-Type'];

    return axiosLib.request({
      url,
      method: ['PUT', 'PATCH', 'DELETE'].includes(method) ? 'POST' : method,
      data: formData,
      signal: this._requestController?.signal,
      headers: reqHeaders,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          this._emit('progress', { form: this, percent, loaded: progressEvent.loaded, total: progressEvent.total });
          this._dispatchDOMEvent('progress', { form: this, percent, loaded: progressEvent.loaded, total: progressEvent.total });
        }
      }
    });
  }

  /**
   * Fetch Request Driver.
   * @private
   */
  async _sendFetch(url, method, formData, headers) {
    let finalUrl = url;
    let body = null;
    let reqMethod = method;

    if (method === 'GET') {
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        params.append(key, value);
      }
      const separator = url.includes('?') ? '&' : '?';
      finalUrl = params.toString() ? `${url}${separator}${params.toString()}` : url;
    } else {
      if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
        formData.set('_method', method);
        reqMethod = 'POST';
      }
      body = formData;
    }

    // Ensure Content-Type is NOT manually set so the browser creates the multipart boundary
    const reqHeaders = { ...headers };
    delete reqHeaders['Content-Type'];

    const response = await fetch(finalUrl, {
      method: reqMethod,
      headers: reqHeaders,
      signal: this._requestController?.signal,
      body: method === 'GET' ? undefined : body
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }

    const normalized = {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: response.headers,
      ok: response.ok
    };

    if (!response.ok) {
      const error = new Error(`Request failed with status code ${response.status}`);
      error.response = normalized;
      error.status = response.status;
      throw error;
    }

    return normalized;
  }

  /**
   * Native XMLHttpRequest Driver. Supports upload progress events.
   * @private
   */
  async _sendXHR(url, method, formData, headers) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const signal = this._requestController?.signal;
      const abort = () => { xhr.abort(); reject(new DOMException("Request canceled", "AbortError")); };
      signal?.addEventListener("abort", abort, { once: true });
      xhr.onloadend = () => signal?.removeEventListener("abort", abort);
      xhr.onabort = () => reject(new DOMException("Request canceled", "AbortError"));
      if (signal?.aborted) { abort(); return; }
      let finalUrl = url;
      let reqMethod = method;

      if (method === 'GET') {
        const params = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          params.append(key, value);
        }
        const separator = url.includes('?') ? '&' : '?';
        finalUrl = params.toString() ? `${url}${separator}${params.toString()}` : url;
      } else if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
        formData.set('_method', method);
        reqMethod = 'POST';
      }

      xhr.open(reqMethod, finalUrl, true);

      // Set headers
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      }

      // Upload progress listener
      if (xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded * 100) / e.total);
            this._emit('progress', { form: this, percent, loaded: e.loaded, total: e.total });
            this._dispatchDOMEvent('progress', { form: this, percent, loaded: e.loaded, total: e.total });
          }
        };
      }

      xhr.onload = () => {
        let responseData = null;
        const contentType = xhr.getResponseHeader('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch {
            responseData = xhr.responseText;
          }
        } else {
          responseData = xhr.responseText;
        }

        const normalized = {
          status: xhr.status,
          statusText: xhr.statusText,
          data: responseData,
          ok: xhr.status >= 200 && xhr.status < 300
        };

        if (normalized.ok) {
          resolve(normalized);
        } else {
          const error = new Error(`XHR failed with status ${xhr.status}`);
          error.response = normalized;
          error.status = xhr.status;
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('XHR Network Error');
        error.code = 'ERR_NETWORK';
        error.response = { status: 0, data: null, ok: false };
        reject(error);
      };

      if (method === 'GET') {
        xhr.send();
      } else {
        xhr.send(formData);
      }
    });
  }

  /**
   * Freezes editable form elements and transitions submit button into loading state.
   * State Memory Guard: Records already disabled or readonly fields in a Set so they
   * are NEVER inadvertently re-enabled if submission fails.
   * @private
   */
  _freezeForm() {
    this._previouslyDisabled.clear();

    const submitBtn = this._getSubmitButton();
    const elements = Array.from(this.form.elements);

    for (const el of elements) {
      if (el.disabled || el.readOnly || el.hasAttribute('readonly') || el.hasAttribute('disabled')) {
        this._previouslyDisabled.add(el);
      } else if (this.options.freezeInputs) {
        // Freeze inputs and non-submit controls
        if (el !== submitBtn) {
          el.disabled = true;
        }
      }
    }

    // Submit button state transition
    if (submitBtn) {
      if (this._submitButtonOriginalHTML === null) {
        this._submitButtonOriginalHTML = submitBtn.innerHTML;
        this._submitButtonOriginalDisabled = submitBtn.disabled;
      }
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');

      if (this.options.showLoadingIndicator) {
        const loadingIndicator = submitBtn.getAttribute('data-cge-loading-text')
          || this.options.loadingText
          || this.t('loading-indicator');
        submitBtn.innerHTML = loadingIndicator;
      }
    }
  }

  /**
   * Re-enables form controls while respecting the State Memory Guard.
   * Elements that were disabled prior to submission remain disabled.
   * @private
   */
  _unfreezeForm() {
    const submitBtn = this._getSubmitButton();
    const elements = Array.from(this.form.elements);

    for (const el of elements) {
      if (el !== submitBtn) {
        if (!this._previouslyDisabled.has(el)) {
          el.disabled = false;
        }
      }
    }

    // Restore submit button
    if (submitBtn) {
      if (this._submitButtonOriginalHTML !== null) {
        submitBtn.innerHTML = this._submitButtonOriginalHTML;
        this._submitButtonOriginalHTML = null;
      }
      submitBtn.removeAttribute('aria-busy');
      if (!this._previouslyDisabled.has(submitBtn) && !this._submitButtonOriginalDisabled) {
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Public helper to manually trigger the freeze/loading state.
   */
  freeze() {
    this._freezeForm();
  }

  /**
   * Public helper to manually unfreeze and restore button/input states.
   */
  unfreeze() {
    this._unfreezeForm();
  }

  /**
   * Finds the primary submit button in the form.
   * @returns {HTMLButtonElement | HTMLInputElement | null}
   * @private
   */
  _getSubmitButton() {
    // 1. Elements inside form with type="submit" or [data-cge-submit]
    const elements = Array.from(this.form.elements);
    const submitBtn = elements.find(el => (el.tagName === 'BUTTON' || el.tagName === 'INPUT') && el.type === 'submit');
    if (submitBtn) return submitBtn;

    const cgeSubmit = this.form.querySelector('[data-cge-submit]');
    if (cgeSubmit) return cgeSubmit;

    // 2. Fallback: button without explicit type="button" or type="reset"
    const fallbackBtn = this.form.querySelector('button:not([type="button"]):not([type="reset"])');
    if (fallbackBtn) return fallbackBtn;

    // 3. External button linked via form attribute
    if (this.form.id) {
      const extBtn = document.querySelector(`button[form="${CSS.escape(this.form.id)}"], input[type="submit"][form="${CSS.escape(this.form.id)}"], [data-cge-submit][form="${CSS.escape(this.form.id)}"]`);
      if (extBtn) return extBtn;
    }

    return null;
  }

  /**
   * Resolves and binds Laravel 422 JSON validation errors to the DOM.
   * Handles simple keys ('email'), numeric array notation ('choices.0'),
   * keyed array notation ('choices2.a'), and nested objects ('user.profile.bio').
   *
   * @param {Record<string, string[] | string>} errors
   */
  bindErrors(errors) {
    if (!errors || typeof errors !== 'object') return;

    for (const [errKey, messages] of Object.entries(errors)) {
      const messageText = Array.isArray(messages) ? messages.join(' ') : String(messages);
      const { inputs, container } = this._resolveErrorTarget(errKey);

      // Apply invalid UI state to matching inputs
      if (inputs && inputs.length > 0) {
        for (const input of inputs) {
          if (this.options.invalidClass) {
            const classes = this.options.invalidClass.split(/\s+/).filter(Boolean);
            input.classList.add(...classes);
          }
          if (this.options.validClass) {
            const classes = this.options.validClass.split(/\s+/).filter(Boolean);
            input.classList.remove(...classes);
          }
          input.setAttribute('aria-invalid', 'true');

          // Parent group state
          const group = input.closest('.cge-form-group') || input.parentElement;
          if (group && this.options.groupErrorClass) {
            group.classList.add(this.options.groupErrorClass);
          }

          // Link aria-describedby if container has an ID
          if (container && container.id) {
            const existingDesc = input.getAttribute('aria-describedby') || '';
            if (!existingDesc.includes(container.id)) {
              input.setAttribute('aria-describedby', `${existingDesc} ${container.id}`.trim());
            }
          }

          // Input/change events bubble to the form's delegated clearing handler.
        }
      }

      // Populate error text into feedback container
      if (container) {
        container.textContent = messageText;
        container.classList.remove('hidden');
        container.style.removeProperty('display');
        container.setAttribute('aria-live', 'polite');
      }
    }
  }

  /**
   * Discovers matching DOM input elements and feedback container for an error key.
   * @param {string} errKey
   * @returns {{ inputs: HTMLElement[], container: HTMLElement | null }}
   * @private
   */
  _resolveErrorTarget(errKey) {
    const inputs = this._findInputsForErrorKey(errKey);
    let container = this._findFeedbackContainer(errKey, inputs);

    // If still missing, dynamically create a fallback container inside the form-group
    if (!container && inputs.length > 0) {
      container = this._createFallbackFeedback(errKey, inputs[0]);
    }

    return { inputs, container };
  }

  /**
   * Discovers form inputs matching Laravel error key notations:
   * 1. Simple: 'email' -> [name="email"]
   * 2. Numeric: 'choices.0' -> [name="choices[0]"], [name="choices[]"][0], or [name="choices.0"]
   * 3. Keyed array: 'choices2.a' -> [name="choices2[a]"] or [name="choices2.a"]
   * 4. Nested dot: 'user.profile.bio' -> [name="user[profile][bio]"] or [name="user.profile.bio"]
   *
   * @param {string} errKey
   * @returns {HTMLElement[]}
   * @private
   */
  _findInputsForErrorKey(errKey) {
    // Direct attribute match
    const directMatches = Array.from(this.form.querySelectorAll(`[name="${CSS.escape(errKey)}"]`));
    if (directMatches.length > 0) return directMatches;

    // Check if error key contains dot notation
    if (errKey.includes('.')) {
      const parts = errKey.split('.');
      const root = parts[0];

      // Format: user[profile][bio]
      const bracketName = `${root}[${parts.slice(1).join('][')}]`;
      const bracketMatches = Array.from(this.form.querySelectorAll(`[name="${CSS.escape(bracketName)}"]`));
      if (bracketMatches.length > 0) return bracketMatches;

      // Format for numeric arrays: choices.0 -> choices[]
      const isNumericLeaf = /^\d+$/.test(parts[parts.length - 1]);
      if (isNumericLeaf) {
        const index = parseInt(parts[parts.length - 1], 10);
        const arrayInputs = Array.from(this.form.querySelectorAll(`[name="${CSS.escape(root)}[]"]`));
        if (arrayInputs.length > 0 && arrayInputs[index]) {
          return [arrayInputs[index]];
        }
        if (arrayInputs.length > 0) {
          return arrayInputs;
        }
      }

      // Root name fallback (e.g. choices for choices.0)
      const rootMatches = Array.from(this.form.querySelectorAll(`[name="${CSS.escape(root)}"], [name="${CSS.escape(root)}[]"]`));
      if (rootMatches.length > 0) return rootMatches;
    }

    // Try array syntax if key is base name but input is array (e.g. 'choices' -> [name="choices[]"])
    const baseArrayMatches = Array.from(this.form.querySelectorAll(`[name="${CSS.escape(errKey)}[]"]`));
    if (baseArrayMatches.length > 0) return baseArrayMatches;

    return [];
  }

  /**
   * Finds the appropriate feedback container element for an error key.
   * @param {string} errKey
   * @param {HTMLElement[]} matchedInputs
   * @returns {HTMLElement | null}
   * @private
   */
  _findFeedbackContainer(errKey, matchedInputs) {
    // 1. Explicit data-cge-feedback matching exact key
    let container = this.form.querySelector(`[data-cge-feedback="${CSS.escape(errKey)}"]`);
    if (container) return container;

    // 2. Bracket notation format if dot notation
    if (errKey.includes('.')) {
      const parts = errKey.split('.');
      const root = parts[0];
      const bracketName = `${root}[${parts.slice(1).join('][')}]`;

      container = this.form.querySelector(`[data-cge-feedback="${CSS.escape(bracketName)}"]`);
      if (container) return container;

      // Root container (e.g., data-cge-feedback="choices" for choices.0)
      container = this.form.querySelector(`[data-cge-feedback="${CSS.escape(root)}"]`);
      if (container) return container;
    }

    // 3. Search adjacent within the parent .cge-form-group of the matched input
    if (matchedInputs && matchedInputs.length > 0) {
      const firstInput = matchedInputs[0];
      const group = firstInput.closest('.cge-form-group') || firstInput.parentElement;
      if (group) {
        container = group.querySelector(`[data-cge-feedback="${CSS.escape(errKey)}"]`)
          || group.querySelector('[data-cge-feedback]')
          || group.querySelector('.cge-feedback, .cge-error-feedback');
        if (container) return container;
      }
    }

    return null;
  }

  /**
   * Dynamically constructs a fallback feedback span directly beneath the target input or inside .cge-form-group.
   * @private
   */
  _createFallbackFeedback(errKey, input) {
    const span = document.createElement('span');
    span.className = 'cge-feedback text-red-500 text-xs mt-1 block';
    span.setAttribute('data-cge-feedback', errKey);
    span.setAttribute('data-cge-dynamic', 'true');

    const group = input.closest('.cge-form-group') || input.parentElement;
    if (group) {
      group.appendChild(span);
    } else {
      input.insertAdjacentElement('afterend', span);
    }

    return span;
  }

  /**
   * Clears error state for a single input and hides its associated feedback.
   * @param {HTMLElement} input
   * @private
   */
  _clearInputError(input) {
    if (!input) return;

    if (this.options.invalidClass) {
      const classes = this.options.invalidClass.split(/\s+/).filter(Boolean);
      input.classList.remove(...classes);
    }
    input.removeAttribute('aria-invalid');

    const group = input.closest('.cge-form-group') || input.parentElement;
    if (group) {
      // Find associated feedback inside group
      const feedbacks = group.querySelectorAll('.cge-feedback, .cge-error-feedback, [data-cge-feedback]');
      feedbacks.forEach((fb) => {
        fb.classList.add('hidden');
        fb.textContent = '';
      });

      // Check if any other invalid inputs remain in this group
      const remainingInvalids = group.querySelectorAll('[aria-invalid="true"]');
      if (remainingInvalids.length === 0 && this.options.groupErrorClass) {
        group.classList.remove(this.options.groupErrorClass);
      }
    }

    this._errorBoundInputs.delete(input);
  }

  /**
   * Clears all validation errors and feedback across the entire form.
   */
  clearErrors() {
    // Clear input classes and attributes
    const invalidInputs = this.form.querySelectorAll('[aria-invalid="true"]');
    invalidInputs.forEach((input) => {
      if (this.options.invalidClass) {
        const classes = this.options.invalidClass.split(/\s+/).filter(Boolean);
        input.classList.remove(...classes);
      }
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    });

    // Clear feedback containers
    const feedbacks = this.form.querySelectorAll('.cge-feedback, .cge-error-feedback, [data-cge-feedback]');
    feedbacks.forEach((fb) => {
      if (fb.hasAttribute('data-cge-dynamic')) {
        fb.remove();
      } else {
        fb.classList.add('hidden');
        fb.textContent = '';
      }
    });

    // Clear form groups
    if (this.options.groupErrorClass) {
      const groups = this.form.querySelectorAll(`.${this.options.groupErrorClass}`);
      groups.forEach((g) => g.classList.remove(this.options.groupErrorClass));
    }

    // Hide in-form success/error banners
    const banners = this.form.querySelectorAll('.cge-form-success, [data-cge-form-success], .cge-form-error, [data-cge-form-error]');
    banners.forEach((b) => {
      b.classList.add('hidden');
      b.textContent = '';
    });

    this._errorBoundInputs.clear();
  }

  /**
   * Resets all fields in the form and clears errors.
   */
  reset() {
    this.form.reset();
    this.clearErrors();
  }

  /**
   * Triggers the pluggable notification feedback bridge.
   * Supports: 'toast' | 'alert' | 'native' | 'sweetalert' | 'custom' | 'none'
   *
   * @param {'success' | 'validation' | 'error'} statusType
   * @param {string} message
   * @param {any} [payload]
   * @private
   */
  _triggerFeedback(statusType, message, payload) {
    const feedbackConf = this.options.feedback || {};

    // Check status-specific overrides
    let driver = feedbackConf.type || 'toast';
    let customHandler = null;

    if (statusType === 'success' && feedbackConf.onSuccess !== undefined) {
      if (typeof feedbackConf.onSuccess === 'function') customHandler = feedbackConf.onSuccess;
      else if (typeof feedbackConf.onSuccess === 'string') driver = feedbackConf.onSuccess;
    } else if (statusType === 'validation' && feedbackConf.onValidationError !== undefined) {
      if (typeof feedbackConf.onValidationError === 'function') customHandler = feedbackConf.onValidationError;
      else if (typeof feedbackConf.onValidationError === 'string') driver = feedbackConf.onValidationError;
    } else if (statusType === 'error' && feedbackConf.onError !== undefined) {
      if (typeof feedbackConf.onError === 'function') customHandler = feedbackConf.onError;
      else if (typeof feedbackConf.onError === 'string') driver = feedbackConf.onError;
    }

    if (customHandler) {
      customHandler(statusType, message, payload, this.form);
      return;
    }

    if (driver === 'none') {
      return;
    }

    const driverOptions = feedbackConf.options || {};
    const title = statusType === 'success' ? this.t('success') : this.t('error');

    // 1. CGEToast Driver
    if (driver === 'toast') {
      const toastLib = window.CGEToast || (window.TailTools && window.TailTools.CGEToast);
      if (toastLib && typeof toastLib.show === 'function') {
        const variant = statusType === 'success' ? 'success' : (statusType === 'validation' ? 'warning' : 'error');
        toastLib.show({
          title,
          message,
          variant,
          ...driverOptions
        });
        return;
      }
      // Fallback if CGEToast is not present
      driver = 'native';
    }

    // 2. CGEAlert Driver
    if (driver === 'alert') {
      const alertLib = window.CGEAlert || (window.TailTools && window.TailTools.CGEAlert);
      if (alertLib && typeof alertLib.fire === 'function') {
        const archetype = statusType === 'success' ? 'success' : (statusType === 'validation' ? 'warning' : 'error');
        alertLib.fire({
          archetype,
          title,
          message,
          ...driverOptions
        });
        return;
      }
      // Fallback if CGEAlert is not present
      driver = 'native';
    }

    // 3. SweetAlert2 Driver (Bridged without bundling)
    if (driver === 'sweetalert') {
      const swal = window.Swal;
      if (swal && typeof swal.fire === 'function') {
        const icon = statusType === 'success' ? 'success' : (statusType === 'validation' ? 'warning' : 'error');
        swal.fire({
          icon,
          title,
          text: message,
          ...driverOptions
        });
        return;
      }
      // Fallback if SweetAlert2 is not present on window
      driver = 'native';
    }

    // 4. Native Browser Alert
    if (driver === 'native') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  /**
   * Displays an in-form success message container if present.
   * @param {string} message
   * @private
   */
  _displayFormSuccess(message) {
    const successBanner = this.form.querySelector('.cge-form-success, [data-cge-form-success]');
    if (successBanner) {
      successBanner.textContent = message;
      successBanner.classList.remove('hidden');
      successBanner.style.removeProperty('display');
    }
  }

  /**
   * Extracts response message from payload in order:
   * 1. response.data.message
   * 2. response.data.status (if string)
   * 3. fallback string
   *
   * @param {any} response
   * @param {string} fallback
   * @returns {string}
   * @private
   */
  _extractMessage(response, fallback) {
    if (!response) return fallback;
    const data = response.data || response;
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.status === 'string' && data.status.trim() && isNaN(Number(data.status))) {
        return data.status.trim();
      }
    }
    return fallback;
  }

  /**
   * Extracts redirect URL from server response if present.
   * @param {any} response
   * @returns {string | null}
   * @private
   */
  _extractRedirect(response) {
    if (!response) return null;
    const data = response.data || response;
    if (data && typeof data === 'object') {
      if (typeof data.redirect === 'string') return data.redirect;
      if (data.data && typeof data.data.redirect === 'string') return data.data.redirect;
    }
    return null;
  }

  /**
   * Fluent instance event registration.
   * Supported events: 'submit' | 'success' | 'error' | 'invalid' | 'complete' | 'redirect' | 'progress'
   *
   * @param {string} event
   * @param {Function} callback
   * @returns {this}
   */
  on(event, callback) {
    if (typeof callback !== 'function') return this;
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return this;
  }

  /**
   * Fluent instance event unregistration.
   * @param {string} event
   * @param {Function} [callback]
   * @returns {this}
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return this;
    if (callback) {
      this._listeners.get(event).delete(callback);
    } else {
      this._listeners.delete(event);
    }
    return this;
  }

  /**
   * Dispatches instance callbacks.
   * @private
   */
  _emit(event, data) {
    if (this._destroyed) return;
    // Check direct constructor option hook (e.g. onSubmit, onSuccess, etc.)
    const hookName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    if (typeof this.options[hookName] === 'function') {
      try {
        this.options[hookName](data);
      } catch (err) {
        console.error(`[CGEForm] Error in option ${hookName}:`, err);
      }
    }

    // Call registered listeners
    const handlers = this._listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[CGEForm] Error in .on('${event}') handler:`, err);
        }
      }
    }
  }

  /**
   * Dispatches native bubbling DOM CustomEvents on the form and document.
   * Dispatched events: cge:form:submit, cge:form:success, cge:form:error, cge:form:invalid, cge:form:complete, cge:form:redirect, cge:form:progress
   *
   * @param {string} eventName
   * @param {any} detail
   * @private
   */
  _dispatchDOMEvent(eventName, detail) {
    if (this._destroyed) return;
    const fullEventName = `cge:form:${eventName}`;
    const customEvent = new CustomEvent(fullEventName, {
      bubbles: true,
      cancelable: true,
      detail
    });

    this.form.dispatchEvent(customEvent);
    if (!this.form.isConnected) {
      document.dispatchEvent(customEvent);
    }
  }

  /**
   * Programmatically triggers a form submission.
   * @returns {Promise<any>}
   */
  submit() {
    return this._handleSubmit();
  }

  /**
   * Completely destroys the CGEForm instance, removing listeners and clearing DOM references.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._requestController?.abort();
    clearTimeout(this._redirectTimer);
    if (this._isSubmitting) this._unfreezeForm();
    this.form.removeEventListener('submit', this._handleSubmit);
    if (this._handleClearError) {
      this.form.removeEventListener('input', this._handleClearError);
      this.form.removeEventListener('change', this._handleClearError);
    }
    if (this._addedNoValidate) this.form.removeAttribute('novalidate');
    this.clearErrors();
    this._listeners.clear();
    this._previouslyDisabled.clear();
    this._errorBoundInputs.clear();
    CGEForm.instances.delete(this.form);
  }
}
