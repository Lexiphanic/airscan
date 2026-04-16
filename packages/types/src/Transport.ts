import { z } from "zod";
import type { DeviceConfig } from "./Device.ts";
import type { AccessPointsMap } from "./AccessPoint.ts";
import type { ClientsMap } from "./Client.ts";
import type { EnabledFeature } from "./EnabledFeature.ts";
import type { LogEntry } from "./index.ts";

export interface TransportCallbacks {
  setDeviceConfig: (deviceConfig: DeviceConfig) => void;
  addAccessPoints: (accessPoints: AccessPointsMap) => void;
  addClients: (clients: ClientsMap) => void;
  addLog: (message: string, type: LogEntry["type"]) => void;
  addEnabledFeature: (feature: EnabledFeature) => void;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface ITransport {
  connect(): Promise<void> | void;
  disconnect(): void;

  // Device commands
  enableFeature(feature: EnabledFeature): void;
  disableFeature(feature: EnabledFeature): void;
}

export const TransportConfigNoneSchema = z.object({
  type: z.literal("none"),
});
export type TransportConfigNone = z.infer<typeof TransportConfigNoneSchema>;

export const TransportConfigWebSocketSchema = z.object({
  type: z.literal("websocket"),
  url: z.url(),
});
export type TransportConfigWebSocket = z.infer<
  typeof TransportConfigWebSocketSchema
>;

export const TransportConfigSerialSchema = z.object({
  type: z.literal("serial"),
  serialPort: z.any(),
  baudRate: z.number(),
});
export type TransportConfigSerial = z.infer<typeof TransportConfigSerialSchema>;

export const TransportConfigSchema = z.discriminatedUnion("type", [
  TransportConfigNoneSchema,
  TransportConfigSerialSchema,
  TransportConfigWebSocketSchema,
]);
export type TransportConfig = z.infer<typeof TransportConfigSchema>;
