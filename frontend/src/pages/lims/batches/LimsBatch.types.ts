/** LimsBatch types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsBatch {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  batchId?: string;
  batchName?: string;
  group?: LimsRef | null;
  lots?: LimsRef[];
  /** True total behind `lots`, which the list endpoint caps at 20. */
  lotsCount?: number;
  description?: string;
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsBatchPayload {
  batchId: string;
  batchName: string;
  group?: string;
  lots?: string[];
  description?: string;
  keptAttachmentIds?: string[];
  changeReason?: string;
}
