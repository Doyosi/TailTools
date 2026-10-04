/**
 * CGEResponsive - TypeScript Definitions
 */

export interface CGEResponsiveOptions {
  mode?: 'collapse' | 'scroll';
  breakpoint?: number;
  table?: HTMLTableElement | string | null;
  container?: HTMLElement | string | null;
  collapseDetailsText?: string;
  onChange?: (payload: { mode: string; width: number; hiddenColumns: string[] }) => void;
}

export declare class CGEResponsive {
  options: Required<CGEResponsiveOptions>;
  mode: 'collapse' | 'scroll';
  tableElement: HTMLTableElement | null;
  containerElement: HTMLElement | null;
  hiddenColumns: Set<string>;
  expandedRows: Set<HTMLTableRowElement>;
  table: any;

  constructor(options?: CGEResponsiveOptions);

  attach(table: HTMLTableElement | string, container?: HTMLElement | string | null): void;
  setMode(mode: 'collapse' | 'scroll'): this;
  refresh(): this;
  toggleRow(tr: HTMLTableRowElement): void;
  expandRow(tr: HTMLTableRowElement): void;
  collapseRow(tr: HTMLTableRowElement): void;
  collapseAll(): void;
  destroy(): void;
}

export default CGEResponsive;
