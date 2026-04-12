# `@airscan/backend-bw16`

![Arduino](https://img.shields.io/badge/Arduino-00979D?logo=arduino&logoColor=white)
![AmebaD](https://img.shields.io/badge/AmebaD-3.1.7-blue)
![BW16](https://img.shields.io/badge/BW16-Ai--Thinker-orange)
![License](https://img.shields.io/badge/License-MIT-green)
![Serial](https://img.shields.io/badge/Serial-115200%20baud-lightgrey)

**Embedded WiFi Scanner Backend** · **Ai-Thinker BW16 Microcontroller** · **Serial Communication**

An embedded WiFi scanning and attack backend for the Ai-Thinker BW16 microcontroller that provides low-level WiFi packet injection and scanning capabilities via serial communication. Part of the AirScan monorepo, offering embedded hardware support alongside the Linux and Windows backends.

[Features](#features) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Architecture](#architecture)

## Features

- **Embedded WiFi Scanning**: Direct hardware access for WiFi network discovery
- **Packet Injection**: Low-level frame transmission for security testing
- **Serial Communication**: Simple command interface over 115200 baud UART
- **Attack Modes**: CTS (Clear-to-Send) and sleep attack capabilities
- **Power Management**: Dynamic power saving during idle periods
- **Real-time Operation**: Immediate response to serial commands
- **Hardware Integration**: Direct access to WiFi radio hardware registers

## Prerequisites

### Hardware Requirements
- **Ai-Thinker BW16** microcontroller board
- **USB-to-Serial adapter** (FTDI/CH340) for programming and communication
- **Power supply**: 3.3V regulated power source
- **Antenna**: Dual-band 2.4GHz/5GHz WiFi antenna connected to board

### Software Requirements
- **Arduino CLI** (version 0.35.0+)
- **AmebaD SDK 3.1.7** (Realtek Ameba platform)
- **Serial terminal** (PuTTY, screen, minicom, or Arduino Serial Monitor)
- **Git** for version control

### Development Environment

#### Recommended: Use DevContainer (VS Code)
The project includes a pre-configured DevContainer with all necessary tools:

1. **Open in VS Code** with DevContainers extension
2. **Reopen in Container** when prompted
3. **All dependencies** (Arduino CLI, Bun, AmebaD SDK) are pre-installed
4. **Serial port access** configured for BW16 programming

#### Manual Setup (Alternative)
```bash
# Install Arduino CLI (Linux/macOS)
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh

# Add to PATH
export PATH="$PATH:$HOME/bin"

# Verify installation
arduino-cli version
```

## Quick Start

### Initial Setup
```bash
# From the monorepo root
bun install

# Navigate to backend directory
cd backends/bw16

# Initialize Arduino environment (first time only)
bun run init:arduino
```

### Build Firmware
```bash
# Compile firmware for BW16
bun run build

# The compiled firmware will be in dist/bw16.ino.bin
```

### Upload to Device
```bash
# Upload firmware to connected BW16
bun run upload

# Ensure the board is in programming mode (may require button press)
```

### Serial Communication
```bash
# Connect to BW16 via serial terminal (115200 baud)
screen /dev/ttyUSB0 115200

# Or using minicom
minicom -D /dev/ttyUSB0 -b 115200
```

## Configuration

### Serial Commands
The BW16 backend accepts these commands via serial at 115200 baud:

| Command | Format | Description |
|---------|--------|-------------|
| **scan** | `scan` | Scan for WiFi networks (returns SSID, BSSID, channel) |
| **cts** | `cts <channel>` | Start CTS attack on specified channel (supports 2.4GHz & 5GHz bands) |
| **sleep** | `sleep <router_mac> <client_mac> <channel>` | Start sleep attack targeting specific client |
| **stop** | `stop` | Stop current attack and return to idle mode |

### Command Examples
```
scan                    # Scan for networks (2.4GHz & 5GHz)
cts 6                   # Start CTS attack on channel 6 (2.4GHz)
cts 36                  # Start CTS attack on channel 36 (5GHz)
sleep 112233445566 AABBCCDDEEFF 6  # Sleep attack on client (2.4GHz)
sleep 112233445566 AABBCCDDEEFF 36 # Sleep attack on client (5GHz)
stop                    # Stop attack
```

### Serial Response Format
```
# Scan results (shows both 2.4GHz and 5GHz networks)
MyWiFiNetwork | AA:BB:CC:DD:EE:FF | CH:6
HiddenNetwork | 11:22:33:44:55:66 | CH:11
Fast5GHzNetwork | 22:33:44:55:66:77 | CH:36
Another5GHz | 33:44:55:66:77:88 | CH:149

# Command acknowledgments
cts on
sleep on
off
```

## Architecture

### Core Components
```
bw16.ino                # Main Arduino firmware
├── WiFi Scanning       # Network discovery via AmebaD SDK
├── Packet Injection    # Raw frame transmission
├── Serial Command Parser # Command processing
└── Attack State Machine # Mode management
```

### Data Flow
1. **Serial Input**: Commands received via UART at 115200 baud
2. **Command Parsing**: String parsing and validation
3. **Mode Selection**: Switch between scan/attack modes
4. **Hardware Control**: Direct WiFi radio manipulation
5. **Frame Construction**: Build raw 802.11 frames
6. **Packet Injection**: Transmit frames via hardware
7. **Response Output**: Results sent back via serial

### Attack Modes

#### CTS (Clear-to-Send) Attack
- Floods channel with CTS frames
- Prevents other devices from transmitting
- Effective for channel jamming
- Supports both 2.4GHz and 5GHz bands
- Command: `cts <channel>`

#### Sleep Attack
- Sends null frames to keep client awake
- Periodically sends deauthentication frames
- Prevents power saving on target device
- Supports both 2.4GHz and 5GHz bands
- Command: `sleep <router_mac> <client_mac> <channel>`

## Technical Details

### Hardware Specifications
- **Microcontroller**: Realtek RTL8710BN (ARM Cortex-M3)
- **WiFi**: 2.4GHz & 5GHz 802.11 b/g/n/ac
- **Flash**: 1MB
- **RAM**: 128KB
- **Serial**: UART at 115200 baud
- **Power**: 3.3V operation

### Frame Structures
The firmware implements these raw 802.11 frame types:

```cpp
// CTS Frame (Clear-to-Send)
struct CTSFrame {
    uint16_t frame_control = 0x00C4;
    uint16_t duration = 0x7FFF;
    uint8_t receiver_addr[6];
};

// Null Data Frame
struct NullFrame {
    uint16_t frame_control = 0x0148;
    uint16_t duration = 0x0000;
    uint8_t destination[6];
    uint8_t source[6];
    uint8_t bssid[6];
    uint16_t sequence_number = 0;
};

// Deauthentication Frame
struct DeauthFrame {
    uint16_t frame_control = 0x00C0;
    uint16_t duration = 0x0100;
    uint8_t dst[6];
    uint8_t src[6];
    uint8_t bssid[6];
    uint16_t sequence_number = 0;
    uint16_t reason = 0x0100;
};
```

### AmebaD SDK Integration
- Uses AmebaD SDK 3.1.7 (must be exact version)
- Direct hardware register access for packet injection
- WiFi scanning via `wifi_scan_networks()`
- Channel selection via `wext_set_channel()`
- Power management via `pmu_set_sysactive_time()`

## Development

### Setup Development Environment

#### Using DevContainer (Recommended)
1. Open the project in VS Code with DevContainers extension
2. Click "Reopen in Container" when prompted
3. The container includes:
   - Arduino CLI with AmebaD SDK
   - Bun package manager
   - Serial port access for BW16
   - All project dependencies

#### Manual Setup
```bash
# Install dependencies
bun install

# Initialize Arduino environment
bun run init:arduino

# Build firmware
bun run build

# Upload to device
bun run upload
```

### Build System
The backend uses Arduino CLI with custom scripts:

```json
{
  "init:arduino": "Setup AmebaD SDK and board packages",
  "build": "Compile firmware for BW16",
  "upload": "Upload firmware to connected device"
}
```

**Note**: In the DevContainer, `init:arduino` is already run during container build, so you can skip this step.

### Code Style
- **Arduino C++** with AmebaD extensions
- **Hardware-specific optimizations**: Direct register manipulation
- **Memory efficiency**: Minimal RAM usage for embedded constraints
- **Error handling**: Basic serial feedback for debugging

## Troubleshooting

### Common Issues

1. **"Error compiling for board Ai-Thinker_BW16"**
   ```bash
   # Ensure AmebaD SDK 3.1.7 is installed
   bun run init:arduino
   
   # Check Arduino CLI version
   arduino-cli version
   ```

2. **"Upload failed" or "Device not found"**
   ```bash
   # Check serial port permissions
   ls -la /dev/ttyUSB*
   sudo chmod 666 /dev/ttyUSB0
   
   # Ensure board is in programming mode
   # May require holding button during upload
   
   # In DevContainer: Ensure /dev is mounted (configured in devcontainer.json)
   ```

3. **"No serial response"**
   ```bash
   # Verify baud rate (115200)
   # Check wiring (TX/RX swapped?)
   # Test with simple serial echo sketch first
   ```

4. **"WiFi not scanning"**
   ```bash
   # Check antenna connection
   # Verify power supply (3.3V stable)
   # Ensure firmware uploaded successfully
   ```

### Debug Mode
```bash
# Monitor serial output during operation
screen /dev/ttyUSB0 115200

# Check build output for errors
bun run build 2>&1 | tee build.log
```

## Related Packages

- **`@airscan/types`**: Shared TypeScript type definitions
- **`@airscan/websockets`**: WebSocket server utilities  
- **`@airscan/engine`**: Shared state management engine
- **`frontends/web`**: React frontend application
- **`backends/tshark`**: Linux WiFi scanner backend
- **`backends/windows`**: Windows WiFi scanner backend

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../../CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on hardware
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/lexiphanic/airscan/issues)
- **Documentation**: See [AGENTS.md](../../AGENTS.md) for detailed guidelines
- **Questions**: Open a discussion in the repository

---

**Built with Arduino, AmebaD SDK, and Ai-Thinker BW16**

*Note: This backend requires specific hardware (Ai-Thinker BW16) and is designed for embedded security testing applications. For desktop platforms, use the `@airscan/backend-tshark` (Linux) or `@airscan/backend-windows` packages.*