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
export const limsCustomerSchema = z.object({
  customerId: z
    .string()
    .min(1, "Customer ID is required")
    .max(50, "Customer ID must not exceed 50 characters"),
  customerName: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Customer name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  group: z.string().optional(),
  rating: z.string().optional(),
  website: z.string().max(200).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20, "Phone must not exceed 20 characters").optional(),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: addressSchema.optional(),
  otherInformation: z
    .string()
    .max(500, "Additional notes must not exceed 500 characters")
    .optional()
});

export type LimsCustomerFormValues = z.infer<typeof limsCustomerSchema>;

/**
 * Copy mode leaves the business ID blank + disabled (the server
 * always mints a fresh one on save — see LimsCustomerForm) — same shape,
 * minus the required check, so the blank field doesn't block Save.
 */
export const limsCustomerCopySchema = limsCustomerSchema.extend({
  customerId: z.string().max(50)
});
