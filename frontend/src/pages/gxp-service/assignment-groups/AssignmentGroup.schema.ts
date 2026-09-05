import { z } from "zod";

/** Assignment Group schema — verbatim from lib/schema.ts#getAssignmentGroupSchema. */
export const assignmentGroupSchema = z.object({
  groupName: z
    .string()
    .min(1, "Group name is required")
    .regex(/^[A-Z]{2}-[A-Z]{3,}-[A-Z]{2,}-[A-Z]{2,}$/, "Group Name must follow format like RD-APP-GXP-BUS-ADMIN"),
  manager: z.object({
    userId: z.string().min(1, "Manager is required"),
    name: z.string().min(1, "Manager name is required")
  }),
  members: z
    .array(z.object({ userId: z.string(), name: z.string() }))
    .optional(),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  isActive: z.boolean().optional()
});

export type AssignmentGroupFormValues = z.infer<typeof assignmentGroupSchema>;
