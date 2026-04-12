import startScanner from "./scanner.ts";
import createServer from "@airscan/websockets/Server";
import ServiceManager from "@airscan/websockets/Manager";
import process from "node:process";

const manager = new ServiceManager("windows", ["scan"]);
const wifiProcess = startScanner((message) => manager.handleScannerMessage(message));
const server = createServer(
  (client) => manager.handleConnect(client),
  (client, message) => manager.handleRequest(client, message),
  (client) => manager.handleDisconnect(client),
);

console.log(`Server running on http://${server.hostname}:${server.port}...`)

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  wifiProcess.kill();
  await server.stop();
  process.exit(0);
});