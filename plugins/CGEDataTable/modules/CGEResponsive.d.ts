/**
 * CGEResponsive - TypeScript Definitions
 */

export interface CGEResponsiveOptions {
  mode?: 'collapse' | 'scroll';
  /**
   * Collapse tiers. A number is the landscape tier and scales the defaults (640 => 480 / 640 / 768);
   * an array sets [phone, landscape, tablet] widths explicitly.
   */
  breakpoint?: number | [number, number, number];
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
