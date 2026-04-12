# `@airscan/web` - Modern WiFi Analysis Frontend

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![Vite](https://img.shields.io/badge/Vite-7.3-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38B2AC)
![Zustand](https://img.shields.io/badge/Zustand-5.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)

**A beautiful, real-time WiFi network analysis interface built with modern web technologies**

[Features](#features) • [Quick Start](#quick-start) • [Development](#development) • [Architecture](#architecture) • [API](#api)

## Features

### Modern Interface
- **Dark Theme**: Sleek, modern dark UI with Tailwind CSS
- **Real-time Updates**: Live data streaming via WebSocket/Serial
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Interactive Visualizations**: Signal strength indicators, connection graphs
- **Multi-transport Support**: WebSocket and Serial communication options

### Network Analysis
- **Real-time Scanning**: Monitor access points and connected clients
- **Device Identification**: Automatic manufacturer lookup using OUI database
- **Advanced Filtering**: Search by SSID, MAC address, manufacturer, signal strength
- **Security Analysis**: Identify vulnerable networks and connected devices
- **Live Logging**: Real-time event logging with different severity levels

### Technical Excellence
- **Type-safe**: Full TypeScript with strict type checking
- **Optimized Performance**: Zustand with memoized selectors
- **Modern Stack**: React 19, Vite, Tailwind CSS v4
- **Modular Architecture**: Clean separation of concerns
- **Real-time Communication**: WebSocket/Serial transport abstraction

## Quick Start

### Prerequisites
- **Bun Runtime**: Version 1.3 or higher ([install bun](https://bun.sh))
- **Node.js**: 18+ (optional, Bun is recommended)

### Installation

```bash
# From the project root
cd frontends/web

# Install dependencies
bun install

# Start development server
bun run dev
```

Open http://localhost:5173 in your browser.

### Connect to a Backend

1. **Linux Backend** (requires root/sudo):
   ```bash
   cd backends/tshark
   sudo bun run dev wlan0
   ```

2. **Windows Backend**:
   ```bash
   cd backends/windows
   bun run dev
   ```

3. **In the Web Interface**:
   - Click "Connect" in the header
   - Choose WebSocket or Serial transport
   - Enter connection details
   - Start scanning networks!

## Architecture

```
frontends/web/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── features/        # Feature-specific components
│   │   └── modal/           # Modal dialogs
│   ├── store/               # Zustand state management
│   │   ├── useAppStore.ts   # Main store
│   │   └── selectors/       # Memoized selectors
│   ├── transport/           # Communication layer
│   │   ├── websocket.ts     # WebSocket transport
│   │   ├── serial.ts        # Serial transport
│   │   └── factory.ts       # Transport factory
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

### Key Components

- **`Dashboard`**: Main application view with access points and clients
- **`Header`**: Navigation and connection controls
- **`AccessPointList`**: Grid of discovered WiFi networks
- **`ClientsList`**: Connected devices for selected access point
- **`Console`**: Real-time logging panel
- **`TransportSettingsModal`**: Connection configuration dialog

## Development

### Available Scripts

```bash
# Development server (http://localhost:5173)
bun run dev

# Type-checking (strict TypeScript)
bun run lint

# Production build
bun run build

# Preview production build
bun run preview
```

### Code Style Guidelines

- **TypeScript**: Strict mode with `verbatimModuleSyntax: true`
- **Imports**: Always include `.ts`/`.tsx` extensions
- **Components**: PascalCase, functional components with hooks
- **Files**: kebab-case for file names
- **State**: Use Zustand selectors for derived state
- **Styling**: Tailwind CSS utility classes only

### Adding New Features

1. **Define Types**: Update shared types in `packages/types/src/`
2. **Update Store**: Modify `useAppStore.ts` for new state/actions
3. **Create Selectors**: Add memoized selectors in `store/selectors/`
4. **Build Components**: Create React components in `src/components/`
5. **Add Transport Support**: Update transport layer if needed

## 📡 API

### Transport Layer

The frontend supports multiple transport mechanisms:

```typescript
// WebSocket transport
const wsTransport = createTransport('websocket', {
  url: 'ws://localhost:8080'
});

// Serial transport
const serialTransport = createTransport('serial', {
  baudRate: 115200
});

// Custom transport
interface Transport {
  connect(): Promise<void>;
  send(data: unknown): Promise<void>;
  onMessage(callback: (data: unknown) => void): void;
  disconnect(): Promise<void>;
}
```

### State Management

```typescript
// Store hooks
import { useAppStore } from './store/useAppStore.ts';

// Basic state access
const accessPoints = useAppStore(state => state.accessPoints);
const clients = useAppStore(state => state.clients);

// Memoized selectors
import { useFilteredAccessPoints } from './store/selectors/useFilteredAccessPoints.ts';
import { useTransportConfig } from './store/selectors/useTransportConfig.ts';

const filteredAPs = useFilteredAccessPoints();
const transportConfig = useTransportConfig();
```

### Component Patterns

```typescript
// Functional component with props
export default function AccessPointCard({ accessPoint }: AccessPointCardProps) {
  const manufacturer = useManufacturerByMac(accessPoint.mac);
  
  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
      <h3 className="text-lg font-semibold">{accessPoint.ssid}</h3>
      <p className="text-slate-400 text-sm">{manufacturer}</p>
    </div>
  );
}
```

## Performance Optimization

### Selector Pattern
```typescript
// Good: Memoized selector
export const useFilteredAccessPoints = () => {
  return useAppStore(
    useCallback((state) => {
      const searchTerm = state.searchTerm.toLowerCase();
      return state.accessPoints.filter(ap => 
        ap.ssid.toLowerCase().includes(searchTerm) ||
        ap.mac.toLowerCase().includes(searchTerm)
      );
    }, [])
  );
};

// Bad: Direct filter in component (causes unnecessary re-renders)
const filtered = accessPoints.filter(ap => ap.ssid.includes(searchTerm));
```

### Component Optimization
- Use `React.memo()` for expensive components
- Split large components into smaller, focused ones
- Lazy load non-critical components with `React.lazy()`
- Use `useMemo()` for expensive calculations

## Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@airscan/types': path.resolve(__dirname, '../../packages/types/src'),
      '@airscan/engine': path.resolve(__dirname, '../../packages/engine/src'),
    },
  },
});
```

### Tailwind CSS
Using Tailwind CSS v4 with `@tailwindcss/vite` plugin:
- No separate configuration file
- Utility-first approach
- Dark theme by default
- Custom colors in `src/index.css`

## 📦 Dependencies

### Core Dependencies
- **React 19**: Latest React features
- **Vite**: Fast build tool and dev server
- **Zustand**: Minimal state management
- **Tailwind CSS v4**: Utility-first CSS
- **Lucide React**: Icon library

### Development Dependencies
- **TypeScript**: Type safety
- **@tailwindcss/vite**: Tailwind integration
- **@vitejs/plugin-react**: React support for Vite

## 🔗 Related Packages

- **`@airscan/types`**: Shared TypeScript type definitions
- **`@airscan/engine`**: Shared state management engine
- **`@airscan/websockets`**: WebSocket server utilities
- **`backends/tshark`**: Linux WiFi scanner backend
- **`backends/windows`**: Windows WiFi scanner backend

## Testing

Run type checking before committing:
```bash
bun run lint
```

The project uses TypeScript's strict mode as the primary quality check. No additional test frameworks are currently configured.

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run type checks**: `bun run lint`
5. **Submit a pull request**

### Development Workflow
1. Ensure TypeScript checks pass: `bun run lint`
2. Follow existing code patterns and conventions
3. Add appropriate error handling
4. Test with both WebSocket and Serial transports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- **React Team**: For the amazing React 19 release
- **Tailwind CSS**: For the utility-first CSS approach
- **Zustand**: For simple yet powerful state management
- **Vite**: For the incredibly fast build tool

## Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/lexiphanic/airscan/issues)
- **Documentation**: See [AGENTS.md](../../AGENTS.md) for detailed guidelines
- **Questions**: Open a discussion in the repository

---

**Built with the modern web stack**

[Report Bug](https://github.com/lexiphanic/airscan/issues) · [Request Feature](https://github.com/lexiphanic/airscan/issues)