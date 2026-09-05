import { z } from "zod";

/** Environment form schema — verbatim from lib/schema.ts#getEnvironmentSchema. */
export const environmentSchema = z.object({
  environmentName: z
    .string()
    .min(1, "Environment name is required")
    .max(20, "Environment name must not exceed 20 characters"),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  status: z.enum(["enabled", "disabled"]).optional()
});

export type EnvironmentFormValues = z.infer<typeof environmentSchema>;
