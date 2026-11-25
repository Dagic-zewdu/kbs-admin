/** Keeps digits and one decimal point while typing: "1,450.5x" → "1450.5" */
export const decimalText = (text: string) => {
  const clean = text.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [whole, ...rest] = clean.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
};
export const wholeText = (text: string) => text.replace(/\D/g, "");
export const toNumber = (text: string) => (text.trim() === "" ? null : Number(text));
