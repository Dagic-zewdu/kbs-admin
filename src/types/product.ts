import type { AdvisorCompleteness, AdvisorProfile, IngredientAnalysis, ProductIngredient } from "./advisor";
import type { Brand } from "./brand";
import type { ReceiveBatch, VariationBarcode, VariationStock } from "./inventory";
import type { Category } from "./category";

export type ProductStatus = "draft" | "private" | "live" | "inactive";
export type VariationType = "none" | "size" | "shade" | "scent" | "pack";
export type SizeUnit = "ml" | "g" | "oz" | "pcs" | "sheets";
export type AttributeValue = string | number | boolean;

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  brand: { id: string; name: string } | null;
  category: { id: string; path: string[] } | null;
  mainPhotoUrl: string | null;
  variationType: VariationType;
  variationsCount: number;
  priceFrom: number | null;
  priceTo: number | null;
  /** Units that can be sold */
  onHand: number;
  /** Of each variation, in order */
  codes: { id: string; name: string; sku: string; barcode: string | null; otherBarcodes: string[] }[];
  /** What is still needed before staff can sell it (private) */
  missingToSell: string[];
  /** What is still needed before it can go live */
  missingToGoLive: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  sizeValue: number | null;
  sizeUnit: SizeUnit | null;
  shadeHex: string | null;
  barcode: string | null;
  barcodes: VariationBarcode[];
  sku: string;
  /** Private to the company */
  costPrice: number | null;
  /** Selling price, before VAT */
  price: number | null;
  compareAtPrice: number | null;
  lowStockLevel: number;
  stock: VariationStock;
}

export interface ProductPhoto {
  fileId: string;
  url: string;
}

export interface Product extends Omit<ProductSummary, "brand" | "category"> {
  brand: Brand | null;
  category: Category | null;
  countryOfOrigin: string | null;
  efdaNumber: string | null;
  shortDescription: string | null;
  description: string | null;
  howToUse: string | null;
  warnings: string | null;
  claims: string[];
  monthsAfterOpening: number | null;
  ingredients: ProductIngredient[];
  ingredientsText: string;
  ingredientAnalysis: IngredientAnalysis;
  advisor: AdvisorProfile;
  advisorCompleteness: AdvisorCompleteness;
  attributes: Record<string, AttributeValue>;
  variations: ProductVariation[];
  photos: ProductPhoto[];
}

/** An extra product field of a category, e.g. SPF */
export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options: string[];
  unit: string | null;
}

export interface SaveProductRequest {
  name: string;
  brandId: string | null;
  categoryId: string | null;
  countryOfOrigin: string;
  efdaNumber: string;
  shortDescription: string;
  description: string;
  howToUse: string;
  warnings: string;
  claims: string[];
  monthsAfterOpening: number | null;
  ingredientsText: string;
  advisor: AdvisorProfile;
  attributes: Record<string, AttributeValue>;
  variationType: VariationType;
  variations: (Omit<ProductVariation, "id" | "stock" | "sku" | "barcodes"> & { id?: string; sku: string | null; newBatch?: ReceiveBatch })[];
  photoFileIds: string[];
}

export const MAX_PHOTOS = 8;
