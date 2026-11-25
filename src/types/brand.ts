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
export interface CompanyBrand extends Brand {
  /** true when this company added it */
  addedByUs: boolean;
  createdAt: string;
}

export interface BrandSearchResult {
  exact: Brand[];
  matches: Brand[];
  /** "Did you mean…?" */
  similar: Brand[];
}
