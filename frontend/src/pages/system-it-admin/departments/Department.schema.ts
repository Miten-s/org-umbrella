import { z } from "zod";

/**
 * Department form schema — colocated (STANDARDS.md §1), rules copied verbatim
 * from lib/schema.ts#getDepartmentSchema (behaviour-preserving).
 */
export const departmentSchema = z.object({
  departmentName: z
    .string()
    .min(1, "Department name is required")
    .max(50, "Department name must not exceed 50 characters"),
  departmentManager: z.string().min(1, "Please select a department manager"),
  departmentGroupLocation: z.string().min(1, "Please select a location"),
  description: z.string().optional()
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
