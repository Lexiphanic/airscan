import meow from "meow";
import createServer from "@airscan/websockets/Server";
import process from "node:process";
import MockManager from "./mockManager";

const cli = meow(
  `
  Usage
    $ bun ./src/index.ts [interface] [options]

  Options
    --channel, -c   WiFi channel to simulate (default: random)
    --ap-count      Number of access points to generate (default: 10)
    --client-count  Number of clients to generate per AP (default: 3)

  Examples
    $ bun ./src/index.ts mock0
    $ bun ./src/index.ts mock0 --channel 6
    $ bun ./src/index.ts mock0 --ap-count 5 --client-count 2
`,
  {
    importMeta: import.meta,
    allowUnknownFlags: false,
    flags: {
      channel: {
        type: "string",
        short: "c",
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
  },
);

const [interfaceName] = cli.input;
const { channel, apCount, clientCount } = cli.flags;

console.log(
  `Starting mock backend with ${apCount} APs, ${clientCount} clients per AP`,
);

const manager = new MockManager(
  interfaceName || "mock0",
  channel,
  apCount,
  clientCount,
);
const server = createServer(
  (client) => manager.handleConnect(client),
  (client, message) => manager.handleRequest(client, message),
  (client) => manager.handleDisconnect(client),
);

console.log(`Server running on ws://${server.hostname}:${server.port}...`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  manager.stop();
  await server.stop();
  process.exit(0);
});
