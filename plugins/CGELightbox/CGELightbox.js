import { acquireOverlay, releaseOverlay, claimOverlayKey } from '../shared/overlay.js';
import { Lifecycle } from '../shared/lifecycle.js';
/**
 * CGELightbox - TailTools Plugin
 * Ultra-fast, touch-capable media lightbox and gallery viewer designed for Tailwind CSS v4.3+ and Laravel Blade.
 * Features multi-media support (images, HTML5 video, YouTube/Vimeo embeds, inline HTML), smooth pan-and-zoom controls,
 * thumbnail navigation ribbons, swipe gestures, progressive image preloading, keyboard navigation, and declarative data-attribute triggers.
 *
 * @license MIT
 * @package TailTools
 */

export class CGELightbox {
  /**
   * Currently active lightbox instance.
   * @type {CGELightbox | null}
   */
  static activeInstance = null;

  /**
   * Set of registered instances.
   * @type {Set<CGELightbox>}
   */
  static instances = new Set();

  /**
   * Global event delegation flag.
   * @private
   */
  static _delegationBound = false;

  /**
   * Default configuration options.
   */
  static defaults = {
    selector: '[data-cge-lightbox]', // declarative element selector
    loop: true, // loop gallery navigation
    thumbnails: true, // show bottom thumbnail carousel
    counter: true, // show slide counter
    download: true, // show download button
    fullscreen: true, // show fullscreen toggle
    zoom: true, // enable pan and zoom
    maxZoom: 3, // maximum zoom scale
    swipeClose: true, // swipe down to dismiss
    preload: true, // preload adjacent slides
    backdropClose: true, // click backdrop to dismiss
    animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
    duration: 250, // transition duration in ms
    translations: {
      close: 'Close (Esc)',
      next: 'Next',
      prev: 'Previous',
      'zoom-in': 'Zoom in',
      'zoom-out': 'Zoom out',
      fullscreen: 'Toggle fullscreen',
      download: 'Download media',
      counter: ':current / :total'
    }
  };

  /**
   * Global localization dictionary.
   */
  static translations = { ...CGELightbox.defaults.translations };

  /**
   * Sets global localization dictionary.
   * @param {Object} dict
   */
  static setTranslations(dict) {
    CGELightbox.translations = { ...CGELightbox.translations, ...dict };
  }

  /**
   * @param {Object} [options={}] - Custom configuration
   */
  _destroyed = false;
  _lifecycle = new Lifecycle();

  constructor(options = {}) {
    this.options = {
      ...CGELightbox.defaults,
      ...options,
      translations: { ...CGELightbox.translations, ...(options.translations || {}) }
    };

    this.items = [];
    this.currentIndex = 0;
    this.isOpen = false;
    this._listeners = new Map();
    this._renderVersion = 0;
    this._closePromise = null;
    this._eventController = null;
    this.portalEl = null;
    this.stageEl = null;
    this.wrapperEl = null;
    this.mediaEl = null;
    this.spinnerEl = null;
    this.captionEl = null;
    this.counterEl = null;
    this.thumbsEl = null;
    this.prevBtn = null;
    this.nextBtn = null;

    // Pan & Zoom state
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Touch gesture state
    this._touchState = {
      tracking: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      initialPinchDist: 0,
      initialScale: 1,
      swipingVertical: false
    };

    this._originalBodyOverflow = '';
    this._originalBodyPadding = '';

    CGELightbox.instances.add(this);
  }

  /**
   * Opens the lightbox with items or from declarative triggers.
   * @param {number} [index=0] - Initial slide index
   * @param {Array<Object>} [items=null] - Optional array of media items
   * @returns {Promise<void>}
   */
  async open(index = 0, items = null) {
    if (this._closePromise) await this._closePromise;
    if (CGELightbox.activeInstance && CGELightbox.activeInstance !== this) {
      await CGELightbox.activeInstance.close();
    }
    if (this._destroyed) return;
    if (this.isOpen) {
      this.goTo(index);
      return;
    }

    if (items && Array.isArray(items)) {
      this.items = items;
    } else if (this.items.length === 0) {
      this.items = this._collectDeclarativeItems();
    }

    if (this.items.length === 0) {
      console.warn('[CGELightbox] No media items found to display.');
      return;
    }

    this._triggerElement = document.activeElement;
    this._lifecycle = new Lifecycle();
    this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1));
    this.isOpen = true;
    CGELightbox.instances.add(this);
    CGELightbox.activeInstance = this;

    // Capture scroll only after the portal is available.

    // 2. Build portal DOM
    this._buildPortal();
    this._lockScroll();

    // 3. Bind runtime event listeners
    this._bindEvents();

    // 4. Load initial slide
    await this._renderSlide(this.currentIndex);
    if (!this.isOpen) return;
    this._emit('open', { index: this.currentIndex, item: this.items[this.currentIndex] });
  }

  /**
   * Closes the lightbox and tears down portal DOM.
   * @returns {Promise<void>}
   */
  async close() {
    if (this._closePromise) return this._closePromise;
    if (!this.isOpen || !this.portalEl) return;

    this.isOpen = false;
    ++this._renderVersion;
    this._mediaController?.abort();
    this._eventController?.abort();
    this.isDragging = false;
    const portal = this.portalEl;
    this._lifecycle.cancel();
    this._emit('close', { index: this.currentIndex });

    this._closePromise = (async () => {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          // Ignored
        }
      }

      const driver = this._resolveAnimationDriver();
      if (driver === 'tailwind-animations') {
        portal.classList.remove('animate-fade-in');
        portal.classList.add('animate-fade-out');
      } else if (driver !== 'none') {
        portal.classList.remove('opacity-100');
        portal.classList.add('opacity-0');
      }

      if (!this._destroyed && driver !== "none") await new Promise(resolve => {
        this._finishClose = resolve;
        this._closeTimer = setTimeout(resolve, this.options.duration);
      });
      portal.remove();
      if (this.portalEl === portal) this.portalEl = null;
      this._finishClose = null;
      this._unlockScroll();
      if (CGELightbox.activeInstance === this) {
        CGELightbox.activeInstance = null;
      }
      CGELightbox.instances.delete(this);
    })();
    try {
      await this._closePromise;
    } finally {
      this._closePromise = null;
    }
  }

  /**
   * Navigates to next slide.
   */
  next() {
    if (this.items.length <= 1) return;
    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.items.length) {
      if (this.options.loop) {
        nextIndex = 0;
      } else {
        return;
      }
    }
    this.goTo(nextIndex);
  }

  /**
   * Navigates to previous slide.
   */
  prev() {
    if (this.items.length <= 1) return;
    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      if (this.options.loop) {
        prevIndex = this.items.length - 1;
      } else {
        return;
      }
    }
    this.goTo(prevIndex);
  }

  /**
   * Navigates to a specific slide index.
   * @param {number} index
   */
  async goTo(index) {
    if (this._destroyed || !this.isOpen || index < 0 || index >= this.items.length) return;
    this.resetZoom();
    this.currentIndex = index;
    await this._renderSlide(index);
    if (!this.isOpen || this._destroyed || this.currentIndex !== index) return;
    this._emit('change', { index, item: this.items[index] });
  }

  /**
   * Sets zoom scale factor (1x to maxZoom).
   * @param {number} scale
   */
  zoom(scale) {
    if (!this.options.zoom) return;
    const item = this.items[this.currentIndex];
    const type = item ? this._resolveMediaType(item) : 'image';
    if (type !== 'image') return; // Only zoom images, keep videos & embeds stable
    this.scale = Math.min(this.options.maxZoom, Math.max(1, scale));
    if (this.scale === 1) {
      this.panX = 0;
      this.panY = 0;
    }
    this._applyTransform();
    this._emit('zoom', { scale: this.scale });
  }

  /**
   * Cycles zoom level (1x -> 2x -> 3x -> 1x).
   */
  toggleZoom() {
    if (this.scale === 1) {
      this.zoom(2);
    } else if (this.scale < this.options.maxZoom) {
      this.zoom(this.options.maxZoom);
    } else {
      this.resetZoom();
    }
  }

  /**
   * Resets zoom scale and pan coordinates.
   */
  resetZoom() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this._applyTransform();
  }

  /**
   * Toggles native browser fullscreen.
   */
  async toggleFullscreen() {
    if (!this.portalEl) return;
    try {
      if (!document.fullscreenElement) {
        await this.portalEl.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('[CGELightbox] Fullscreen not allowed or failed:', err);
    }
  }

  /**
   * Triggers download of the currently active media item.
   */
  downloadCurrent() {
    const item = this.items[this.currentIndex];
    if (!item || !item.src) return;

    const link = document.createElement('a');
    link.href = item.src;
    link.download = item.src.split('/').pop().split('?')[0] || 'media-download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Builds the DOM elements for the full-screen lightbox portal.
   * @private
   */
  _buildPortal() {
    const existing = document.getElementById('cge-lightbox-portal');
    if (existing) existing.remove();

    const portal = document.createElement('div');
    portal.id = 'cge-lightbox-portal';
    portal.className = 'cge-lightbox fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-black/92 backdrop-blur-md select-none transition-opacity duration-300 opacity-0';
    portal.style.transitionDuration = `${this.options.duration}ms`;
    const driver = this._resolveAnimationDriver();
    if (driver === 'none' || driver === 'tailwind-animations') {
      portal.classList.remove('transition-opacity', 'opacity-0');
      portal.classList.add('opacity-100');
    }
    if (driver === 'tailwind-animations') {
      portal.style.animationDuration = `${this.options.duration}ms`;
      portal.classList.add('animate-fade-in');
    }
    portal.setAttribute('role', 'dialog');
    portal.tabIndex = -1;
    portal.setAttribute('aria-modal', 'true');
    portal.setAttribute('aria-label', 'Media Gallery Lightbox');

    // 1. Top Action Toolbar
    const topbar = document.createElement('div');
    topbar.className = 'cge-lightbox-topbar w-full px-4 py-3 flex items-center justify-between z-20 pointer-events-auto shrink-0';

    const counterHtml = this.options.counter
      ? `<span class="cge-lightbox-counter px-2.5 py-1 rounded-sm bg-white/10 border border-white/10 text-xs font-mono text-white/90"></span>`
      : '<div></div>';

    topbar.innerHTML = `
      <div class="flex items-center gap-2">
        ${counterHtml}
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2">
        ${this.options.zoom ? `
          <button type="button" data-cge-lb-action="zoom-out" class="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer" title="${this.options.translations['zoom-out']}">−</button>
          <button type="button" data-cge-lb-action="zoom-in" class="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer" title="${this.options.translations['zoom-in']}">+</button>
        ` : ''}
        ${this.options.fullscreen ? `
          <button type="button" data-cge-lb-action="fullscreen" class="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer" title="${this.options.translations.fullscreen}">⛶</button>
        ` : ''}
        ${this.options.download ? `
          <button type="button" data-cge-lb-action="download" class="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer" title="${this.options.translations.download}">↓</button>
        ` : ''}
        <button type="button" data-cge-lb-action="close" class="w-8 h-8 rounded-sm bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center text-sm transition cursor-pointer" title="${this.options.translations.close}">✕</button>
      </div>
    `;

    // 2. Main Stage & Navigation Arrows
    const stage = document.createElement('div');
    stage.className = 'cge-lightbox-stage relative flex-1 flex items-center justify-center overflow-hidden w-full h-full p-2 sm:p-4';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.setAttribute('data-cge-lb-action', 'prev');
    prevBtn.className = 'cge-lightbox-prev absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-sm bg-black/40 hover:bg-black/70 border border-white/10 text-white flex items-center justify-center text-xl transition cursor-pointer';
    prevBtn.setAttribute('title', this.options.translations.prev);
    prevBtn.innerHTML = '‹';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.setAttribute('data-cge-lb-action', 'next');
    nextBtn.className = 'cge-lightbox-next absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-sm bg-black/40 hover:bg-black/70 border border-white/10 text-white flex items-center justify-center text-xl transition cursor-pointer';
    nextBtn.setAttribute('title', this.options.translations.next);
    nextBtn.innerHTML = '›';

    // Content Wrapper for scaling/panning
    const wrapper = document.createElement('div');
    wrapper.className = 'cge-lightbox-content-wrapper relative flex items-center justify-center max-w-full max-h-full transition-transform duration-200';

    // Loading Spinner
    const spinner = document.createElement('div');
    spinner.className = 'cge-lightbox-spinner hidden absolute inset-0 m-auto w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin z-10';

    stage.appendChild(prevBtn);
    stage.appendChild(nextBtn);
    wrapper.appendChild(spinner);
    stage.appendChild(wrapper);

    // 3. Bottom Bar (Caption & Thumbnails)
    const bottombar = document.createElement('div');
    bottombar.className = 'cge-lightbox-bottombar w-full px-4 pb-4 pt-2 z-20 pointer-events-auto flex flex-col items-center gap-2 shrink-0';

    const caption = document.createElement('div');
    caption.className = 'cge-lightbox-caption text-center max-w-2xl px-4 py-1.5 rounded-sm bg-black/60 backdrop-blur-xs border border-white/10 text-xs sm:text-sm text-white hidden';

    const thumbs = document.createElement('div');
    thumbs.className = 'cge-lightbox-thumbnails flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-none';

    bottombar.appendChild(caption);
    if (this.options.thumbnails) {
      bottombar.appendChild(thumbs);
    }

    portal.appendChild(topbar);
    portal.appendChild(stage);
    portal.appendChild(bottombar);

    document.body.appendChild(portal);

    // Cache element references
    this.portalEl = portal;
    this.stageEl = stage;
    this.wrapperEl = wrapper;
    this.spinnerEl = spinner;
    this.captionEl = caption;
    this.counterEl = portal.querySelector('.cge-lightbox-counter');
    this.thumbsEl = thumbs;
    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;

    // Trigger reveal transition
    this._lifecycle.frame(() => {
      if (!this.isOpen || this._destroyed) return;
      portal.focus();
      portal.classList.remove('opacity-0');
      portal.classList.add('opacity-100');
    });
  }

  /**
   * Renders the media item at index inside the stage.
   * @private
   */
  async _renderSlide(index) {
    this._mediaController?.abort();
    const controller = this._mediaController = new AbortController();
    const version = ++this._renderVersion;
    const wrapper = this.wrapperEl;
    const item = this.items[index];
    if (!item) return;

    // Update Counter
    if (this.counterEl) {
      this.counterEl.textContent = this.options.translations.counter
        .replace(':current', String(index + 1))
        .replace(':total', String(this.items.length));
    }

    // Update Navigation Arrow visibility if loop is disabled
    if (!this.options.loop && this.items.length > 1) {
      this.prevBtn.style.display = index === 0 ? 'none' : 'flex';
      this.nextBtn.style.display = index === this.items.length - 1 ? 'none' : 'flex';
    } else if (this.items.length <= 1) {
      this.prevBtn.style.display = 'none';
      this.nextBtn.style.display = 'none';
    } else {
      this.prevBtn.style.display = 'flex';
      this.nextBtn.style.display = 'flex';
    }

    // Update Caption
    if (this.captionEl) {
      const captionText = item.caption || item.title || '';
      const descText = item.description || '';
      if (captionText || descText) {
        this.captionEl.innerHTML = `
          ${captionText ? `<div class="font-semibold text-white tracking-tight">${captionText}</div>` : ''}
          ${descText ? `<div class="text-[11px] text-slate-300 mt-0.5 leading-snug">${descText}</div>` : ''}
        `;
        this.captionEl.classList.remove('hidden');
      } else {
        this.captionEl.classList.add('hidden');
      }
    }

    // Update Thumbnails
    this._renderThumbnails(index);

    // Show loading spinner
    if (this.spinnerEl) {
      this.spinnerEl.classList.remove('hidden');
    }

    // Clear previous media
    const oldMedia = this.wrapperEl.querySelector('.cge-lightbox-media');
    if (oldMedia) oldMedia.remove();

    // Determine Media Type
    const type = this._resolveMediaType(item);
    let mediaNode = null;

    if (type === 'image') {
      let cancel;
      const canceled = new Promise(resolve => {
        cancel = () => resolve(null);
        controller.signal.addEventListener('abort', cancel, { once: true });
      });
      try { mediaNode = await Promise.race([this._createImageNode(item, controller.signal), canceled]); }
      finally { controller.signal.removeEventListener('abort', cancel); }
    } else if (type === 'video') {
      mediaNode = this._createVideoNode(item);
    } else if (type === 'youtube' || type === 'vimeo' || type === 'iframe') {
      mediaNode = this._createEmbedNode(item, type);
    } else if (type === 'inline') {
      mediaNode = this._createInlineNode(item);
    }

    if (!this.isOpen || version !== this._renderVersion || wrapper !== this.wrapperEl) return;

    if (this.spinnerEl) {
      this.spinnerEl.classList.add('hidden');
    }

    if (mediaNode) {
      mediaNode.classList.add('cge-lightbox-media');
      this.wrapperEl.appendChild(mediaNode);
      this.mediaEl = mediaNode;
    }

    // Adaptive Toolbar Controls based on media type
    if (this.portalEl) {
      const zoomInBtn = this.portalEl.querySelector('[data-cge-lb-action="zoom-in"]');
      const zoomOutBtn = this.portalEl.querySelector('[data-cge-lb-action="zoom-out"]');
      const downloadBtn = this.portalEl.querySelector('[data-cge-lb-action="download"]');
      if (zoomInBtn && zoomOutBtn) {
        zoomInBtn.style.display = type === 'image' ? 'flex' : 'none';
        zoomOutBtn.style.display = type === 'image' ? 'flex' : 'none';
      }
      if (downloadBtn) {
        downloadBtn.style.display = (type === 'image' || type === 'video') ? 'flex' : 'none';
      }
    }

    // Progressive preloading of adjacent slides
    if (this.options.preload) {
      this._preloadAdjacent(index);
    }
  }

  /**
   * Resolves the media type of an item.
   * @private
   */
  _resolveMediaType(item) {
    if (item.type) return item.type;
    const url = item.src || '';

    if (/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url)) {
      return 'youtube';
    }
    if (/(?:vimeo\.com\/)(\d+)/i.test(url)) {
      return 'vimeo';
    }
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
      return 'video';
    }
    if (url.startsWith('#') || item.content) {
      return 'inline';
    }
    return 'image';
  }

  /**
   * Creates an Image element with progressive loading.
   * @private
   */
  _createImageNode(item, signal) {
    return new Promise((resolve) => {
      const img = new Image();
      const cancel = () => {
        img.onload = img.onerror = null;
        img.removeAttribute('src');
        resolve(null);
      };
      signal?.addEventListener('abort', cancel, { once: true });
      img.className = 'max-w-[90vw] max-h-[80vh] object-contain rounded-sm transition-opacity duration-200 opacity-0 cursor-zoom-in';
      img.alt = item.caption || 'Lightbox Image';

      img.onload = () => {
        signal?.removeEventListener('abort', cancel);
        img.classList.remove('opacity-0');
        img.classList.add('opacity-100');
        resolve(img);
      };

      img.onerror = () => {
        signal?.removeEventListener('abort', cancel);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-6 rounded-sm bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs text-center';
        errorDiv.innerHTML = `⚠️ Failed to load image: <br><span class="font-mono text-[11px] text-white/70">${item.src}</span>`;
        resolve(errorDiv);
      };

      img.src = item.src;
    });
  }

  /**
   * Creates an HTML5 Video element.
   * @private
   */
  _createVideoNode(item) {
    const video = document.createElement('video');
    video.className = 'max-w-[90vw] max-h-[80vh] object-contain rounded-sm border border-white/10 shadow-2xl';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.src = item.src;
    return video;
  }

  /**
   * Creates responsive iframe container for YouTube/Vimeo/URL embeds.
   * @private
   */
  _createEmbedNode(item, type) {
    const container = document.createElement('div');
    container.className = 'cge-lightbox-embed-container relative w-[90vw] max-w-4xl rounded-sm overflow-hidden border border-white/10 shadow-2xl bg-black select-auto pointer-events-auto';
    container.style.aspectRatio = '16 / 9';

    let embedUrl = item.src;
    if (type === 'youtube') {
      const match = item.src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      const videoId = match ? match[1] : '';
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&playsinline=1&modestbranding=0&enablejsapi=1`;
    } else if (type === 'vimeo') {
      const match = item.src.match(/(?:vimeo\.com\/)(\d+)/i);
      const videoId = match ? match[1] : '';
      embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&controls=1&title=1&byline=1`;
    }

    const iframe = document.createElement('iframe');
    iframe.className = 'absolute inset-0 w-full h-full border-0 block';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.src = embedUrl;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('loading', 'lazy');

    container.appendChild(iframe);
    return container;
  }

  /**
   * Creates inline HTML element container.
   * @private
   */
  _createInlineNode(item) {
    const container = document.createElement('div');
    container.className = 'max-w-[90vw] max-h-[80vh] overflow-y-auto p-6 rounded-sm bg-slate-900 border border-slate-800 text-white shadow-2xl';

    if (item.content) {
      container.innerHTML = item.content;
    } else if (item.src && item.src.startsWith('#')) {
      const target = document.querySelector(item.src);
      if (target) {
        container.innerHTML = target.innerHTML;
      }
    }
    return container;
  }

  /**
   * Preloads adjacent images in the background.
   * @private
   */
  _preloadAdjacent(index) {
    const prev = (index - 1 + this.items.length) % this.items.length;
    const next = (index + 1) % this.items.length;

    [prev, next].forEach((i) => {
      const item = this.items[i];
      if (item && this._resolveMediaType(item) === 'image' && item.src) {
        const img = new Image();
        img.src = item.src;
      }
    });
  }

  /**
   * Renders the thumbnail navigation carousel.
   * @private
   */
  _renderThumbnails(activeIndex) {
    if (!this.thumbsEl || !this.options.thumbnails || this.items.length <= 1) return;

    this.thumbsEl.innerHTML = '';
    this.items.forEach((item, idx) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      const isActive = idx === activeIndex;
      const borderClass = isActive
        ? 'ring-2 ring-indigo-500 scale-105 opacity-100'
        : 'opacity-50 hover:opacity-100';
      thumb.className = `w-14 h-10 shrink-0 rounded-sm overflow-hidden border border-white/20 transition-all cursor-pointer ${borderClass}`;

      const thumbSrc = item.thumb || item.src;
      const type = this._resolveMediaType(item);

      if (type === 'image' && thumbSrc) {
        thumb.innerHTML = `<img src="${thumbSrc}" alt="Thumb" class="w-full h-full object-cover">`;
      } else {
        const icon = type === 'video' ? '🎬' : (type === 'youtube' || type === 'vimeo' ? '▶️' : '📄');
        thumb.innerHTML = `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-white">${icon}</div>`;
      }

      thumb.addEventListener('click', () => {
        this.goTo(idx);
      });

      this.thumbsEl.appendChild(thumb);

      if (isActive) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  /**
   * Binds click, pan, zoom, touch, and keyboard listeners.
   * @private
   */
  _bindEvents() {
    this._eventController?.abort();
    this._eventController = new AbortController();
    const signal = this._eventController.signal;
    // Toolbar and Navigation Click Handling
    this.portalEl.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-cge-lb-action]');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        const action = actionBtn.getAttribute('data-cge-lb-action');
        if (action === 'close') this.close();
        else if (action === 'next') this.next();
        else if (action === 'prev') this.prev();
        else if (action === 'zoom-in') this.zoom(this.scale + 0.5);
        else if (action === 'zoom-out') this.zoom(this.scale - 0.5);
        else if (action === 'fullscreen') this.toggleFullscreen();
        else if (action === 'download') this.downloadCurrent();
        return;
      }

      // Backdrop Click
      if (this.options.backdropClose) {
        if (e.target === this.stageEl || e.target === this.portalEl) {
          this.close();
        }
      }
    });

    // Double-Click to Zoom
    this.stageEl.addEventListener('dblclick', (e) => {
      if (!this.options.zoom || !this.mediaEl || !this.mediaEl.contains(e.target)) return;
      e.preventDefault();
      this.toggleZoom();
    });

    // Mouse Wheel Zoom
    this.stageEl.addEventListener('wheel', (e) => {
      if (!this.options.zoom || !this.mediaEl || !this.mediaEl.contains(e.target)) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.3 : -0.3;
      this.zoom(this.scale + delta);
    }, { passive: false });

    // Click & Drag Pan when zoomed
    this.stageEl.addEventListener('mousedown', (e) => {
      if (this.scale <= 1 || e.button !== 0 || !this.mediaEl || !this.mediaEl.contains(e.target)) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      this.mediaEl.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this._applyTransform();
    }, { signal });

    window.addEventListener('mouseup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.mediaEl) {
        this.mediaEl.style.cursor = this.scale > 1 ? 'grab' : 'zoom-in';
      }
    }, { signal });

    // Touch Gestures (Swipe to navigate, vertical flick to dismiss, pinch zoom)
    this._bindTouchGestures();

    // Keyboard Shortcuts
    this._handleKeyDown = (e) => {
      if (!this.isOpen || !claimOverlayKey(this, e)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'Tab') {
        const focusable = [...this.portalEl.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter(element => element.offsetWidth || element.offsetHeight);
        const first = focusable[0] || this.portalEl;
        const last = focusable.at(-1) || this.portalEl;
        if (!this.portalEl.contains(document.activeElement) || document.activeElement === this.portalEl ||
          e.shiftKey && document.activeElement === first || !e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.zoom(this.scale + 0.5);
      } else if (e.key === 'ArrowDown' || e.key === '-') {
        e.preventDefault();
        this.zoom(this.scale - 0.5);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    };
    document.addEventListener('keydown', this._handleKeyDown, { signal });
  }

  /**
   * Binds touch gesture listeners.
   * @private
   */
  _bindTouchGestures() {
    this.stageEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this._touchState.tracking = true;
        this._touchState.startX = touch.clientX;
        this._touchState.startY = touch.clientY;
        this._touchState.startTime = Date.now();
        this._touchState.swipingVertical = false;
      } else if (e.touches.length === 2 && this.options.zoom) {
        // Pinch zoom start
        this._touchState.tracking = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this._touchState.initialPinchDist = Math.hypot(dx, dy);
        this._touchState.initialScale = this.scale;
      }
    }, { passive: true });

    this.stageEl.addEventListener('touchmove', (e) => {
      // Pinch to Zoom
      if (e.touches.length === 2 && this.options.zoom && this._touchState.initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const ratio = currentDist / this._touchState.initialPinchDist;
        this.zoom(this._touchState.initialScale * ratio);
        return;
      }

      if (!this._touchState.tracking || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this._touchState.startX;
      const deltaY = touch.clientY - this._touchState.startY;

      // Vertical swipe-to-dismiss check when scale is 1
      if (this.scale === 1 && this.options.swipeClose && Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        this._touchState.swipingVertical = true;
        this.wrapperEl.style.transform = `translate3d(0, ${deltaY}px, 0)`;
        const opacity = Math.max(0.2, 1 - (deltaY / 400));
        this.portalEl.style.opacity = String(opacity);
      }
    }, { passive: true });

    const handleTouchEnd = (e) => {
      // Handle vertical dismiss snap
      if (this._touchState.swipingVertical) {
        const touch = e.changedTouches[0];
        const deltaY = touch.clientY - this._touchState.startY;
        const elapsed = Math.max(1, Date.now() - this._touchState.startTime);
        const velocity = deltaY / elapsed;

        this.portalEl.style.opacity = '';
        if (deltaY > 120 || velocity > 0.45) {
          this.close();
        } else {
          this.wrapperEl.style.transform = '';
        }
        this._touchState.swipingVertical = false;
        this._touchState.tracking = false;
        return;
      }

      // Handle horizontal swipe navigation when scale is 1
      if (this._touchState.tracking && this.scale === 1) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this._touchState.startX;
        const deltaY = touch.clientY - this._touchState.startY;
        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
        }
      }

      this._touchState.tracking = false;
      this._touchState.initialPinchDist = 0;
    };

    this.stageEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    this.stageEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  /**
   * Applies active zoom scale and pan translations to media wrapper.
   * @private
   */
  _applyTransform() {
    if (!this.wrapperEl) return;
    this.wrapperEl.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.scale})`;
    if (this.mediaEl) {
      this.mediaEl.style.cursor = this.scale > 1 ? 'grab' : 'zoom-in';
    }
  }

  /**
   * Scans DOM for declarative lightbox triggers matching selector.
   * @private
   */
  _collectDeclarativeItems() {
    const nodes = document.querySelectorAll(this.options.selector);
    const items = [];
    nodes.forEach((el) => {
      items.push({
        src: el.getAttribute('href') || el.dataset.cgeSrc || el.getAttribute('src'),
        thumb: el.dataset.cgeThumb || el.querySelector('img')?.getAttribute('src'),
        caption: el.dataset.cgeCaption || el.getAttribute('title') || el.dataset.cgeTitle,
        description: el.dataset.cgeDescription,
        gallery: el.dataset.cgeGallery,
        type: el.dataset.cgeType,
        element: el
      });
    });
    return items;
  }

  /**
   * Locks document body scroll with layout shift compensation.
   * @private
   */
  _resolveAnimationDriver() {
    if (this.options.animationDriver !== 'auto') return this.options.animationDriver;
    return document.documentElement.classList.contains('has-tailwind-animations') || window.__TAILWIND_ANIMATIONS__
      ? 'tailwind-animations' : 'css';
  }

  _lockScroll() { acquireOverlay(this, this.portalEl, true); }

  _unlockScroll() { releaseOverlay(this, this._triggerElement); }

  /**
   * Emits instance callbacks and native DOM CustomEvents.
   * @private
   */
  _emit(eventName, detail = {}) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach((cb) => {
        try {
          cb({ lightbox: this, ...detail });
        } catch (err) {
          console.error(`[CGELightbox] Error in event listener "${eventName}":`, err);
        }
      });
    }

    const domEventName = `cge:lightbox:${eventName.toLowerCase()}`;
    const customEvent = new CustomEvent(domEventName, {
      bubbles: true,
      cancelable: true,
      detail: { lightbox: this, ...detail }
    });

    document.dispatchEvent(customEvent);
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
   * Cleans up instance and listeners.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._lifecycle.cancel();
    clearTimeout(this._closeTimer);
    this._finishClose?.();
    this._eventController?.abort();
    ++this._renderVersion;
    if (this.isOpen) {
      this.close();
    }
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }
    CGELightbox.instances.delete(this);
    this._listeners.clear();
  }

  // =========================================================================
  // Static Helper Methods
  // =========================================================================

  /**
   * Programmatically opens a lightbox with an array of media objects.
   * @param {Array<Object>} items
   * @param {Object} [options={}]
   * @param {number} [initialIndex=0]
   * @returns {CGELightbox}
   */
  static open(items, options = {}, initialIndex = 0) {
    const lb = new CGELightbox(options);
    lb.open(initialIndex, items);
    return lb;
  }

  /**
   * Closes the active lightbox instance.
   */
  static close() {
    if (CGELightbox.activeInstance) {
      CGELightbox.activeInstance.close();
    }
  }

  /**
   * Binds declarative click triggers on root element.
   * @param {string} [selector='[data-cge-lightbox]']
   */
  static init(selector = '[data-cge-lightbox]') {
    if (CGELightbox._delegationBound || typeof document === 'undefined') return;

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest(selector);
      if (!trigger) return;

      e.preventDefault();

      const galleryName = trigger.dataset.cgeGallery;
      let items = [];
      let initialIndex = 0;

      if (galleryName) {
        const galleryNodes = Array.from(document.querySelectorAll(selector)).filter(el => el.dataset.cgeGallery === galleryName);
        items = galleryNodes.map((el) => ({
          src: el.getAttribute('href') || el.dataset.cgeSrc || el.getAttribute('src'),
          thumb: el.dataset.cgeThumb || el.querySelector('img')?.getAttribute('src'),
          caption: el.dataset.cgeCaption || el.getAttribute('title') || el.dataset.cgeTitle,
          description: el.dataset.cgeDescription,
          gallery: galleryName,
          type: el.dataset.cgeType,
          element: el
        }));
        initialIndex = Math.max(0, galleryNodes.indexOf(trigger));
      } else {
        items = [{
          src: trigger.getAttribute('href') || trigger.dataset.cgeSrc || trigger.getAttribute('src'),
          thumb: trigger.dataset.cgeThumb || trigger.querySelector('img')?.getAttribute('src'),
          caption: trigger.dataset.cgeCaption || trigger.getAttribute('title') || trigger.dataset.cgeTitle,
          description: trigger.dataset.cgeDescription,
          type: trigger.dataset.cgeType,
          element: trigger
        }];
        initialIndex = 0;
      }

      CGELightbox.open(items, {}, initialIndex);
    });

    CGELightbox._delegationBound = true;
  }
}
