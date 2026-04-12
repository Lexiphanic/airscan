import { z } from "zod";

export const AccessPointSchema = z.object({
  bssid: z.string(),
  ssid: z.string(),
  channel: z.number().nonnegative(),
  rssi: z.number().nonnegative(),
  speed: z.string().optional(),
  authentication: z.string(),
  encryption: z.string(),
  packetCount: z.number().optional(),
});
export type AccessPoint = z.infer<typeof AccessPointSchema>;


export const AccessPointsMapSchema = z.record(z.string(), AccessPointSchema);
export type AccessPointsMap = z.infer<typeof AccessPointsMapSchema>;