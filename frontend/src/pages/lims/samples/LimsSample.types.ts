/** LimsSample types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsTestWindowRow extends Record<string, unknown> {
  analysisName?: string | number;
  componentId?: string | number;
  componentName?: string | number;
  description?: string | number;
  value?: string | number;
  unit?: string | number;
  outOfRange?: string | number;
  enteredOn?: string | number;
  enteredBy?: string | number;
  instrument?: string | number;
  stock?: string | number;
}

/** A Test assigned to the sample at login, with its result rows. */
export interface LimsSampleTest {
  id: string;
  testId?: string;
  testName?: string;
  status?: string;
  analysisId?: string;
  components?: {
    id: string;
    componentId?: string;
    componentName?: string;
    unit?: string;
    value?: string;
  }[];
}

export interface LimsSample {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  sampleId?: string;
  idNumeric?: string;
  idText?: string;
  sampleName?: string;
  project?: LimsRef | null;
  sampleType?: LimsRef | null;
  specification?: LimsRef | null;
  testGroup?: LimsRef | null;
  location?: LimsRef | null;
  group?: LimsRef | null;
  stockBatch?: LimsRef | null;
  lotNumber?: string;
  serialNumber?: string;
  loginDate?: string;
  loginBy?: string;
  sampleStartDate?: string;
  sampleStartBy?: string;
  description?: string;
  comments?: string;
  testWindows?: LimsTestWindowRow[];
  tests?: LimsSampleTest[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsSamplePayload {
  idText?: string;
  sampleName: string;
  project?: string;
  sampleType?: string;
  specification?: string;
  testGroup?: string;
  location?: string;
  group?: string;
  stockBatch?: string;
  lotNumber?: string;
  serialNumber?: string;
  loginDate?: string;
  loginBy?: string;
  sampleStartDate?: string;
  sampleStartBy?: string;
  description?: string;
  comments?: string;
  testWindows?: LimsTestWindowRow[];
  /** Test Templates to assign as new Tests. */
  testTemplates?: string[];
  keptAttachmentIds?: string[];
  changeReason?: string;
}
