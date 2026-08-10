import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsTestSchema = z.object({
  testId: z.string().min(1, "This field is required").max(150),
  testName: z.string().min(1, "This field is required").max(150),
  sample: z.string().max(500).optional(),
  analysis: z.string().max(500).optional(),
  instrument: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  replicateCount: z.union([z.number(), z.string()]).optional(),
  loginDate: z.string().max(500).optional(),
  loginBy: z.string().max(500).optional(),
  description: z.string().max(500).optional()
});

export type LimsTestFormValues = z.infer<typeof limsTestSchema>;
