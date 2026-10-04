/**
 * TypeScript Declarations for CGEAlert
 * TailTools promise-based alert, confirmation, and dialog system.
 */

export type CGEAlertArchetype =
  | 'alert'
  | 'confirm'
  | 'delete'
  | 'restore'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'prompt'
  | 'custom';

export type CGEAlertInputType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'select'
  | 'number';

export type CGEAlertSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type CGEAlertTheme = 'light' | 'dark' | 'auto';

export interface CGEAlertSelectOption {
  value: string | number;
  label: string;
}

export interface CGEAlertTranslations {
  'confirm-button'?: string;
  'cancel-button'?: string;
  'deny-button'?: string;
  'delete-button'?: string;
  'restore-button'?: string;
  'ok-button'?: string;
  'input-placeholder'?: string;
  'input-required-error'?: string;
  'type-to-confirm-helper'?: string;
  'type-to-confirm-mismatch'?: string;
  [key: string]: string | undefined;
}

export interface CGEAlertResult<T = any> {
  /** True if user pressed primary Confirm button */
  isConfirmed: boolean;
  /** True if user pressed Deny button */
  isDenied: boolean;
  /** True if user dismissed dialog via cancel, close, esc, or backdrop */
  isDismissed: boolean;
  /** Specific dismissal reason if isDismissed is true */
  dismissReason?: 'backdrop' | 'cancel' | 'close' | 'esc';
  /** Value from input field or custom return value from preConfirm */
  value?: T;
}

export interface CGEAlertOptions {
  /** Color theme mode ('light', 'dark', or 'auto'). Defaults to 'light'. */
  theme?: CGEAlertTheme;

  /** Alert title heading */
  title?: string | null;

  /** Alert plain text message */
  message?: string;

  /** Alert rich HTML content (overrides message) */
  html?: string | null;

  /** Preset archetype styling and button configuration */
  archetype?: CGEAlertArchetype;

  /** Render variant SVG icon, custom SVG string, or disable with false */
  icon?: boolean | string;

  /** Modal sizing preset: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md') */
  size?: CGEAlertSize;

  /** Show primary confirm button (default: true) */
  showConfirmButton?: boolean;

  /** Text label for confirm button */
  confirmButtonText?: string | null;

  /** Custom CSS classes for confirm button */
  confirmButtonClass?: string;

  /** Show secondary Deny button (default: false) */
  showDenyButton?: boolean;

  /** Text label for deny button */
  denyButtonText?: string | null;

  /** Custom CSS classes for deny button */
  denyButtonClass?: string;

  /** Show Cancel button (default: false, automatically true for confirm/delete/restore/prompt) */
  showCancelButton?: boolean;

  /** Text label for cancel button */
  cancelButtonText?: string | null;

  /** Custom CSS classes for cancel button */
  cancelButtonClass?: string;

  /** Show corner close button (default: true) */
  showCloseButton?: boolean;

  /** Dismiss alert when backdrop overlay is clicked (default: true; if false, shakes dialog) */
  backdropClose?: boolean;

  /** Dismiss alert when Escape key is pressed (default: true; if false, shakes dialog) */
  allowEscapeKey?: boolean;

  /** Automatically focus confirm button on open (default: true) */
  focusConfirm?: boolean;

  /** Trap keyboard Tab focus inside dialog (default: true) */
  trapFocus?: boolean;

  /** Input field type for prompt dialogs */
  input?: CGEAlertInputType | null;

  /** Initial value for input field */
  inputValue?: string;

  /** Placeholder text for input field */
  inputPlaceholder?: string;

  /** Options array or key-value object for select inputs */
  inputOptions?: Record<string, string> | CGEAlertSelectOption[] | null;

  /** Async or sync validator returning an error string if invalid, or null if valid */
  inputValidator?: (value: string) => string | null | Promise<string | null>;

  /** High security confirmation phrase (confirm button disabled until exact match) */
  requireInput?: string | null;

  /** Whether type-to-confirm requires exact case match (default: true) */
  requireInputCaseSensitive?: boolean;

  /** Animation driver ('auto' | 'tailwind-animations' | 'css' | 'none') */
  animationDriver?: 'auto' | 'tailwind-animations' | 'css' | 'none';

  /** Translation overrides */
  translations?: Partial<CGEAlertTranslations>;

  /** Lifecycle hook before dialog opens */
  beforeOpen?: (dialogEl: HTMLElement) => void;

  /** Lifecycle hook after dialog opens and focuses */
  didOpen?: (dialogEl: HTMLElement) => void;

  /** Lifecycle hook before dialog closes */
  willClose?: (dialogEl: HTMLElement) => void;

  /** Async pre-confirm hook before closing; return false to abort dismissal */
  preConfirm?: (value: any) => any | Promise<any>;
}

export interface CGEAlertEventDetail {
  alert: CGEAlert;
  archetype: CGEAlertArchetype;
  value?: any;
  reason?: string;
  [key: string]: any;
}

export declare class CGEAlert {
  static currentAlert: CGEAlert | null;
  static portalContainer: HTMLElement | null;
  static translations: CGEAlertTranslations;
  static defaults: CGEAlertOptions;
  static ICONS: Record<string, string>;
  static SIZES: Record<CGEAlertSize, string>;

  id: string;
  options: CGEAlertOptions;
  translations: CGEAlertTranslations;
  isOpen: boolean;
  isLoadingState: boolean;
  previousActiveElement: Element | null;
  overlayEl: HTMLElement | null;
  dialogEl: HTMLElement | null;
  inputEl: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  confirmBtn: HTMLButtonElement | null;
  denyBtn: HTMLButtonElement | null;
  cancelBtn: HTMLButtonElement | null;
  inputErrorEl: HTMLElement | null;

  constructor(options?: CGEAlertOptions);

  /**
   * Lazily gets or creates the portal container under document.body.
   */
  static getPortal(): HTMLElement;

  /**
   * Opens the alert and returns a Promise.
   */
  show(): Promise<CGEAlertResult>;

  /**
   * Triggers a horizontal shake animation on the alert card.
   */
  shake(): void;

  /**
   * Puts confirm button into loading state with a spinner.
   */
  showLoading(): void;

  /**
   * Restores confirm button from loading state.
   */
  hideLoading(): void;

  /**
   * Dismisses the alert dialog.
   */
  dismiss(reason?: 'backdrop' | 'cancel' | 'close' | 'esc'): void;

  /**
   * Launches an alert dialog with full options object.
   */
  static fire<T = any>(options?: CGEAlertOptions): Promise<CGEAlertResult<T>>;

  /**
   * Shortcut for alert notification dialog.
   */
  static alert(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;

  /**
   * Shortcut for confirmation dialog with Confirm and Cancel buttons.
   */
  static confirm(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;

  /**
   * Shortcut for destructive deletion confirmation dialog.
   */
  static delete(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;

  /**
   * Shortcut for item recovery / restore confirmation dialog.
   */
  static restore(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;

  /**
   * Shortcut for prompt input dialog.
   */
  static prompt<T = string>(title: string, inputOptions?: Partial<CGEAlertOptions>): Promise<CGEAlertResult<T>>;

  /**
   * Programmatically closes the currently active alert.
   */
  static close(reason?: 'backdrop' | 'cancel' | 'close' | 'esc'): void;

  /**
   * Checks if an alert is currently in loading state.
   */
  static isLoading(): boolean;

  /**
   * Puts active alert into loading state.
   */
  static showLoading(): void;

  /**
   * Restores active alert from loading state.
   */
  static hideLoading(): void;

  /**
   * Updates global configuration defaults for all future alerts.
   */
  static setDefaultOptions(options: Partial<CGEAlertOptions>): void;

  /**
   * Updates global translations dictionary.
   */
  static setTranslations(dict: Partial<CGEAlertTranslations>): void;

  /**
   * Scans document and sets up global click event delegation for `[data-cge-alert]`.
   */
  static init(root?: Document | HTMLElement): void;
}

export default CGEAlert;

declare global {
  interface DocumentEventMap {
    'cge:alert:open': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:confirm': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:cancel': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:close': CustomEvent<CGEAlertEventDetail>;
  }
}
