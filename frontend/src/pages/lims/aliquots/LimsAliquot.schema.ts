import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsAliquotSchema = z.object({
  aliquotSetId: z.string().min(1, "This field is required").max(150),
  stockBatch: z.string().min(1, "This field is required").max(150),
  aliquotsNumber: z.union([z.number(), z.string()]).optional()
});

export type LimsAliquotFormValues = z.infer<typeof limsAliquotSchema>;

/**
 * Copy mode leaves the business ID blank + disabled (the server
 * always mints a fresh one on save — see LimsAliquotForm) — same shape,
 * minus the required check, so the blank field doesn't block Save.
 */
export const limsAliquotCopySchema = limsAliquotSchema.extend({
  aliquotSetId: z.string().max(150)
});
