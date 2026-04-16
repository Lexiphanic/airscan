import { z } from "zod";
import DeviceConfigSchema from "../Device.ts";
import { AccessPointsMapSchema } from "../AccessPoint.ts";
import { ClientsMapSchema } from "../Client.ts";
import { LogEntrySchema } from "../Logs.ts";
import { EnabledFeatureSchema } from "../EnabledFeature.ts";

export const pingSchema = z.object({
  type: z.literal("ping"),
});
export type ping = z.infer<typeof pingSchema>;

export const pongSchema = z.object({
  type: z.literal("pong"),
});
export type pong = z.infer<typeof pongSchema>;

export const setDeviceConfigSchema = z.object({
  type: z.literal("setDeviceConfig"),
  config: DeviceConfigSchema,
});
export type setDeviceConfig = z.infer<typeof setDeviceConfigSchema>;

export const addAccessPointsSchema = z.object({
  type: z.literal("addAccessPoints"),
  accessPoints: AccessPointsMapSchema,
});
export type addAccessPoints = z.infer<typeof addAccessPointsSchema>;

export const addClientsSchema = z.object({
  type: z.literal("addClients"),
  clients: ClientsMapSchema,
});
export type addClients = z.infer<typeof addClientsSchema>;

export const addLogSchema = z.object({
  type: z.literal("addLog"),
  log: LogEntrySchema,
});
export type addLog = z.infer<typeof addLogSchema>;

export const enableFeatureSchema = z.object({
  type: z.literal("enableFeature"),
  feature: EnabledFeatureSchema,
});
export type enableFeature = z.infer<typeof enableFeatureSchema>;

export const disableFeatureSchema = z.object({
  type: z.literal("disableFeature"),
  feature: EnabledFeatureSchema,
});
export type disableFeature = z.infer<typeof disableFeatureSchema>;

export const WebSocketApiSchema = z.discriminatedUnion("type", [
  pingSchema,
  pongSchema,
  setDeviceConfigSchema,
  addAccessPointsSchema,
  addClientsSchema,
  addLogSchema,
  enableFeatureSchema,
  disableFeatureSchema,
]);
export type WebSocketApi = z.infer<typeof WebSocketApiSchema>;

export const WebSocketApiSchemaAsJson = z
  .string()
  .transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid JSON: ${(error as Error).message}`,
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .pipe(WebSocketApiSchema);
