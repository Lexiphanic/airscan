# `@airscan/backend-mock`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)
![Mock](https://img.shields.io/badge/Mock-Data-orange)
![License](https://img.shields.io/badge/License-MIT-green)

**Mock WiFi Scanner Backend** · **Semi-realistic Data Generation** · **WebSocket API**

A mock backend for testing and development that generates semi-realistic WiFi scanning data using faker. Part of the AirScan monorepo.

[Features](#features) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Architecture](#architecture)

## Features

- **Semi-realistic Mock Data**: Generates fake access points and clients with realistic attributes
- **Dynamic Simulation**: RSSI fluctuations, random AP/client appearance/disappearance
- **Scan & Deauth Support**: Implements both scanning and deauthentication features
- **WebSocket API**: Streams mock data to frontend applications
- **Multiple Clients**: Supports multiple WebSocket clients with synchronized data
- **No Hardware Required**: Works on any platform without WiFi hardware

## Quick Start

### Installation
```bash
# From the monorepo root
bun install

# Navigate to backend directory
cd backends/mock
```

### Basic Usage
```bash
# Run mock backend (interface name optional)
bun run dev mock0

# Customize number of access points and clients
bun run dev mock0 --ap-count 5 --client-count 2

# Specify channel (affects generated data)
bun run dev mock0 --channel 6
```

### Build Executable
```bash
# Compile to standalone binary
bun run build

# Run the compiled binary
./dist/airscan-backend-mock mock0 --ap-count 10
```

## Configuration

### Command Line Options
```
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
```

### Mock Data Generation
The backend generates the following data with configurable quantities:

- **Access Points**: BSSID, SSID, channel, RSSI, authentication, encryption, speed
- **Clients**: MAC address, associated BSSID, RSSI, probe requests
- **Dynamic Behavior**:
  - RSSI values fluctuate ±5 dBm every 2 seconds
  - Random APs/clients appear and disappear (10% chance each interval)
  - All data is broadcast to subscribed WebSocket clients

## WebSocket API

The backend exposes a WebSocket server that streams mock scan results in real-time, following the same API as real backends:

### Connection
```javascript
// Connect to the backend
const ws = new WebSocket('ws://localhost:8080');

// Server runs on port 8080 by default
console.log(`Server running on ws://${server.hostname}:${server.port}...`)
```

### Message Format
Messages follow the `@airscan/types` schema (identical to real backends):

```typescript
// Access Point Discovery
{
  type: "addAccessPoints",
  accessPoints: {
    [bssid: string]: {
      bssid: string;
      ssid: string;
      rssi: number;
      channel: number;
      encryption: string;
      authentication: string;
      speed?: string;
      packetCount?: number;
    }
  }
}

// Client Discovery
{
  type: "addClients",
  clients: {
    [mac: string]: {
      mac: string;
      bssid: string[];
      probes: string[];
      rssi: number;
    }
  }
}

// Deauth Logs
{
  type: "addLog",
  log: {
    timestamp: number;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  }
}
```

### Feature Support
- **Scan Feature**: Clients can enable scanning to receive continuous mock data
- **Deauth Feature**: Clients can enable/disable mock deauthentication attacks
- **Multiple Clients**: All connected clients receive the same data stream

## Architecture

### Core Components
```
src/
└── index.ts          # CLI entry point, mock data generation, and WebSocket server
```

### Data Flow
1. **CLI Parsing**: `meow` for command-line argument parsing
2. **Mock Generation**: `MockManager` creates initial access points and clients
3. **Simulation Loop**: Periodic updates to RSSI and random AP/client changes
4. **WebSocket Broadcasting**: Results sent to all connected scan subscribers
5. **Deauth Simulation**: Log generation for deauthentication feature enable/disable
6. **Graceful Shutdown**: Clean termination on SIGINT

### Dependencies
```json
{
  "@airscan/types": "Shared type definitions",
  "@airscan/websockets": "WebSocket server utilities",
  "@faker-js/faker": "Mock data generation",
  "meow": "CLI argument parsing"
}
```

## Development

### Setup Development Environment
```bash
# Install dependencies
bun install

# Type checking
bun run lint

# Development mode
bun run dev mock0 --ap-count 5

# Build for production
bun run build
```

### Testing
```bash
# Run tests (when implemented)
bun test
```

### Code Style
- **TypeScript** with strict type checking
- **ESLint** configuration from monorepo root
- **Prettier** formatting
- **Import aliases**: `@airscan/*` for internal packages

## Use Cases

1. **Frontend Development**: Test UI components without hardware
2. **CI/CD Pipelines**: Run integration tests without WiFi hardware
3. **Demo/Presentations**: Showcase AirScan capabilities anywhere
4. **Feature Development**: Develop new features against a stable backend
5. **Education**: Learn AirScan architecture without hardware requirements

## Related Packages

- **`@airscan/types`**: Shared TypeScript type definitions
- **`@airscan/websockets`**: WebSocket server utilities
- **`@airscan/engine`**: Shared state management engine
- **`frontends/web`**: React frontend application

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../../CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/lexiphanic/airscan/issues)
- **Documentation**: See [AGENTS.md](../../AGENTS.md) for detailed guidelines
- **Questions**: Open a discussion in the repository

---

**Built with Bun, TypeScript, and Faker**