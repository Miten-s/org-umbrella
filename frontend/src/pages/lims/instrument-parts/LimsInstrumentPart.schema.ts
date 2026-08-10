import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsInstrumentPartSchema = z.object({
  partId: z.string().min(1, "This field is required").max(150),
  partName: z.string().min(1, "This field is required").max(150),
  status: z.string().max(500).optional(),
  group: z.string().max(500).optional(),
  instrument: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  supplier: z.string().max(500).optional(),
  dateInstalled: z.string().max(500).optional(),
  sopReference: z.string().max(500).optional(),
  manufacturer: z.string().max(500).optional(),
  serialNumber: z.string().max(500).optional(),
  modelNumber: z.string().max(500).optional(),
  measuringInformation: z.string().max(500).optional(),
  details: z.string().max(500).optional()
});

export type LimsInstrumentPartFormValues = z.infer<typeof limsInstrumentPartSchema>;
