import type { EnabledFeature } from "@airscan/types/EnabledFeature";
import type { ITransport, TransportCallbacks } from "@airscan/types/Transport";
import {
  WebSocketApiSchemaAsJson,
  type WebSocketApi,
} from "@airscan/types/Api/WebSocket";

export class WebSocketClient implements ITransport {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: TransportCallbacks;

  constructor(url: string, callbacks: TransportCallbacks) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect(): void {
    this.disconnect();

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.callbacks.addLog("WebSocket connected", "info");
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      const data = WebSocketApiSchemaAsJson.safeParse(event.data);
      const msg: WebSocketApi = data.success
        ? data.data
        : {
            type: "addLog",
            log: {
              message: `${event.data}: ${data.error.toString()}`,
              type: "error",
              timestamp: new Date(),
            },
          };

      switch (msg.type) {
        case "setDeviceConfig":
          this.callbacks.setDeviceConfig(msg.config);
          break;
        case "addAccessPoints":
          this.callbacks.addAccessPoints(msg.accessPoints);
          break;
        case "addClients":
          this.callbacks.addClients(msg.clients);
          break;
        case "enableFeature":
          this.callbacks.addEnabledFeature(msg.feature);
          break;
        case "addLog":
          this.callbacks.addLog(msg.log.message, msg.log.type);
          break;
        case "ping":
        case "pong":
          // Nothing to do.
          break;
        default:
          this.callbacks.addLog(
            `Unexpected message type from server: ${(msg as any).type}`,
            "error",
          );
      }
    };

    this.ws.onclose = () => {
      this.callbacks.addLog("WebSocket disconnected", "info");
      this.callbacks.onDisconnect?.();
    };

    this.ws.onerror = () => {
      this.callbacks.addLog("WebSocket error", "error");
    };
  }

  // Your existing send method
  send(payload: WebSocketApi) {
    this.ws?.send(JSON.stringify(payload));
  }

  enableFeature(feature: EnabledFeature): void {
    this.send({ type: "enableFeature", feature });
  }

  disableFeature(feature: EnabledFeature): void {
    this.send({ type: "disableFeature", feature });
  }

  // Your existing disconnect with ITransport signature
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
