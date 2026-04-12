# AirScan - WiFi Network Analysis Tool

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)
![Zustand](https://img.shields.io/badge/Zustand-5.0-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38B2AC)

**A modern, cross-platform WiFi network analysis and penetration testing tool**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development) • [Architecture](#architecture)

## Overview

AirScan is a comprehensive WiFi network analysis tool built with modern web technologies. It provides real-time network scanning, device discovery, and security analysis capabilities through a beautiful React-based interface. The tool supports multiple platforms including Linux (using tshark/aireplay-ng), Windows, and embedded devices (BW16) with a unified frontend experience.

## Features

### Core Capabilities
- **Real-time WiFi Scanning**: Monitor access points and connected clients in real-time
- **Cross-platform Support**: Linux (tshark/aireplay-ng), Windows, and embedded (BW16) backends
- **Device Identification**: Automatic manufacturer lookup using OUI database
- **Advanced Filtering**: Search and filter by SSID, MAC address, manufacturer, and signal strength
- **Security Analysis**: Identify vulnerable networks and connected devices
- **Live Logging**: Real-time event logging with different severity levels
- **Embedded Support**: BW16 microcontroller for portable WiFi analysis

### Modern Interface
- **Dark Theme**: Clean, modern dark UI built with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile browsers
- **Real-time Updates**: WebSocket-based live data streaming
- **Interactive Visualizations**: Signal strength indicators, connection graphs
- **Multi-transport Support**: WebSocket and Serial communication options

### Technical Excellence
- **Type-safe Architecture**: Full TypeScript with strict type checking
- **Monorepo Structure**: Bun workspaces for shared packages
- **State Management**: Zustand with optimized selectors
- **Real-time Communication**: WebSocket server with connection management
- **Modular Design**: Separated frontend, backends, and shared packages
- **Embedded Development**: Arduino-based firmware for BW16 microcontroller

## Architecture

```
airscan/
├── frontends/web/          # React frontend (Vite + TypeScript + Tailwind)
│   ├── src/components/     # React components
│   ├── src/store/          # Zustand store + selectors
│   └── src/transport/      # WebSocket/Serial abstraction
├── backends/
│   ├── tshark/             # Linux WiFi scanner (tshark + aireplay-ng)
│   ├── windows/            # Windows WiFi scanner backend
│   └── bw16/               # BW16 embedded microcontroller backend
└── packages/
    ├── types/              # Zod schemas + TypeScript types
    ├── websockets/         # WebSocket server utilities
    └── engine/             # Shared state engine + selectors
```

## Installation

### Prerequisites

- **Bun Runtime**: Version 1.3 or higher ([install bun](https://bun.sh))
- **Linux Backend**: `tshark`, `aireplay-ng` (for Linux scanning)
- **Windows Backend**: PowerShell with WiFi capabilities
- **BW16 Backend**: Ai-Thinker BW16 microcontroller, Arduino CLI, AmebaD SDK 3.1.7

### Quick Start

1. **Clone the repository**
   ```bash
    git clone https://github.com/lexiphanic/airscan.git
   cd airscan
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```
   This will automatically generate the OUI database (`packages/engine/src/data/oui.json`) via a postinstall script.

3. **Start the frontend**
   ```bash
   cd frontends/web
   bun run dev
   ```
   Open http://localhost:5173 in your browser

4. **Start a backend** (choose one)

   **Linux (requires root/sudo):**
   ```bash
   cd backends/tshark
   sudo bun run dev wlan0
   ```

   **Windows:**
   ```bash
   cd backends/windows
   bun run dev
   ```

   **BW16 Embedded Device:**
   ```bash
   cd backends/bw16
   # First-time setup
   bun run init:arduino
   # Build firmware
   bun run build
   # Upload to device
   bun run upload
   ```

## Usage

### Frontend Interface

1. **Connect to Backend**: Use the connection dialog to connect via WebSocket or Serial
2. **Scan Networks**: Start scanning to discover nearby WiFi networks
3. **Analyze Devices**: View connected clients, signal strength, and manufacturer info
4. **Filter Results**: Use the search bar to filter by SSID, MAC, or manufacturer
5. **Monitor Logs**: Check the logs panel for real-time events and errors

### Backend Commands

**Linux Backend:**
```bash
# Basic scan on wlan0 interface
sudo bun ./src/index.ts wlan0

# Scan specific channel with auto mode
sudo bun ./src/index.ts wlan0 --channel 6 --mode auto

# Help
bun ./src/index.ts --help
```

**Windows Backend:**
```bash
# Start Windows scanner
bun ./src/index.ts

# With specific options
bun ./src/index.ts --interval 5000
```

**BW16 Backend:**
```bash
# Serial commands (sent via Serial monitor at 115200 baud)
scan                    # Scan for nearby WiFi networks
cts <channel>          # Start CTS attack on specific channel
sleep <router_mac> <client_mac> <channel>  # Start sleep attack
stop                   # Stop current attack mode
```

## Development

### Project Structure

This is a monorepo using **Bun workspaces** with the following packages:

- **`@airscan/web`**: React frontend application
- **`@airscan/types`**: Shared TypeScript types and Zod schemas
- **`@airscan/websockets`**: WebSocket server utilities
- **`@airscan/engine`**: Shared state engine and selectors
- **`@airscan/backend-*`**: Platform-specific scanner backends

### Development Commands

**From root directory:**
```bash
# Install all dependencies
bun install

# Type-check all packages
bunx tsc -b
```

**Frontend Development:**
```bash
cd frontends/web
bun run dev          # Start dev server
bun run build        # Production build
bun run lint         # Type-check
```

**Package Development:**
```bash
cd packages/engine
bun run lint         # Type-check
bun run build        # Build OUI database
```

### Code Style Guidelines

- **TypeScript**: Strict mode with `verbatimModuleSyntax: true`
- **Imports**: Always include `.ts`/`.tsx` extensions
- **Naming**: kebab-case files, PascalCase components, camelCase functions
- **State Management**: Zustand with selector pattern
- **Styling**: Tailwind CSS utility-first approach

### Adding New Features

1. **Define Types**: Add Zod schemas in `packages/types/src/`
2. **Update Engine**: Modify `packages/engine/src/engine.ts` for state changes
3. **Create Selectors**: Add derived state selectors in `packages/engine/src/selectors/`
4. **Build UI**: Create React components in `frontends/web/src/components/`
5. **Update Backend**: Implement feature in relevant backend scanner
6. **Embedded Features**: Add Arduino code to `backends/bw16/bw16.ino` for BW16 support

## API Documentation

### WebSocket API

The backend exposes a WebSocket server that streams:
- Access point discoveries
- Connected client information
- Real-time logs
- Device configuration updates

### Transport Layer

Multiple transport options are supported:
- **WebSocket**: Real-time bidirectional communication
- **Serial**: Direct serial connection to embedded devices
- **Custom**: Extensible transport interface

### State Management

The engine package provides a shared Zustand store with optimized selectors:
- `useAccessPoints()`: Filtered access points
- `useClients()`: Connected clients
- `useEnabledFeatures()`: Active features
- `useSearchTerm()`: Current search filter

## Contributing

### Development Workflow

1. Ensure all TypeScript checks pass: `bunx tsc -b`
2. Follow existing code patterns and conventions
3. Add appropriate error handling
4. Test on both Linux and Windows if applicable

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **OUI Database**: Manufacturer lookup using `oui-data` package
- **React 19**: Latest React features and optimizations
- **Bun**: Fast JavaScript runtime and package manager
- **Tailwind CSS**: Utility-first CSS framework

## Support

- **Issues**: Report bugs or feature requests on GitHub
- **Documentation**: See `AGENTS.md` for detailed development guidelines
- **Community**: Join discussions in the project repository

---

**Built with modern web technologies**

[Report Bug](https://github.com/lexiphanic/airscan/issues) · [Request Feature](https://github.com/lexiphanic/airscan/issues)