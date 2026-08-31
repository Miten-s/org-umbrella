import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsInspectionPlanSchema = z.object({
  inspectionId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  inspectionType: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

export type LimsInspectionPlanFormValues = z.infer<typeof limsInspectionPlanSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsInspectionPlanForm) — same shape, minus the required check. */
export const limsInspectionPlanCopySchema = limsInspectionPlanSchema.extend({
  inspectionId: z.string().max(150)
});
