import type { ProductStatus } from "./product";

export interface VariationStock {
  /** Units that can be sold (not expired) */
  onHand: number;
  expired: number;
  batches: number;
  nextExpiry: string | null;
}

export type InventoryFilter = "all" | "low" | "out" | "expiring" | "expired";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number | null;
  lowStockLevel: number;
  product: { id: string; name: string; status: ProductStatus };
  stock: VariationStock;
}

export interface Batch {
  id: string;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  quantityReceived: number;
  quantityOnHand: number;
  unitCost: number | null;
  supplier: string | null;
  receivedDate: string;
}

export interface StockMovement {
  id: string;
  type: "received" | "sold" | "damaged" | "returned" | "corrected";
  /** + in, − out */
  quantity: number;
  quantityAfter: number;
  reason: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  by: string | null;
  createdAt: string;
}

export interface VariationStockDetail {
  variation: Omit<InventoryItem, "product" | "stock">;
  product: InventoryItem["product"];
  expiryRequired: boolean;
  stock: VariationStock;
  batches: Batch[];
  movements: StockMovement[];
}

export interface BatchDetails {
  batchNumber: string | null;
  expiryDate: string | null;
  manufacturingDate: string | null;
  unitCost: number | null;
  supplier: string | null;
}

export type ReceiveBatch = BatchDetails & { quantity: number };
export interface AdjustBatch {
  type: "damaged" | "returned" | "corrected";
  quantity: number;
  reason: string;
}
