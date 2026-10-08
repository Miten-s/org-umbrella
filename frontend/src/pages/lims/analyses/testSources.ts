import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { fetchApprovedLimsAnalysisOptions } from "@/pages/lims/analyses/LimsAnalysis.api";
import { fetchLimsTestGroupOptions } from "@/pages/lims/test-groups/LimsTestGroup.api";

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
