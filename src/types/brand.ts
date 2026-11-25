/** A product brand, shared by every company */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  website: string | null;
  logoUrl: string | null;
}

export interface BrandSearchResult {
  exact: Brand[];
  matches: Brand[];
  /** "Did you mean…?" */
  similar: Brand[];
}
