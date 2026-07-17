import { z } from "zod";

/**
 * Supplier form schema — colocated (STANDARDS.md §1), rules copied verbatim
 * from lib/schema.ts#getSupplierSchema (behaviour-preserving).
 */
export const supplierSchema = z.object({
  supplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(20, "Supplier name must not exceed 20 characters"),
  typeOfSupplier: z.string().optional(),
  product: z.string().optional(),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  status: z.enum(["enabled", "disabled"]).optional()
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
