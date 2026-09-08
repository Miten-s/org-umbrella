import { z } from "zod";

/**
 * Designation form schema — colocated with the module (STANDARDS.md §1),
 * moved out of the global lib/schema.ts.
 */
export const designationSchema = z.object({
  designationName: z
    .string()
    .min(1, "Designation name is required")
    .max(50, "Designation name must be under 50 characters"),
  description: z.string().optional()
});

export type DesignationFormValues = z.infer<typeof designationSchema>;
