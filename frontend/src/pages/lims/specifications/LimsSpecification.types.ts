/** LimsSpecification types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsLimitRow extends Record<string, unknown> {
  analysisName?: string | number;
  componentName?: string | number;
  /**
   * Set only when this row was populated via the Limits grid's Analysis/
   * Component picker — that's what drives Min/Max/etc. rendering read-only
   * for the row. A manually-typed row leaves both null/undefined and stays
   * freely editable. `analysisName`/`componentName` stay the durable,
   * rename-safe display values either way (see spec-limit.model.ts).
   */
  analysisId?: string;
  componentId?: string;
  min?: string | number;
  max?: string | number;
  text?: string | number;
  phrase?: string | number;
  boolean?: string | number;
  calculation?: string | number;
}

export interface LimsSpecification {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  specId?: string;
  name?: string;
  group?: LimsRef | null;
  description?: string;
  limits?: LimsLimitRow[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsSpecificationPayload {
  specId: string;
  name: string;
  group?: string;
  description?: string;
  limits?: LimsLimitRow[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
