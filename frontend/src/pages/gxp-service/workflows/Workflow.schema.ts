import { z } from "zod";

/**
 * Workflow form schema. `levels` is a comma-separated field; validated inline
 * (S1) so it fails on the form with a friendly message before submit — the
 * server expects a non-empty array + integer numberOfLevels (built on submit).
 */
export const workflowSchema = z.object({
  workflowName: z
    .string()
    .min(1, "Workflow name is required")
    .max(20, "Workflow name must not exceed 20 characters"),
  levels: z
    .string()
    .min(1, "Add at least one level")
    .refine(
      (v) => v.split(",").map((s) => s.trim()).filter(Boolean).length >= 1,
      "Add at least one level (comma-separated)"
    ),
  description: z.string().max(50, "Description must not exceed 50 characters").optional(),
  status: z.enum(["enabled", "disabled"]).optional()
});

export type WorkflowFormValues = z.infer<typeof workflowSchema>;
