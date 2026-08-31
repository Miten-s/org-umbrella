import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsAliquotSchema = z.object({
  aliquotSetId: z.string().min(1, "This field is required").max(150),
  stockBatch: z.string().min(1, "This field is required").max(150),
  aliquotsNumber: z.union([z.number(), z.string()]).optional()
});

export type LimsAliquotFormValues = z.infer<typeof limsAliquotSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsAliquotForm) — same shape, minus the required check. */
export const limsAliquotCopySchema = limsAliquotSchema.extend({
  aliquotSetId: z.string().max(150)
});
