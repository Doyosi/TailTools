/**
 * TypeScript Declarations for CGEToast
 * TailTools notification and toast alert plugin.
 */

export type CGEToastVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type CGEToastTheme = 'light' | 'dark' | 'auto';

export type CGEToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center'
  | 'top-full'
  | 'bottom-full';

export interface CGEToastAction {
  label: string;
  class?: string;
  onClick?: (toast: CGEToast, event: MouseEvent) => void;
}

export interface CGEToastImage {
  src: string;
  alt?: string;
  class?: string;
}

export interface CGEToastTranslations {
  close?: string;
  undo?: string;
  'success-title'?: string;
  'error-title'?: string;
  'warning-title'?: string;
  'info-title'?: string;
  'neutral-title'?: string;
  [key: string]: string | undefined;
}

export interface CGEToastOptions {
  /**
   * Theme mode ('light', 'dark', or 'auto'). Defaults to 'light'.
   */
  theme?: CGEToastTheme;

  /**
   * Primary notification message. Rendered as plain text unless `html: true`.
   */
  message: string;

  /**
   * Optional header title. If omitted, uses localized default variant title. Plain text unless `html: true`.
   */
  title?: string | null;

  /**
   * Render `title`, `message` and action labels as trusted HTML. Leave `false` for any
   * server/user-provided text (CGEForm and CGEActionButton messages rely on this default).
   * Declarative triggers opt in with `data-cge-html` / `data-cge-toast-html`.
   * @default false
   */
  html?: boolean;

  /**
   * Semantic style variant.
   * @default 'neutral'
   */
  variant?: CGEToastVariant;

  /**
   * Viewport placement position.
   * Standard floating: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'
   * Full-width edge-to-edge banners: 'top-full' | 'bottom-full'
   * @default 'top-right'
   */
  position?: CGEToastPosition;

  /**
   * Duration in milliseconds before auto-dismissal. Set to `false` or `0` for persistent toasts.
   * @default 5000
   */
  duration?: number | false;

  /**
   * Show animated countdown progress bar at bottom of toast.
   * @default true
   */
  progressBar?: boolean;

  /**
   * Freeze countdown timer while cursor is hovered over toast.
   * @default true
   */
  pauseOnHover?: boolean;

  /**
   * Dismiss notification upon clicking the card.
   * @default false
   */
  dismissOnClick?: boolean;

  /**
   * Show dedicated close button.
   * @default true
   */
  dismissible?: boolean;

  /**
   * Enable touch horizontal swipe gesture to flick away on mobile devices.
   * @default true
   */
  swipeToDismiss?: boolean;

  /**
   * Render variant SVG icon, custom SVG string, or disable with `false`.
   * @default true
   */
  icon?: boolean | string;

  /**
   * Custom image or avatar object.
   */
  image?: CGEToastImage | null;

  /**
   * Action buttons rendered inside notification card.
   */
  actions?: CGEToastAction[];

  /**
   * Prepend new toasts to top of stack when `true`; append to bottom when `false`.
   * @default true
   */
  newestOnTop?: boolean;

  /**
   * Maximum concurrent notifications allowed in this position container.
   * @default 5
   */
  maxToasts?: number;

  /**
   * Translation overrides for this specific toast.
   */
  translations?: Partial<CGEToastTranslations>;

  /**
   * Callback fired immediately when toast mounts into DOM.
   */
  onOpen?: (toast: CGEToast) => void;

  /**
   * Callback fired after toast is dismissed and removed.
   */
  onClose?: (toast: CGEToast) => void;

  /**
   * Callback fired when toast card is clicked.
   */
  onClick?: (toast: CGEToast, event: MouseEvent) => void;
}

export interface CGEToastEventDetail {
  toast: CGEToast;
  variant: CGEToastVariant;
  message: string;
  position: CGEToastPosition;
  event?: MouseEvent;
  [key: string]: any;
}

export declare class CGEToast {
  static activeToasts: Set<CGEToast>;
  static containers: Map<string, HTMLElement>;
  static translations: CGEToastTranslations;
  static defaults: CGEToastOptions;
  static ICONS: Record<string, string>;
  static VARIANTS: Record<string, { border: string; progress: string; badge: string }>;

  id: string;
  isOpen: boolean;
  isPaused: boolean;
  remainingTime: number;
  options: CGEToastOptions;
  translations: CGEToastTranslations;
  container: HTMLElement;
  el: HTMLElement;

  constructor(options: CGEToastOptions);

  /**
   * Pauses the countdown timer.
   */
  pause(): void;

  /**
   * Resumes the countdown timer.
   */
  resume(): void;

  /**
   * Dismisses and unmounts the notification.
   */
  dismiss(): Promise<boolean>;

  /**
   * Shows a generic toast notification.
   */
  static show(options: CGEToastOptions): CGEToast;

  /**
   * Shortcut for success notification.
   */
  static success(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /**
   * Shortcut for error notification.
   */
  static error(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /**
   * Shortcut for warning notification.
   */
  static warning(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /**
   * Shortcut for info notification.
   */
  static info(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /**
   * Dismisses all active notifications, or all in a specific position.
   */
  static dismissAll(position?: CGEToastPosition | null): void;

  /**
   * Updates global configuration defaults for all future toasts.
   */
  static setDefaultOptions(options: Partial<CGEToastOptions>): void;

  /**
   * Reconfigures global translation dictionary.
   */
  static setTranslations(dict: Partial<CGEToastTranslations>): void;

  /**
   * Scans document for declarative triggers and session flash templates.
   * Toasts and delegation roots detached by Livewire/Turbo are forgotten first.
   */
  static init(root?: Document | HTMLElement): void;

  /**
   * Removes trigger delegation bound to `root` (or inside it). Passing `document` also
   * dismisses every active toast; the promise resolves once they are removed.
   */
  static destroyAll(root?: Document | HTMLElement): Promise<void>;
}

export default CGEToast;

declare global {
  interface DocumentEventMap {
    'cge:toast:open': CustomEvent<CGEToastEventDetail>;
    'cge:toast:close': CustomEvent<CGEToastEventDetail>;
    'cge:toast:click': CustomEvent<CGEToastEventDetail>;
  }
}
