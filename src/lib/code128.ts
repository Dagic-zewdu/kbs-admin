/** Code 128 barcodes: letters and digits, read by every scanner. Bar and space widths of each symbol, in modules. */
const PATTERNS = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 " +
  "221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 " +
  "231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 " +
  "314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 " +
  "114131 311141 411131 211412 211214 211232 2331112"
).split(" ");
const CODE_C = 99;
const START_B = 104;
const START_C = 105;
const STOP = 106;
/** Empty space a scanner needs on each side */
const QUIET = 10;

export interface Barcode {
  /** Total width in modules, quiet zones included */
  width: number;
  bars: { x: number; width: number }[];
}

/** null when the text has characters this barcode can't hold */
export const encodeCode128 = (text: string): Barcode | null => {
  if (!/^[ -~]+$/.test(text)) return null;
  // Digits at the end go two per symbol, which makes the barcode shorter
  const digits = text.match(/\d+$/)?.[0].length ?? 0;
  const paired = digits >= 4 ? digits - (digits % 2) : 0;
  const plain = text.slice(0, text.length - paired);
  const pairs = text.slice(text.length - paired).match(/\d\d/g) ?? [];

  const symbols = plain ? [START_B, ...[...plain].map((char) => char.charCodeAt(0) - 32), ...(paired ? [CODE_C] : [])] : [START_C];
  symbols.push(...pairs.map(Number));
  const check = symbols.reduce((sum, symbol, index) => sum + symbol * Math.max(index, 1), 0) % 103;

  const bars: Barcode["bars"] = [];
  let x = QUIET;
  for (const symbol of [...symbols, check, STOP]) {
    [...PATTERNS[symbol]].forEach((value, index) => {
      if (index % 2 === 0) bars.push({ x, width: Number(value) });
      x += Number(value);
    });
  }
  return { width: x + QUIET, bars };
};
