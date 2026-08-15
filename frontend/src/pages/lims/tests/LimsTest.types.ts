/** LimsTest types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsResultRow extends Record<string, unknown> {
  componentId?: string | number;
  componentName?: string | number;
  value?: string | number;
  unit?: string | number;
  outOfRange?: string | number;
  enteredOn?: string | number;
  enteredBy?: string | number;
  version?: string | number;
}

export interface LimsTest {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  testId?: string;
  testName?: string;
  sample?: LimsRef | null;
  analysis?: LimsRef | null;
  instrument?: LimsRef | null;
  group?: LimsRef | null;
  replicateCount?: number | string;
  loginDate?: string;
  loginBy?: string;
  description?: string;
  components?: LimsResultRow[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsTestPayload {
  testName: string;
  sample?: string;
  analysis?: string;
  instrument?: string;
  group?: string;
  replicateCount?: number | string;
  loginDate?: string;
  loginBy?: string;
  description?: string;
  components?: LimsResultRow[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
