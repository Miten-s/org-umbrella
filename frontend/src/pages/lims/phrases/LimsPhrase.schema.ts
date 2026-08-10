import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsPhraseSchema = z.object({
  phrase: z
    .string()
    .min(1, "Pick list code is required")
    .max(50, "Pick list code must not exceed 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Use capitals, numbers and underscores only (e.g. LOCATION_TYPE)"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  group: z.string().optional()
});

export type LimsPhraseFormValues = z.infer<typeof limsPhraseSchema>;
