import { z } from "zod";

/** Rule 3: encode the server's rules so failures are inline and friendly. */
export const limsGroupSchema = z.object({
  groupId: z
    .string()
    .min(1, "Group ID is required")
    .max(50, "Group ID must not exceed 50 characters")
    .regex(/^LIMS_/, "Group ID must start with LIMS_"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  ownedBy: z.string().optional(),
  parentGroup: z.string().optional()
});

export type LimsGroupFormValues = z.infer<typeof limsGroupSchema>;
