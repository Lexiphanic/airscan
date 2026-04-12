# `@airscan/backend-tshark`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)
![Wireshark](https://img.shields.io/badge/Wireshark-tshark-blue)

**Linux WiFi Scanner Backend** · **Real-time Network Analysis** · **WebSocket API**

A high-performance WiFi scanning backend for Linux systems that uses `tshark` (Wireshark CLI) to capture and analyze wireless network traffic in real-time. Part of the AirScan monorepo.

[Features](#features) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Architecture](#architecture)

## Features

- **Real-time WiFi Scanning**: Capture access points and client devices in real-time
- **Monitor Mode Support**: Automatic interface configuration with `airmon-ng`
- **WebSocket API**: Stream scan results to frontend applications
- **CSV Parsing**: Efficient parsing of tshark CSV output
- **Graceful Shutdown**: Clean process termination and interface cleanup
- **NetworkManager Integration**: Automatic configuration to prevent conflicts

## Prerequisites

### System Requirements
- **Linux** (tested on Debian/Ubuntu-based distributions)
- **Wireless interface** with monitor mode support
- **Root/sudo privileges** for interface configuration

### Required Packages
```bash
# Install tshark and wireless tools
sudo apt-get update
sudo apt-get install -y tshark aircrack-ng

# Add user to wireshark group (optional, for non-root capture)
sudo usermod -a -G wireshark $USER
```

## Quick Start

### Installation
```bash
# From the monorepo root
bun install

# Navigate to backend directory
cd backends/tshark
```

### Basic Usage
```bash
# Run with a wireless interface (requires monitor mode)
sudo bun run dev wlan0

# Auto-configure monitor mode
sudo bun run dev wlan0 --mode auto

# Specify WiFi channel
sudo bun run dev wlan0 --channel 6 --mode auto
```

### Build Executable
```bash
# Compile to standalone binary
bun run build

# Run the compiled binary
sudo ./dist/airscan-backend-tshark wlan0 --mode auto
```

## Configuration

### Command Line Options
```
Usage
  $ bun ./src/index.ts <interface> [options]

Options
  --channel, -c   WiFi channel to scan (1-14)
  --mode          auto or manual (default: manual)

Examples
  $ bun ./src/index.ts wlan0
  $ bun ./src/index.ts wlan0 --mode auto
  $ bun ./src/index.ts wlan0 --channel 6 --mode auto
```

### Monitor Mode
The backend supports two modes for interface configuration:

1. **Manual Mode** (`--mode manual`):
   - Interface must already be in monitor mode
   - Use `airmon-ng start wlan0` before running
   - More control over interface configuration

2. **Auto Mode** (`--mode auto`):
   - Automatically configures monitor mode
   - Handles NetworkManager conflicts
   - Restores interface on shutdown

## WebSocket API

The backend exposes a WebSocket server that streams scan results in real-time:

### Connection
```javascript
// Connect to the backend
const ws = new WebSocket('ws://localhost:8080');

// Server runs on port 8080 by default
console.log(`Server running on ws://${server.hostname}:${server.port}...`)
```

### Message Format
Messages follow the `@airscan/types` schema:

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
      data: number;
    }
  }
}
```

## Architecture

### Core Components
```
src/
├── index.ts          # CLI entry point & server initialization
├── scanner.ts        # tshark process management & CSV parsing
└── interfaceManager.ts # Monitor mode configuration
```

### Data Flow
1. **CLI Parsing**: `meow` for command-line argument parsing
2. **Interface Setup**: `InterfaceManager` configures monitor mode
3. **Process Spawn**: `Bun.spawn()` launches `tshark` subprocess
4. **CSV Streaming**: Real-time parsing of tshark CSV output
5. **WebSocket Broadcasting**: Results sent to connected clients
6. **Graceful Shutdown**: Clean termination on SIGINT

### Dependencies
```json
{
  "@airscan/types": "Shared type definitions",
  "@airscan/websockets": "WebSocket server utilities",
  "meow": "CLI argument parsing",
  "tshark": "Packet capture (system dependency)"
}
```

## Technical Details

### Tshark Fields Captured
The backend captures these specific fields from WiFi packets:

| Field | Description | Example |
|-------|-------------|---------|
| `frame.time_epoch` | Packet timestamp | `1711801234.567` |
| `wlan.ta` | Transmitter address | `aa:bb:cc:dd:ee:ff` |
| `wlan.ra` | Receiver address | `11:22:33:44:55:66` |
| `wlan.sa` | Source address | `aa:bb:cc:dd:ee:ff` |
| `wlan.da` | Destination address | `11:22:33:44:55:66` |
| `wlan.bssid` | BSSID (AP MAC) | `aa:bb:cc:dd:ee:ff` |
| `wlan.ssid` | Network SSID | `"MyWiFi"` or hex |
| `radiotap.dbm_antsignal` | Signal strength | `-65` |
| `wlan_radio.channel` | WiFi channel | `6` |

### CSV Parsing
- Custom CSV parser handles quoted fields and escaped quotes
- Hex-encoded SSIDs automatically decoded to UTF-8
- Invalid/missing fields gracefully handled
- Efficient streaming with buffer management

## Development

### Setup Development Environment
```bash
# Install dependencies
bun install

# Type checking
bun run lint

# Development mode
bun run dev wlan0 --mode auto

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

## Troubleshooting

### Common Issues

1. **"Permission denied" for tshark**
   ```bash
   # Add user to wireshark group
   sudo usermod -a -G wireshark $USER
   
   # Log out and back in, or use:
   newgrp wireshark
   ```

2. **NetworkManager conflicts**
   - Auto mode handles this automatically
   - Manual fix: `sudo systemctl stop NetworkManager`

3. **Interface not found**
   ```bash
   # List available interfaces
   iwconfig
   
   # Check monitor mode
   iw dev wlan0 info
   ```

4. **No packets captured**
   - Ensure interface is in monitor mode
   - Check channel configuration
   - Verify wireless card supports packet injection

### Debug Mode
```bash
# Run with verbose output
sudo bun run dev wlan0 --mode auto 2>&1 | tee debug.log
```

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

**Built with Bun, TypeScript, and tshark**