import { z } from "zod";

export const getAdminSchema = (isUpdate: boolean) => {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
      password: isUpdate ? z.string().optional() : z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: isUpdate ? z.string().optional() : z.string().min(1, "Please confirm your password"),
      assignRole: z.array(z.string()).min(1, "Select at least one role")
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    });
};

