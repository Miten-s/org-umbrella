import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsProjectSchema = z.object({
  projectId: z
    .string()
    .min(1, "Project ID is required")
    .max(50, "Project ID must not exceed 50 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  code: z.string().max(50, "Code must not exceed 50 characters").optional(),
  details: z.string().max(500, "Details must not exceed 500 characters").optional(),
  group: z.string().optional(),
  customer: z.string().optional(),
  customerContact: z.string().max(100).optional(),
  supervisor: z.string().optional()
});

export type LimsProjectFormValues = z.infer<typeof limsProjectSchema>;
