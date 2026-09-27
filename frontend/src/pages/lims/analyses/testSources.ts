import type { QueryClient } from "@tanstack/react-query";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import {
  fetchApprovedLimsAnalysisOptions,
  fetchLimsAnalysisById
} from "@/pages/lims/analyses/LimsAnalysis.api";
import {
  fetchLimsTestGroupById,
  fetchLimsTestGroupOptions
} from "@/pages/lims/test-groups/LimsTestGroup.api";
import type { LimsAnalysis } from "@/pages/lims/analyses/LimsAnalysis.types";
import type { LimsLimitRow } from "@/pages/lims/specifications/LimsSpecification.types";

/** Picker values carry their kind, since one dropdown lists both. */
export const TEMPLATE_PREFIX = "tt:";
export const GROUP_PREFIX = "tg:";

/** Approved Test Templates and Test Groups in one searchable dropdown. */
export const useTestSourceOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: ["limsAnalysis", "test-sources"],
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues,
    fetchPage: async (page, signal) => {
      const [templates, groups] = await Promise.all([
        fetchApprovedLimsAnalysisOptions(page, signal),
        fetchLimsTestGroupOptions(page, signal)
      ]);
      return {
        options: [
          ...templates.options.map((o) => ({
            ...o,
            value: `${TEMPLATE_PREFIX}${o.value}`,
            sublabel: "Test Template"
          })),
          ...groups.options.map((o) => ({
            ...o,
            value: `${GROUP_PREFIX}${o.value}`,
            sublabel: "Test Group"
          }))
        ],
        nextPage:
          templates.nextPage !== null || groups.nextPage !== null
            ? page.page + 1
            : null
      };
    }
  });

/** Cached per template, so the editor's per-row lookups reuse what "Add" just fetched. */
export const templateQuery = (id: string) => ({
  queryKey: ["limsAnalysis", "spec-source", id],
  queryFn: () => fetchLimsAnalysisById(id),
  staleTime: 60_000
});

const isApproved = (analysis: LimsAnalysis) =>
  analysis.approvalStatus?.name === "Approved";

/** One limit row per component, pre-filled from the template (Min/Max, default List answer). */
const rowsFor = (analysis: LimsAnalysis): LimsLimitRow[] =>
  (analysis.components ?? [])
    .filter((component) => component.id)
    .map((component) => ({
      analysisId: analysis.id,
      analysisName: analysis.name,
      componentId: String(component.id),
      componentName: String(component.name ?? component.componentId ?? ""),
      min: component.min ?? "",
      max: component.max ?? "",
      phrase: component.type === "LIST" ? (component.option ?? "") : "",
      boolean: "",
      text: ""
    }));

/** Expands a picked Test Template or Test Group into its Approved templates, in the group's
 * order. Templates that aren't Approved (a group can hold one superseded later) are skipped. */
export const expandToTemplates = async (
  queryClient: QueryClient,
  value: string
): Promise<{ templates: LimsAnalysis[]; skipped: string[] }> => {
  const templateIds = value.startsWith(GROUP_PREFIX)
    ? [
        ...((await fetchLimsTestGroupById(value.slice(GROUP_PREFIX.length)))
          .tests ?? [])
      ]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((test) => String(test.analysisId ?? test.analysis?.id ?? ""))
        .filter(Boolean)
    : [value.slice(TEMPLATE_PREFIX.length)];

  const analyses = await Promise.all(
    templateIds.map((id) => queryClient.fetchQuery(templateQuery(id)))
  );
  const skipped = analyses
    .filter((a) => !isApproved(a))
    .map((a) => String(a.name ?? ""));
  return { templates: analyses.filter(isApproved), skipped };
};

/** A picked Test Template or Test Group as Specification limit rows, one per component. */
export const expandSource = async (
  queryClient: QueryClient,
  value: string
): Promise<{ rows: LimsLimitRow[]; skipped: string[] }> => {
  const { templates, skipped } = await expandToTemplates(queryClient, value);
  return { rows: templates.flatMap(rowsFor), skipped };
};
