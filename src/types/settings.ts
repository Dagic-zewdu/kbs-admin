/** Settings of the signed-in admin's company */
export interface CompanySettings {
  /** VAT is added on top of selling prices */
  vatEnabled: boolean;
  /** Percent */
  vatRate: number;
  /** Print the receipt by itself when a sale is completed. Off by default */
  receiptAutoPrint: boolean;
  receiptPaper: "80mm" | "a4";
}
