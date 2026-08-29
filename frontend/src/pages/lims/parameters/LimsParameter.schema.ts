import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsParameterSchema = z.object({
  parameterId: z
    .string()
    .min(1, "Parameter ID is required")
    .max(50, "Parameter ID must not exceed 50 characters"),
  parameterName: z
    .string()
    .min(1, "Parameter name is required")
    .max(100, "Parameter name must not exceed 100 characters"),
  parameterType: z.string().optional(),
  defaultValue: z.string().max(100, "Default value must not exceed 100 characters").optional(),
  unit: z.string().max(20, "Unit must not exceed 20 characters").optional()
});

export type LimsParameterFormValues = z.infer<typeof limsParameterSchema>;

/**
 * Copy mode leaves the business ID blank + disabled (the server always
 * mints a fresh one on save — see LimsParameterForm) — same shape, minus
 * the required check, so the blank field doesn't block Save.
 */
export const limsParameterCopySchema = limsParameterSchema.extend({
  parameterId: z.string().max(50)
});
