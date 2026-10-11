/**
 * TypeScript Declarations for CGEModal
 * TailTools native modal plugin.
 */

export type CGEModalSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | 'full'
  | string;

export type CGEModalAnimationDriver = 'auto' | 'tailwind-animations' | 'css' | 'none';

export type CGEModalAnimation = 'zoom' | 'fade' | 'slide-up' | 'slide-down' | string;

export interface CGEModalOptions {
  /**
   * Backdrop dismissal behavior.
   * If `true`, clicking backdrop closes modal.
   * If `'static'`, outside clicks shake the dialog card.
   * If `false`, backdrop does not close modal.
   * @default true
   */
  backdrop?: boolean | 'static';

  /**
   * Shorthand alias for backdrop closing behavior.
   * @default true
   */
  backdropClose?: boolean;

  /**
   * Whether pressing Escape key closes the modal.
   * If `false` and `backdrop` is `'static'`, pressing Escape triggers the shake effect.
   * @default true
   */
  escapeClose?: boolean;

  /**
   * Sizing preset or custom max-width Tailwind class.
   * Presets: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'
   * @default 'lg'
   */
  size?: CGEModalSize;

  /**
   * Animation driver mode.
   * - 'auto': Checks if tailwind-animations is present; falls back to CSS transitions.
   * - 'tailwind-animations': Midudev CSS animation utilities.
   * - 'css': Standard Tailwind v4 transition classes.
   * - 'none': Immediate toggle with no animation.
   * @default 'auto'
   */
  animationDriver?: CGEModalAnimationDriver;

  /**
   * Entry and exit animation style.
   * @default 'zoom'
   */
  animation?: CGEModalAnimation;

  /**
   * Trap Tab key focus navigation inside open modal.
   * @default true
   */
  focusTrap?: boolean;

  /**
   * Whether to autofocus on first interactive element or selector to focus.
   * @default true
   */
  autoFocus?: boolean | string;

  /**
   * Restore focus to trigger element upon closing.
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Lock body scrolling while modal is open (with scrollbar jump compensation).
   * @default true
   */
  lockScroll?: boolean;

  /**
   * Animation duration in milliseconds for cleanup timers.
   * @default 250
   */
  duration?: number;
}

export interface CGEModalEventDetail {
  instance: CGEModal;
  modal: HTMLElement;
  dialog: HTMLElement | null;
  trigger?: HTMLElement | null;
  [key: string]: any;
}

export declare class CGEModal {
  /**
   * Active instance registry.
   */
  static instances: Map<HTMLElement, CGEModal>;

  /**
   * Sizing presets mapping.
   */
  static SIZES: Record<string, string>;

  /**
   * Default configuration options.
   */
  static defaults: CGEModalOptions;

  /**
   * The root modal container element.
   */
  modal: HTMLElement;

  /**
   * The inner dialog card container.
   */
  dialog: HTMLElement | null;

  /**
   * The backdrop overlay element.
   */
  backdrop: HTMLElement | null;

  /**
   * Resolved options.
   */
  options: CGEModalOptions;

  /**
   * @param target - Modal element, CSS selector or bare element ID
   * @param options - Custom configuration options
   * @throws Error when the target element cannot be found
   */
  constructor(target: string | HTMLElement, options?: CGEModalOptions);

  /**
   * Initializes modal ARIA attributes, size classes, and DOM listeners.
   */
  init(): void;

  /**
   * Opens the modal dialog.
   * @param triggerElement - Optional element that initiated the open action
   * @returns Promise resolving to `true` if opened, `false` if prevented
   */
  open(triggerElement?: HTMLElement | null): Promise<boolean>;

  /**
   * Closes the modal dialog.
   * @returns Promise resolving to `true` if closed, `false` if prevented
   */
  close(): Promise<boolean>;

  /**
   * Toggles the modal visibility.
   * @param triggerElement
   */
  toggle(triggerElement?: HTMLElement | null): Promise<boolean>;

  /**
   * Triggers tactile shake animation on dialog card.
   */
  shake(): void;

  /**
   * Dynamically updates the dialog size preset or custom class.
   * @param newSize - Size preset or Tailwind max-width class
   */
  setSize(newSize: CGEModalSize): this;

  /**
   * Boolean state indicating if modal is currently open.
   */
  get isOpen(): boolean;

  /**
   * Destroys the modal instance, resets scroll, and cleans up all listeners.
   */
  destroy(): void;

  /**
   * Retrieves existing CGEModal instance attached to an element.
   */
  static getInstance(target: string | HTMLElement): CGEModal | undefined;

  /**
   * Resolves an element, a CSS selector (`#id`, `.class`, `[data-x]`) or a bare element ID.
   */
  static resolveTarget(target: string | HTMLElement | null | undefined): HTMLElement | null;

  /**
   * Gets existing instance or initializes a new CGEModal.
   */
  static getOrCreateInstance(target: string | HTMLElement, options?: CGEModalOptions): CGEModal;

  /**
   * Closes all currently opened CGEModal instances on the page.
   */
  static closeAll(): void;

  /**
   * Scans document for declarative triggers and modals and attaches click behaviors.
   * Instances whose elements were removed (Livewire morph, Turbo) are destroyed first.
   */
  static init(root?: Document | HTMLElement): void;

  /**
   * Destroys instances inside `root` (or already detached) and removes trigger delegation
   * bound to `root` or roots inside it. Call before Livewire/Turbo replaces the subtree.
   */
  static destroyAll(root?: Document | HTMLElement): CGEModal[];
}

export default CGEModal;

declare global {
  interface HTMLElementEventMap {
    'cge:modal:open': CustomEvent<CGEModalEventDetail>;
    'cge:modal:opened': CustomEvent<CGEModalEventDetail>;
    'cge:modal:close': CustomEvent<CGEModalEventDetail>;
    'cge:modal:closed': CustomEvent<CGEModalEventDetail>;
    'cge:modal:shake': CustomEvent<CGEModalEventDetail>;
    'cge:modal:init': CustomEvent<CGEModalEventDetail>;
    'cge:modal:destroy': CustomEvent<CGEModalEventDetail>;
  }
}
