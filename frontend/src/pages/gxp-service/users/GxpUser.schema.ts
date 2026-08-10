import { z } from "zod";

/** GXP User form schema — verbatim from lib/schema.ts#getGxpUserSchema. */
export const gxpUserSchema = z.object({
  userId: z.string().min(1, "User is required"),
  userType: z.enum(["User", "Resolver"]),
  roleId: z.array(z.string().min(1, "Role ID is required")).min(1, "Role is required"),
  description: z.string().optional(),
  status: z.enum(["enabled", "disabled"])
});

export type GxpUserFormValues = z.infer<typeof gxpUserSchema>;
