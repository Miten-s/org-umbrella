import type { SampleFieldRow } from "@/pages/lims/samples/sampleFields";

/** LIMS Sample Template types — saved defaults that pre-fill new Sample forms. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** One Test Template the samples created from this template get. */
export interface LimsSampleTemplateTestRow extends Record<string, unknown> {
  analysisId?: string;
  sortOrder?: number;
  analysis?: { id: string; analysisId?: string; name?: string } | null;
}

export interface LimsSampleTemplate {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  sampleTemplateId: string;
  name: string;
  /** Default values for a new sample's name and ID text. */
  sampleName?: string;
  idText?: string;
  /** Which sample fields this template uses and what it calls them. */
  fieldRows?: SampleFieldRow[];
  sampleType?: LimsRef | null;
  project?: LimsRef | null;
  specification?: LimsRef | null;
  location?: LimsRef | null;
  group?: LimsRef | null;
  lotNumber?: string;
  serialNumber?: string;
  loginDate?: string;
  loginBy?: string;
  sampleStartDate?: string;
  sampleStartBy?: string;
  description?: string;
  comments?: string;
  tests?: LimsSampleTemplateTestRow[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsSampleTemplatePayload {
  sampleTemplateId: string;
  name: string;
  sampleName?: string;
  idText?: string;
  fieldRows?: SampleFieldRow[];
  sampleType?: string;
  project?: string;
  specification?: string;
  location?: string;
  group?: string;
  lotNumber?: string;
  serialNumber?: string;
  loginDate?: string;
  loginBy?: string;
  sampleStartDate?: string;
  sampleStartBy?: string;
  description?: string;
  comments?: string;
  tests?: { analysisId: string; sortOrder: number }[];
  changeReason?: string;
}
