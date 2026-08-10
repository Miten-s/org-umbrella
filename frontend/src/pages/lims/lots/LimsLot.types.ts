/** LimsLot types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}


export interface LimsLot {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  lotId?: string;
  lotName?: string;
  group?: LimsRef | null;
  samples?: LimsRef[];
  description?: string;
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsLotPayload {
  lotId: string;
  lotName: string;
  group?: string;
  samples?: string[];
  description?: string;
  keptAttachmentIds?: string[];
  changeReason?: string;
}
