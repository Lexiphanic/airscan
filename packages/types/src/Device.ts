import { z } from "zod";
import { FeatureSchema } from "./Feature.ts";

const DeviceConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  driver: z.string(),
  features: z.array(FeatureSchema),
  channels: z.array(z.number()).optional(),
});
export type DeviceConfig = z.infer<typeof DeviceConfigSchema>;

export default DeviceConfigSchema;
