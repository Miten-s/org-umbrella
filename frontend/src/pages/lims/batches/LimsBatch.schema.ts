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

/**
 * Copy mode leaves the business ID blank + disabled (the server
 * always mints a fresh one on save — see LimsBatchForm) — same shape,
 * minus the required check, so the blank field doesn't block Save.
 */
export const limsBatchCopySchema = limsBatchSchema.extend({
  batchId: z.string().max(150)
});
