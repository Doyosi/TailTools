/**
 * CGEDropzone - TailTools Plugin
 * Versatile, accessible drag-and-drop file uploader and preview manager
 * designed for Tailwind CSS v4.3+ and Laravel Blade environments.
 *
 * @license MIT
 * @package TailTools
 */

export class CGEDropzone {
  /**
   * Static Map registry mapping DOM elements / IDs to CGEDropzone instances.
   * @type {Map<HTMLElement | string, CGEDropzone>}
   */
  static instances = new Map();

  /**
   * Default configuration options.
   */
  static defaults = {
    url: null,
    method: 'POST',
    paramName: 'file',
    uploadMode: 'instant', // 'instant' | 'form'
    mode: 'standard', // 'standard' | 'avatar'
    aspectRatio: 'auto', // '1:1' | '16:9' | '300x600' | '1200x630' | '50x50' | 'auto'
    acceptedFiles: null, // e.g. 'image/*,.pdf,.zip'
    maxFileSize: 10, // In MB
    minFileSize: null, // In MB
    maxFiles: null, // Max files allowed (forced to 1 in avatar mode)
    maxConcurrent: 2, // Concurrency limit in instant upload mode
    autoProcessQueue: true, // Automatically start uploading when added
    headers: {},
    extraData: {}, // Object or function returning object
    removeUrl: null, // Endpoint for remote file deletion
    removeMethod: 'DELETE',
    confirmDelete: true, // Uses CGEAlert if available, otherwise native confirm
    driver: 'axios', // 'axios' | 'xhr' | 'fetch'
    axiosInstance: null,
    existingFiles: [], // [{ id, name, size, url, mimeType }]
    clickable: true, // Dropzone click triggers file picker
    previewContainer: null, // Custom container selector for previews (defaults to inside dropzone)
    renderPreview: null, // (fileItem, dropzone) => HTMLElement | string
    renderTrigger: null, // (dropzone) => HTMLElement | string
    ui: {
      container: 'cge-dropzone-container relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/70 dark:bg-slate-900/70 rounded-xl p-6 transition-all duration-200 cursor-pointer text-center select-none group',
      dragOver: '!border-indigo-600 dark:!border-indigo-400 !bg-indigo-50/50 dark:!bg-indigo-950/40 ring-4 ring-indigo-500/10',
      disabled: 'opacity-50 pointer-events-none cursor-not-allowed bg-slate-100 dark:bg-slate-900',
      trigger: 'cge-dropzone-trigger flex flex-col items-center justify-center gap-2 pointer-events-none',
      triggerIcon: 'cge-dropzone-trigger-icon w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors',
      triggerText: 'cge-dropzone-trigger-text text-sm font-semibold text-slate-700 dark:text-slate-200',
      triggerSubtext: 'cge-dropzone-trigger-subtext text-xs text-slate-400 dark:text-slate-500',
      previewsContainer: 'cge-dropzone-previews mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-left',
      previewCard: 'cge-dropzone-card relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col',
      previewMedia: 'cge-dropzone-media relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center',
      previewImage: 'cge-dropzone-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
      previewIconWrapper: 'p-6 flex flex-col items-center justify-center',
      fileIcon: 'w-12 h-12 text-slate-400 dark:text-slate-500',
      previewDetails: 'cge-dropzone-details p-3 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60',
      previewFileName: 'cge-dropzone-filename text-xs font-semibold text-slate-800 dark:text-slate-200 truncate',
      previewMeta: 'cge-dropzone-meta text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between mt-1',
      previewBadge: 'cge-dropzone-badge px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      progressBarContainer: 'cge-dropzone-progress-bg absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800 overflow-hidden',
      progressBar: 'cge-dropzone-progress-bar h-full bg-indigo-600 transition-all duration-200 ease-out',
      progressBarSuccess: 'bg-emerald-500',
      progressBarError: 'bg-rose-500',
      statusOverlay: 'cge-dropzone-status-overlay absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-center transition-opacity',
      removeBtn: 'cge-dropzone-remove absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white shadow-xs backdrop-blur-sm transition-all cursor-pointer z-10',
      cancelBtn: 'cge-dropzone-cancel absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-amber-600 text-white shadow-xs backdrop-blur-sm transition-all cursor-pointer z-10',
      retryBtn: 'cge-dropzone-retry mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer',
      errorText: 'cge-dropzone-error text-[10px] text-rose-600 dark:text-rose-400 mt-1 line-clamp-2',
      // Avatar mode specific
      avatarContainer: 'cge-avatar-container relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer group flex items-center justify-center select-none mx-auto',
      avatarImage: 'cge-avatar-image w-full h-full object-cover',
      avatarOverlay: 'cge-avatar-overlay absolute inset-0 bg-slate-950/50 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium gap-1',
      avatarIcon: 'w-6 h-6 text-white'
    },
    translations: {
      "dict-default-message": "Drop files here or click to browse",
      "dict-fallback-message": "Your browser does not support drag and drop uploads.",
      "dict-file-too-big": "File is too large (:fileSize MB). Max size: :maxFileSize MB.",
      "dict-file-too-small": "File is too small (:fileSize MB). Min size: :minFileSize MB.",
      "dict-invalid-file-type": "You cannot upload files of this type.",
      "dict-response-error": "Server responded with :statusCode code.",
      "dict-cancel-upload": "Cancel upload",
      "dict-cancel-confirmation": "Are you sure you want to cancel this upload?",
      "dict-remove-file": "Delete file",
      "dict-remove-confirmation": "Are you sure you want to delete this file?",
      "dict-max-files-exceeded": "You cannot upload more than :maxFiles files.",
      "dict-uploading": "Uploading...",
      "dict-uploaded": "Completed",
      "dict-retry": "Retry",
      "dict-avatar-prompt": "Change Photo"
    }
  };

  /**
   * Global localization dictionary.
   */
  static translations = { ...CGEDropzone.defaults.translations };

  /**
   * Updates global default translations.
   * @param {Object} dict
   */
  static setTranslations(dict) {
    CGEDropzone.translations = { ...CGEDropzone.translations, ...dict };
  }

  /**
   * Returns an active CGEDropzone instance by DOM Element or CSS Selector.
   * @param {string | HTMLElement} target
   * @returns {CGEDropzone | null}
   */
  static get(target) {
    if (typeof target === 'string') {
      const el = document.querySelector(target);
      return el ? CGEDropzone.instances.get(el) || null : null;
    }
    return CGEDropzone.instances.get(target) || null;
  }

  /**
   * Automatically initializes all declarative dropzones on the page.
   * @param {string | HTMLElement | Document} [root=document]
   * @param {Object} [options={}]
   * @returns {CGEDropzone[]}
   */
  static init(root = document, options = {}) {
    const scope = typeof root === 'string' ? document.querySelector(root) || document : root;
    const elements = scope.querySelectorAll('[data-cge-dropzone]');
    const initialized = [];

    elements.forEach(el => {
      if (!CGEDropzone.instances.has(el)) {
        try {
          const instance = new CGEDropzone(el, options);
          initialized.push(instance);
        } catch (err) {
          console.error('[CGEDropzone] Failed to initialize element:', el, err);
        }
      }
    });

    return initialized;
  }

  /**
   * @param {string | HTMLElement} target - Container element or selector string
   * @param {Object} [options={}] - Custom configuration options
   */
  constructor(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('[CGEDropzone] A valid HTMLElement or matching selector is required.');
    }

    if (CGEDropzone.instances.has(element)) {
      return CGEDropzone.instances.get(element);
    }

    this.element = element;
    this.options = this._resolveOptions(options);

    // Avatar mode forces single file
    if (this.options.mode === 'avatar') {
      this.options.maxFiles = 1;
    }

    // State
    this.files = []; // Array of DropzoneFile objects
    this.isDisabled = false;
    this.isUploading = false;
    this._listeners = new Map();
    this._activeUploadsCount = 0;

    // DOM Elements
    this.hiddenInput = null;
    this.previewsContainer = null;
    this.triggerContainer = null;
    this.form = this.element.closest('form') || null;

    // Build UI and bind events
    this._buildUI();
    this._bindEvents();
    this._loadExistingFiles();

    // Register instance
    CGEDropzone.instances.set(this.element, this);
    if (this.element.id) {
      CGEDropzone.instances.set(this.element.id, this);
    }
  }

  // =========================================================================
  // Initialization & Options Resolution
  // =========================================================================

  /**
   * Merges defaults, data-cge-* attributes, and explicit JS options.
   * @private
   */
  _resolveOptions(userOptions) {
    const ds = this.element.dataset;
    let jsonOptions = {};

    if (ds.cgeDropzone && ds.cgeDropzone.trim().startsWith('{')) {
      try {
        jsonOptions = JSON.parse(ds.cgeDropzone);
      } catch (e) {
        console.warn('[CGEDropzone] Failed to parse JSON in data-cge-dropzone attribute:', e);
      }
    }

    const dataAttrOptions = {};
    if (ds.cgeUrl) dataAttrOptions.url = ds.cgeUrl;
    if (ds.cgeMethod) dataAttrOptions.method = ds.cgeMethod.toUpperCase();
    if (ds.cgeParamName) dataAttrOptions.paramName = ds.cgeParamName;
    if (ds.cgeUploadMode) dataAttrOptions.uploadMode = ds.cgeUploadMode;
    if (ds.cgeMode) dataAttrOptions.mode = ds.cgeMode;
    if (ds.cgeAspectRatio) dataAttrOptions.aspectRatio = ds.cgeAspectRatio;
    if (ds.cgeAcceptedFiles) dataAttrOptions.acceptedFiles = ds.cgeAcceptedFiles;
    if (ds.cgeMaxFileSize) dataAttrOptions.maxFileSize = parseFloat(ds.cgeMaxFileSize);
    if (ds.cgeMinFileSize) dataAttrOptions.minFileSize = parseFloat(ds.cgeMinFileSize);
    if (ds.cgeMaxFiles) dataAttrOptions.maxFiles = parseInt(ds.cgeMaxFiles, 10);
    if (ds.cgeMaxConcurrent) dataAttrOptions.maxConcurrent = parseInt(ds.cgeMaxConcurrent, 10);
    if (ds.cgeAutoProcessQueue !== undefined) dataAttrOptions.autoProcessQueue = ds.cgeAutoProcessQueue !== 'false';
    if (ds.cgeRemoveUrl) dataAttrOptions.removeUrl = ds.cgeRemoveUrl;
    if (ds.cgeRemoveMethod) dataAttrOptions.removeMethod = ds.cgeRemoveMethod.toUpperCase();
    if (ds.cgeConfirmDelete !== undefined) dataAttrOptions.confirmDelete = ds.cgeConfirmDelete !== 'false';
    if (ds.cgeDriver) dataAttrOptions.driver = ds.cgeDriver;
    if (ds.cgeExtraData) {
      try {
        dataAttrOptions.extraData = JSON.parse(ds.cgeExtraData);
      } catch (e) {
        console.warn('[CGEDropzone] Failed to parse JSON extraData:', e);
      }
    }

    return {
      ...CGEDropzone.defaults,
      translations: {
        ...CGEDropzone.translations,
        ...(userOptions.translations || {})
      },
      ui: {
        ...CGEDropzone.defaults.ui,
        ...(userOptions.ui || {})
      },
      ...jsonOptions,
      ...dataAttrOptions,
      ...userOptions
    };
  }

  // =========================================================================
  // DOM Construction
  // =========================================================================

  /**
   * Sets up HTML structure, hidden file input, and preview zones.
   * @private
   */
  _buildUI() {
    const isAvatar = this.options.mode === 'avatar';

    // Apply baseline styling classes to root element
    if (isAvatar) {
      this.element.className = `${this.options.ui.avatarContainer} ${this.element.className || ''}`.trim();
    } else {
      this.element.className = `${this.options.ui.container} ${this.element.className || ''}`.trim();
    }

    this.element.setAttribute('role', 'region');
    this.element.setAttribute('tabindex', '0');
    this.element.setAttribute('aria-label', this._t('dict-default-message'));

    // Create hidden file input
    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'file';
    this.hiddenInput.className = 'hidden sr-only';
    this.hiddenInput.tabIndex = -1;
    this.hiddenInput.setAttribute('aria-hidden', 'true');

    if (this.options.acceptedFiles) {
      this.hiddenInput.accept = this.options.acceptedFiles;
    }
    if (this.options.maxFiles !== 1 && !isAvatar) {
      this.hiddenInput.multiple = true;
    }
    if (this.options.paramName) {
      this.hiddenInput.name = this.options.paramName + (this.hiddenInput.multiple ? '[]' : '');
    }

    this.element.appendChild(this.hiddenInput);

    if (isAvatar) {
      this._buildAvatarUI();
    } else {
      this._buildStandardUI();
    }
  }

  /**
   * Builds Standard multi-file dropzone trigger and preview container.
   * @private
   */
  _buildStandardUI() {
    // If element already contains custom inner HTML, preserve it or render trigger
    if (!this.element.querySelector('.cge-dropzone-trigger') && this.element.children.length <= 1) {
      if (typeof this.options.renderTrigger === 'function') {
        const customTrigger = this.options.renderTrigger(this);
        if (typeof customTrigger === 'string') {
          const div = document.createElement('div');
          div.innerHTML = customTrigger;
          this.triggerContainer = div.firstElementChild || div;
        } else {
          this.triggerContainer = customTrigger;
        }
      } else {
        this.triggerContainer = document.createElement('div');
        this.triggerContainer.className = this.options.ui.trigger;
        this.triggerContainer.innerHTML = `
          <svg class="${this.options.ui.triggerIcon}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <div class="${this.options.ui.triggerText}">${this._t('dict-default-message')}</div>
          <div class="${this.options.ui.triggerSubtext}">
            ${this.options.acceptedFiles ? this.options.acceptedFiles.replace(/,/g, ', ') : 'Any file'}
            ${this.options.maxFileSize ? ` • Max ${this.options.maxFileSize}MB` : ''}
          </div>
        `;
      }
      this.element.appendChild(this.triggerContainer);
    } else {
      this.triggerContainer = this.element.querySelector('.cge-dropzone-trigger') || this.element;
    }

    // Previews container setup
    if (this.options.previewContainer) {
      this.previewsContainer = typeof this.options.previewContainer === 'string'
        ? document.querySelector(this.options.previewContainer)
        : this.options.previewContainer;
    }

    if (!this.previewsContainer) {
      this.previewsContainer = document.createElement('div');
      this.previewsContainer.className = this.options.ui.previewsContainer;
      this.element.appendChild(this.previewsContainer);
    }
  }

  /**
   * Builds Avatar single-file container.
   * @private
   */
  _buildAvatarUI() {
    this.avatarImage = document.createElement('img');
    this.avatarImage.className = `${this.options.ui.avatarImage} hidden`;
    this.avatarImage.alt = 'Avatar Preview';

    this.avatarPlaceholder = document.createElement('div');
    this.avatarPlaceholder.className = 'w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500';
    this.avatarPlaceholder.innerHTML = `
      <svg class="${this.options.ui.avatarIcon} w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <span class="text-[10px] font-medium tracking-tight">Upload</span>
    `;

    this.avatarOverlay = document.createElement('div');
    this.avatarOverlay.className = this.options.ui.avatarOverlay;
    this.avatarOverlay.innerHTML = `
      <svg class="${this.options.ui.avatarIcon}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
      <span>${this._t('dict-avatar-prompt')}</span>
    `;

    this.element.appendChild(this.avatarImage);
    this.element.appendChild(this.avatarPlaceholder);
    this.element.appendChild(this.avatarOverlay);
  }

  /**
   * Loads initial pre-existing files if supplied in options.
   * @private
   */
  _loadExistingFiles() {
    if (Array.isArray(this.options.existingFiles) && this.options.existingFiles.length > 0) {
      this.options.existingFiles.forEach(f => {
        const fileItem = {
          id: f.id || 'cge-file-' + Math.random().toString(36).substring(2, 9),
          file: null,
          name: f.name || 'Existing File',
          size: f.size || 0,
          type: f.mimeType || this._inferMimeType(f.name || f.url || ''),
          formattedSize: this._formatBytes(f.size || 0),
          status: 'success',
          progress: 100,
          previewUrl: f.url || null,
          isImage: (f.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.name || f.url || ''),
          isExisting: true,
          xhr: null,
          abortController: null,
          errorMessage: null,
          response: f,
          domCard: null
        };

        this.files.push(fileItem);
        this._renderFileCard(fileItem);
      });

      this._syncFormInput();
    }
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================

  /**
   * Binds drag, drop, file picker, and keyboard handlers.
   * @private
   */
  _bindEvents() {
    // Click triggers file picker
    if (this.options.clickable) {
      this._onClickListener = (e) => {
        if (this.isDisabled) return;
        // Don't trigger if user clicked directly on a button, remove icon, or existing preview card
        if (e.target.closest('button') || e.target.closest('.cge-dropzone-remove') || e.target.closest('.cge-dropzone-cancel') || e.target.closest('.cge-dropzone-retry')) {
          return;
        }
        if (this.options.mode !== 'avatar' && e.target.closest('.cge-dropzone-card')) {
          return;
        }
        this.hiddenInput.click();
      };
      this.element.addEventListener('click', this._onClickListener);
    }

    // Keyboard support (Space / Enter)
    this._onKeyDownListener = (e) => {
      if (this.isDisabled) return;
      if (e.target === this.element && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.hiddenInput.click();
      }
    };
    this.element.addEventListener('keydown', this._onKeyDownListener);

    // Native file input change
    this._onInputChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.addFiles(e.target.files);
        // Reset input value so same file can be selected again
        this.hiddenInput.value = '';
      }
    };
    this.hiddenInput.addEventListener('change', this._onInputChange);

    // Drag & Drop handlers
    this._onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.isDisabled) return;
      this.element.classList.add(...this.options.ui.dragOver.split(' '));
    };

    this._onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.isDisabled) return;
      e.dataTransfer.dropEffect = 'copy';
      this.element.classList.add(...this.options.ui.dragOver.split(' '));
    };

    this._onDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only remove if leaving root dropzone
      if (e.relatedTarget && this.element.contains(e.relatedTarget)) return;
      this.element.classList.remove(...this.options.ui.dragOver.split(' '));
    };

    this._onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.remove(...this.options.ui.dragOver.split(' '));
      if (this.isDisabled) return;

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.addFiles(e.dataTransfer.files);
      }
    };

    this.element.addEventListener('dragenter', this._onDragEnter);
    this.element.addEventListener('dragover', this._onDragOver);
    this.element.addEventListener('dragleave', this._onDragLeave);
    this.element.addEventListener('drop', this._onDrop);

    // Listen to form submit if in 'form' mode to ensure FormData contains our files
    if (this.form && this.options.uploadMode === 'form') {
      this._onFormSubmit = (e) => {
        this._syncFormInput();
      };
      this.form.addEventListener('submit', this._onFormSubmit);
    }
  }

  // =========================================================================
  // File Management & Public API
  // =========================================================================

  /**
   * Adds multiple files to the dropzone.
   * @param {FileList | File[]} fileList
   */
  addFiles(fileList) {
    const arr = Array.from(fileList);
    arr.forEach(file => this.addFile(file));
  }

  /**
   * Adds a single file to the dropzone, validates it, and queues/starts upload.
   * @param {File} file
   * @returns {Object | null} Created fileItem or null if rejected
   */
  addFile(file) {
    if (this.isDisabled) return null;

    // Check Max Files constraint
    const activeFilesCount = this.files.filter(f => f.status !== 'error' && f.status !== 'canceled').length;
    if (this.options.maxFiles !== null && activeFilesCount >= this.options.maxFiles) {
      if (this.options.mode === 'avatar') {
        // In avatar mode, replace existing file cleanly
        this.clear();
      } else {
        const errorMsg = this._t('dict-max-files-exceeded', { maxFiles: this.options.maxFiles });
        this._emit('error', null, errorMsg);
        return null;
      }
    }

    // Validate file
    const validation = this._validateFile(file);

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    const fileItem = {
      id: 'cge-file-' + Math.random().toString(36).substring(2, 9),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type || this._inferMimeType(file.name),
      formattedSize: this._formatBytes(file.size),
      status: validation.valid ? 'queued' : 'error',
      progress: 0,
      previewUrl: previewUrl,
      isImage: isImage,
      isExisting: false,
      xhr: null,
      abortController: null,
      errorMessage: validation.error || null,
      response: null,
      domCard: null
    };

    this.files.push(fileItem);

    // Render Preview
    this._renderFileCard(fileItem);

    // Sync native file input for form mode
    this._syncFormInput();

    // Trigger events
    this._emit('add', fileItem);
    if (typeof this.options.onAddedFile === 'function') {
      this.options.onAddedFile(fileItem);
    }

    if (!validation.valid) {
      this._emit('error', fileItem, fileItem.errorMessage);
      if (typeof this.options.onError === 'function') {
        this.options.onError(fileItem, fileItem.errorMessage);
      }
      return fileItem;
    }

    // If instant upload mode and autoProcessQueue is enabled, start upload
    if (this.options.uploadMode === 'instant' && this.options.autoProcessQueue) {
      this._processQueue();
    }

    return fileItem;
  }

  /**
   * Removes a file by ID or file object.
   * @param {string | Object} fileOrId
   * @param {boolean} [silent=false]
   */
  async removeFile(fileOrId, silent = false) {
    const fileId = typeof fileOrId === 'string' ? fileOrId : fileOrId.id;
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) return;

    const fileItem = this.files[index];

    // Confirmation if already uploaded or removeUrl is active
    if (!silent && this.options.confirmDelete && fileItem.status === 'success' && this.options.removeUrl) {
      const confirmed = await this._confirmAction(this._t('dict-remove-confirmation'));
      if (!confirmed) return;
    }

    // If currently uploading, cancel first
    if (fileItem.status === 'uploading') {
      this.cancelUpload(fileId);
    }

    // If remote delete URL is provided and file was successfully uploaded
    if (this.options.removeUrl && fileItem.status === 'success') {
      try {
        await this._sendDeleteRequest(fileItem);
      } catch (err) {
        console.error('[CGEDropzone] Failed to delete file on server:', err);
      }
    }

    // Cleanup Object URL to prevent memory leaks
    if (fileItem.previewUrl && fileItem.isImage && !fileItem.isExisting) {
      URL.revokeObjectURL(fileItem.previewUrl);
    }

    // Remove DOM Card
    if (fileItem.domCard && fileItem.domCard.parentNode) {
      fileItem.domCard.remove();
    }

    // Remove from internal array
    this.files.splice(index, 1);

    // Update Avatar UI if avatar mode
    if (this.options.mode === 'avatar') {
      this.avatarImage.src = '';
      this.avatarImage.classList.add('hidden');
      this.avatarPlaceholder.classList.remove('hidden');
    }

    // Sync input
    this._syncFormInput();

    // Trigger events
    if (!silent) {
      this._emit('removed', fileItem);
      if (typeof this.options.onRemoved === 'function') {
        this.options.onRemoved(fileItem);
      }
    }

    // Re-check queue if uploading
    if (this.options.uploadMode === 'instant') {
      this._processQueue();
    }
  }

  /**
   * Clears all files from the dropzone.
   */
  clear() {
    const copy = [...this.files];
    copy.forEach(f => this.removeFile(f.id, true));
    this.files = [];
    if (this.previewsContainer) {
      this.previewsContainer.innerHTML = '';
    }
    this._syncFormInput();
  }

  /**
   * Uploads all queued files (instant mode).
   */
  uploadAll() {
    if (this.isDisabled) return;
    const queued = this.getQueuedFiles();
    queued.forEach(f => this.uploadFile(f.id));
  }

  /**
   * Uploads a specific file by its ID.
   * @param {string} fileId
   */
  async uploadFile(fileId) {
    const fileItem = this.files.find(f => f.id === fileId);
    if (!fileItem || fileItem.status === 'uploading' || fileItem.status === 'success') {
      return;
    }

    const uploadUrl = this.options.url || (this.form ? this.form.action : null);
    if (!uploadUrl) {
      console.error('[CGEDropzone] No upload URL specified in options or enclosing form.');
      return;
    }

    fileItem.status = 'uploading';
    fileItem.progress = 0;
    fileItem.errorMessage = null;
    this._activeUploadsCount++;
    this._updateCardUI(fileItem);

    // Build payload
    const formData = new FormData();
    formData.append(this.options.paramName, fileItem.file, fileItem.name);

    // Append extraData
    let extra = typeof this.options.extraData === 'function' ? this.options.extraData(fileItem) : this.options.extraData;
    if (extra && typeof extra === 'object') {
      for (const [key, val] of Object.entries(extra)) {
        formData.append(key, val);
      }
    }

    // Headers & CSRF
    const headers = this._buildHeaders();

    try {
      let response;
      const driver = (this.options.driver || 'axios').toLowerCase();

      if (driver === 'axios' && (window.axios || this.options.axiosInstance)) {
        response = await this._uploadWithAxios(uploadUrl, formData, headers, fileItem);
      } else {
        // Fallback to XHR driver (ensures 100% reliable upload progress events)
        response = await this._uploadWithXHR(uploadUrl, formData, headers, fileItem);
      }

      fileItem.status = 'success';
      fileItem.progress = 100;
      fileItem.response = response;
      this._updateCardUI(fileItem);

      this._emit('progress', fileItem, 100);
      this._emit('success', fileItem, response);
      if (typeof this.options.onUploadProgress === 'function') {
        this.options.onUploadProgress(fileItem, 100);
      }
      if (typeof this.options.onSuccess === 'function') {
        this.options.onSuccess(fileItem, response);
      }
    } catch (err) {
      if (fileItem.status !== 'canceled') {
        fileItem.status = 'error';
        fileItem.errorMessage = err.message || this._t('dict-response-error', { statusCode: err.status || '500' });
        this._updateCardUI(fileItem);

        this._emit('error', fileItem, fileItem.errorMessage);
        if (typeof this.options.onError === 'function') {
          this.options.onError(fileItem, fileItem.errorMessage);
        }
      }
    } finally {
      this._activeUploadsCount = Math.max(0, this._activeUploadsCount - 1);
      fileItem.xhr = null;
      fileItem.abortController = null;
      this._processQueue();
    }
  }

  /**
   * Cancels an active in-flight file upload.
   * @param {string} fileId
   */
  cancelUpload(fileId) {
    const fileItem = this.files.find(f => f.id === fileId);
    if (!fileItem || fileItem.status !== 'uploading') return;

    if (fileItem.xhr) {
      fileItem.xhr.abort();
    }
    if (fileItem.abortController) {
      fileItem.abortController.abort();
    }

    fileItem.status = 'canceled';
    this._activeUploadsCount = Math.max(0, this._activeUploadsCount - 1);
    this.removeFile(fileId, true);
  }

  /**
   * Retries uploading a failed file.
   * @param {string} fileId
   */
  retryUpload(fileId) {
    const fileItem = this.files.find(f => f.id === fileId);
    if (!fileItem) return;
    fileItem.status = 'queued';
    fileItem.errorMessage = null;
    fileItem.progress = 0;
    this._updateCardUI(fileItem);
    this.uploadFile(fileId);
  }

  /**
   * Disables user interaction.
   */
  disable() {
    this.isDisabled = true;
    this.element.classList.add(...this.options.ui.disabled.split(' '));
    this.hiddenInput.disabled = true;
  }

  /**
   * Enables user interaction.
   */
  enable() {
    this.isDisabled = false;
    this.element.classList.remove(...this.options.ui.disabled.split(' '));
    this.hiddenInput.disabled = false;
  }

  /**
   * Completely destroys dropzone, removes listeners, and cleans up memory.
   */
  destroy() {
    // Revoke all object URLs
    this.files.forEach(f => {
      if (f.previewUrl && f.isImage && !f.isExisting) {
        URL.revokeObjectURL(f.previewUrl);
      }
      if (f.status === 'uploading') {
        this.cancelUpload(f.id);
      }
    });

    // Remove event listeners
    if (this._onClickListener) {
      this.element.removeEventListener('click', this._onClickListener);
    }
    if (this._onKeyDownListener) {
      this.element.removeEventListener('keydown', this._onKeyDownListener);
    }
    if (this._onInputChange) {
      this.hiddenInput.removeEventListener('change', this._onInputChange);
    }
    this.element.removeEventListener('dragenter', this._onDragEnter);
    this.element.removeEventListener('dragover', this._onDragOver);
    this.element.removeEventListener('dragleave', this._onDragLeave);
    this.element.removeEventListener('drop', this._onDrop);

    if (this.form && this._onFormSubmit) {
      this.form.removeEventListener('submit', this._onFormSubmit);
    }

    // Clean DOM
    if (this.hiddenInput && this.hiddenInput.parentNode) {
      this.hiddenInput.remove();
    }
    if (this.previewsContainer && this.previewsContainer !== this.element) {
      this.previewsContainer.innerHTML = '';
    }

    CGEDropzone.instances.delete(this.element);
    if (this.element.id) {
      CGEDropzone.instances.delete(this.element.id);
    }
  }

  // =========================================================================
  // Getters & Utility Methods
  // =========================================================================

  getFiles() {
    return [...this.files];
  }

  getQueuedFiles() {
    return this.files.filter(f => f.status === 'queued');
  }

  getUploadingFiles() {
    return this.files.filter(f => f.status === 'uploading');
  }

  getCompletedFiles() {
    return this.files.filter(f => f.status === 'success');
  }

  getFailedFiles() {
    return this.files.filter(f => f.status === 'error');
  }

  /**
   * Appends all active valid files to a FormData instance.
   * Useful for batch forms or CGEForm integration.
   * @param {FormData} formData
   * @param {string} [fieldName]
   */
  appendToFormData(formData, fieldName = null) {
    const name = fieldName || this.options.paramName || 'file';
    const isMultiple = this.options.maxFiles !== 1;
    const filesToAppend = this.files.filter(f => f.file instanceof File);

    filesToAppend.forEach(f => {
      formData.append(isMultiple ? `${name}[]` : name, f.file, f.name);
    });
  }

  // =========================================================================
  // Internal Upload Queue & Network Handlers
  // =========================================================================

  /**
   * Processes queued files based on maxConcurrent settings.
   * @private
   */
  _processQueue() {
    if (this.isDisabled || this.options.uploadMode !== 'instant') return;

    const queued = this.getQueuedFiles();
    if (queued.length === 0) {
      if (this._activeUploadsCount === 0 && this.files.length > 0) {
        this._emit('complete');
        if (typeof this.options.onQueueComplete === 'function') {
          this.options.onQueueComplete();
        }
      }
      return;
    }

    const availableSlots = Math.max(0, (this.options.maxConcurrent || 2) - this._activeUploadsCount);
    for (let i = 0; i < Math.min(availableSlots, queued.length); i++) {
      this.uploadFile(queued[i].id);
    }
  }

  /**
   * Uploads file via XMLHttpRequest with precise progress event reporting.
   * @private
   */
  _uploadWithXHR(url, formData, headers, fileItem) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      fileItem.xhr = xhr;

      xhr.open(this.options.method || 'POST', url, true);

      // Apply headers
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      // Progress reporting
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          fileItem.progress = percent;
          this._updateCardUI(fileItem);
          this._emit('progress', fileItem, percent);
          if (typeof this.options.onUploadProgress === 'function') {
            this.options.onUploadProgress(fileItem, percent);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let jsonResponse;
          try {
            jsonResponse = JSON.parse(xhr.responseText);
          } catch {
            jsonResponse = xhr.responseText;
          }
          resolve(jsonResponse);
        } else {
          const err = new Error(this._t('dict-response-error', { statusCode: xhr.status }));
          err.status = xhr.status;
          err.responseText = xhr.responseText;
          reject(err);
        }
      };

      xhr.onerror = () => {
        const err = new Error('Network error during file upload');
        err.status = 0;
        reject(err);
      };

      xhr.onabort = () => {
        const err = new Error('Upload aborted by user');
        err.status = -1;
        reject(err);
      };

      xhr.send(formData);
    });
  }

  /**
   * Uploads file via Axios instance.
   * @private
   */
  async _uploadWithAxios(url, formData, headers, fileItem) {
    const axiosLib = window.axios || this.options.axiosInstance;
    const abortController = new AbortController();
    fileItem.abortController = abortController;

    const res = await axiosLib({
      url: url,
      method: (this.options.method || 'POST').toLowerCase(),
      data: formData,
      headers: headers,
      signal: abortController.signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          fileItem.progress = percent;
          this._updateCardUI(fileItem);
          this._emit('progress', fileItem, percent);
          if (typeof this.options.onUploadProgress === 'function') {
            this.options.onUploadProgress(fileItem, percent);
          }
        }
      }
    });

    return res.data;
  }

  /**
   * Dispatches DELETE request for a server-hosted file.
   * @private
   */
  async _sendDeleteRequest(fileItem) {
    const url = this.options.removeUrl;
    const method = this.options.removeMethod || 'DELETE';
    const headers = this._buildHeaders();
    const payload = { id: fileItem.id, name: fileItem.name, response: fileItem.response };

    if (window.axios || this.options.axiosInstance) {
      const axiosLib = window.axios || this.options.axiosInstance;
      return axiosLib({
        url: url,
        method: method.toLowerCase(),
        data: payload,
        headers: headers
      });
    } else {
      return fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
    }
  }

  /**
   * Prompts user confirmation using CGEAlert if present, otherwise native window.confirm.
   * @private
   */
  async _confirmAction(message) {
    if (window.CGEAlert && typeof window.CGEAlert.confirm === 'function') {
      const res = await window.CGEAlert.confirm({
        title: this._t('dict-remove-file'),
        text: message,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        variant: 'danger'
      });
      return res && res.isConfirmed;
    }
    return window.confirm(message);
  }

  /**
   * Synchronizes internal files with hidden <input type="file"> via DataTransfer.
   * @private
   */
  _syncFormInput() {
    if (!this.hiddenInput) return;

    try {
      const dt = new DataTransfer();
      const validFiles = this.files.filter(f => f.file instanceof File && f.status !== 'error' && f.status !== 'canceled');

      validFiles.forEach(f => {
        dt.items.add(f.file);
      });

      this.hiddenInput.files = dt.files;
    } catch (e) {
      // DataTransfer is supported in modern browsers; fail gracefully if restricted
    }
  }

  /**
   * Automatically gathers Laravel CSRF token and XML headers.
   * @private
   */
  _buildHeaders() {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...this.options.headers
    };

    // Extract CSRF
    let csrfToken = null;
    const metaCsrf = document.querySelector('meta[name="csrf-token"]');
    if (metaCsrf) {
      csrfToken = metaCsrf.getAttribute('content');
    }

    if (!csrfToken && this.form) {
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

  // =========================================================================
  // Validation Engine
  // =========================================================================

  /**
   * Validates file size and MIME type.
   * @private
   */
  _validateFile(file) {
    // Max file size
    if (this.options.maxFileSize !== null) {
      const maxBytes = this.options.maxFileSize * 1024 * 1024;
      if (file.size > maxBytes) {
        return {
          valid: false,
          error: this._t('dict-file-too-big', {
            fileSize: (file.size / (1024 * 1024)).toFixed(1),
            maxFileSize: this.options.maxFileSize
          })
        };
      }
    }

    // Min file size
    if (this.options.minFileSize !== null) {
      const minBytes = this.options.minFileSize * 1024 * 1024;
      if (file.size < minBytes) {
        return {
          valid: false,
          error: this._t('dict-file-too-small', {
            fileSize: (file.size / (1024 * 1024)).toFixed(1),
            minFileSize: this.options.minFileSize
          })
        };
      }
    }

    // Accepted files
    if (this.options.acceptedFiles) {
      const rules = this.options.acceptedFiles.split(',').map(s => s.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const mime = (file.type || '').toLowerCase();

      const matches = rules.some(rule => {
        if (rule.startsWith('.')) {
          return fileName.endsWith(rule);
        } else if (rule.endsWith('/*')) {
          const prefix = rule.replace('/*', '');
          return mime.startsWith(prefix);
        } else {
          return mime === rule;
        }
      });

      if (!matches) {
        return {
          valid: false,
          error: this._t('dict-invalid-file-type')
        };
      }
    }

    return { valid: true };
  }

  // =========================================================================
  // Preview Rendering Engine
  // =========================================================================

  /**
   * Renders the preview card for standard or avatar mode.
   * @private
   */
  _renderFileCard(fileItem) {
    if (this.options.mode === 'avatar') {
      this._renderAvatarPreview(fileItem);
      return;
    }

    if (!this.previewsContainer) return;

    // Custom preview render hook
    if (typeof this.options.renderPreview === 'function') {
      const customEl = this.options.renderPreview(fileItem, this);
      let cardEl;
      if (typeof customEl === 'string') {
        const div = document.createElement('div');
        div.innerHTML = customEl;
        cardEl = div.firstElementChild || div;
      } else {
        cardEl = customEl;
      }
      fileItem.domCard = cardEl;
      this.previewsContainer.appendChild(cardEl);
      return;
    }

    const card = document.createElement('div');
    card.className = this.options.ui.previewCard;
    card.id = fileItem.id;
    fileItem.domCard = card;

    // Calculate aspect ratio utility class
    const aspectClass = this._getAspectRatioClass();

    // Media slot (Image or Semantic SVG File Icon)
    const mediaContainer = document.createElement('div');
    mediaContainer.className = `${this.options.ui.previewMedia} ${aspectClass}`;

    if (fileItem.isImage && fileItem.previewUrl) {
      const img = document.createElement('img');
      img.src = fileItem.previewUrl;
      img.alt = fileItem.name;
      img.className = this.options.ui.previewImage;
      mediaContainer.appendChild(img);
    } else {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = this.options.ui.previewIconWrapper;
      iconWrapper.innerHTML = this._getMimeIconSVG(fileItem.type, fileItem.name);
      mediaContainer.appendChild(iconWrapper);
    }

    // Cancel Button (visible during upload)
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = `${this.options.ui.cancelBtn} ${fileItem.status === 'uploading' ? '' : 'hidden'}`;
    cancelBtn.title = this._t('dict-cancel-upload');
    cancelBtn.innerHTML = `
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cancelUpload(fileItem.id);
    });
    mediaContainer.appendChild(cancelBtn);

    // Remove Button (visible when not uploading)
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = `${this.options.ui.removeBtn} ${fileItem.status === 'uploading' ? 'hidden' : ''}`;
    removeBtn.title = this._t('dict-remove-file');
    removeBtn.innerHTML = `
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    `;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeFile(fileItem.id);
    });
    mediaContainer.appendChild(removeBtn);

    // Progress Bar
    const progressBg = document.createElement('div');
    progressBg.className = `${this.options.ui.progressBarContainer} ${fileItem.status === 'uploading' ? '' : 'hidden'}`;
    const progressBar = document.createElement('div');
    progressBar.className = this.options.ui.progressBar;
    progressBar.style.width = `${fileItem.progress}%`;
    progressBg.appendChild(progressBar);
    mediaContainer.appendChild(progressBg);

    card.appendChild(mediaContainer);

    // Card Details Footer
    const details = document.createElement('div');
    details.className = this.options.ui.previewDetails;

    const ext = fileItem.name.split('.').pop() || 'FILE';

    details.innerHTML = `
      <div>
        <div class="${this.options.ui.previewFileName}" title="${fileItem.name}">${fileItem.name}</div>
        <div class="${this.options.ui.previewMeta}">
          <span>${fileItem.formattedSize}</span>
          <span class="${this.options.ui.previewBadge}">${ext}</span>
        </div>
      </div>
      <div class="cge-dropzone-error-container ${fileItem.status === 'error' ? '' : 'hidden'}">
        <div class="${this.options.ui.errorText}">${fileItem.errorMessage || ''}</div>
        <button type="button" class="${this.options.ui.retryBtn}">${this._t('dict-retry')}</button>
      </div>
    `;

    // Hook up retry button
    const retryBtn = details.querySelector('.cge-dropzone-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.retryUpload(fileItem.id);
      });
    }

    card.appendChild(details);
    this.previewsContainer.appendChild(card);
  }

  /**
   * Updates preview card visual states based on progress and status.
   * @private
   */
  _updateCardUI(fileItem) {
    if (this.options.mode === 'avatar') {
      return;
    }

    const card = fileItem.domCard;
    if (!card) return;

    const cancelBtn = card.querySelector('.cge-dropzone-cancel');
    const removeBtn = card.querySelector('.cge-dropzone-remove');
    const progressBg = card.querySelector('.cge-dropzone-progress-bg');
    const progressBar = card.querySelector('.cge-dropzone-progress-bar');
    const errorContainer = card.querySelector('.cge-dropzone-error-container');
    const errorText = card.querySelector('.cge-dropzone-error');

    if (fileItem.status === 'uploading') {
      if (cancelBtn) cancelBtn.classList.remove('hidden');
      if (removeBtn) removeBtn.classList.add('hidden');
      if (progressBg) progressBg.classList.remove('hidden');
      if (progressBar) {
        progressBar.style.width = `${fileItem.progress}%`;
        progressBar.classList.remove('bg-emerald-500', 'bg-rose-500');
        progressBar.classList.add('bg-indigo-600');
      }
      if (errorContainer) errorContainer.classList.add('hidden');
    } else if (fileItem.status === 'success') {
      if (cancelBtn) cancelBtn.classList.add('hidden');
      if (removeBtn) removeBtn.classList.remove('hidden');
      if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.classList.remove('bg-indigo-600');
        progressBar.classList.add('bg-emerald-500');
      }
      setTimeout(() => {
        if (progressBg) progressBg.classList.add('hidden');
      }, 500);
      if (errorContainer) errorContainer.classList.add('hidden');
    } else if (fileItem.status === 'error') {
      if (cancelBtn) cancelBtn.classList.add('hidden');
      if (removeBtn) removeBtn.classList.remove('hidden');
      if (progressBar) {
        progressBar.classList.remove('bg-indigo-600', 'bg-emerald-500');
        progressBar.classList.add('bg-rose-500');
      }
      if (errorContainer) {
        errorContainer.classList.remove('hidden');
        if (errorText) errorText.textContent = fileItem.errorMessage || '';
      }
    } else {
      if (cancelBtn) cancelBtn.classList.add('hidden');
      if (removeBtn) removeBtn.classList.remove('hidden');
      if (progressBg) progressBg.classList.add('hidden');
      if (errorContainer) errorContainer.classList.add('hidden');
    }
  }

  /**
   * Renders avatar mode thumbnail inside the circular/square container.
   * @private
   */
  _renderAvatarPreview(fileItem) {
    if (fileItem.isImage && fileItem.previewUrl) {
      this.avatarImage.src = fileItem.previewUrl;
      this.avatarImage.classList.remove('hidden');
      this.avatarPlaceholder.classList.add('hidden');
    }
  }

  /**
   * Maps configured aspectRatio option to Tailwind v4 CSS classes.
   * @private
   */
  _getAspectRatioClass() {
    switch (this.options.aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case '300x600':
        return 'aspect-[300/600]';
      case '1200x630':
        return 'aspect-[1200/630]';
      case '50x50':
        return 'w-[50px] h-[50px] aspect-square mx-auto';
      case 'auto':
      default:
        return 'aspect-video';
    }
  }

  /**
   * Generates context-aware semantic SVG file icons based on MIME or extension.
   * @private
   */
  _getMimeIconSVG(mime, filename = '') {
    const ext = filename.split('.').pop().toLowerCase();

    // PDF Files
    if (mime === 'application/pdf' || ext === 'pdf') {
      return `
        <svg class="${this.options.ui.fileIcon} text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5h6m-6 3h4.5" />
        </svg>
      `;
    }

    // Word / Documents
    if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mime.includes('word') || mime.includes('document')) {
      return `
        <svg class="${this.options.ui.fileIcon} text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      `;
    }

    // Spreadsheets (Excel, CSV)
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
      return `
        <svg class="${this.options.ui.fileIcon} text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      `;
    }

    // Archives (ZIP, RAR, TAR, GZ)
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
      return `
        <svg class="${this.options.ui.fileIcon} text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      `;
    }

    // Audio Files
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return `
        <svg class="${this.options.ui.fileIcon} text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a.25.25 0 00.178-.24V9.61a.25.25 0 00-.184-.242L9 6.87M9 9v7.553a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A.25.25 0 009 15.546V9zm0 0l10.5-3" />
        </svg>
      `;
    }

    // Video Files
    if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) {
      return `
        <svg class="${this.options.ui.fileIcon} text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      `;
    }

    // Code Files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'php', 'py', 'sql'].includes(ext)) {
      return `
        <svg class="${this.options.ui.fileIcon} text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      `;
    }

    // Default Document Icon
    return `
      <svg class="${this.options.ui.fileIcon} text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    `;
  }

  // =========================================================================
  // Helpers, i18n & Event Dispatcher
  // =========================================================================

  /**
   * Helper to format bytes to human readable string (e.g. 2.4 MB, 850 KB).
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Infers basic MIME type from file extension.
   * @private
   */
  _inferMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      zip: 'application/zip',
      json: 'application/json',
      txt: 'text/plain',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return map[ext] || 'application/octet-stream';
  }

  /**
   * Interpolates localization dictionary strings.
   * @private
   */
  _t(key, params = {}) {
    let str = this.options.translations[key] || CGEDropzone.translations[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`:${k}`, 'g'), v);
    }
    return str;
  }

  /**
   * Registers custom instance event listener.
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  /**
   * Removes custom instance event listener.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(handler);
    }
    return this;
  }

  /**
   * Dispatches internal event callbacks and native DOM CustomEvents.
   * @private
   */
  _emit(eventName, file = null, data = null) {
    // 1. Trigger custom registered callbacks
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach(handler => {
        try {
          handler(file, data);
        } catch (e) {
          console.error(`[CGEDropzone] Error in '${eventName}' listener:`, e);
        }
      });
    }

    // 2. Dispatch native DOM CustomEvent on container
    const event = new CustomEvent(`cge:dropzone:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: {
        instance: this,
        file: file,
        data: data
      }
    });

    this.element.dispatchEvent(event);
  }
}

export default CGEDropzone;
