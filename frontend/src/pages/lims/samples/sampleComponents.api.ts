import limsApi from "@/utils/lims.axios.interceptor";

/** One test component row of a sample, as the bulk components page shows it. */
export interface SampleComponentRow {
  id: string;
  sampleId: string;
  testUuid: string;
  /** The test's Test Template. */
  analysisId?: string;
  testId?: string;
  testStatus?: string;
  analysisName?: string;
  componentId?: string;
  componentName?: string;
  value?: string | null;
  unit?: string | null;
  /** The template component's type, list and option, copied at assignment. */
  componentType?: string | null;
  componentList?: string | null;
  componentOption?: string | null;
  outOfRange?: boolean;
  enteredOn?: string | null;
  enteredBy?: string | null;
  instrumentId?: string | null;
  instrumentName?: string | null;
}

export interface SampleComponentsResponse {
  samples: { id: string; sampleId?: string; sampleName?: string }[];
  data: SampleComponentRow[];
}

export const fetchSampleComponents = async (
  sampleIds: string[],
  signal?: AbortSignal
) => {
  const response = await limsApi.post(
    "/lims-samples/components",
    { sampleIds },
    { signal }
  );
  return response.data as SampleComponentsResponse;
};

export type ComponentChange = { id: string } & Partial<
  Pick<
    SampleComponentRow,
    "value" | "unit" | "outOfRange" | "enteredOn" | "enteredBy" | "instrumentId"
  >
>;

export const saveSampleComponentChanges = async (
  changes: ComponentChange[],
  changeReason: string
) => {
  const response = await limsApi.patch("/lims-tests/components/bulk", {
    changes,
    changeReason
  });
  return response.data as { message: string; count: number; tests: number };
};
