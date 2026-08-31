import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsCalibrationSchema = z.object({
  calibrationId: z.string().min(1, "This field is required").max(150),
  calibrationName: z.string().min(1, "This field is required").max(150),
  instrument: z.string().min(1, "This field is required").max(500),
  calibrationType: z.string().max(500).optional(),
  status: z.string().max(500).optional(),
  plan: z.string().max(500).optional(),
  planTime: z.string().max(500).optional(),
  leadTimeValue: z.union([z.number(), z.string()]).optional(),
  leadTimeUnit: z.string().max(500).optional(),
  owner: z.string().max(500).optional(),
  contractor: z.string().max(500).optional(),
  lastMaintenanceDate: z.string().max(500).optional(),
  nextMaintenanceDate: z.string().max(500).optional(),
  autoLogin: z.boolean().optional()
});

export type LimsCalibrationFormValues = z.infer<typeof limsCalibrationSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsCalibrationForm) — same shape, minus the required check. */
export const limsCalibrationCopySchema = limsCalibrationSchema.extend({
  calibrationId: z.string().max(150)
});
