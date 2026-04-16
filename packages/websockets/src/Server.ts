import type { WebSocketApi } from "@airscan/types/Api/WebSocketApi";

type onConnectCallback = (client: Bun.ServerWebSocket) => void;
type onRequestCallback = (
  client: Bun.ServerWebSocket,
  request: WebSocketApi,
) => void;
type onDisconnectCallback = (client: Bun.ServerWebSocket) => void;

export default function createServer(
  onConnect: onConnectCallback,
  onRequest: onRequestCallback,
  onDisconnect: onDisconnectCallback,
  port: number = 8080,
) {
  const server = Bun.serve({
    hostname: "0.0.0.0",
    port,
    websocket: {
      open(webSocket) {
        try {
          console.debug("Client connected");
          onConnect(webSocket);
        } catch (e) {
          console.error("onConnect handler error:", e);
        }
      },
      message(webSocket, message) {
        try {
          // Bun message can be a string or object with .data
          const data =
            typeof message === "string"
              ? message
              : ((message && (message as any).data) ?? message);
          onRequest(webSocket, data as unknown as WebSocketApi);
        } catch (e) {
          console.error("onRequest handler error:", e);
        }
      },
      close(webSocket) {
        try {
          console.debug("Client disconnected");
          onDisconnect(webSocket);
        } catch (e) {
          console.error("onDisconnect handler error:", e);
        }
      },
    },
    fetch(request: Request) {
      if (server.upgrade(request)) {
        return; // do not return a Response
      }

      return new Response("Not a WebSocket upgrade request", { status: 400 });
    },
  });

  return server;
}
