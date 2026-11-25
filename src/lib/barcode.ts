/** The same code as the API stores: no spaces or dashes, and a 12-digit UPC as its EAN with a leading 0 */
export const normalizeBarcode = (text: string) => {
  const code = text.replace(/[\s-]/g, "").toUpperCase();
  return /^\d{12}$/.test(code) ? `0${code}` : code;
};
