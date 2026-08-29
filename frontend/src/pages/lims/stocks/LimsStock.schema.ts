import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsStockSchema = z.object({
  stockId: z.string().min(1, "This field is required").max(150),
  stockName: z.string().min(1, "This field is required").max(150),
  stockType: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  operator: z.string().max(500).optional(),
  defaultLocation: z.string().max(500).optional(),
  preferredSupplier: z.string().max(500).optional(),
  suppliers: z.array(z.string()).optional(),
  unit: z.string().max(500).optional(),
  targetAmount: z.union([z.number(), z.string()]).optional(),
  lowAmount: z.union([z.number(), z.string()]).optional(),
  lowPercentage: z.union([z.number(), z.string()]).optional(),
  description: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

export type LimsStockFormValues = z.infer<typeof limsStockSchema>;

/**
 * Copy mode leaves the business ID blank + disabled (the server
 * always mints a fresh one on save — see LimsStockForm) — same shape,
 * minus the required check, so the blank field doesn't block Save.
 */
export const limsStockCopySchema = limsStockSchema.extend({
  stockId: z.string().max(150)
});
