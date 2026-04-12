# `@airscan/engine`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Zustand](https://img.shields.io/badge/Zustand-5.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)

**Core State Management Engine** · **Zustand Store** · **OUI Database** · **Type-safe Selectors**

Core state management engine for the AirScan WiFi security analysis platform. Provides a shared Zustand store with selectors, utilities, and OUI database for managing WiFi scanning state across frontend and backend components.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Development](#development)

## Features

- **Centralized State Management**: Zustand store for WiFi scanning state (access points, clients, logs, features)
- **Type-Safe Selectors**: Optimized selectors for derived state calculations
- **OUI Database**: MAC address vendor lookup database built from IEEE OUI data
- **Engine Callbacks**: Transport-agnostic interface for backend communication
- **Deep Merge Utilities**: Efficient state updates with nested object merging

## Installation

```bash
# From the monorepo root
bun install

# Or install as a dependency in another package
bun add @airscan/engine
```

## Usage

### Basic Store Setup

```typescript
import { createEngineStore, useEngineStore } from '@airscan/engine';

// Create store with callbacks
const store = createEngineStore({
  setDeviceConfig: (config) => console.log('Device config:', config),
  addAccessPoints: (aps) => console.log('Access points:', aps),
  addClients: (clients) => console.log('Clients:', clients),
  addLog: (message, type) => console.log(`[${type}] ${message}`),
  addEnabledFeature: (feature) => console.log('Enabled feature:', feature),
  removeEnabledFeature: (feature) => console.log('Disabled feature:', feature),
});

// React hook usage
const Component = () => {
  const accessPoints = useEngineStore(state => state.accessPoints);
  const searchTerm = useEngineStore(state => state.searchTerm);
  const setSearchTerm = useEngineStore(state => state.setSearchTerm);
  
  return <div>{/* ... */}</div>;
};
```

### Selectors

```typescript
import { selectors } from '@airscan/engine/selectors';

// Get filtered access points
const filteredAPs = useEngineStore(selectors.filteredAccessPoints);

// Get access point by BSSID
const ap = useEngineStore(selectors.getAccessPoint('00:11:22:33:44:55'));

// Get client by MAC
const client = useEngineStore(selectors.getClient('aa:bb:cc:dd:ee:ff'));

// Get logs by type
const errorLogs = useEngineStore(selectors.getLogsByType('error'));
```

### OUI Database

```typescript
import { getVendorFromMac } from '@airscan/engine/utils';

// Look up vendor from MAC address
const vendor = getVendorFromMac('00:11:22:33:44:55');
console.log(vendor); // "Cisco Systems, Inc"
```

### Engine Callbacks Interface

```typescript
import type { EngineCallbacks } from '@airscan/engine';

const callbacks: EngineCallbacks = {
  setDeviceConfig: (config) => { /* Update device config */ },
  addAccessPoints: (accessPoints) => { /* Add new access points */ },
  addClients: (clients) => { /* Add new clients */ },
  addLog: (message, type) => { /* Add log entry */ },
  addEnabledFeature: (feature) => { /* Enable feature */ },
  removeEnabledFeature: (feature) => { /* Disable feature */ },
  onConnect: () => { /* Connection established */ },
  onDisconnect: () => { /* Connection lost */ },
};
```

## API Reference

### Store State

```typescript
interface EngineState {
  deviceConfig: DeviceConfig;          // Current device configuration
  accessPoints: AccessPointsMap;       // Discovered access points
  clients: ClientsMap;                 // Connected clients
  searchTerm: string;                  // Search filter term
  logs: LogEntry[];                    // Application logs
  enabledFeatures: EnabledFeature[];   // Active features
  
  // Action methods
  setSearchTerm: (term: string) => void;
  setDeviceConfig: (config: DeviceConfig) => void;
  setAccessPoints: (aps: AccessPointsMap) => void;
  addAccessPoints: (aps: AccessPointsMap) => void;
  setClients: (clients: ClientsMap) => void;
  addClients: (clients: ClientsMap) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
  addEnabledFeature: (feature: EnabledFeature) => void;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  updateEnabledFeature: (feature: EnabledFeature) => void;
}
```

### Available Selectors

- `filteredAccessPoints`: Access points filtered by search term
- `filteredClients`: Clients filtered by search term
- `getAccessPoint(bssid)`: Get specific access point by BSSID
- `getClient(mac)`: Get specific client by MAC address
- `getLogsByType(type)`: Get logs filtered by type (info, warning, error)
- `getEnabledFeature(type)`: Get enabled feature by type
- `isFeatureEnabled(type)`: Check if a feature is enabled

### Utilities

- `getVendorFromMac(mac)`: Look up vendor from MAC address
- `deepMerge(target, source)`: Deep merge utility for state updates
- `generateId()`: Generate unique IDs for state entries

## Building OUI Database

The OUI database is built from the IEEE OUI database. After installing dependencies (`bun install`), the OUI database is automatically generated via a postinstall script. The generated file `src/data/oui.json` is excluded from version control.

To manually rebuild the database:

```bash
cd packages/engine
bun run build
```

This creates `src/data/oui.json` with cleaned vendor data for MAC address lookups.

## Development

```bash
# Type checking
bun run lint

# Build OUI database
bun run build

# Run tests (when implemented)
bun test
```

## 📦 Dependencies

- `zustand`: State management
- `@airscan/types`: Shared type definitions
- `nanoid`: ID generation
- `oui-data`: IEEE OUI database

## 🔗 Related Packages

- [`@airscan/types`](../types/): Shared Zod schemas and TypeScript types
- [`@airscan/websockets`](../websockets/): WebSocket server utilities
- [`frontends/web`](../../frontends/web/): React frontend application
- [`backends/tshark`](../../backends/tshark/): Linux WiFi scanner backend
- [`backends/windows`](../../backends/windows/): Windows WiFi scanner backend