/**
 * CGETabs TypeScript Definitions
 * High-performance, accessible tabs and segmented control plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
 *
 * @license MIT
 * @package TailTools
 */

export type CGETabsUrlSync = 'hash' | 'query' | false;
export type CGETabsHistoryMode = 'replace' | 'push';
export type CGETabsStorage = 'localStorage' | 'sessionStorage' | false;
export type CGETabsOrientation = 'horizontal' | 'vertical';
export type CGETabsIndicator = boolean | 'line' | 'pill';
export type CGETabsAjaxDriver = 'auto' | 'axios' | 'fetch';

export interface CGETabsAjaxConfig {
  url: string;
  method?: string;
  driver?: CGETabsAjaxDriver;
}

/** Minimal axios-compatible client (a configured instance wins over window.axios). */
export interface CGETabsAxiosLike {
  request(config: Record<string, unknown>): Promise<{ data: unknown; headers?: unknown }>;
}

/** Initializes nested plugins inside a freshly loaded AJAX panel. */
export type CGETabsPanelInitializer = (panel: HTMLElement, tabId: string, instance: CGETabs) => void;
/** Destroys nested plugins before a panel's content is replaced or restored. */
export type CGETabsPanelDestroyer = (panel: HTMLElement, instance: CGETabs) => void;

export interface CGETabsUIConfig {
  /** Base layout slots apply when explicitly configured; markup owns their default styling. */
  tabList?: string;
  tab?: string;
  activeTab?: string;
  inactiveTab?: string;
  disabledTab?: string;
  indicator?: string;
  panelContainer?: string;
  panel?: string;
  activePanel?: string;
  loadingContainer?: string;
  errorContainer?: string;
}

export interface CGETabsTranslations {
  loading?: string;
  'ajax-error'?: string;
  retry?: string;
  [key: string]: string | undefined;
}

export interface CGETabsItem {
  id: string;
  trigger: HTMLElement;
  panel: HTMLElement | null;
}

export interface CGETabsOptions {
  /** 'hash' stores state as #<hashKey>=<tabId>&<otherKey>=<tabId>; a legacy #<tabId> is still read. */
  urlSync?: CGETabsUrlSync;
  /** Key of this group in the namespaced hash; defaults to the element id. */
  hashKey?: string | null;
  queryParamKey?: string;
  historyMode?: CGETabsHistoryMode;
  storage?: CGETabsStorage;
  storageKey?: string | null;
  defaultTab?: string | null;
  orientation?: CGETabsOrientation;
  indicator?: CGETabsIndicator;
  cacheAjax?: boolean;
  ajaxDriver?: CGETabsAjaxDriver;
  ajaxHeaders?: Record<string, string>;
  ajaxTabs?: Record<string, string | CGETabsAjaxConfig>;
  /** Configured axios instance used by the 'auto'/'axios' drivers before window.axios. */
  axiosInstance?: CGETabsAxiosLike | null;
  /**
   * Applied to every AJAX response before injection (e.g. DOMPurify.sanitize).
   * Responses must be HTML/text or JSON with a string `html` property; other JSON is an error.
   */
  sanitize?: ((html: string, tabId: string) => string | Node) | null;
  /** Per-instance initializer for nested plugins; overrides CGETabs.setPanelInitializer(). */
  initPanel?: CGETabsPanelInitializer | null;
  /** Per-instance teardown for nested plugins; overrides the registered destroyer. */
  destroyPanel?: CGETabsPanelDestroyer | null;
  manual?: boolean;
  transition?: boolean;
  animationIn?: string;
  onShow?: (((tabId: string, panel: HTMLElement | null, trigger: HTMLElement) => void) | null) | null;
  onShown?: (((tabId: string, panel: HTMLElement | null, trigger: HTMLElement) => void) | null) | null;
  onAjaxStart?: (((tabId: string, panel: HTMLElement) => void) | null) | null;
  onAjaxLoaded?: (((tabId: string, panel: HTMLElement, response: string) => void) | null) | null;
  onAjaxError?: (((tabId: string, error: any) => void) | null) | null;
  ui?: CGETabsUIConfig;
  translations?: CGETabsTranslations;
}

export type CGETabsResolvedOptions = Omit<Required<CGETabsOptions>, 'ui' | 'translations'> & {
  ui: Required<CGETabsUIConfig>;
  translations: Required<CGETabsTranslations>;
};

export interface CGETabsShowEventDetail {
  tabId: string;
  previousTabId: string | null;
  panel: HTMLElement | null;
  trigger: HTMLElement;
  instance: CGETabs;
}

export interface CGETabsAjaxStartDetail {
  tabId: string;
  panel: HTMLElement;
  instance: CGETabs;
}

export interface CGETabsAjaxLoadedDetail {
  tabId: string;
  panel: HTMLElement;
  response: string;
  instance: CGETabs;
}

export interface CGETabsAjaxErrorDetail {
  tabId: string;
  error: any;
  instance: CGETabs;
}

export interface CGETabsDestroyedDetail {
  instance: CGETabs;
}

export interface CGETabsEventMap {
  'cge:tabs:show': CGETabsShowEventDetail;
  'cge:tabs:shown': CGETabsShowEventDetail;
  'cge:tabs:ajax-start': CGETabsAjaxStartDetail;
  'cge:tabs:ajax-loaded': CGETabsAjaxLoadedDetail;
  'cge:tabs:ajax-error': CGETabsAjaxErrorDetail;
  'cge:tabs:destroyed': CGETabsDestroyedDetail;
}

export declare class CGETabs {
  static instances: Map<HTMLElement | string, CGETabs>;
  static defaults: CGETabsOptions;
  /** Returns the registered instance or null. */
  static get(elementOrId: string | HTMLElement): CGETabs | null;
  /**
   * Returns every instance under root (new and existing). Destroys detached instances first and
   * rebuilds instances whose plugin attributes were removed by Livewire morphing.
   */
  static init(selectorOrRoot?: string | HTMLElement | Document, options?: CGETabsOptions, root?: HTMLElement | Document): CGETabs[];
  /** Destroys instances whose element is inside root or no longer connected. */
  static destroyAll(root?: HTMLElement | Document): CGETabs[];
  /** Registers the nested-plugin initializer for AJAX panels (tailtools/auto registers initTailTools). */
  static setPanelInitializer(initializer: CGETabsPanelInitializer | null, destroyer?: CGETabsPanelDestroyer | null): void;

  element: HTMLElement;
  id: string;
  options: CGETabsResolvedOptions;
  activeTabId: string | null;
  tabs: CGETabsItem[];
  tabList: HTMLElement | null;
  indicatorEl: HTMLElement | null;

  constructor(target: string | HTMLElement, options?: CGETabsOptions);

  /** Returns true for the active tab without repeating events or reloading content. */
  show(tabId: string, options?: { focus?: boolean; updateHistory?: boolean }): boolean;
  next(): boolean;
  prev(): boolean;
  first(): boolean;
  last(): boolean;
  getActiveTab(): string | null;
  getTab(tabId: string): HTMLElement | null;
  getPanel(tabId: string): HTMLElement | null;
  updateIndicator(): void;
  loadAjaxTab(tabId: string, force?: boolean): Promise<void>;
  on<K extends keyof CGETabsEventMap>(event: K, callback: (detail: CGETabsEventMap[K]) => void): this;
  off<K extends keyof CGETabsEventMap>(event: K, callback: (detail: CGETabsEventMap[K]) => void): this;
  destroy(): void;
}

