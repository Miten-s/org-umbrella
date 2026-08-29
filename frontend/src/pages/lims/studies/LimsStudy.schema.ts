import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsStudySchema = z.object({
  studyId: z
    .string()
    .min(1, "Study ID is required")
    .max(50, "Study ID must not exceed 50 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  studyCode: z.string().max(50, "Study code must not exceed 50 characters").optional(),
  details: z.string().max(500, "Details must not exceed 500 characters").optional(),
  group: z.string().optional(),
  project: z.string().optional(),
  projectDetails: z.string().max(500).optional(),
  supervisor: z.string().optional()
});

export type LimsStudyFormValues = z.infer<typeof limsStudySchema>;

/**
 * Copy mode leaves the business ID blank + disabled (the server
 * always mints a fresh one on save — see LimsStudyForm) — same shape,
 * minus the required check, so the blank field doesn't block Save.
 */
export const limsStudyCopySchema = limsStudySchema.extend({
  studyId: z.string().max(50)
});
