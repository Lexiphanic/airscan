import type { WebSocketApi } from '@airscan/types/Api/WebSocket';
import type { DeviceConfig } from '@airscan/types/Device';
import type { AccessPointsMap } from '@airscan/types/AccessPoint';
import type { FeatureType } from '@airscan/types/Feature';
import type { ClientsMap } from '@airscan/types/Client';

export default class Manager {
  clients: Set<Bun.ServerWebSocket> = new Set();
  scanSubscribers: Set<Bun.ServerWebSocket> = new Set();
  lastDeviceConfig: DeviceConfig = {
    id: "disconnected",
    name: "disconnected",
    driver: "disconnected",
    features: [],
  };
  lastScanAccessPoints: AccessPointsMap = {};
  lastScanClients: ClientsMap = {};

  constructor(interfaceName: string, features: FeatureType[]) {
    this.lastDeviceConfig.features = [ ...features ];
    this.lastDeviceConfig.id = interfaceName;
    this.lastDeviceConfig.name = interfaceName;
    this.lastDeviceConfig.driver = interfaceName;
  }

  handleConnect(client: Bun.ServerWebSocket) {
    this.clients.add(client);
    this.send(client, { type: 'setDeviceConfig', config: this.lastDeviceConfig });
  }

  handleDisconnect(client: Bun.ServerWebSocket) {
    this.clients.delete(client);
    this.scanSubscribers.delete(client);
  }

  handleRequest(client: Bun.ServerWebSocket, raw: WebSocketApi | string) {
    const message = (typeof raw === "string" ? JSON.parse(raw) : raw) as WebSocketApi;

    switch (message.type) {
      case 'enableFeature':
        // For scan features, add to scan subscribers
        if (message.feature.type === 'scan') {
          this.scanSubscribers.add(client);
          if (this.lastScanAccessPoints && Object.keys(this.lastScanAccessPoints).length) {
            this.send(client, { type: 'addAccessPoints', accessPoints: this.lastScanAccessPoints } satisfies WebSocketApi);
          }
        }
        break;
      case 'disableFeature':
        // For scan features, remove from scan subscribers
        if (message.feature.type === 'scan') {
          this.scanSubscribers.delete(client);
        }
        break;
      default:
        break;
    }
  }

  handleScannerMessage(msg: WebSocketApi) {
    if (msg.type === 'setDeviceConfig') {
      this.lastDeviceConfig = { ...this.lastDeviceConfig, ...msg.config };
      this.broadcastAll(msg);
    } else if (msg.type === 'addAccessPoints') {
      this.lastScanAccessPoints = msg.accessPoints;
      this.broadcastScan(msg);
    } else if (msg.type === 'addClients') {
      this.lastScanClients = msg.clients;
      this.broadcastScan(msg);
    } else {
      console.warn("Unrecognised message type: " + msg.type)
    }
  }

  send(client: Bun.ServerWebSocket, payload: WebSocketApi) {
    try {
      client.send(JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to send to client:', e);
    }
  }

  broadcastAll(payload: WebSocketApi) {
    for (const client of this.clients) {
      this.send(client, payload);
    }
  }

  broadcastScan(payload: WebSocketApi) {
    for (const client of this.scanSubscribers) {
      this.send(client, payload);
    }
  }
}
