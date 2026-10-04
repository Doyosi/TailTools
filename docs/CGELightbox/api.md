# CGELightbox API

This reference mirrors the shipped [declaration](../../plugins/CGELightbox/CGELightbox.d.ts). Both named and default class imports are supported by the plugin barrel.

Use zoom, maxZoom:3, description/data-cge-description, toggleZoom(), downloadCurrent(), init(selector) and .on() event subscriptions. close() waits for teardown, rapid reopening waits for close, and destroy cancels queued reopening and pending media rendering. Global listeners and focus/scroll ownership are released. animationDriver="none" disables portal animation; "css" uses opacity transitions; "tailwind-animations" uses fade classes; "auto" selects the latter only with has-tailwind-animations or window.__TAILWIND_ANIMATIONS__. Duration controls the portal transition. Media fade effects are separate. Tab stays inside the active Lightbox.

```typescript
/**
 * CGELightbox TypeScript Definitions
 * Ultra-fast, touch-capable media lightbox and gallery viewer designed for Tailwind CSS v4.3+ and Laravel Blade.
 *
 * @license MIT
 * @package TailTools
 */

export type CGELightboxMediaType = 'image' | 'video' | 'youtube' | 'vimeo' | 'iframe' | 'inline' | string;

export interface CGELightboxItem {
  /**
   * Media resource URL (high-res image, video file, or embed URL).
   */
  src: string;

  /**
   * Optional thumbnail preview image URL.
   */
  thumb?: string;

  /**
   * Main caption or title text.
   */
  caption?: string;

  /**
   * Alias for caption.
   */
  title?: string;

  /**
   * Subtitle or long description text.
   */
  description?: string;

  /**
   * Media type specifier. Auto-detected from URL if omitted.
   */
  type?: CGELightboxMediaType;

  /**
   * Gallery identifier group name.
   */
  gallery?: string;

  /**
   * Custom inline HTML string if type is 'inline'.
   */
  content?: string;

  /**
   * Originating DOM element if discovered declaratively.
   */
  element?: HTMLElement;
}

export interface CGELightboxTranslations {
  close?: string;
  next?: string;
  prev?: string;
  'zoom-in'?: string;
  'zoom-out'?: string;
  fullscreen?: string;
  download?: string;
  counter?: string;
  [key: string]: string | undefined;
}

export interface CGELightboxOptions {
  /**
   * CSS selector used to discover declarative lightbox triggers.
   * @default '[data-cge-lightbox]'
   */
  selector?: string;

  /**
   * Loop continuous navigation past the last slide.
   * @default true
   */
  loop?: boolean;

  /**
   * Show bottom thumbnail navigation strip.
   * @default true
   */
  thumbnails?: boolean;

  /**
   * Show slide counter badge (e.g. '1 / 8').
   * @default true
   */
  counter?: boolean;

  /**
   * Show direct media download button in toolbar.
   * @default true
   */
  download?: boolean;

  /**
   * Show native browser fullscreen toggle button.
   * @default true
   */
  fullscreen?: boolean;

  /**
   * Enable pan-and-zoom controls (double-click, wheel, drag pan).
   * @default true
   */
  zoom?: boolean;

  /**
   * Maximum zoom scale factor.
   * @default 3
   */
  maxZoom?: number;

  /**
   * Allow vertical swipe down gesture to dismiss lightbox.
   * @default true
   */
  swipeClose?: boolean;

  /**
   * Preload adjacent images in background.
   * @default true
   */
  preload?: boolean;

  /**
   * Close lightbox when clicking the backdrop overlay.
   * @default true
   */
  backdropClose?: boolean;

  /**
   * Transition animation driver.
   * @default 'auto'
   */
  animationDriver?: 'auto' | 'tailwind-animations' | 'css' | 'none';

  /**
   * Animation duration in milliseconds.
   * @default 250
   */
  duration?: number;

  /**
   * Localization dictionary.
   */
  translations?: CGELightboxTranslations;
}

export interface CGELightboxEventDetail {
  lightbox: CGELightbox;
  index?: number;
  item?: CGELightboxItem;
  scale?: number;
}

export type CGELightboxEventCallback = (detail: CGELightboxEventDetail) => void;

export class CGELightbox {
  /**
   * Active instance currently displayed on screen.
   */
  static activeInstance: CGELightbox | null;

  /**
   * Registered instances.
   */
  static instances: Set<CGELightbox>;

  /**
   * Default configuration options.
   */
  static defaults: CGELightboxOptions;

  /**
   * Global localization dictionary.
   */
  static translations: CGELightboxTranslations;

  /**
   * Sets global localization dictionary.
   */
  static setTranslations(dict: CGELightboxTranslations): void;

  /**
   * Array of media items in active gallery.
   */
  items: CGELightboxItem[];

  /**
   * Active slide index.
   */
  currentIndex: number;

  /**
   * Whether the lightbox portal is currently mounted and visible.
   */
  isOpen: boolean;

  /**
   * Current pan and zoom scale factor.
   */
  scale: number;

  /**
   * Configuration options.
   */
  options: CGELightboxOptions;

  constructor(options?: CGELightboxOptions);

  /**
   * Opens the lightbox.
   */
  open(index?: number, items?: CGELightboxItem[] | null): Promise<void>;

  /**
   * Closes the lightbox.
   */
  close(): Promise<void>;

  /**
   * Navigates to next slide.
   */
  next(): void;

  /**
   * Navigates to previous slide.
   */
  prev(): void;

  /**
   * Navigates to a specific slide index.
   */
  goTo(index: number): Promise<void>;

  /**
   * Sets zoom scale factor.
   */
  zoom(scale: number): void;

  /**
   * Cycles zoom level (1x -> 2x -> 3x -> 1x).
   */
  toggleZoom(): void;

  /**
   * Resets zoom and pan.
   */
  resetZoom(): void;

  /**
   * Toggles native browser fullscreen.
   */
  toggleFullscreen(): Promise<void>;

  /**
   * Downloads active media file.
   */
  downloadCurrent(): void;

  /**
   * Attaches an event callback.
   */
  on(event: 'open' | 'change' | 'zoom' | 'close' | string, callback: CGELightboxEventCallback): this;

  /**
   * Detaches an event callback.
   */
  off(event: string, callback: CGELightboxEventCallback): this;

  /**
   * Cleans up instance and removes portal.
   */
  destroy(): void;

  /**
   * Opens a lightbox programmatically.
   */
  static open(items: CGELightboxItem[], options?: CGELightboxOptions, initialIndex?: number): CGELightbox;

  /**
   * Closes the active lightbox instance.
   */
  static close(): void;

  /**
   * Binds declarative click triggers on DOM.
   */
  static init(selector?: string): void;
}

export default CGELightbox;
```
