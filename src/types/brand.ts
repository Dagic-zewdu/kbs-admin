import type { Ownership } from "./shared-item";

/** A product brand, shared by every company */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
}

/** A brand in the list */
export interface CompanyBrand extends Brand, Ownership {
  createdAt: string;
}

export interface BrandSearchResult {
  exact: Brand[];
  matches: Brand[];
  /** "Did you mean…?" */
  similar: Brand[];
}
