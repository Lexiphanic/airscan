# `@airscan/backend-windows`

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Bun](https://img.shields.io/badge/Bun-1.3-lightgreen)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?logo=powershell&logoColor=white)

**Windows WiFi Scanner Backend** · **Native Windows WiFi API** · **WebSocket Streaming**

A native Windows WiFi scanning backend that uses the Windows Runtime (WinRT) WiFi API to discover access points and client devices. Part of the AirScan monorepo, providing Windows support alongside the Linux tshark backend.

[Features](#features) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Architecture](#architecture)

## Features

- **Native Windows WiFi API**: Uses Windows.Devices.WiFi for reliable scanning
- **Real-time Access Point Discovery**: Continuous scanning with 2-second intervals
- **Device Information**: Automatic wireless adapter detection and reporting
- **WebSocket API**: Stream scan results to frontend applications
- **PowerShell Integration**: Embedded PowerShell script for WiFi operations
- **Graceful Shutdown**: Clean process termination and resource cleanup
- **Frequency to Channel Conversion**: Supports 2.4GHz, 5GHz, and 6GHz bands
- **Security Information**: Captures authentication and encryption types

## Prerequisites

### System Requirements
- **Windows 10/11** (64-bit)
- **Wireless network adapter** with Windows WiFi driver support
- **Administrator privileges** for WiFi scanning (recommended)
- **Windows Runtime (WinRT)** access enabled

### Required Windows Features
- **WiFi API Access**: Windows.Devices.WiFi namespace
- **PowerShell 5.1+**: For script execution
- **Execution Policy**: Allow PowerShell script execution

## Quick Start

### Installation
```bash
# From the monorepo root
bun install

# Navigate to backend directory
cd backends/windows
```

### Basic Usage
```bash
# Run the backend (requires Windows)
bun run dev

# The backend will automatically:
# 1. Detect wireless adapters
# 2. Start continuous scanning
# 3. Launch WebSocket server on port 8080
```

### Build Windows Executable
```bash
# Compile to standalone Windows binary
bun run build

# Run the compiled binary
./dist/airscan-backend-windows.exe
```

## Configuration

### Command Line Options
Currently runs without arguments - automatically detects and uses the first available WiFi adapter.

### PowerShell Execution Policy
If you encounter execution policy errors:
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass for this session
powershell.exe -ExecutionPolicy Bypass -File script.ps1
```

## WebSocket API

The backend exposes a WebSocket server that streams scan results in real-time:

### Connection
```javascript
// Connect to the backend
const ws = new WebSocket('ws://localhost:8080');

// Server runs on port 8080 by default
console.log(`Server running on http://${server.hostname}:${server.port}...`)
```

### Message Format
Messages follow the `@airscan/types` schema:

```typescript
// Device Configuration (sent once at startup)
{
  type: "setDeviceConfig",
  config: {
    name: string;      // Adapter name (e.g., "Wi-Fi")
    driver: string;    // Driver description
    id: string;        // Interface GUID
  }
}

// Access Point Discovery (sent every 2 seconds)
{
  type: "addAccessPoints",
  accessPoints: {
    [bssid: string]: {
      bssid: string;           // MAC address (BSSID)
      ssid: string;            // Network name
      rssi: number;            // Signal strength in dBm
      channel: number;         // WiFi channel (1-233)
      encryption: string;      // Encryption type (e.g., "WPA2")
      authentication: string;  // Authentication type (e.g., "RSNA")
      beaconInterval?: number; // Beacon interval in ms
      uptime?: number;         // Network uptime in seconds
    }
  }
}
```

## Architecture

### Core Components
```
src/
├── index.ts              # CLI entry point & server initialization
├── scanner.ts            # PowerShell process management & JSON parsing
└── WifiScanner.ps1.ts    # Embedded PowerShell script for WiFi operations
```

### Data Flow
1. **Process Spawn**: `Bun.spawn()` launches PowerShell with embedded script
2. **PowerShell Execution**: Windows WiFi API calls via WinRT
3. **JSON Streaming**: Marker-delimited JSON output with start/end markers
4. **Real-time Parsing**: Buffer management and JSON parsing
5. **WebSocket Broadcasting**: Results sent to connected clients
6. **Graceful Shutdown**: Clean termination on SIGINT

### Embedded PowerShell Script
The backend uses an embedded PowerShell script (`WifiScanner.ps1.ts`) that:
- Accesses Windows.Devices.WiFi API via WinRT
- Performs continuous WiFi scanning
- Converts frequencies to standard WiFi channels
- Outputs JSON with start/end markers for reliable parsing
- Handles errors gracefully with try/catch blocks

## Technical Details

### Windows WiFi API Integration
The backend leverages these Windows Runtime APIs:

| API | Purpose | Notes |
|-----|---------|-------|
| `Windows.Devices.WiFi.WiFiAdapter` | Primary WiFi interface | Requires `RequestAccessAsync()` |
| `WiFiAdapter.ScanAsync()` | Trigger WiFi scan | Async operation with 2-second wait |
| `WiFiAdapter.NetworkReport` | Get scan results | Contains `AvailableNetworks` collection |
| `Windows.Devices.Enumeration` | Device discovery | Finds WiFi adapters by selector |

### Frequency to Channel Conversion
The script supports all WiFi bands:

| Band | Frequency Range | Channels | Conversion Formula |
|------|----------------|----------|-------------------|
| 2.4GHz | 2412-2484 MHz | 1-14 | `(freq - 2412) / 5 + 1` |
| 5GHz | 5170-5825 MHz | 36-165 | `(freq - 5000) / 5` |
| 6GHz | 5925-7125 MHz | 1-233 | `(freq - 5950) / 5 + 1` |

### Security Information
Captured from `NetworkSecuritySettings`:
- **NetworkAuthenticationType**: OPEN, RSNA, WPA, WPA2, etc.
- **NetworkEncryptionType**: NONE, WEP, TKIP, CCMP, etc.

## Development

### Setup Development Environment
```bash
# Install dependencies
bun install

# Type checking
bun run lint

# Development mode
bun run dev

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
- **Import aliases**: `@airscan/*` for internal packages
- **File extensions**: Always include `.ts`/`.tsx` in imports
- **Error handling**: Comprehensive try/catch with logging

## Troubleshooting

### Common Issues

1. **"Access denied" error**
   ```powershell
   # Run as Administrator
   # Or check WiFi permissions in Windows Settings
   ```

2. **No WiFi adapters found**
   ```powershell
   # Check if WiFi is enabled
   netsh wlan show interfaces
   
   # Verify driver is installed
   Get-NetAdapter | Where-Object {$_.PhysicalMediaType -match 'wireless'}
   ```

3. **PowerShell execution policy blocked**
   ```powershell
   # Check current policy
   Get-ExecutionPolicy -List
   
   # Set policy for current user
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **No scan results**
   - Ensure WiFi is enabled and connected
   - Check for driver updates
   - Verify Windows WiFi service is running

### Debug Mode
```bash
# Run with verbose output
bun run dev 2>&1 | tee debug.log
```

## Related Packages

- **`@airscan/types`**: Shared TypeScript type definitions
- **`@airscan/websockets`**: WebSocket server utilities
- **`@airscan/engine`**: Shared state management engine
- **`frontends/web`**: React frontend application
- **`backends/tshark`**: Linux WiFi scanner backend

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

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

**Built with Bun, TypeScript, and Windows WiFi API**

*Note: This backend is designed for Windows systems only. For Linux support, use the `@airscan/backend-tshark` package.*