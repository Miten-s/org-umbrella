import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsResultSchema = z.object({
  test: z.string().min(1, "This field is required").max(500),
  sample: z.string().max(500).optional(),
  analysis: z.string().max(500).optional(),
  componentId: z.string().max(500).optional(),
  componentName: z.string().max(500).optional(),
  value: z.string().max(500).optional(),
  unit: z.string().max(500).optional(),
  instrument: z.string().max(500).optional(),
  stock: z.string().max(500).optional(),
  enteredOn: z.string().max(500).optional(),
  enteredBy: z.string().max(500).optional(),
  outOfRange: z.boolean().optional()
});

export type LimsResultFormValues = z.infer<typeof limsResultSchema>;
