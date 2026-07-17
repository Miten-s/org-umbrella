import { z } from "zod";
import { UserTypes } from "@/utils/common.constants";

/**
 * User form schema — colocated with the module (STANDARDS.md §1), moved out of
 * the global lib/schema.ts. Behavior preserved from getUserAdminSchema.
 */
export const getUserSchema = (isUpdate: boolean) =>
  z
    .object({
      fullName: z
        .string()
        .min(1, "Full name is required")
        .max(30, "Full name must not exceed 30 characters"),
      email: z.string().email("Invalid email").max(30, "Email must not exceed 30 characters"),
      userType: z.enum([UserTypes.ADMIN, UserTypes.USER]),
      mobileNumber: z.string().max(15, "Phone number must not exceed 15 characters").optional(),
      locationGroup: z.string().optional(),
      designation: z.string().optional(),
      department: z.string().optional(),
      description: z.string().max(50, "Description must not exceed 50 characters").optional(),
      modifiable: z.boolean().optional(),
      trainingCompleted: z.boolean().optional(),
      status: z.boolean().optional(),
      signature: z.string().optional(),
      password: isUpdate
        ? z.string().optional()
        : z.string().min(8, "Password must be at least 8 characters").max(20, "Password must not exceed 20 characters"),
      confirmPassword: isUpdate ? z.string().optional() : z.string().min(1, "Please confirm your password")
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    })
    .superRefine((data, ctx) => {
      if (!isUpdate) {
        const value = data.password ?? "";
        const ok =
          /[A-Z]/.test(value) &&
          /[a-z]/.test(value) &&
          /[0-9]/.test(value) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);
        if (!ok) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: "Password must include uppercase, lowercase, number, and symbol"
          });
        }
      }

      if (data.userType === UserTypes.ADMIN) return;

      if (!data.locationGroup)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["locationGroup"], message: "Location is required" });
      if (!data.designation)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["designation"], message: "Designation is required" });
      if (!data.department)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["department"], message: "Department is required" });
    });

export type UserFormValues = z.infer<ReturnType<typeof getUserSchema>>;
