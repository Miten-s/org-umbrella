/** Sample fields a Sample Template can use. Mirrored in the frontend's
 * `pages/lims/samples/sampleFields.ts` — separate deployables, keep the two in step. */
export const MANDATORY_SAMPLE_FIELDS = ["sampleId", "sampleName", "idText"];

export const SAMPLE_FIELD_KEYS = [
  ...MANDATORY_SAMPLE_FIELDS,
  "sampleType",
  "project",
  "specification",
  "location",
  "group",
  "lotNumber",
  "serialNumber",
  "loginDate",
  "loginBy",
  "sampleStartDate",
  "sampleStartBy",
  "description",
  "comments"
];
