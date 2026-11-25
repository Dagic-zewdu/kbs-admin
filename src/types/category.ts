import type { Ownership } from "./shared-item";

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
  /** Suggested routine step for its products */
  defaultRoutineStep: string | null;
  sortOrder: number;
  childrenCount: number;
}

/** A category in the management list */
export interface CompanyCategory extends Category, Ownership {
  /** false when it, or a category above it, is inactive */
  isVisible: boolean;
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
