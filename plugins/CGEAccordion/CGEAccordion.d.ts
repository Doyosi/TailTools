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
  onOpen?: (itemId: string, itemEl: HTMLElement) => void;
  onClose?: (itemId: string, itemEl: HTMLElement) => void;
  onToggle?: (itemId: string, isOpen: boolean, itemEl: HTMLElement) => void;
  ui?: CGEAccordionUIOptions;
}

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
  options: CGEAccordionOptions;
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

  static init(root?: HTMLElement | Document | string, options?: CGEAccordionOptions): CGEAccordion[];
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
  onOpen?: (instance: CGECollapse) => void;
  onClose?: (instance: CGECollapse) => void;
  onToggle?: (isOpen: boolean, instance: CGECollapse) => void;
  ui?: CGECollapseUIOptions;
}

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
  content: HTMLElement | null;
  icon: HTMLElement | null;
  options: CGECollapseOptions;
  id: string;

  constructor(target: string | HTMLElement, options?: CGECollapseOptions);

  open(): this;
  close(): this;
  toggle(): this;
  isOpen(): boolean;
  on(eventName: string, callback: CGECollapseEventCallback): this;
  off(eventName: string, callback: CGECollapseEventCallback): this;
  destroy(): void;

  static init(root?: HTMLElement | Document | string, options?: CGECollapseOptions): CGECollapse[];
  static get(elementOrId: HTMLElement | string): CGECollapse | null;
}

export default CGEAccordion;
