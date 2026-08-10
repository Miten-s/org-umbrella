/** LimsScheduler types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}


export interface LimsScheduler {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  schedulerId?: string;
  name?: string;
  scope?: string;
  group?: LimsRef | null;
  project?: LimsRef | null;
  analysis?: LimsRef | null;
  testGroup?: LimsRef | null;
  specification?: LimsRef | null;
  sampleType?: LimsRef | null;
  owner?: LimsRef | null;
  plan?: string;
  planTime?: string;
  leadTimeValue?: number | string;
  leadTimeUnit?: string;
  lastRunDate?: string;
  nextRunDate?: string;
  generatedCount?: string;
  description?: string;
  autoLogin?: boolean;
  isActive?: boolean;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsSchedulerPayload {
  schedulerId: string;
  name: string;
  scope?: string;
  group?: string;
  project?: string;
  analysis?: string;
  testGroup?: string;
  specification?: string;
  sampleType?: string;
  owner?: string;
  plan?: string;
  planTime?: string;
  leadTimeValue?: number | string;
  leadTimeUnit?: string;
  lastRunDate?: string;
  nextRunDate?: string;
  description?: string;
  autoLogin?: boolean;
  isActive?: boolean;
  changeReason?: string;
}
