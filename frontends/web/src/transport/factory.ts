import type { ITransport, TransportCallbacks, TransportConfig } from '@airscan/types/Transport';
import { WebSocketClient } from './websocket.ts';
import { SerialTransport } from './serial.ts';

export function createTransport(
  config: TransportConfig,
  callbacks: TransportCallbacks
): ITransport | null {
  switch (config.type) {
    case 'websocket':
      return new WebSocketClient(config.url, callbacks);
    case 'serial':
      return new SerialTransport(config.serialPort, config.baudRate, callbacks);
    case 'none':
    default:
      return null;
  }
}