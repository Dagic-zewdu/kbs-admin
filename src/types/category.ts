/** A product category, shared by every company */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** null = main category */
  parentId: string | null;
  /** Names from the main category down, e.g. ["Skincare", "Cleansers"] */
  path: string[];
  depth: number;
  sortOrder: number;
  childrenCount: number;
}

export interface CategorySearchResult {
  exact: Category[];
  matches: Category[];
  /** "Did you mean…?" */
  similar: Category[];
}

/** Main category → sub-category → sub-sub-category */
export const MAX_CATEGORY_LEVELS = 3;

export const categoryPath = (category: Category) => category.path.join(" › ");
