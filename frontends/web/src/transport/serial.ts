import { WebSocketApiSchema, WebSocketApiSchemaAsJson, type WebSocketApi } from "@airscan/types/Api/WebSocket";
import type { EnabledFeature } from "@airscan/types/EnabledFeature";
import type { ITransport, TransportCallbacks } from "@airscan/types/Transport";

export class SerialTransport implements ITransport {
  private port: SerialPort;
  private baudRate: number;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private callbacks: TransportCallbacks;
  private connected = false;
  private buffer = '';

  constructor(port: SerialPort, baudRate: number, callbacks: TransportCallbacks) {
    this.port = port;
    this.baudRate = baudRate;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    await this.port.open({ baudRate: this.baudRate });

    this.reader = this.port.readable!.getReader();
    this.writer = this.port.writable!.getWriter();
    this.connected = true;

    this.callbacks.addLog(`Serial connected at ${this.baudRate} baud`, 'info');
    this.callbacks.onConnect?.();

    this.readLoop();

    // Request device configuration (little delay to avoid issues).
    this.send({ type: 'getDeviceConfig' });
  }

  private async readLoop() {
    const decoder = new TextDecoder();

    try {
      while (this.connected) {
        const { value, done } = await this.reader!.read();
        if (done) break;

        this.buffer += decoder.decode(value, { stream: true });
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          console.log("serial message recieved", line);
          const jsonStartOffset = line.indexOf('{');
          if (jsonStartOffset === -1) {
            continue;
          }
          const msg = WebSocketApiSchemaAsJson.safeParse(line.substring(jsonStartOffset))
          if (msg.success) {
            this.handleMessage(msg.data);
          } else {
            this.callbacks.addLog(line + ': ' + msg.error.toString(), 'error');
          }
        }
      }
    } catch (error) {
      if (this.connected) {
        // this.callbacks.onError?.(error as Error);
      }
    }
  }

  private handleMessage(msg: WebSocketApi) {
    switch (msg.type) {
      case 'setDeviceConfig':
        this.callbacks.setDeviceConfig(msg.config);
        break;
      case 'addAccessPoints':
        this.callbacks.addAccessPoints(msg.accessPoints);
        break;
      case 'addClients':
        this.callbacks.addClients(msg.clients);
        break;
      case 'addLog':
        this.callbacks.addLog(msg.log.message, msg.log.type);
        break;
      case 'ping':
      case 'pong':
        // Nothing to do.
        break;
      default:
        this.callbacks.addLog('Unexpected message type: ' + msg.type, 'error');
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    await this.reader?.cancel().catch((e) => { console.error(e) });
    await this.writer?.close().catch((e) => { console.error(e) });
    await this.port.close().catch((e) => { console.error(e) });
    this.callbacks.onDisconnect?.();
  }

  syncFeature(action: 'enable' | 'disable' | 'update', payload: unknown): void {
    this.send({ type: action, feature: payload });
  }

  enableFeature(feature: EnabledFeature): void {
    this.send({ type: 'enableFeature', feature });
  }

  disableFeature(feature: EnabledFeature): void {
    this.send({ type: 'disableFeature', feature });
  }

  private send(data: unknown): void {
    console.log("serial message sending", data);
    if (!(this.connected && this.port.readable !== null)) return;
    const encoder = new TextEncoder();
    this.writer!.write(encoder.encode(JSON.stringify(data) + '\n'));
  }
}