/** LimsResult types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}


export interface LimsResult {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  resultId?: string;
  test?: LimsRef | null;
  sample?: LimsRef | null;
  analysis?: LimsRef | null;
  componentId?: string;
  componentName?: string;
  value?: string;
  unit?: string;
  version?: string;
  instrument?: LimsRef | null;
  stock?: LimsRef | null;
  enteredOn?: string;
  enteredBy?: string;
  outOfRange?: boolean;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsResultPayload {
  test: string;
  sample?: string;
  analysis?: string;
  componentId?: string;
  componentName?: string;
  value?: string;
  unit?: string;
  instrument?: string;
  stock?: string;
  enteredOn?: string;
  enteredBy?: string;
  outOfRange?: boolean;
  changeReason?: string;
}
