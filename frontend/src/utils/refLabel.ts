/**
 * Backend relations denormalize their display name onto varying columns
 * (userName, locationName, supplierName, ...), not a uniform `name` — reading
 * `.name` alone silently renders blank for most of them. Single place to
 * resolve whichever one is actually present.
 */
export interface NamedRef {
  id?: string;
  name?: string;
  userName?: string;
  locationName?: string;
  supplierName?: string;
  customerName?: string;
  stockName?: string;
  sampleName?: string;
  testName?: string;
  batchName?: string;
  lotName?: string;
  partName?: string;
  /** StockBatch's identifier is a number/code, not a "...Name" field. */
  batchNumber?: string | number;
}

export const refLabel = (ref: NamedRef | string | null | undefined): string => {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return String(
    ref.name ??
      ref.userName ??
      ref.locationName ??
      ref.supplierName ??
      ref.customerName ??
      ref.stockName ??
      ref.sampleName ??
      ref.testName ??
      ref.batchName ??
      ref.lotName ??
      ref.partName ??
      ref.batchNumber ??
      ""
  );
};

/** AsyncSelect's `initialSelectedOptions` shape for a single ref — seeds edit mode. */
export const seedRefOption = (ref: NamedRef | null | undefined) => {
  const label = refLabel(ref);
  return ref?.id && label ? [{ value: ref.id, label }] : undefined;
};

/** Same, for a multi-select's array of existing refs. */
export const seedRefOptions = (refs: NamedRef[] | null | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id)
    .map((ref) => ({ value: ref.id as string, label: refLabel(ref) }))
    .filter((option) => option.label);
