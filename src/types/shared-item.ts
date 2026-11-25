/** Who created a brand or category: us = this company, which may change it */
export type CreatedBy = "us" | "platform" | "company";

export interface Ownership {
  createdBy: CreatedBy;
  isActive: boolean;
  deactivatedBy: "platform" | "company" | null;
}

/** Products that use it, for the warning before deleting */
export interface Usage {
  products: number;
  liveProducts: number;
  /** The first 5 */
  productNames: string[];
  /** Other companies use it, so it can't be deleted or deactivated */
  usedByOthers: boolean;
  /** Categories only */
  subCategories?: number;
}

export interface Affected {
  unlinked: number;
  madePrivate: number;
}
