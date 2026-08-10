import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsBatchSchema = z.object({
  batchId: z.string().min(1, "This field is required").max(150),
  batchName: z.string().min(1, "This field is required").max(150),
  group: z.string().max(500).optional(),
  lots: z.array(z.string()).optional(),
  description: z.string().max(500).optional()
});

export type LimsBatchFormValues = z.infer<typeof limsBatchSchema>;
