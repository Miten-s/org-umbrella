import { UserTypes } from "@/utils/common.constants";
import { z } from "zod";

export const getUserAdminSchema = (isUpdate: boolean) => {
  const schema = z
    .object({
      // Common fields
      fullName: z.string()
        .min(1, "Full name is required")
        .max(30, "Full name must not exceed 30 characters"),
      email: z.string()
        .email("Invalid email")
        .max(30, "Email must not exceed 30 characters"),
      assignRole: z.array(z.string())
        .optional(),
      passwordExpiry: z.string().optional(),
      userType: z.enum([UserTypes.ADMIN, UserTypes.USER]),
      // User-specific fields
      mobileNumber: z.string()
        .max(15, "Phone number must not exceed 15 characters")
        .optional(),
      locationGroup: z.string().optional(),
      designation: z.string().optional(),
      department: z.string().optional(),
      description: z.string()
        .max(50, "Description must not exceed 50 characters")
        .optional(),
      modifiable: z.boolean().optional(),
      trainingCompleted: z.boolean().optional(),
      status: z.boolean().optional(),
      enableSignature: z.boolean().optional(),
      signature: z.string().optional(),
      // Password fields
      password: isUpdate
        ? z.string().optional()
        : z.string()
          .min(8, "Password must be at least 8 characters")
          .max(20, "Password must not exceed 20 characters"),
      confirmPassword: isUpdate
        ? z.string().optional()
        : z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    })
    .superRefine((data, ctx) => {
      if (!isUpdate) {
        const value = data.password ?? "";
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);

        if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message:
              "Password must include uppercase, lowercase, number, and symbol",
          });
        }
      }

      if (data.userType === UserTypes.ADMIN) return;

      if (!data.locationGroup) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["locationGroup"],
          message: "Location is required",
        });
      }

      if (!data.designation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["designation"],
          message: "Designation is required",
        });
      }

      if (!data.department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["department"],
          message: "Department is required",
        });
      }
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

export const getSupplierSchema = z.object({
  supplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(20, "Supplier name must not exceed 20 characters"),
  typeOfSupplier: z.string().optional(),
  product: z.string().optional(),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  status: z.enum(["enabled", "disabled"]).optional(),
});

export const getWorkflowSchema = z.object({
  workflowName: z
    .string()
    .min(1, "Workflow name is required")
    .max(20, "Workflow name must not exceed 20 characters"),
  levels: z.string().min(1, "Levels are required"),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  status: z.enum(["enabled", "disabled"]).optional(),

});

export const getAssignmentGroupSchema = z.object({
  groupName: z
    .string()
    .min(1, "Group name is required"),
  //Comment out in future 
  // .regex(/^[A-Z]{2}-[A-Z]{3,}-[A-Z]{2,}-[A-Z]{2,}$/, "Invalid group name format. Expected format: RD-APP-LIMS-BUS-ADMIN"),
  manager: z.object({
    userId: z.string().min(1, "Manager is required"),
    name: z.string().min(1, "Manager name is required"),
  }),
  members: z.array(z.object({
    userId: z.string(),
    name: z.string(),
  })).optional(),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  isActive: z.boolean().default(true).optional(),
});

export const getEnvironmentSchema = z.object({
  environmentName: z
    .string()
    .min(1, "Environment name is required")
    .max(20, "Environment name must not exceed 20 characters"),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
});

export const getGxpPermissionSchema = z.object({
  permissionName: z
    .string()
    .min(1, "Permission name is required"),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
});

export const getGxpRoleSchema = z.object({
  roleName: z
    .string()
    .min(1, "Role name is required")
    .max(20, "Role name must not exceed 20 characters")
    .refine((v) => v.startsWith("Service"), {
      message: "Role name must start with Service",
    }),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
});


export const getApplicationSchema = z.object({
  applicationName: z.string().min(1),
  applicationType: z.enum(["GxP", "Non-GxP"]),
  applicationEnvironment: z.string().min(1, "Application environment is required"),
  group: z.string().min(1, "Group is required"),
  applicationRoles: z.array(z.string()).default([]),
  applicationGroups: z.array(z.string()).default([]),
  applicationServiceRequestTypes: z
    .array(z.string().min(1, "Service request type is required"))
    .min(1, "Service request type is required"),
  applicationModules: z.array(z.string()).default([]),
  applicationWorkflow: z.string().min(1, "Workflow is required"),
  applicationSystemOwner: z.string().min(1, "System owner is required"),
  applicationProcessOwner: z.string().min(1, "Process owner is required"),
  supplier: z.string().min(1, "Supplier is required"),
  departments: z
    .array(z.string().min(1, "Department is required"))
    .min(1, "At least one department is required"),
  notes: z.string().min(1, "Notes are required"),
  attachments: z.array(z.string()).default([]),
  status: z.enum(["enabled", "disabled"]).default("enabled"),
});

export type ApplicationFormInput = z.input<typeof getApplicationSchema>;
export type ApplicationFormOutput = z.output<typeof getApplicationSchema>;


export const getApplicationSoftwareModuleSchema = z.object({
  moduleName: z
    .string()
    .min(1, "Module name is required")
    .max(100, "Module name must be less than 100 characters"),
  status: z.enum(["enabled", "disabled"]).default("enabled"),
});

export const getGxpUserSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    userType: z.enum(["User", "Resolver"]),
    roleId: z.array(z.string().min(1, "Role ID is required")).min(1, "Role is required"),
    description: z.string().optional(),
    status: z.enum(["enabled", "disabled"]),
});
export type GxpUserFormInput = z.infer<typeof getGxpUserSchema>;
export type GxpUserFormOutput = z.output<typeof getGxpUserSchema>;

export const getServiceRequestSchema = z.object({
  priority: z.enum(["Very High", "High", "Medium", "Low"]),
  application: z.string().min(1, "Application is required"),
  esignCheck: z.enum(["Yes", "No"]).default("No"),
  trainingDone: z.boolean().default(true),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  requestType: z.string().min(1).default("Applications"),
  applicationEnvironment: z.string().optional().default(""),
  group: z.string().optional().default(""),
  applicationWorkflow: z.string().optional().default(""),
  applicationModules: z.array(z.string()).optional().default([]),
  applicationServiceRequestTypes: z.string().optional().default(""),
  applicationRoles: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
  status: z
    .enum([
      "New",
      "In Progress",
      "Hold",
      "Closed - Incomplete",
      "Closed - Complete",
      "Closed - Skipped",
    ])
    .default("New"),
  comments: z
    .array(z.string().min(1, "Comment is required"))
    .min(1, "Comment is required"),
});

export type ServiceRequestFormInput = z.input<typeof getServiceRequestSchema>;
export type ServiceRequestFormOutput = z.output<typeof getServiceRequestSchema>;
