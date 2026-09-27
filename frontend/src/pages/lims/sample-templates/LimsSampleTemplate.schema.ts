import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSampleTemplateSchema = z.object({
  sampleTemplateId: z
    .string()
    .min(1, "Sample template ID is required")
    .max(100, "Sample template ID must not exceed 100 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  sampleType: z.string().optional(),
  project: z.string().optional(),
  specification: z.string().optional(),
  location: z.string().optional(),
  group: z.string().optional(),
  lotNumber: z.string().max(150).optional(),
  serialNumber: z.string().max(150).optional(),
  loginDate: z.string().optional(),
  loginBy: z.string().max(200).optional(),
  sampleStartDate: z.string().optional(),
  sampleStartBy: z.string().max(200).optional(),
  description: z.string().optional(),
  comments: z.string().optional()
});

export type LimsSampleTemplateFormValues = z.infer<
  typeof limsSampleTemplateSchema
>;

/** Copy mode leaves the business ID blank (server mints a fresh one) — minus the required check. */
export const limsSampleTemplateCopySchema = limsSampleTemplateSchema.extend({
  sampleTemplateId: z.string().max(100)
});
