/** LIMS Parameter types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsParameter {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  parameterId: string;
  parameterName: string;
  parameterType?: LimsRef | null;
  defaultValue?: string;
  unit?: string;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsParameterPayload {
  parameterId: string;
  parameterName: string;
  parameterType?: string;
  defaultValue?: string;
  unit?: string;
  changeReason?: string;
}
