/** LimsInstrument types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsParameterValue extends Record<string, unknown> {
  identity?: string | number;
  value?: string | number;
  unit?: string | number;
}
export interface LimsMaintenanceRow extends Record<string, unknown> {
  maintenanceName?: string | number;
  performedOn?: string | number;
  performedBy?: string | number;
  remarks?: string | number;
}

export interface LimsInstrument {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  instrumentId?: string;
  name?: string;
  type?: LimsRef | null;
  measurementType?: LimsRef | null;
  status?: LimsRef | null;
  group?: LimsRef | null;
  location?: LimsRef | null;
  supplier?: LimsRef | null;
  dateInstalled?: string;
  lastMsaDate?: string;
  sopReference?: string;
  manufacturer?: string;
  serialNumber?: string;
  modelNumber?: string;
  measuringInformation?: string;
  msaInformation?: string;
  details?: string;
  parameters?: LimsParameterValue[];
  maintenance?: LimsMaintenanceRow[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsInstrumentPayload {
  instrumentId: string;
  name: string;
  type?: string;
  measurementType?: string;
  status?: string;
  group?: string;
  location?: string;
  supplier?: string;
  dateInstalled?: string;
  lastMsaDate?: string;
  sopReference?: string;
  manufacturer?: string;
  serialNumber?: string;
  modelNumber?: string;
  measuringInformation?: string;
  msaInformation?: string;
  details?: string;
  parameters?: LimsParameterValue[];
  maintenance?: LimsMaintenanceRow[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
