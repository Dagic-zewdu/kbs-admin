import type { CompanyBranding } from "@/types/auth";

/**
 * The admin is themed with the signed-in company's brand colour. Tailwind reads every brand-* utility
 * from the --color-brand-* variables (see globals.css), so overriding them on <html> recolours the whole site.
 */
const SHADES: Record<number, string> = {
  50: "color-mix(in oklab, var(--brand) 7%, white)",
  100: "color-mix(in oklab, var(--brand) 14%, white)",
  200: "color-mix(in oklab, var(--brand) 28%, white)",
  300: "color-mix(in oklab, var(--brand) 48%, white)",
  400: "color-mix(in oklab, var(--brand) 72%, white)",
  500: "color-mix(in oklab, var(--brand) 88%, white)",
  600: "var(--brand)",
  700: "color-mix(in oklab, var(--brand) 84%, black)",
  800: "color-mix(in oklab, var(--brand) 68%, black)",
  900: "color-mix(in oklab, var(--brand) 55%, black)",
};

const isHexColor = (value: string | undefined | null): value is string => Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));

/** Applies a company colour, or the default pink when called with null */
export const applyBrandColor = (hex: string | null | undefined) => {
  const root = document.documentElement.style;
  if (!isHexColor(hex)) {
    root.removeProperty("--brand");
    Object.keys(SHADES).forEach((shade) => root.removeProperty(`--color-brand-${shade}`));
    return;
  }
  root.setProperty("--brand", hex);
  Object.entries(SHADES).forEach(([shade, value]) => root.setProperty(`--color-brand-${shade}`, value));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", hex);
};

// The last company that signed in on this device, so its login page looks familiar next time.
// The logo URL is not stored (it expires).
const STORAGE_KEY = "kbs_admin_last_company";
export type RememberedCompany = Pick<CompanyBranding, "name" | "slug" | "brandColor">;

export const rememberCompany = (company: RememberedCompany) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: company.name, slug: company.slug, brandColor: company.brandColor }));
  } catch {
    // storage may be blocked (private mode): branding just isn't remembered
  }
};

/** The raw saved value (a stable string, so React can compare snapshots) */
export const readRememberedCompanyRaw = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const parseRememberedCompany = (raw: string | null): RememberedCompany | null => {
  try {
    const saved = JSON.parse(raw || "null");
    return saved && typeof saved.slug === "string" && isHexColor(saved.brandColor) ? saved : null;
  } catch {
    return null;
  }
};

export const getRememberedCompany = () => parseRememberedCompany(readRememberedCompanyRaw());

export const forgetCompany = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
