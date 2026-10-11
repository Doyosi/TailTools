export interface CGEAccordionUIOptions {
  item?: string;
  trigger?: string;
  activeTrigger?: string;
  icon?: string;
  activeIcon?: string;
  wrapper?: string;
  activeWrapper?: string;
  content?: string;
  activeContent?: string;
}

export interface CGEAccordionOptions {
  exclusive?: boolean;
  alwaysOpen?: boolean;
  defaultOpen?: string | string[] | null;
  urlSync?: 'hash' | false;
  updateHash?: boolean;
  scrollIntoView?: boolean;
  storage?: 'localStorage' | 'sessionStorage' | false;
  storageKey?: string | null;
  duration?: number;
  animation?: string | false;
  keyboard?: boolean;
  onOpen?: ((itemId: string, itemEl: HTMLElement) => void) | null;
  onClose?: ((itemId: string, itemEl: HTMLElement) => void) | null;
  onToggle?: ((itemId: string, isOpen: boolean, itemEl: HTMLElement) => void) | null;
  ui?: CGEAccordionUIOptions;
}

export type CGEAccordionResolvedOptions = Omit<Required<CGEAccordionOptions>, 'ui'> & {
  ui: Required<CGEAccordionUIOptions>;
};

export interface CGEAccordionItem {
  id: string;
  el: HTMLElement;
  trigger: HTMLElement;
  wrapper: HTMLElement;
  content: HTMLElement | null;
  icon: HTMLElement | null;
  isOpen: boolean;
}

export interface CGEAccordionEventDetail {
  instance: CGEAccordion;
  itemId?: string;
  itemEl?: HTMLElement;
  isOpen?: boolean;
  id?: string;
}

export type CGEAccordionEventCallback = (detail: CGEAccordionEventDetail) => void;

export declare class CGEAccordion {
  static instances: Map<HTMLElement | string, CGEAccordion>;
  static defaults: CGEAccordionOptions;
  element: HTMLElement;
  id: string;
  options: CGEAccordionResolvedOptions;
  items: CGEAccordionItem[];
  openItemIds: Set<string>;

  constructor(target: string | HTMLElement, options?: CGEAccordionOptions);

  open(itemId: string): this;
  close(itemId: string): this;
  toggle(itemId: string): this;
  openAll(): this;
  closeAll(): this;
  isOpen(itemId: string): boolean;
  getItems(): CGEAccordionItem[];
  getItem(itemId: string): CGEAccordionItem | null;
  on(eventName: string, callback: CGEAccordionEventCallback): this;
  off(eventName: string, callback: CGEAccordionEventCallback): this;
  destroy(): void;

  /**
   * Returns every instance under root (new and existing). Destroys detached instances first and
   * rebuilds instances whose plugin attributes were removed by Livewire morphing.
   */
  static init(root?: HTMLElement | Document | string, options?: CGEAccordionOptions): CGEAccordion[];
  /** Destroys instances whose element is inside root or no longer connected. */
  static destroyAll(root?: HTMLElement | Document): CGEAccordion[];
  /** Returns the registered instance or null. */
  static get(elementOrId: HTMLElement | string): CGEAccordion | null;
}

export interface CGECollapseUIOptions {
  trigger?: string;
  activeTrigger?: string;
  icon?: string;
  activeIcon?: string;
  wrapper?: string;
  activeWrapper?: string;
  content?: string;
}

export interface CGECollapseOptions {
  defaultOpen?: boolean;
  duration?: number;
  animation?: string | false;
  storage?: 'localStorage' | 'sessionStorage' | false;
  storageKey?: string | null;
  onOpen?: ((instance: CGECollapse) => void) | null;
  onClose?: ((instance: CGECollapse) => void) | null;
  onToggle?: ((isOpen: boolean, instance: CGECollapse) => void) | null;
  ui?: CGECollapseUIOptions;
}

export type CGECollapseResolvedOptions = Omit<Required<CGECollapseOptions>, 'ui'> & {
  ui: Required<CGECollapseUIOptions>;
};

export interface CGECollapseEventDetail {
  instance: CGECollapse;
  isOpen?: boolean;
}

export type CGECollapseEventCallback = (detail: CGECollapseEventDetail) => void;

export declare class CGECollapse {
  static instances: Map<HTMLElement | string, CGECollapse>;
  static defaults: CGECollapseOptions;
  wrapper: HTMLElement;
  trigger: HTMLElement | null;
  /** All controls targeting the same panel share this instance and state. */
  triggers: HTMLElement[];
  content: HTMLElement | null;
  icon: HTMLElement | null;
  options: CGECollapseResolvedOptions;
  id: string;

  constructor(target: string | HTMLElement, options?: CGECollapseOptions);

  open(): this;
  close(): this;
  toggle(): this;
  isOpen(): boolean;
  on(eventName: string, callback: CGECollapseEventCallback): this;
  off(eventName: string, callback: CGECollapseEventCallback): this;
  destroy(): void;

  /**
   * Returns every collapse under root. Accordion item triggers are skipped; collapses inside
   * accordion bodies are initialized.
   */
  static init(root?: HTMLElement | Document | string, options?: CGECollapseOptions): CGECollapse[];
  /** Destroys collapses whose panel is inside root or no longer connected. */
  static destroyAll(root?: HTMLElement | Document): CGECollapse[];
  /** Returns the registered instance or null. */
  static get(elementOrId: HTMLElement | string): CGECollapse | null;
}

export default CGEAccordion;
