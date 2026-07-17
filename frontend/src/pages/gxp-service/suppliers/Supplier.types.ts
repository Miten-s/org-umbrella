/** Supplier module types (STANDARDS.md §1). GXP entity — served via gxpApi. */
export interface Supplier {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  supplierName: string;
  typeOfSupplier?: string;
  product?: string;
  description?: string;
  status?: "enabled" | "disabled";
}

export interface SupplierPayload {
  supplierName: string;
  typeOfSupplier?: string;
  product?: string;
  description?: string;
  status?: "enabled" | "disabled";
}
