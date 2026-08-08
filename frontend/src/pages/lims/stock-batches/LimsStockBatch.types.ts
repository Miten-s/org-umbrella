/** LimsStockBatch types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsConsumptionRow extends Record<string, unknown> {
  consumedOn?: string | number;
  consumedBy?: string | number;
  amount?: string | number;
  unit?: string | number;
  remarks?: string | number;
}
export interface LimsParameterValue extends Record<string, unknown> {
  identity?: string | number;
  value?: string | number;
  unit?: string | number;
}

export interface LimsStockBatch {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  stock?: LimsRef | null;
  batchNumber?: number | string;
  stockBatchId?: string;
  status?: LimsRef | null;
  project?: LimsRef | null;
  supplier?: LimsRef | null;
  location?: LimsRef | null;
  manufacturingDate?: string;
  expiryDate?: string;
  supplierBatchNumber?: string;
  sapBatchId?: string;
  internalBatchId?: string;
  initialAmount?: number | string;
  currentAmount?: number | string;
  unit?: string;
  description?: string;
  consumptions?: LimsConsumptionRow[];
  parameters?: LimsParameterValue[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsStockBatchPayload {
  stock: string;
  batchNumber?: number | string;
  status?: string;
  project?: string;
  supplier?: string;
  location?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  supplierBatchNumber?: string;
  sapBatchId?: string;
  internalBatchId?: string;
  initialAmount?: number | string;
  currentAmount?: number | string;
  unit?: string;
  description?: string;
  consumptions?: LimsConsumptionRow[];
  parameters?: LimsParameterValue[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
