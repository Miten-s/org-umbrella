import { z } from "zod";

/** Location form schema — verbatim from lib/schema.ts#getLocationSchema. */
export const locationSchema = z.object({
  locationName: z
    .string()
    .min(1, "Location name is required")
    .max(50, "Location name must be under 50 characters"),
  description: z.string().optional()
});

export type LocationFormValues = z.infer<typeof locationSchema>;
