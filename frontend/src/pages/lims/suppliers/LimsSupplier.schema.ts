import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().max(120).optional(),
  line2: z.string().max(120).optional(),
  town: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  zipcode: z.string().max(20).optional(),
  country: z.string().max(80).optional()
});

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSupplierSchema = z.object({
  supplierId: z
    .string()
    .min(1, "Supplier ID is required")
    .max(50, "Supplier ID must not exceed 50 characters"),
  supplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(100, "Supplier name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  group: z.string().optional(),
  rating: z.string().optional(),
  website: z.string().max(200).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z
    .string()
    .max(20, "Phone must not exceed 20 characters")
    .regex(/^[0-9+()\-\s]*$/, "Enter a valid phone number")
    .optional(),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: addressSchema.optional()
});

export type LimsSupplierFormValues = z.infer<typeof limsSupplierSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsSupplierForm) — same shape, minus the required check. */
export const limsSupplierCopySchema = limsSupplierSchema.extend({
  supplierId: z.string().max(50)
});
