import meow from "meow";
import createServer from "@airscan/websockets/Server";
import Manager from "@airscan/websockets/Manager";
import { faker } from "@faker-js/faker";
import type { WebSocketApi } from "@airscan/types/Api/WebSocket";
import type { AccessPoint, AccessPointsMap } from "@airscan/types/AccessPoint";
import type { Client, ClientsMap } from "@airscan/types/Client";
import process from "node:process";


const cli = meow(`
  Usage
    $ bun ./src/index.ts [interface] [options]

  Options
    --channel, -c   WiFi channel to simulate (default: random)
    --mode          auto or manual (default: manual)
    --ap-count      Number of access points to generate (default: 10)
    --client-count  Number of clients to generate per AP (default: 3)

  Examples
    $ bun ./src/index.ts mock0
    $ bun ./src/index.ts mock0 --channel 6 --mode auto
    $ bun ./src/index.ts mock0 --ap-count 5 --client-count 2
`, {
  importMeta: import.meta,
  allowUnknownFlags: false,
  flags: {
    channel: {
      type: "string",
      short: "c",
    },
    mode: {
      type: "string",
      default: "manual",
    },
    apCount: {
      type: "number",
      default: 10,
    },
    clientCount: {
      type: "number",
      default: 3,
    },
  },
});

const [interfaceName] = cli.input;
const { channel, mode, apCount, clientCount } = cli.flags;

console.log(`Starting mock backend with ${apCount} APs, ${clientCount} clients per AP`);

class MockManager extends Manager {
  private deauthActive: Set<string> = new Set(); // store deauth feature IDs
  private interval: NodeJS.Timeout | null = null;
  private mockAccessPoints: AccessPointsMap = {};
  private mockClients: ClientsMap = {};
  private simulationChannel: number | null = null;
  private simulationMode: string;

  constructor(interfaceName: string, channel: string | undefined, mode: string, apCount: number, clientCount: number) {
    super(interfaceName, ["scan", "deauth"]);
    this.simulationChannel = channel ? parseInt(channel, 10) : null;
    this.simulationMode = mode;
    this.generateMockData(apCount, clientCount);
    this.startSimulation();
  }

  private generateMockData(apCount: number, clientsPerAp: number) {
    this.mockAccessPoints = {};
    this.mockClients = {};

    for (let i = 0; i < apCount; i++) {
      const bssid = faker.internet.mac();
      const ssid = faker.internet.displayName();
      const channel = this.simulationChannel ?? faker.number.int({ min: 1, max: 11 });
      const rssi = faker.number.int({ min: 30, max: 90 });
      const ap: AccessPoint = {
        bssid,
        ssid,
        channel,
        rssi,
        authentication: faker.helpers.arrayElement(["WPA2", "WPA3", "WEP", "OPEN"]),
        encryption: faker.helpers.arrayElement(["CCMP", "TKIP", "NONE"]),
        speed: faker.helpers.arrayElement(["54 Mbps", "150 Mbps", "300 Mbps", "600 Mbps"]),
        packetCount: faker.number.int({ min: 0, max: 1000 }),
      };
      this.mockAccessPoints[bssid] = ap;

      // Generate clients for this AP
      for (let j = 0; j < clientsPerAp; j++) {
        const clientMac = faker.internet.mac();
        const client: Client = {
          mac: clientMac,
          bssid: [bssid],
          probes: [],
          rssi: faker.number.int({ min: 40, max: 80 }),
        };
        this.mockClients[clientMac] = client;
      }
    }

    // Update base class state
    this.lastScanAccessPoints = this.mockAccessPoints;
    this.lastScanClients = this.mockClients;
    this.broadcastAll({ type: 'setDeviceConfig', config: this.lastDeviceConfig });
    this.broadcastScan({ type: 'addAccessPoints', accessPoints: this.mockAccessPoints });
    this.broadcastScan({ type: 'addClients', clients: this.mockClients });
  }

  private startSimulation() {
    // Update RSSI and simulate changes every 2 seconds
    this.interval = setInterval(() => {
      this.updateSimulation();
    }, 2000);
  }

  private updateSimulation() {
    // Slightly fluctuate RSSI values
    for (const ap of Object.values(this.mockAccessPoints)) {
      ap.rssi = Math.max(10, Math.min(100, ap.rssi + faker.number.int({ min: -5, max: 5 })));
    }
    for (const client of Object.values(this.mockClients)) {
      client.rssi = Math.max(10, Math.min(100, client.rssi + faker.number.int({ min: -5, max: 5 })));
    }

    // Occasionally add/remove APs/clients (10% chance each)
    if (Math.random() < 0.1) {
      this.addRandomAccessPoint();
    }
    if (Math.random() < 0.1) {
      this.removeRandomAccessPoint();
    }
    if (Math.random() < 0.1) {
      this.addRandomClient();
    }
    if (Math.random() < 0.1) {
      this.removeRandomClient();
    }

    // Update base class state
    this.lastScanAccessPoints = this.mockAccessPoints;
    this.lastScanClients = this.mockClients;

    // Broadcast updates
    this.broadcastScan({ type: 'addAccessPoints', accessPoints: this.mockAccessPoints });
    this.broadcastScan({ type: 'addClients', clients: this.mockClients });
  }

  private addRandomAccessPoint() {
    const bssid = faker.internet.mac();
    const ap: AccessPoint = {
      bssid,
      ssid: faker.internet.displayName(),
      channel: this.simulationChannel ?? faker.number.int({ min: 1, max: 11 }),
      rssi: faker.number.int({ min: 30, max: 90 }),
      authentication: faker.helpers.arrayElement(["WPA2", "WPA3", "WEP", "OPEN"]),
      encryption: faker.helpers.arrayElement(["CCMP", "TKIP", "NONE"]),
      speed: faker.helpers.arrayElement(["54 Mbps", "150 Mbps", "300 Mbps", "600 Mbps"]),
      packetCount: faker.number.int({ min: 0, max: 1000 }),
    };
    this.mockAccessPoints[bssid] = ap;
    console.log(`Mock AP added: ${ap.ssid} (${bssid})`);
  }

  private removeRandomAccessPoint() {
    const keys = Object.keys(this.mockAccessPoints);
    if (keys.length > 1) { // keep at least one
      const randomKey = faker.helpers.arrayElement(keys);
      delete this.mockAccessPoints[randomKey];
      console.log(`Mock AP removed: ${randomKey}`);
    }
  }

  private addRandomClient() {
    const mac = faker.internet.mac();
    const bssids = Object.keys(this.mockAccessPoints);
    if (bssids.length === 0) return;
    const bssid = faker.helpers.arrayElement(bssids);
    const client: Client = {
      mac,
      bssid: [bssid],
      probes: [],
      rssi: faker.number.int({ min: 40, max: 80 }),
    };
    this.mockClients[mac] = client;
    console.log(`Mock client added: ${mac} connected to ${bssid}`);
  }

  private removeRandomClient() {
    const keys = Object.keys(this.mockClients);
    if (keys.length > 1) {
      const randomKey = faker.helpers.arrayElement(keys);
      delete this.mockClients[randomKey];
      console.log(`Mock client removed: ${randomKey}`);
    }
  }

  // Override handleRequest to support deauth feature
  override handleRequest(client: Bun.ServerWebSocket, raw: WebSocketApi | string) {
    const message = (typeof raw === "string" ? JSON.parse(raw) : raw) as WebSocketApi;

    switch (message.type) {
      case 'enableFeature':
        if (message.feature.type === 'scan') {
          this.scanSubscribers.add(client);
          if (Object.keys(this.lastScanAccessPoints).length) {
            this.send(client, { type: 'addAccessPoints', accessPoints: this.lastScanAccessPoints });
          }
          if (Object.keys(this.lastScanClients).length) {
            this.send(client, { type: 'addClients', clients: this.lastScanClients });
          }
        } else if (message.feature.type === 'deauth') {
          this.deauthActive.add(message.feature.id);
          console.log(`Deauth enabled: ${message.feature.id}`, message.feature.options);
          // Simulate deauth attack by sending logs
          this.send(client, {
            type: 'addLog',
            log: {
              timestamp: new Date(),
              message: `Deauthentication attack started (mock) - AP: ${message.feature.options.accessPoint || 'any'}, STA: ${message.feature.options.station || 'any'}, CH: ${message.feature.options.channel}`,
              type: 'info',
            },
          });
        }
        break;
      case 'disableFeature':
        if (message.feature.type === 'scan') {
          this.scanSubscribers.delete(client);
        } else if (message.feature.type === 'deauth') {
          this.deauthActive.delete(message.feature.id);
          console.log(`Deauth disabled: ${message.feature.id}`);
          this.send(client, {
            type: 'addLog',
            log: {
              timestamp: new Date(),
              message: `Deauthentication attack stopped (mock)`,
              type: 'info',
            },
          });
        }
        break;
      default:
        // Let base class handle other messages (like ping/pong)
        super.handleRequest(client, raw);
        break;
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}

const manager = new MockManager(interfaceName || "mock0", channel, mode, apCount, clientCount);
const server = createServer(
  (client) => manager.handleConnect(client),
  (client, message) => manager.handleRequest(client, message),
  (client) => manager.handleDisconnect(client),
);

console.log(`Server running on ws://${server.hostname}:${server.port}...`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  manager.stop();
  await server.stop();
  process.exit(0);
});