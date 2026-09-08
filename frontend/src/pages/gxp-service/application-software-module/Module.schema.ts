import { z } from "zod";

/** Module form schema — verbatim from lib/schema.ts#getApplicationSoftwareModuleSchema. */
// Defaults ("", "enabled") are supplied via the form's defaultValues, so the
// fields are plain-optional here (avoids zod input/output type divergence).
export const moduleSchema = z.object({
  moduleName: z
    .string()
    .min(1, "Module name is required")
    .max(100, "Module name must be less than 100 characters"),
  application: z.string().optional(),
  status: z.enum(["enabled", "disabled"]).optional()
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;
