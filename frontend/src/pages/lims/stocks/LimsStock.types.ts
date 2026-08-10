/** LimsStock types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

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

export interface LimsStock {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  stockId?: string;
  stockName?: string;
  stockType?: LimsRef | null;
  group?: LimsRef | null;
  operator?: LimsRef | null;
  defaultLocation?: LimsRef | null;
  preferredSupplier?: LimsRef | null;
  suppliers?: LimsRef[];
  unit?: string;
  targetAmount?: number | string;
  lowAmount?: number | string;
  lowPercentage?: number | string;
  inventory?: string;
  description?: string;
  details?: string;
  parameters?: LimsParameterValue[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsStockPayload {
  stockId: string;
  stockName: string;
  stockType?: string;
  group?: string;
  operator?: string;
  defaultLocation?: string;
  preferredSupplier?: string;
  suppliers?: string[];
  unit?: string;
  targetAmount?: number | string;
  lowAmount?: number | string;
  lowPercentage?: number | string;
  description?: string;
  details?: string;
  parameters?: LimsParameterValue[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
