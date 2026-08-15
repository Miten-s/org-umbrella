import { z } from "zod";

/**
 * Storage Location form schema.
 *
 * MIGRATION.md Rule 3: encode the server's rules here so the user gets a
 * friendly inline message before submit, never a raw machine string.
 */
export const limsLocationSchema = z.object({
  locationId: z
    .string()
    .min(1, "Location ID is required")
    .max(50, "Location ID must not exceed 50 characters"),
  locationName: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  locationType: z.string().optional(),
  group: z.string().optional(),
  parentLocation: z.string().optional(),
  otherInformation: z
    .string()
    .max(500, "Additional notes must not exceed 500 characters")
    .optional()
});

export type LimsLocationFormValues = z.infer<typeof limsLocationSchema>;
