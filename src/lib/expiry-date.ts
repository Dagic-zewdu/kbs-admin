/**
 * Finds the expiry date in text read from a package, or typed by staff.
 * Packages print it many ways: EXP 2028.05.18, 2028.05.18 까지, 사용기한 2028-05-18, 18/05/2028, 05/2028,
 * BEST BEFORE MAY 2028, EXP20280518. Dates after MFG or 제조 are the manufacturing date.
 */

export interface DateFound {
  /** yyyy-mm-dd */
  date: string;
  kind: "expiry" | "manufactured";
  /** Day and month could be the other way round: the other reading */
  swapped: string | null;
  /** Only a month was printed: the last day of it */
  isMonthOnly: boolean;
}

const MONTHS: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const EXPIRY_WORDS = /(EXP|EXPIRY|EXPIRES|EXPIRATION|BB|BBE|BEST\s*BEFORE|USE\s*BY|USE\s*BEFORE|VALID|사용기한|유통기한|까지)/;
const MADE_WORDS = /(MFG|MFD|MFC|MF|MANUF|MANUFACTURED|PROD|PRODUCED|PRODUCTION|PKD|제조|생산)/;
/** Never years far away: a misread digit gives one */
const FIRST_YEAR = 2015;
const LAST_YEAR = 2045;

const pad = (value: number) => String(value).padStart(2, "0");
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const toIso = (year: number, month: number, day: number | null) => {
  if (year < 100) year += 2000;
  if (year < FIRST_YEAR || year > LAST_YEAR || month < 1 || month > 12) return null;
  const last = lastDay(year, month);
  const used = day ?? last;
  return used >= 1 && used <= last ? `${year}-${pad(month)}-${pad(used)}` : null;
};

/** OCR mixes up some letters and digits next to digits */
const cleanUp = (text: string) =>
  text
    .toUpperCase()
    .replace(/(?<=\d[\d.\-/ ]?)[OQD](?=[\d.\-/ ]?\d)/g, "0")
    .replace(/(?<=\d)[IL|](?=\d)/g, "1")
    .replace(/(?<=\d)[B](?=\d|\b)/g, "8")
    .replace(/(?<=\d)S(?=\d)/g, "5")
    .replace(/[,·]/g, ".");

type Match = Omit<DateFound, "kind"> & { at: number; end: number };

const findDates = (text: string): Match[] => {
  const found: Match[] = [];
  const add = (at: number, length: number, date: string | null, swapped: string | null = null, isMonthOnly = false) => {
    if (date && !found.some((item) => at < item.end && item.at < at + length)) found.push({ date, swapped: swapped !== date ? swapped : null, isMonthOnly, at, end: at + length });
  };
  const each = (pattern: RegExp, read: (match: RegExpMatchArray) => void) => {
    for (const match of text.matchAll(pattern)) read(match);
  };
  // 2028.05.18, 2028-5-18, 2028 05 18
  // (OCR sometimes glues the next characters on: "2028.05.1877T")
  each(/(?<!\d)(20\d\d)\s?[.\-/ ]\s?(\d\d?)\s?[.\-/ ]\s?(\d\d)/g, (m) => add(m.index!, m[0].length, toIso(+m[1], +m[2], +m[3])));
  // 20280518
  each(/(?<!\d)(20\d\d)(\d\d)(\d\d)(?!\d)/g, (m) => add(m.index!, m[0].length, toIso(+m[1], +m[2], +m[3])));
  // 18/05/2028 (day first), or 05/18/2028
  each(/(?<!\d)(\d\d?)\s?[.\-/]\s?(\d\d?)\s?[.\-/]\s?(20\d\d|\d\d)(?!\d)/g, (m) => {
    const dayFirst = toIso(+m[3], +m[2], +m[1]);
    const monthFirst = toIso(+m[3], +m[1], +m[2]);
    add(m.index!, m[0].length, dayFirst ?? monthFirst, dayFirst ? monthFirst : null);
  });
  // MAY 2028, 18 MAY 2028, MAY 18 2028
  each(/(?:(\d\d?)\s?)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s?(?:(\d\d?)\s?[,.]?\s?)?(20\d\d)/g, (m) => {
    const day = m[1] ?? m[3];
    add(m.index!, m[0].length, toIso(+m[4], MONTHS[m[2]], day ? +day : null), null, !day);
  });
  // 05/2028, 05.28 after EXP
  each(/(?<![\d.\-/])(\d\d?)\s?[.\-/]\s?(20\d\d)(?![\d.\-/])/g, (m) => add(m.index!, m[0].length, toIso(+m[2], +m[1], null), null, true));
  // 280518 (yymmdd) right after a word, as on many Korean and Japanese packages
  each(/(?:EXP|BB|USE BY|MFG|MFD)\s?[:.]?\s?(\d\d)(\d\d)(\d\d)(?!\d)/g, (m) => {
    const at = m.index! + m[0].length - 6;
    add(at, 6, toIso(+m[1], +m[2], +m[3]), toIso(+m[3], +m[2], +m[1]));
  });
  return found.sort((a, b) => a.at - b.at);
};

/** Every date, with what it says it is: the words just before it, or 까지 / 제조 after it. null when nothing says. */
export const readDates = (raw: string): (Omit<DateFound, "kind"> & { kind: DateFound["kind"] | null })[] => {
  const text = cleanUp(raw);
  return findDates(text).map(({ at, end, ...date }) => {
    const before = text.slice(Math.max(0, at - 14), at);
    const after = text.slice(end, end + 6);
    const lastExpiry = Math.max(...[...before.matchAll(new RegExp(EXPIRY_WORDS, "g"))].map((m) => m.index!), -1);
    const lastMade = Math.max(...[...before.matchAll(new RegExp(MADE_WORDS, "g"))].map((m) => m.index!), -1);
    const isMade = /제조|생산/.test(after) || lastMade > lastExpiry;
    const isExpiry = /까지/.test(after) || lastExpiry > lastMade;
    const kind: DateFound["kind"] | null = isMade && !isExpiry ? "manufactured" : isExpiry ? "expiry" : null;
    return { ...date, kind };
  });
};

/**
 * The expiry date on a package. A lone date is taken as the expiry date unless it is marked as made;
 * with several, the latest marked or unmarked one wins (a made date is always earlier).
 */
export const findExpiry = (raw: string, today = new Date()): DateFound | null => {
  // A misread digit gives a year long gone: expiry dates are near or ahead, made dates a few years back
  const year = today.getFullYear();
  const isLikely = (item: DateFound) => {
    const at = Number(item.date.slice(0, 4));
    return item.kind === "expiry" ? at >= year - 1 && at <= year + 15 : at >= year - 6 && at <= year;
  };
  // Words the reader can't read (Korean 제조, 까지) leave a date unmarked. A made date is never ahead,
  // and a new delivery's expiry date never behind, so the date itself tells which one it is.
  const todayText = `${year}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const dates = readDates(raw)
    .map((item): DateFound => ({ ...item, kind: item.kind ?? (item.date <= todayText ? "manufactured" : "expiry") }))
    .filter(isLikely);
  const expiry = dates.filter((item) => item.kind === "expiry").sort((a, b) => a.date.localeCompare(b.date));
  return expiry.at(-1) ?? dates.find((item) => item.kind === "manufactured") ?? null;
};

/** A typed date: 18/05/2028, 18.05.28, 2028-05-18, 20280518, 180528, 05/28, 05/2028 */
export const parseTypedDate = (raw: string): DateFound | null => {
  const text = raw.trim();
  if (!text) return null;
  // Typed means expiry, whatever the date
  const fromText = findExpiry(`EXP ${text}`);
  if (fromText) return { ...fromText, kind: "expiry" };
  const digits = text.replace(/\D/g, "");
  const parts = text.split(/[^\dA-Za-z]+/).filter(Boolean);
  const made = (date: string | null, isMonthOnly = false, swapped: string | null = null): DateFound | null =>
    date ? { date, kind: "expiry", isMonthOnly, swapped: swapped !== date ? swapped : null } : null;
  if (parts.length === 3 && parts.every((part) => /^\d+$/.test(part))) {
    const [a, b, c] = parts.map(Number);
    return parts[0].length === 4 ? made(toIso(a, b, c)) : made(toIso(c, b, a), false, toIso(c, a, b));
  }
  if (parts.length === 2 && parts.every((part) => /^\d+$/.test(part))) return made(toIso(Number(parts[1]), Number(parts[0]), null), true);
  if (/^\d{8}$/.test(digits) && parts.length === 1) {
    return made(toIso(+digits.slice(0, 4), +digits.slice(4, 6), +digits.slice(6)) ?? toIso(+digits.slice(4), +digits.slice(2, 4), +digits.slice(0, 2)));
  }
  // Day first, as people say it here: 180528 = 18 May 2028
  if (/^\d{6}$/.test(digits) && parts.length === 1) return made(toIso(+digits.slice(4), +digits.slice(2, 4), +digits.slice(0, 2)));
  if (/^\d{4}$/.test(digits) && parts.length === 1) return made(toIso(+digits.slice(2), +digits.slice(0, 2), null), true);
  return null;
};

/** A manufacturing date plus the shelf life */
export const addMonths = (iso: string, months: number) => {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = lastDay(target.getUTCFullYear(), target.getUTCMonth() + 1);
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(Math.min(day, last))}`;
};

/** GS1 data in a 2D code: (17)YYMMDD is the expiry date. Day 00 means the end of the month. */
export const gs1Expiry = (text: string): string | null => {
  const match = text.match(/\(17\)(\d\d)(\d\d)(\d\d)/) ?? text.match(/(?:^|\x1d|\]d2|\]Q3)(?:01\d{14})?(?:.*?\x1d)?17(\d\d)(\d\d)(\d\d)/);
  if (!match) return null;
  return toIso(2000 + +match[1], +match[2], +match[3] === 0 ? null : +match[3]);
};
