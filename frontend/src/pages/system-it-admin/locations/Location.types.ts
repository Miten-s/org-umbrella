/** Location module types (STANDARDS.md §1). Unique business field: locationName. */
export interface Location {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  locationName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationPayload {
  locationName: string;
  description?: string;
}
