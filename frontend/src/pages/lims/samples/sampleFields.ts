/** Sample fields a Sample Template can use. Mirrors lims-service
 * `configs/sample-template-fields.ts` — separate deployables, keep the two in step. */
export interface SampleFieldDef {
  key: string;
  labelKey: string;
  /** Always in a template; it can be renamed but never removed. */
  mandatory?: boolean;
}

export const SAMPLE_FIELDS: SampleFieldDef[] = [
  { key: "sampleId", labelKey: "limsSampleId", mandatory: true },
  { key: "sampleName", labelKey: "limsSampleName", mandatory: true },
  { key: "idText", labelKey: "limsIdText", mandatory: true },
  { key: "sampleType", labelKey: "limsSampleType" },
  { key: "project", labelKey: "limsProject" },
  { key: "specification", labelKey: "limsSpecification" },
  { key: "location", labelKey: "limsLocation" },
  { key: "group", labelKey: "limsGroup" },
  { key: "lotNumber", labelKey: "limsLotNumber" },
  { key: "serialNumber", labelKey: "limsSerialNumber" },
  { key: "loginDate", labelKey: "limsLoginDate" },
  { key: "loginBy", labelKey: "limsLoginBy" },
  { key: "sampleStartDate", labelKey: "limsSampleStartDate" },
  { key: "sampleStartBy", labelKey: "limsSampleStartBy" },
  { key: "description", labelKey: "description" },
  { key: "comments", labelKey: "comments" }
];

export const fieldDef = (key: string) =>
  SAMPLE_FIELDS.find((field) => field.key === key);

/** One field a sample shows, under the name its template gave it. */
export interface SampleFieldLayout {
  key: string;
  label: string;
}

export interface SampleFieldRow extends Record<string, unknown> {
  fieldKey?: string;
  displayName?: string | null;
  sortOrder?: number | null;
}

const byOrder = (a: SampleFieldRow, b: SampleFieldRow) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

/** A template's rows as the layout a new sample keeps a copy of. */
export const layoutFromRows = (
  rows: SampleFieldRow[] | undefined,
  t: (key: string) => string
): SampleFieldLayout[] =>
  [...(rows ?? [])].sort(byOrder).flatMap((row) => {
    const def = fieldDef(String(row.fieldKey ?? ""));
    return def
      ? [{ key: def.key, label: row.displayName || t(def.labelKey) }]
      : [];
  });

/** A template's rows in order, always led by the mandatory fields. */
export const rowsWithMandatory = (saved: SampleFieldRow[] | undefined) => {
  const rows = [...(saved ?? [])].sort(byOrder);
  const missing = SAMPLE_FIELDS.filter(
    (field) =>
      field.mandatory && !rows.some((row) => row.fieldKey === field.key)
  ).map((field) => ({ fieldKey: field.key, displayName: "" }));
  return [...missing, ...rows];
};
