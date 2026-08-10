/** LimsInstrumentPart types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsMaintenanceRow extends Record<string, unknown> {
  maintenanceName?: string | number;
  performedOn?: string | number;
  performedBy?: string | number;
  remarks?: string | number;
}

export interface LimsInstrumentPart {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  partId?: string;
  partName?: string;
  status?: LimsRef | null;
  group?: LimsRef | null;
  instrument?: LimsRef | null;
  location?: LimsRef | null;
  supplier?: LimsRef | null;
  dateInstalled?: string;
  sopReference?: string;
  manufacturer?: string;
  serialNumber?: string;
  modelNumber?: string;
  measuringInformation?: string;
  details?: string;
  maintenance?: LimsMaintenanceRow[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsInstrumentPartPayload {
  partId: string;
  partName: string;
  status?: string;
  group?: string;
  instrument?: string;
  location?: string;
  supplier?: string;
  dateInstalled?: string;
  sopReference?: string;
  manufacturer?: string;
  serialNumber?: string;
  modelNumber?: string;
  measuringInformation?: string;
  details?: string;
  maintenance?: LimsMaintenanceRow[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
