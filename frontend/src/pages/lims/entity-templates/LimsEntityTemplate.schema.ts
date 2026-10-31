import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsEntityTemplateSchema = z.object({
  // Left blank, the server assigns the next ENT-000001.
  entityTemplateId: z
    .string()
    .max(50, "Entity template ID must not exceed 50 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  entity: z.string().min(1, "Table is required"),
  group: z.string().optional(),
  description: z.string().optional()
});

export type LimsEntityTemplateFormValues = z.infer<
  typeof limsEntityTemplateSchema
>;
