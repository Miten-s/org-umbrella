import { z } from "zod";
import type { LimsLimitRow } from "./LimsSpecification.types";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsSpecificationSchema = z.object({
  specId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  group: z.string().max(500).optional(),
  description: z.string().max(500).optional()
});

export type LimsSpecificationFormValues = z.infer<typeof limsSpecificationSchema>;

/** Copy mode leaves the business ID blank + disabled (server always mints a fresh
 * one — see LimsSpecificationForm) — same shape, minus the required check. */
export const limsSpecificationCopySchema = limsSpecificationSchema.extend({
  specId: z.string().max(150)
});

/** Blank/non-numeric → undefined; otherwise the parsed number. */
const asNumber = (value: unknown): number | undefined => {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

/** The Limits grid lives outside RHF/zod: checks Min/Max are real numbers when present and
 * Min <= Max (parsed — the backend column is STRING, not numeric). */
export const validateLimitsRows = (rows: LimsLimitRow[]): string | undefined => {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const label = String(row.componentName ?? row.analysisName ?? `Row ${i + 1}`);

    for (const field of ["min", "max"] as const) {
      const raw = row[field];
      if (raw === "" || raw === undefined || raw === null) continue;
      if (asNumber(raw) === undefined) {
        return `${label}: ${field === "min" ? "Min" : "Max"} must be a number.`;
      }
    }

    const min = asNumber(row.min);
    const max = asNumber(row.max);
    if (min !== undefined && max !== undefined && min > max) {
      return `${label}: Min cannot be greater than Max.`;
    }
  }
  return undefined;
};
