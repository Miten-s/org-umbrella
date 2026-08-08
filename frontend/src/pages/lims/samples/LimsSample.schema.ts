import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSampleSchema = z.object({
  sampleId: z.string().min(1, "This field is required").max(150),
  idText: z.string().max(500).optional(),
  sampleName: z.string().min(1, "This field is required").max(150),
  project: z.string().max(500).optional(),
  sampleType: z.string().max(500).optional(),
  specification: z.string().max(500).optional(),
  testGroup: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  stockBatch: z.string().max(500).optional(),
  lotNumber: z.string().max(500).optional(),
  serialNumber: z.string().max(500).optional(),
  loginDate: z.string().max(500).optional(),
  loginBy: z.string().max(500).optional(),
  sampleStartDate: z.string().max(500).optional(),
  sampleStartBy: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  comments: z.string().max(500).optional()
});

export type LimsSampleFormValues = z.infer<typeof limsSampleSchema>;
