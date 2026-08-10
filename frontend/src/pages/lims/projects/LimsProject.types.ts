/** LIMS Project types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
  customerName?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsProject {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  projectId: string;
  name: string;
  code?: string;
  details?: string;
  group?: LimsRef | null;
  customer?: LimsRef | null;
  customerContact?: string;
  supervisor?: LimsRef | null;
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsProjectPayload {
  projectId: string;
  name: string;
  code?: string;
  details?: string;
  group?: string;
  customer?: string;
  customerContact?: string;
  supervisor?: string;
  keptAttachmentIds?: string[];
  changeReason?: string;
}
