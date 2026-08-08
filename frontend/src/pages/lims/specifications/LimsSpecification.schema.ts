import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSpecificationSchema = z.object({
  specId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  group: z.string().max(500).optional(),
  description: z.string().max(500).optional()
});

export type LimsSpecificationFormValues = z.infer<typeof limsSpecificationSchema>;
