import { z } from "zod";

const optionalAmount = z.union([z.number(), z.string()]).optional();

const toNumber = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : Number(value);

/** Rule 3: friendly, inline validation mirroring the server's rules. */
const limsStockBaseSchema = z.object({
  stockId: z.string().min(1, "This field is required").max(150),
  stockName: z.string().min(1, "This field is required").max(150),
  stockType: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  operator: z.string().max(500).optional(),
  defaultLocation: z.string().max(500).optional(),
  preferredSupplier: z.string().max(500).optional(),
  suppliers: z.array(z.string()).optional(),
  unit: z.string().max(500).optional(),
  targetAmount: optionalAmount,
  lowAmount: optionalAmount,
  lowPercentage: optionalAmount,
  description: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

const withAmountRules = <
  T extends z.ZodType<z.infer<typeof limsStockBaseSchema>>
>(
  schema: T
) =>
  schema.superRefine((values, ctx) => {
    const target = toNumber(values.targetAmount);
    const low = toNumber(values.lowAmount);
    const percentage = toNumber(values.lowPercentage);

    if (target !== null && target < 0)
      ctx.addIssue({
        code: "custom",
        path: ["targetAmount"],
        message: "Target amount cannot be negative"
      });
    if (low !== null && low < 0)
      ctx.addIssue({
        code: "custom",
        path: ["lowAmount"],
        message: "Low amount cannot be negative"
      });
    if (target !== null && low !== null && low >= target)
      ctx.addIssue({
        code: "custom",
        path: ["lowAmount"],
        message: "Low amount must be less than the target amount"
      });
    if (percentage !== null && (percentage < 0 || percentage > 100))
      ctx.addIssue({
        code: "custom",
        path: ["lowPercentage"],
        message: "Low percentage must be between 0 and 100"
      });
  });

export const limsStockSchema = withAmountRules(limsStockBaseSchema);

export type LimsStockFormValues = z.infer<typeof limsStockBaseSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsStockForm) — same shape, minus the required check. */
export const limsStockCopySchema = withAmountRules(
  limsStockBaseSchema.extend({
    stockId: z.string().max(150)
  })
);
