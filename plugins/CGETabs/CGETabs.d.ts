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

export interface CGETabsUIConfig {
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
  urlSync?: CGETabsUrlSync;
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
  manual?: boolean;
  transition?: boolean;
  animationIn?: string;
  onShow?: ((tabId: string, panel: HTMLElement | null, trigger: HTMLElement) => void) | null;
  onShown?: ((tabId: string, panel: HTMLElement | null, trigger: HTMLElement) => void) | null;
  onAjaxStart?: ((tabId: string, panel: HTMLElement) => void) | null;
  onAjaxLoaded?: ((tabId: string, panel: HTMLElement, response: string) => void) | null;
  onAjaxError?: ((tabId: string, error: any) => void) | null;
  ui?: CGETabsUIConfig;
  translations?: CGETabsTranslations;
}

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
  static get(elementOrId: string | HTMLElement): CGETabs | undefined;
  static init(selectorOrRoot?: string | HTMLElement | Document, options?: CGETabsOptions, root?: HTMLElement | Document): CGETabs[];

  element: HTMLElement;
  id: string;
  options: Required<CGETabsOptions>;
  activeTabId: string | null;
  tabs: CGETabsItem[];
  tabList: HTMLElement | null;
  indicatorEl: HTMLElement | null;

  constructor(target: string | HTMLElement, options?: CGETabsOptions);

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

