# `@airscan/websockets`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)
![WebSocket](https://img.shields.io/badge/WebSocket-API-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**WebSocket Server Utilities** · **Real-time Communication** · **Type-safe API** · **Connection Management**

WebSocket server utilities for the AirScan WiFi security analysis platform. Provides a lightweight, type-safe WebSocket server implementation for real-time communication between frontend and backend components.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Development](#development)

## Features

- **Type-Safe WebSocket Server**: Built on Bun's native WebSocket support
- **Connection Management**: Automatic client tracking and lifecycle management
- **Error Handling**: Robust error handling with graceful degradation
- **Message Validation**: Integration with `@airscan/types` for type-safe messages
- **Simple API**: Clean, minimal API for WebSocket server creation

## Installation

```bash
# From the monorepo root
bun install

# Or install as a dependency in another package
bun add @airscan/websockets
```

## Usage

### Basic Server Setup

```typescript
import createServer from '@airscan/websockets/Server';
import type { WebSocketApi } from '@airscan/types/Api/WebSocketApi';

// Create WebSocket server
const server = createServer(
  // onConnect callback
  (client) => {
    console.log('Client connected:', client.remoteAddress);
    
    // Send welcome message
    client.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  },
  
  // onRequest callback
  (client, message: WebSocketApi) => {
    console.log('Received message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'addAccessPoints':
        console.log('Adding access points:', message.accessPoints);
        // Process access points...
        break;
      case 'addClients':
        console.log('Adding clients:', message.clients);
        // Process clients...
        break;
      // ... handle other message types
    }
    
    // Send response
    client.send(JSON.stringify({ type: 'ack', message: 'Received' }));
  },
  
  // onDisconnect callback
  (client) => {
    console.log('Client disconnected:', client.remoteAddress);
  },
  
  // Optional port (default: 8080)
  8080
);

console.log(`WebSocket server running on ws://0.0.0.0:${server.port}`);
```

### Connection Manager

```typescript
import { ConnectionManager } from '@airscan/websockets/Manager';
import type { WebSocketApi } from '@airscan/types/Api/WebSocketApi';

// Create connection manager
const manager = new ConnectionManager();

// Add connection with metadata
manager.addConnection(websocket, { 
  id: 'client-1', 
  ip: '192.168.1.100',
  connectedAt: Date.now() 
});

// Broadcast to all connected clients
manager.broadcast(JSON.stringify({ 
  type: 'systemMessage', 
  message: 'Server restarting in 5 minutes' 
}));

// Send to specific client
manager.sendToClient('client-1', JSON.stringify({ 
  type: 'ping', 
  timestamp: Date.now() 
}));

// Get connection info
const connections = manager.getConnections();
console.log(`Active connections: ${connections.length}`);

// Remove connection
manager.removeConnection(websocket);
```

### Complete Example with Error Handling

```typescript
import createServer from '@airscan/websockets/Server';
import { ConnectionManager } from '@airscan/websockets/Manager';
import type { WebSocketApi } from '@airscan/types/Api/WebSocketApi';
import { WebSocketApiSchema } from '@airscan/types/Api/WebSocketApi';

const manager = new ConnectionManager();

const server = createServer(
  (client) => {
    const clientId = `client-${Date.now()}`;
    manager.addConnection(client, { 
      id: clientId, 
      ip: client.remoteAddress,
      connectedAt: Date.now() 
    });
    
    console.log(`Client ${clientId} connected from ${client.remoteAddress}`);
    
    // Send initial state
    client.send(JSON.stringify({
      type: 'connected',
      clientId,
      serverTime: Date.now()
    }));
  },
  
  (client, rawMessage) => {
    try {
      // Parse and validate message
      const parsed = JSON.parse(rawMessage as string);
      const message = WebSocketApiSchema.parse(parsed) as WebSocketApi;
      
      // Process message based on type
      switch (message.type) {
        case 'addAccessPoints':
          // Handle access points
          processAccessPoints(message.accessPoints);
          break;
          
        case 'addClients':
          // Handle clients
          processClients(message.clients);
          break;
          
        case 'setDeviceConfig':
          // Update device configuration
          updateDeviceConfig(message.deviceConfig);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
      
      // Send acknowledgment
      client.send(JSON.stringify({
        type: 'ack',
        messageId: (message as any).id,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error response
      client.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  },
  
  (client) => {
    manager.removeConnection(client);
    console.log('Client disconnected');
  },
  
  8080
);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  
  // Notify all clients
  manager.broadcast(JSON.stringify({
    type: 'systemMessage',
    message: 'Server shutting down'
  }));
  
  // Close server
  server.stop();
  process.exit(0);
});
```

## API Reference

### `createServer(onConnect, onRequest, onDisconnect, port?)`

Creates a new WebSocket server.

**Parameters:**
- `onConnect: (client: Bun.ServerWebSocket) => void` - Called when a client connects
- `onRequest: (client: Bun.ServerWebSocket, message: WebSocketApi) => void` - Called when a message is received
- `onDisconnect: (client: Bun.ServerWebSocket) => void` - Called when a client disconnects
- `port: number = 8080` - Port to listen on (default: 8080)

**Returns:** `Bun.Server` instance

### `ConnectionManager`

Manages WebSocket connections with metadata.

**Methods:**
- `addConnection(websocket: Bun.ServerWebSocket, metadata: Record<string, any>)`: Add a connection
- `removeConnection(websocket: Bun.ServerWebSocket)`: Remove a connection
- `getConnection(id: string): Bun.ServerWebSocket | undefined`: Get connection by ID
- `getConnections(): Array<{ websocket: Bun.ServerWebSocket; metadata: Record<string, any> }>`: Get all connections
- `broadcast(message: string)`: Send message to all connections
- `sendToClient(id: string, message: string)`: Send message to specific client
- `getConnectionCount(): number`: Get number of active connections

## Error Handling

The server includes built-in error handling:

```typescript
// All callbacks are wrapped in try-catch blocks
// Errors are logged to console.error but don't crash the server

// Custom error handling example
const server = createServer(
  (client) => {
    try {
      // Connection logic
    } catch (error) {
      console.error('Connection error:', error);
      client.close(1011, 'Internal server error'); // 1011 = Internal Error
    }
  },
  // ... other callbacks
);
```

## Message Format

Messages should follow the `WebSocketApi` type from `@airscan/types`:

```typescript
type WebSocketApi = 
  | { type: 'addAccessPoints'; accessPoints: AccessPointsMap }
  | { type: 'addClients'; clients: ClientsMap }
  | { type: 'setDeviceConfig'; deviceConfig: DeviceConfig }
  | { type: 'addLog'; message: string; logType: LogEntry['type'] }
  | { type: 'addEnabledFeature'; feature: EnabledFeature }
  | { type: 'removeEnabledFeature'; feature: EnabledFeature }
  | { type: 'onConnect' }
  | { type: 'onDisconnect' };
```

## Development

```bash
# Type checking
bun run lint
```

## 📦 Dependencies

- `zod`: Runtime validation (via `@airscan/types`)

## 🔗 Related Packages

- [`@airscan/types`](../types/): WebSocket API type definitions
- [`@airscan/engine`](../engine/): State management that can use WebSocket transport
- [`frontends/web`](../../frontends/web/): React frontend WebSocket client
- [`backends/tshark`](../../backends/tshark/): Linux backend WebSocket server
- [`backends/windows`](../../backends/windows/): Windows backend WebSocket server