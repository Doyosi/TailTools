# CGEToast API

This reference mirrors the shipped [declaration](../../plugins/CGEToast/CGEToast.d.ts). Both named and default class imports are supported by the plugin barrel.

Repeated init consumes each session flash once; duration=0/false remains persistent. Nested root listeners process a click once. Toast rich messages and custom render content accept trusted HTML; keep untrusted user text escaped. Use dismiss/clear and the declared Toast API rather than adding a universal destroy method.

```typescript
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
   * Primary notification message (supports HTML strings).
   */
  message: string;

  /**
   * Optional header title. If omitted, uses localized default variant title.
   */
  title?: string | null;

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
   */
  static init(root?: Document | HTMLElement): void;
}

export default CGEToast;

declare global {
  interface DocumentEventMap {
    'cge:toast:open': CustomEvent<CGEToastEventDetail>;
    'cge:toast:close': CustomEvent<CGEToastEventDetail>;
    'cge:toast:click': CustomEvent<CGEToastEventDetail>;
  }
}
```
