import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsTestGroupSchema = z.object({
  testGroupId: z
    .string()
    .min(1, "Test group ID is required")
    .max(50, "Test group ID must not exceed 50 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  group: z.string().optional()
});

export type LimsTestGroupFormValues = z.infer<typeof limsTestGroupSchema>;
