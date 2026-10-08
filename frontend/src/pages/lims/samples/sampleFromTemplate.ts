import type { LimsSampleTemplate } from "@/pages/lims/sample-templates/LimsSampleTemplate.types";
import type { LimsSample } from "./LimsSample.types";

/** A new sample pre-filled from a Sample Template — fields plus its tests as fresh picks. */
export const sampleFromTemplate = (tpl: LimsSampleTemplate): LimsSample =>
  ({
    sampleType: tpl.sampleType ?? null,
    project: tpl.project ?? null,
    specification: tpl.specification ?? null,
    location: tpl.location ?? null,
    group: tpl.group ?? null,
    lotNumber: tpl.lotNumber ?? "",
    serialNumber: tpl.serialNumber ?? "",
    loginDate: tpl.loginDate ?? "",
    loginBy: tpl.loginBy ?? "",
    sampleStartDate: tpl.sampleStartDate ?? "",
    sampleStartBy: tpl.sampleStartBy ?? "",
    description: tpl.description ?? "",
    comments: tpl.comments ?? "",
    tests: [...(tpl.tests ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((row) => ({
        id: "",
        analysisId: row.analysisId ?? row.analysis?.id,
        testName: row.analysis?.name,
        status: "Open"
      }))
  }) as unknown as LimsSample;
