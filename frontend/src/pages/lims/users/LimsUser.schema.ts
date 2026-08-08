import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsUserSchema = z.object({
  userId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  email: z.string().max(500).optional(),
  mobileNumber: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  accessGroups: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  signature: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  trainingCompleted: z.boolean().optional()
});

export type LimsUserFormValues = z.infer<typeof limsUserSchema>;
