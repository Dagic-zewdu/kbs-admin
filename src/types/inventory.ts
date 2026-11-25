import type { ProductStatus } from "./product";

export interface VariationStock {
  /** Units that can be sold (not expired) */
  onHand: number;
  expired: number;
  batches: number;
  nextExpiry: string | null;
}

export interface VariationBarcode {
  barcode: string;
  /** Printed on stickers */
  isMain: boolean;
  /** A delivery came with it, so it stays */
  isUsed: boolean;
}

/** What a scanned code is */
export interface ScannedItem {
  code: string;
  matchedBy: "barcode" | "sku";
  variation: { id: string; name: string; sku: string; barcode: string | null };
  product: { id: string; name: string; brand: string | null; status: ProductStatus; photoUrl: string | null };
  /** Before VAT */
  price: number | null;
  customerPrice: number | null;
  onHand: number;
  nextExpiry: string | null;
  canBeSold: boolean;
  problem: "STATUS" | "NO_PRICE" | "OUT_OF_STOCK" | null;
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
  /** It came with this one */
  barcode: string | null;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  quantityReceived: number;
  quantityOnHand: number;
  unitCost: number | null;
  /** The selling price set with this delivery */
  unitPrice: number | null;
  receivedDate: string;
}

export interface StockMovement {
  id: string;
  type: "received" | "sold" | "damaged" | "returned" | "corrected";
  /** + in, − out */
  quantity: number;
  quantityAfter: number;
  /** Why units were taken out */
  reasonLabel: string | null;
  reason: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  by: string | null;
  createdAt: string;
}

export interface VariationStockDetail {
  variation: Omit<InventoryItem, "product" | "stock"> & { barcodes: VariationBarcode[]; costPrice: number | null; compareAtPrice: number | null };
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
  /** Left out = the variation's prices */
  unitCost?: number | null;
  unitPrice?: number | null;
}

export type ReceiveBatch = BatchDetails & { quantity: number };
export type ReceiveStock = ReceiveBatch & { barcode: string; addBarcode?: boolean };

/** Why units are taken out of stock */
export type ReduceReason = "damaged" | "lost" | "expired" | "tester" | "gift" | "supplier_return" | "wrong_count" | "other";
export interface ReduceStock {
  reasonCode: ReduceReason;
  quantity: number;
  reason: string;
}

export type AdjustBatch =
  | { type: "damaged"; reasonCode: ReduceReason; quantity: number; reason: string }
  | { type: "returned" | "corrected"; quantity: number; reason: string };
