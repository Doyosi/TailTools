# CGELightbox - TypeScript API Reference

Complete TypeScript declarations, options schemas, and event payload types for **CGELightbox**.

---

## 1. Core Interfaces

```typescript
export type CGELightboxMediaType = 'image' | 'video' | 'youtube' | 'vimeo' | 'inline';

export interface CGELightboxItem {
  /** Source URL (image file, video URL, YouTube/Vimeo link) or DOM selector for inline templates */
  src: string;
  /** Thumbnail image URL for the bottom preview ribbon */
  thumb?: string;
  /** Primary title/caption */
  caption?: string;
  /** Secondary subtitle or description */
  subtitle?: string;
  /** Media type: 'image' | 'video' | 'youtube' | 'vimeo' | 'inline' */
  type?: CGELightboxMediaType;
  /** Poster image URL for direct HTML5 video elements */
  poster?: string;
  /** Custom data attributes or metadata */
  [key: string]: any;
}

export interface CGELightboxTranslations {
  close?: string;
  next?: string;
  prev?: string;
  'zoom-in'?: string;
  'zoom-out'?: string;
  fullscreen?: string;
  download?: string;
  counter?: string; // Supports ':current' and ':total' tokens
  [key: string]: string | undefined;
}

export interface CGELightboxOptions {
  /** Array of media items to display */
  items?: CGELightboxItem[];
  /** Initial slide index to open (0-based) */
  initialIndex?: number;
  /** Loop navigation when reaching the start or end */
  loop?: boolean;
  /** Enable zoom and pan controls for images */
  zoomable?: boolean;
  /** Zoom step factors cycled on click/double-tap (default: [1, 2, 3]) */
  zoomSteps?: number[];
  /** Maximum allowable zoom level (default: 4) */
  maxZoom?: number;
  /** Enable mouse wheel zooming */
  wheelZoom?: boolean;
  /** Enable vertical flick/swipe down to close on touch devices */
  swipeClose?: boolean;
  /** Minimum downward swipe distance in pixels to trigger close (default: 80) */
  swipeThreshold?: number;
  /** Display bottom thumbnail ribbon */
  thumbnails?: boolean;
  /** Display position counter badge (e.g. 1 / 8) */
  counter?: boolean;
  /** Show fullscreen toggle button */
  fullscreen?: boolean;
  /** Show direct download button */
  download?: boolean;
  /** Close when clicking the backdrop overlay */
  backdropClose?: boolean;
  /** Background preload adjacent images */
  preload?: boolean;
  /** Animation driver mode: 'auto' | 'tailwind-animations' | 'css' | 'none' */
  animationDriver?: 'auto' | 'tailwind-animations' | 'css' | 'none';
  /** Animation duration in milliseconds */
  duration?: number;
  /** Custom translation dictionary */
  translations?: CGELightboxTranslations;
  /** Callback fired on open */
  onOpen?: (index: number) => void;
  /** Callback fired when slide changes */
  onChange?: (index: number, item: CGELightboxItem) => void;
  /** Callback fired on zoom change */
  onZoom?: (scale: number) => void;
  /** Callback fired on close */
  onClose?: () => void;
}
```

---

## 2. Event Types & Payloads

```typescript
export interface CGELightboxEventMap {
  open: { index: number; item: CGELightboxItem };
  change: { index: number; item: CGELightboxItem };
  zoom: { scale: number };
  close: void;
}

export interface CGELightboxCustomEventDetail {
  instance: CGELightbox;
  index?: number;
  item?: CGELightboxItem;
  scale?: number;
}
```

---

## 3. Class Declaration

```typescript
export class CGELightbox {
  // Static Methods
  static open(items: CGELightboxItem[], options?: CGELightboxOptions): CGELightbox;
  static init(root?: Document | HTMLElement): void;
  static setTranslations(translations: Partial<CGELightboxTranslations>): void;
  static activeInstance: CGELightbox | null;

  // Instance Properties
  readonly options: Required<CGELightboxOptions>;
  readonly items: CGELightboxItem[];
  currentIndex: number;
  currentZoom: number;
  isOpen: boolean;

  // Constructor
  constructor(options?: CGELightboxOptions);

  // Instance Methods
  open(index?: number): this;
  close(): this;
  next(): this;
  prev(): this;
  goTo(index: number): this;
  zoom(scale: number): this;
  zoomIn(): this;
  zoomOut(): this;
  resetZoom(): this;
  toggleFullscreen(): this;
  download(): this;
  destroy(): void;

  // Event Subscription
  on<K extends keyof CGELightboxEventMap>(
    event: K,
    handler: (payload: CGELightboxEventMap[K]) => void
  ): this;

  off<K extends keyof CGELightboxEventMap>(
    event: K,
    handler: (payload: CGELightboxEventMap[K]) => void
  ): this;
}
```
