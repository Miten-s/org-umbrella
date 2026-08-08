import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsAnalysisSchema = z.object({
  analysisId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  analysisType: z.string().max(500).optional(),
  approvalStatus: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  inspectionPlan: z.string().max(500).optional(),
  sopReference: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

export type LimsAnalysisFormValues = z.infer<typeof limsAnalysisSchema>;
