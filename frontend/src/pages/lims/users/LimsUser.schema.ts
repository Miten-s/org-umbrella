import { z } from "zod";

/**
 * Rule 3: friendly, inline validation.
 * `userId` is the selected platform user's id — LIMS never creates users, so
 * there are no name/email/phone fields here; those live on the platform user.
 */
export const limsUserSchema = z.object({
  userId: z.string().min(1, "Select a user"),
  group: z.string().optional(),
  location: z.string().optional(),
  accessGroups: z.array(z.string()).optional(),
  roles: z.array(z.string()).min(1, "Assign at least one lab role"),
  signature: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  trainingCompleted: z.boolean().optional()
});

export type LimsUserFormValues = z.infer<typeof limsUserSchema>;
