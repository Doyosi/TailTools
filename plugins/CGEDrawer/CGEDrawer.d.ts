/**
 * CGEDrawer TypeScript Definitions
 * High-performance, gesture-capable sliding drawer and off-canvas navigation plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
 *
 * @license MIT
 * @package TailTools
 */

export type CGEDrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export type CGEDrawerSideSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
export type CGEDrawerVerticalSize = 'sm' | 'md' | 'lg' | 'full' | 'auto' | string;
export type CGEDrawerSize = CGEDrawerSideSize | CGEDrawerVerticalSize;

export type CGEDrawerAnimationDriver = 'auto' | 'tailwind-animations' | 'css' | 'none';

export interface CGEDrawerTranslations {
  'close-button'?: string;
  'drawer-label'?: string;
  [key: string]: string | undefined;
}

export interface CGEDrawerSwipeEventDetail {
  direction: CGEDrawerPlacement;
  distance: number;
  progress: number;
  event: TouchEvent;
}

export interface CGEDrawerEventDetail {
  drawer: CGEDrawer;
  [key: string]: any;
}

export interface CGEDrawerOptions {
  /**
   * Directional screen placement.
   * @default 'left'
   */
  placement?: CGEDrawerPlacement;

  /**
   * Sizing preset or custom Tailwind CSS dimension utility.
   * Presets for side: 'sm' (w-64), 'md' (w-80), 'lg' (w-96), 'xl' (w-1/2), 'full' (w-screen).
   * Presets for vertical: 'sm' (h-48), 'md' (h-80), 'lg' (h-1/2), 'full' (h-screen), 'auto' (bottom-sheet).
   * @default 'md'
   */
  size?: CGEDrawerSize;

  /**
   * Display modal backdrop overlay. Set to false for persistent, non-modal side panels.
   * @default true
   */
  backdrop?: boolean | 'static';

  /**
   * Dismiss drawer when clicking on the backdrop overlay.
   * If false, outside clicks trigger directional tactile bounce nudge feedback.
   * @default true
   */
  backdropClose?: boolean;

  /**
   * Close drawer on Escape key press.
   * @default true
   */
  escapeClose?: boolean;

  /**
   * Animation driver preference.
   * @default 'auto'
   */
  animationDriver?: CGEDrawerAnimationDriver;

  /**
   * Enable real-time touch swipe-to-dismiss gesture tracking.
   * @default true
   */
  swipeClose?: boolean;

  /**
   * Drag distance ratio (0.0 to 1.0) required to trigger swipe dismissal.
   * @default 0.3
   */
  swipeThreshold?: number;

  /**
   * CSS selector or HTMLElement to push when the drawer opens.
   * @default null
   */
  pushContentSelector?: string | HTMLElement | null;

  /**
   * Collapsed mini-rail mode. If true, closed state docks into a narrow rail rather than hiding off-screen.
   * @default false
   */
  mini?: boolean;

  /**
   * Width of the dock rail when closed in mini mode.
   * @default 'w-16'
   */
  miniWidth?: string;

  /**
   * Lock document body scroll while modal drawer is active (with scrollbar-gutter jump compensation).
   * @default true
   */
  lockScroll?: boolean;

  /**
   * Trap Tab key navigation within the drawer dialog.
   * @default true
   */
  focusTrap?: boolean;

  /**
   * Focus first actionable element or target CSS selector upon opening.
   * @default true
   */
  autoFocus?: boolean | string;

  /**
   * Return focus to trigger element on close.
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Transition animation duration in milliseconds.
   * @default 300
   */
  duration?: number;

  /**
   * Localization string dictionary.
   */
  translations?: CGEDrawerTranslations;
}

export type CGEDrawerEventCallback<T = any> = (detail: T) => void;

export class CGEDrawer {
  /**
   * Registry of active CGEDrawer instances by drawer element.
   */
  static instances: Map<HTMLElement, CGEDrawer>;

  /**
   * Sizing presets mapping to Tailwind CSS utility classes.
   */
  static SIZES: {
    side: Record<string, string>;
    vertical: Record<string, string>;
  };

  /**
   * Directional geometry and transition configuration.
   */
  static PLACEMENTS: Record<CGEDrawerPlacement, {
    dialogBase: string;
    closedClass: string;
    openClass: string;
    animIn: string;
    animOut: string;
    bounceClass: string;
    axis: 'x' | 'y';
    dismissFactor: number;
  }>;

  /**
   * Default configuration options.
   */
  static defaults: CGEDrawerOptions;

  /**
   * Global localization dictionary.
   */
  static translations: CGEDrawerTranslations;

  /**
   * Sets global localization dictionary.
   */
  static setTranslations(dict: CGEDrawerTranslations): void;

  /**
   * Drawer root container element.
   */
  drawer: HTMLElement;

  /**
   * Dialog / drawer panel element.
   */
  dialog: HTMLElement | null;

  /**
   * Backdrop overlay element.
   */
  backdrop: HTMLElement | null;

  /**
   * Unique instance identifier.
   */
  id: string;

  /**
   * Merged configuration options.
   */
  options: CGEDrawerOptions;

  constructor(target: string | HTMLElement, options?: CGEDrawerOptions);

  /**
   * Initializes geometry, accessibility attributes, and listeners.
   */
  init(): void;

  /**
   * Opens the drawer.
   */
  open(trigger?: HTMLElement | null): Promise<void>;

  /**
   * Closes the drawer.
   */
  close(): Promise<void>;

  /**
   * Toggles the drawer state.
   */
  toggle(trigger?: HTMLElement | null): Promise<void>;

  /**
   * Returns whether the drawer is currently open.
   */
  isOpen(): boolean;

  /**
   * Subscribes to an instance event.
   */
  on(event: 'open' | 'opened' | 'close' | 'closed', callback: CGEDrawerEventCallback<CGEDrawerEventDetail>): this;
  on(event: 'backdropClick', callback: CGEDrawerEventCallback<{ drawer: CGEDrawer; event: MouseEvent }>): this;
  on(event: 'swipe', callback: CGEDrawerEventCallback<CGEDrawerSwipeEventDetail>): this;
  on(event: string, callback: CGEDrawerEventCallback): this;

  /**
   * Unsubscribes from an instance event.
   */
  off(event: string, callback: CGEDrawerEventCallback): this;

  /**
   * Cleans up listeners and removes instance from registry.
   */
  destroy(): void;

  /**
   * Retrieves an instance by selector or DOM element.
   */
  static get(target: string | HTMLElement): CGEDrawer | null;

  /**
   * Opens a drawer by selector or element.
   */
  static open(target: string | HTMLElement, options?: CGEDrawerOptions): Promise<void>;

  /**
   * Closes a drawer by selector or element.
   */
  static close(target: string | HTMLElement): Promise<void>;

  /**
   * Toggles a drawer by selector or element.
   */
  static toggle(target: string | HTMLElement, options?: CGEDrawerOptions): Promise<void>;

  /**
   * Binds declarative triggers and discovers drawers in DOM.
   */
  static init(root?: Document | HTMLElement): void;
}

export default CGEDrawer;
