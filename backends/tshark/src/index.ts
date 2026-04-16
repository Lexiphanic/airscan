import meow from "meow";
import startScanner from "./scanner.ts";
import createServer from "@airscan/websockets/Server";
import ServiceManager from "@airscan/websockets/Manager";
import InterfaceManager from "./interfaceManager.ts";
import process from "node:process";

const cli = meow(
  `
  Usage
    $ bun ./src/index.ts <interface> [options]

  Options
    --channel, -c   WiFi channel to scan
    --mode          auto or manual (default: manual)

  Examples
    $ bun ./src/index.ts wlan0
    $ bun ./src/index.ts wlan0 --mode auto
    $ bun ./src/index.ts wlan0 --channel 6 --mode auto
`,
  {
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
    },
  },
);

const [interfaceName] = cli.input;
const { channel, mode } = cli.flags;

if (!interfaceName) {
  console.error("Error: interface name is required");
  cli.showHelp();
  process.exit(1);
}

const manager = new ServiceManager(interfaceName, ["scan"]);
const interfaceManager = new InterfaceManager();

const autoModeUsed =
  mode === "auto" && (await interfaceManager.autoSetup(interfaceName));

const wifiProcess = startScanner(interfaceName, channel, (message) =>
  manager.handleScannerMessage(message),
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
  wifiProcess.kill();
  await server.stop();
  if (autoModeUsed) {
    await interfaceManager.stopMonitorMode(interfaceName);
  }
  process.exit(0);
});
