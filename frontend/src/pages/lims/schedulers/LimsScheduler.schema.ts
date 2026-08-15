import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSchedulerSchema = z.object({
  schedulerId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  scope: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  project: z.string().max(500).optional(),
  analysis: z.string().max(500).optional(),
  testGroup: z.string().max(500).optional(),
  specification: z.string().max(500).optional(),
  sampleType: z.string().max(500).optional(),
  owner: z.string().max(500).optional(),
  plan: z.string().max(500).optional(),
  planTime: z.string().max(500).optional(),
  leadTimeValue: z.union([z.number(), z.string()]).optional(),
  leadTimeUnit: z.string().max(500).optional(),
  nextRunDate: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  autoLogin: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export type LimsSchedulerFormValues = z.infer<typeof limsSchedulerSchema>;
