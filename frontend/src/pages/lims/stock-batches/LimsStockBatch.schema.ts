import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsStockBatchSchema = z.object({
  stock: z.string().min(1, "This field is required").max(150),
  status: z.string().max(500).optional(),
  project: z.string().max(500).optional(),
  supplier: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  manufacturingDate: z.string().max(500).optional(),
  expiryDate: z.string().max(500).optional(),
  supplierBatchNumber: z.string().max(500).optional(),
  sapBatchId: z.string().max(500).optional(),
  internalBatchId: z.string().max(500).optional(),
  initialAmount: z.union([z.number(), z.string()]).optional(),
  currentAmount: z.union([z.number(), z.string()]).optional(),
  unit: z.string().max(500).optional(),
  description: z.string().max(500).optional()
});

export type LimsStockBatchFormValues = z.infer<typeof limsStockBatchSchema>;
