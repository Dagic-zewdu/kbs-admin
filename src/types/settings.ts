/** Settings of the signed-in admin's company */
export interface CompanySettings {
  /** VAT is added on top of selling prices */
  vatEnabled: boolean;
  /** Percent */
  vatRate: number;
}
