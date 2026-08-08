import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsInstrumentSchema = z.object({
  instrumentId: z.string().min(1, "This field is required").max(150),
  name: z.string().min(1, "This field is required").max(150),
  type: z.string().max(500).optional(),
  measurementType: z.string().max(500).optional(),
  status: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  supplier: z.string().max(500).optional(),
  dateInstalled: z.string().max(500).optional(),
  lastMsaDate: z.string().max(500).optional(),
  sopReference: z.string().max(500).optional(),
  manufacturer: z.string().max(500).optional(),
  serialNumber: z.string().max(500).optional(),
  modelNumber: z.string().max(500).optional(),
  measuringInformation: z.string().max(500).optional(),
  msaInformation: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

export type LimsInstrumentFormValues = z.infer<typeof limsInstrumentSchema>;
