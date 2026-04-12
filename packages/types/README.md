# `@airscan/types`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Zod](https://img.shields.io/badge/Zod-4.3-purple)
![License](https://img.shields.io/badge/License-MIT-green)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)

**Shared TypeScript Types** · **Zod Schemas** · **WebSocket API** · **Cross-platform Compatibility**

Shared TypeScript type definitions and Zod schemas for the AirScan WiFi security analysis platform. Provides type-safe data structures for WiFi scanning, client management, logging, and WebSocket communication.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Available Types](#available-types) • [Development](#development)

## Features

- **Zod Schemas**: Runtime validation for all data types
- **TypeScript Types**: Full type inference from schemas
- **WebSocket API Types**: Type-safe WebSocket communication
- **Cross-Platform Compatibility**: Used by frontend, backend, and engine packages
- **Export Aliases**: Convenient import paths for specific types

## Installation

```bash
# From the monorepo root
bun install

# Or install as a dependency in another package
bun add @airscan/types
```

## Usage

### Basic Type Import

```typescript
// Import specific types
import type { AccessPoint, AccessPointsMap } from '@airscan/types/AccessPoint';
import type { Client, ClientsMap } from '@airscan/types/Client';
import type { DeviceConfig } from '@airscan/types/Device';
import type { LogEntry } from '@airscan/types/Logs';
import type { Transport } from '@airscan/types/Transport';

// Import all types
import * as Types from '@airscan/types';
```

### Schema Validation

```typescript
import { AccessPointSchema, ClientSchema } from '@airscan/types';

// Validate incoming data
const rawData = { bssid: '00:11:22:33:44:55', ssid: 'Test Network', channel: 6, rssi: -65 };
const accessPoint = AccessPointSchema.parse(rawData); // Throws if invalid

// Safe parsing with error handling
const result = AccessPointSchema.safeParse(rawData);
if (result.success) {
  const ap: AccessPoint = result.data; // Type-safe access point
} else {
  console.error('Validation error:', result.error);
}
```

### WebSocket API Types

```typescript
import type { WebSocketApi } from '@airscan/types/Api/WebSocketApi';

// Type-safe WebSocket message handling
function handleWebSocketMessage(message: WebSocketApi) {
  switch (message.type) {
    case 'addAccessPoints':
      // message.accessPoints is typed as AccessPointsMap
      console.log('Adding access points:', message.accessPoints);
      break;
    case 'addClients':
      // message.clients is typed as ClientsMap
      console.log('Adding clients:', message.clients);
      break;
    case 'setDeviceConfig':
      // message.deviceConfig is typed as DeviceConfig
      console.log('Setting device config:', message.deviceConfig);
      break;
    // ... other message types
  }
}
```

## Available Types

### Access Points

```typescript
// Individual access point
type AccessPoint = {
  bssid: string;           // MAC address (00:11:22:33:44:55)
  ssid: string;            // Network name
  channel: number;         // WiFi channel (1-14)
  rssi: number;            // Signal strength (dBm)
  speed?: string;          // Connection speed
  authentication: string;  // Security type (WPA2, WPA3, etc.)
  encryption: string;      // Encryption type
  beacons?: number;        // Beacon count
  data?: number;           // Data packet count
};

// Map of access points by BSSID
type AccessPointsMap = Record<string, AccessPoint>;
```

### Clients

```typescript
// Individual client device
type Client = {
  mac: string;            // MAC address
  vendor?: string;        // Manufacturer from OUI database
  bssid: string;          // Associated access point BSSID
  probe?: string;         // Probed SSID
  packets: number;        // Packet count
  power: number;          // Signal power
};

// Map of clients by MAC address
type ClientsMap = Record<string, Client>;
```

### Device Configuration

```typescript
type DeviceConfig = {
  interface: string;      // Network interface name
  channel: number;        // Current channel
  mode: string;          // Operation mode
  mac: string;           // Device MAC address
  ip: string;            // Device IP address
};
```

### Logs

```typescript
type LogEntry = {
  id: string;            // Unique identifier
  timestamp: number;     // Unix timestamp
  message: string;       // Log message
  type: 'info' | 'warning' | 'error'; // Log level
};
```

### Transport

```typescript
type Transport = {
  type: 'websocket' | 'serial';  // Connection type
  url?: string;                   // WebSocket URL
  port?: string;                  // Serial port
  baudRate?: number;              // Serial baud rate
};
```

### Features

```typescript
type Feature = {
  type: 'deauth' | 'beacon' | 'probe';  // Feature type
  name: string;                         // Display name
  description: string;                  // Feature description
  enabled: boolean;                     // Enabled state
};

type EnabledFeature = Feature & {
  target?: string;      // Target BSSID or MAC
  count?: number;       // Number of packets
  interval?: number;    // Interval between packets
};
```

### WebSocket API

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

## Export Aliases

The package provides convenient export aliases for cleaner imports:

```typescript
// Instead of:
import type { AccessPoint } from '@airscan/types/src/AccessPoint';

// Use:
import type { AccessPoint } from '@airscan/types/AccessPoint';

// Available aliases:
// @airscan/types/AccessPoint
// @airscan/types/Api/WebSocketApi
// @airscan/types/Client
// @airscan/types/Device
// @airscan/types/Feature
// @airscan/types/Logs
// @airscan/types/Transport
```

## Development

```bash
# Type checking
bun run lint

# Build (no build step needed for types)
```

## 📦 Dependencies

- `zod`: Runtime validation and type inference

## 🔗 Related Packages

- [`@airscan/engine`](../engine/): State management using these types
- [`@airscan/websockets`](../websockets/): WebSocket server using WebSocketApi types
- [`frontends/web`](../../frontends/web/): React frontend using these types
- [`backends/tshark`](../../backends/tshark/): Linux backend using these types
- [`backends/windows`](../../backends/windows/): Windows backend using these types