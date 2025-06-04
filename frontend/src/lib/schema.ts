import { z } from "zod";

export const getUserAdminSchema = (isUpdate: boolean) => {
  const schema = z
    .object({
      fullName: z.string().min(1, "Full name is required"),
      email: z.string().email("Invalid email"),
      // userType: z.enum(['user', 'admin'], { required_error: "User type is required" }),
      assignRole: z.array(z.string()).optional(),
      passwordExpiry: z.string().optional(), 

      // User-specific optional fields
      mobileNumber: z.string().optional(),
      locationGroup: z.string().optional(), 
      designation: z.string().optional(), 
      department: z.string().optional(), 
      description: z.string().optional(),
      modifiable: z.boolean().optional(),
      trainingCompleted: z.boolean().optional(),
      status: z.boolean().optional(),

      password: isUpdate
        ? z.string().optional()
        : z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: isUpdate
        ? z.string().optional()
        : z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    })

  return schema;
};

export const getAdminSchema = (isUpdate: boolean) => {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
      password: isUpdate
        ? z.string().optional()
        : z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: isUpdate
        ? z.string().optional()
        : z.string().min(1, "Please confirm your password"),
      assignRole: z.array(z.string()).min(1, "Select at least one role"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    });
};

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
});

export const getDepartmentSchema = z.object({
  departmentName: z
    .string()
    .min(1, "Department name is required")
    .max(50, "Department name must not exceed 50 characters"),
  departmentManager: z.string().min(1, "Please select a department manager"),
  departmentGroupLocation: z.string().min(1, "Please select a location"),
  description: z.string().optional(),
});

export const getLocationSchema = z.object({
  locationName: z
    .string()
    .min(1, "Location name is required")
    .max(50, "Location name must be under 50 characters"),
  description: z.string().optional(),
});

export const getDesignationSchema = z.object({
  designationName: z
    .string()
    .min(1, "Designation name is required")
    .max(50, "Designation name must be under 50 characters"),
  description: z.string().optional(),
});
