/** LimsCalibration types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}


export interface LimsCalibration {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  calibrationId?: string;
  calibrationName?: string;
  instrument?: LimsRef | null;
  calibrationType?: LimsRef | null;
  status?: LimsRef | null;
  plan?: string;
  planTime?: string;
  leadTimeValue?: number | string;
  leadTimeUnit?: string;
  owner?: LimsRef | null;
  contractor?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  autoLogin?: boolean;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsCalibrationPayload {
  calibrationId: string;
  calibrationName: string;
  instrument?: string;
  calibrationType?: string;
  status?: string;
  plan?: string;
  planTime?: string;
  leadTimeValue?: number | string;
  leadTimeUnit?: string;
  owner?: string;
  contractor?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  autoLogin?: boolean;
  changeReason?: string;
}
