import { z } from "zod";

/**
 * Application form schema — rules copied verbatim from lib/schema.ts#getApplicationSchema.
 * `.default()` moved to the form's defaultValues to avoid zod input/output divergence.
 */
export const applicationSchema = z.object({
  applicationName: z.string().min(1, "Application name is required"),
  applicationType: z.enum(["GxP", "Non-GxP"]),
  applicationEnvironment: z.string().min(1, "Application environment is required"),
  group: z.string().min(1, "Group is required"),
  assignmentGroup: z.string().min(1, "Assignment group is required"),
  applicationRoles: z.array(z.string()),
  applicationGroups: z.array(z.string()),
  applicationServiceRequestTypes: z.array(z.string().min(1)).min(1, "Service request type is required"),
  applicationModules: z.array(z.string()),
  applicationWorkflow: z.string().min(1, "Workflow is required"),
  applicationSystemOwner: z.string().min(1, "System owner is required"),
  applicationProcessOwner: z.string().min(1, "Process owner is required"),
  supplier: z.string().min(1, "Supplier is required"),
  departments: z.array(z.string().min(1)).min(1, "At least one department is required"),
  notes: z.string().min(1, "Notes are required"),
  attachments: z.array(z.string()),
  status: z.enum(["enabled", "disabled"])
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
