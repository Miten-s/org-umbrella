import { z } from "zod";

/** Rule 3: friendly, inline validation mirroring the server's rules. */
export const limsLotSchema = z.object({
  lotId: z.string().min(1, "This field is required").max(150),
  lotName: z.string().min(1, "This field is required").max(150),
  group: z.string().max(500).optional(),
  samples: z.array(z.string()).optional(),
  description: z.string().max(500).optional()
});

export type LimsLotFormValues = z.infer<typeof limsLotSchema>;
