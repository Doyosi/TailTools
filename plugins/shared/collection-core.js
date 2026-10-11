// Shared data helpers for the CGEDataTable and CGEDataGrid modules: text folding,
// value access, column type detection/parsing and Laravel paginator responses.

export const isEmptyValue = value => value === null || value === undefined
  || (typeof value === 'string' && value.trim() === '')
  || (typeof value === 'number' && Number.isNaN(value));

/** Filter values that mean "no filter": empty, 'all', [] (Blade "All" options). */
export const isClearFilter = value => value === undefined || value === null || value === ''
  || value === 'all' || (Array.isArray(value) && value.length === 0);

/** Page language (`<html lang="tr">`) used when no explicit locale is configured. */
export function defaultLocale() {
  if (typeof document === 'undefined') return undefined;
  return document.documentElement?.lang || undefined;
}

/** Returns a locale accepted by Intl, otherwise undefined (runtime default). */
export function safeLocale(locale) {
  if (!locale) return undefined;
  try {
    'a'.toLocaleLowerCase(locale);
    return locale;
  } catch {
    return undefined;
  }
}

/**
 * Forgiving search key: locale lower-case, diacritics removed and dotless ı folded to i,
 * so İstanbul / istanbul / ISTANBUL and IĞDIR / ığdır match each other.
 */
export function foldText(value, locale) {
  let text = String(value ?? '');
  try {
    text = locale ? text.toLocaleLowerCase(locale) : text.toLowerCase();
  } catch {
    text = text.toLowerCase();
  }
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

/** Reads a row value: DOM `cells`, direct keys, then dotted paths ("user.name"). */
export function readValue(row, key) {
  if (row == null || key == null) return null;
  if (row.cells && typeof row.cells === 'object' && key in row.cells) return row.cells[key];
  if (row[key] !== undefined) return row[key];
  if (typeof key === 'string' && key.includes('.')) {
    return key.split('.').reduce((acc, part) => (acc != null && acc[part] !== undefined ? acc[part] : null), row);
  }
  return null;
}

const PRIMITIVES = new Set(['string', 'number', 'boolean', 'bigint']);

/** Keys searched when none are configured: primitive, public, non-markup fields. */
export function searchableKeys(row, exclude = []) {
  if (!row || typeof row !== 'object') return [];
  return Object.keys(row).filter(key => !key.startsWith('_') && !/^html_|_html$/i.test(key)
    && !exclude.includes(key) && PRIMITIVES.has(typeof row[key]));
}

// --- Numbers -----------------------------------------------------------------

const CURRENCY_SYMBOLS = /[$€£¥₺₹₽]/g;
const CURRENCY_CODES = /^(?:[A-Z]{3}|TL)\s+|\s+(?:[A-Z]{3}|TL)$/g;

/** Strips currency symbols/codes, spaces and % and returns a numeric string or null. */
function numericText(value) {
  const text = String(value).trim().replace(CURRENCY_SYMBOLS, '').replace(CURRENCY_CODES, '')
    .replace(/[\s\u00a0\u202f']/g, '').replace(/%$/, '').replace(/^\u2212/, '-');
  return /^[+-]?(?:\d[\d.,]*|[.,]\d+)$/.test(text) && !/[.,]$/.test(text) ? text : null;
}

/** Decimal separator implied by one value, or null when it is ambiguous ("1.234"). */
function decimalOf(text) {
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) return comma > dot ? ',' : '.';
  const index = Math.max(comma, dot);
  if (index < 0) return null;
  const separator = text[index];
  if (text.indexOf(separator) !== index) return separator === ',' ? '.' : ',';
  return text.length - index - 1 === 3 ? null : separator;
}

export function localeDecimal(locale) {
  try {
    return new Intl.NumberFormat(safeLocale(locale)).format(1.5).includes(',') ? ',' : '.';
  } catch {
    return '.';
  }
}

/** Column decimal separator: majority of unambiguous values, then the locale. */
export function detectDecimal(values, locale) {
  let comma = 0;
  let dot = 0;
  for (const value of values) {
    if (typeof value === 'number') continue;
    const text = numericText(value);
    const decimal = text && decimalOf(text);
    if (decimal === ',') comma++;
    else if (decimal === '.') dot++;
  }
  if (comma !== dot) return comma > dot ? ',' : '.';
  return localeDecimal(locale);
}

/** Parses "1.234,50", "$1,200.00", "999,00 TL" or 12 into a number (NaN when not numeric). */
export function parseNumber(value, fallbackDecimal = '.') {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value == null) return NaN;
  const text = numericText(value);
  if (text === null) return NaN;
  const decimal = decimalOf(text) || fallbackDecimal;
  const thousands = decimal === ',' ? /\./g : /,/g;
  return Number(text.replace(thousands, '').replace(decimal, '.'));
}

export const isNumericValue = value => typeof value === 'number' ? Number.isFinite(value)
  : typeof value === 'bigint' || (value != null && numericText(value) !== null);

// --- Dates -------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:$|[T\s])/;
const YMD_DATE = /^(\d{4})[./](\d{1,2})[./](\d{1,2})(?:[T\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const DMY_DATE = /^(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?:[T\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

const utc = (year, month, day, hours = 0, minutes = 0, seconds = 0) => {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59 || seconds > 59) return NaN;
  const time = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  return new Date(time).getUTCDate() === day ? time : NaN;
};

/**
 * Parses only real date formats: ISO "YYYY-MM-DD[ HH:MM[:SS]]", "YYYY/MM/DD", and day-first
 * "DD.MM.YYYY" / "DD/MM/YYYY" ("MM/DD/YYYY" with dateOrder 'mdy'). Codes like "A-10" are not dates.
 */
export function parseDate(value, dateOrder = 'dmy') {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== 'string') return NaN;
  const text = value.trim();
  if (ISO_DATE.test(text)) {
    const time = Date.parse(text.replace(' ', 'T'));
    if (!Number.isNaN(time)) return time;
  }
  let match = text.match(YMD_DATE);
  if (match) return utc(+match[1], +match[2], +match[3], +(match[4] || 0), +(match[5] || 0), +(match[6] || 0));
  match = text.match(DMY_DATE);
  if (!match) return NaN;
  let [first, second] = [+match[1], +match[3]];
  const monthFirst = match[2] !== '.' && dateOrder === 'mdy' && first <= 12;
  if (monthFirst || (first <= 12 && second > 12)) [first, second] = [second, first];
  return utc(+match[4], second, first, +(match[5] || 0), +(match[6] || 0), +(match[7] || 0));
}

export const isDateValue = (value, dateOrder) => value instanceof Date
  || (typeof value === 'string' && !Number.isNaN(parseDate(value, dateOrder)));

/** Detects one type for the whole column so every pair is compared the same way. */
export function detectColumnType(values, dateOrder = 'dmy') {
  const present = values.filter(value => !isEmptyValue(value));
  if (present.length === 0) return 'string';
  if (present.every(value => isDateValue(value, dateOrder))) return 'date';
  if (present.every(isNumericValue)) return 'number';
  return 'string';
}

// --- Server responses --------------------------------------------------------

const toNumber = value => {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

/** Normalizes adapter output or derived metrics into the shape used by the paginator. */
function normalizeResult(result, raw) {
  const metrics = {
    rows: Array.isArray(result.rows) ? result.rows : [],
    html: typeof result.html === 'string' ? result.html : null,
    total: toNumber(result.total),
    page: toNumber(result.page),
    perPage: result.perPage ?? undefined,
    lastPage: toNumber(result.lastPage),
    hasMore: typeof result.hasMore === 'boolean' ? result.hasMore : undefined,
    nextCursor: result.nextCursor ?? null,
    prevCursor: result.prevCursor ?? null,
    mode: result.mode,
    raw,
  };
  if (!metrics.mode) {
    if ('nextCursor' in result || 'prevCursor' in result) metrics.mode = 'cursor';
    else if (metrics.total === undefined && metrics.hasMore !== undefined) metrics.mode = 'simple';
  }
  if (metrics.mode === 'cursor') metrics.hasMore = Boolean(metrics.nextCursor);
  return metrics;
}

/**
 * Reads Laravel responses: plain arrays, LengthAwarePaginator (top-level total/current_page),
 * API Resource collections ({ data, meta, links }), simplePaginate (next_page_url / links.next),
 * cursorPaginate (next_cursor / prev_cursor) and trusted Blade HTML ({ full } or { html }).
 * A custom `adapter(response)` returning { rows, total, page, perPage, lastPage, hasMore } wins.
 */
export function readCollectionResponse(response, adapter = null) {
  if (typeof adapter === 'function') return normalizeResult(adapter(response) || {}, response);
  if (Array.isArray(response)) return normalizeResult({ rows: response }, response);
  if (typeof response === 'string') return normalizeResult({ html: response }, response);
  if (!response || typeof response !== 'object') return normalizeResult({}, response);

  const source = !Array.isArray(response.data) && response.data && typeof response.data === 'object'
    && Array.isArray(response.data.data) ? response.data : response;
  const meta = source.meta && typeof source.meta === 'object' ? { ...source, ...source.meta } : source;
  const links = source.links && typeof source.links === 'object' && !Array.isArray(source.links) ? source.links : {};
  const html = typeof source.full === 'string' ? source.full
    : typeof source.html === 'string' ? source.html
      : source.html && typeof source.html === 'object' ? Object.values(source.html).join('') : null;

  const result = {
    rows: Array.isArray(source.data) ? source.data : [],
    html,
    total: meta.total,
    page: meta.current_page ?? meta.currentPage ?? meta.page,
    perPage: meta.per_page ?? meta.perPage,
    lastPage: meta.last_page ?? meta.lastPage,
  };
  if ('next_cursor' in meta || 'prev_cursor' in meta) {
    result.mode = 'cursor';
    result.nextCursor = meta.next_cursor ?? null;
    result.prevCursor = meta.prev_cursor ?? null;
  } else if (toNumber(meta.total) === undefined && ('next_page_url' in meta || 'next' in links)) {
    result.mode = 'simple';
    result.hasMore = Boolean(meta.next_page_url ?? links.next);
  }
  return normalizeResult(result, response);
}

/** Server parameter names shared by the collection modules; paramNames overrides them. */
export function resolveParamNames(paramNames = {}) {
  return { page: 'page', perPage: 'per_page', sort: 'sort_by', direction: 'sort_dir',
    search: 'search', filters: 'filters', cursor: 'cursor', ...(paramNames || {}) };
}
