# Agent Guidelines for airscan

This is a monorepo using **Bun workspaces** with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Zustand
- **Backends**: Bun-based servers (Linux/Windows WiFi scanners) + Arduino firmware (BW16)
- **Packages**: Shared types (Zod schemas), WebSocket server utilities, Engine (shared state)

## Build/Lint/Test Commands

### Package Manager
This project uses **Bun** as the package manager. Always use `bun` instead of `npm`/`pnpm`/`yarn`.

```bash
# Install dependencies (from root)
bun install
```

### Frontend (frontends/web)
```bash
cd frontends/web
bun run dev          # Start dev server at http://localhost:5173
bun run build        # Type-check + production build
bun run lint         # Type-check with tsc
bun run preview      # Preview production build
```

### Backends
```bash
# tshark backend
cd backends/tshark
bun run dev          # Run with: bun ./src/index.ts <interface>
bun run build        # Compile to binary
bun run lint         # Type-check

# Windows backend
cd backends/windows
bun run dev
bun run build        # Compile to Windows binary
bun run lint

# BW16 backend
cd backends/bw16
bun run init:arduino  # First-time Arduino setup
bun run build         # Compile firmware
bun run upload        # Upload to device
```

### Shared Packages
```bash
# Type definitions
cd packages/types
bun run lint

# WebSocket utilities
cd packages/websockets
bun run lint

# Engine (shared state)
cd packages/engine
bun run lint         # Type-check
bun run build        # Build OUI database
```

### Running a Single Type-Check
```bash
bunx tsc -b <package-path>    # Check specific package
bunx tsc -b frontends/web     # Check frontend
bunx tsc -b packages/engine   # Check engine
bunx tsc -b --showConfig      # Show resolved config
```

### Testing
**No tests currently exist in this codebase.** When adding tests:
- Place test files alongside source: `src/foo.ts` → `src/foo.test.ts`
- Use Bun's built-in test runner: `bun test`
- Test files should use `.test.ts` or `.spec.ts` extension
- Add test script to package.json: `"test": "bun test"`

## Code Style Guidelines

### TypeScript Configuration
The project uses strict TypeScript. Key settings in `tsconfig.json`:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `verbatimModuleSyntax: true` (must use `.ts`/`.tsx` extensions in imports)
- `moduleResolution: "bundler"`
- `allowImportingTsExtensions: true`

### Imports
- Always include file extensions in imports: `import { foo } from './foo.ts'`
- Use `import type` for type-only imports
- Import path aliases available:
  - `@airscan/types/*` → `packages/types/src/*`
  - `@airscan/websockets/*` → `packages/websockets/src/*`
  - `@airscan/engine/*` → `packages/engine/src/*`
- Group imports: external packages first, then internal aliases, then relative imports

### Naming Conventions
- **Files/Directories**: kebab-case (`access-point-list.tsx`)
- **Components**: PascalCase (`AccessPointList.tsx`)
- **Functions/Variables**: camelCase (`useFilteredAccessPoints`)
- **Types/Interfaces**: PascalCase (`AccessPointsMap`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE
- **Store/State**: Use `State` suffix for Zustand store interfaces (`EngineState`)

### Type Safety
- Use **Zod schemas** for all shared types in `packages/types`
- Infer types from schemas: `type Foo = z.infer<typeof FooSchema>`
- Prefer `satisfies` over type assertions
- Enable `noUncheckedIndexedAccess` - always check array/object access
- Use `Record<string, T>` for typed dictionaries instead of `{ [key: string]: T }`

### React Components
- Functional components with hooks (no class components)
- Do not destructure props in function signature
- Use `default` exports for pages/components, named exports for utilities
- Colocate component files: `Component.tsx`, `Component.css` (if needed)
- Use React 19+ features (no `React.FC` type, use direct function declarations)

### State Management (Zustand)
- Use selectors for derived state (see `packages/engine/src/selectors/`)
- Keep store actions in store files (e.g., `engine.ts`)
- Selector pattern: `const value = useAppStore(state => state.value)`
- Use `create` from `zustand` with TypeScript generics for type safety
- Export store hooks with `use` prefix: `useEngineStore`

### Engine Package Patterns
- The `@airscan/engine` package contains shared state logic
- Use `EngineCallbacks` interface for transport layer communication
- Store selectors are exported from `packages/engine/src/selectors/`
- OUI database is automatically generated via postinstall script after `bun install`. Run `bun run build` in engine package to manually rebuild.

### Error Handling
- Use `try/catch` with `async/await`
- Log errors with context: `console.error("Failed to X:", err)`
- Graceful degradation for optional features
- WebSocket send errors: wrap in try/catch with warning
- Use typed error handling with discriminated unions when possible

### Styling
- **Tailwind CSS** for all styling (no separate CSS files unless necessary)
- Dark theme: `bg-slate-950`, `text-slate-200`
- Use `className` for conditional classes (template literals)
- Utility-first with consistent spacing scale
- Use Tailwind v4 with `@tailwindcss/vite` plugin

### Backends (Bun)
- Use `Bun.spawn()` for subprocess management
- Always implement graceful shutdown (SIGINT handler)
- WebSocket handling via `@airscan/websockets`
- CLI parsing with `meow`
- Compile to binaries with `bun build --production --compile`

### BW16 Backend (Arduino)
- Uses AmebaD SDK 3.1.7 for Ai-Thinker BW16
- Serial communication at 115200 baud
- WiFi scanning and attack modes (CTS, sleep attacks)
- Arduino CLI for building and uploading
- Requires `arduino-cli` and AmebaD board package

## Project Structure

```
airscan/
├── frontends/web/          # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand store + selectors
│   │   └── transport/     # WebSocket/Serial abstraction
├── backends/
│   ├── tshark/             # Linux WiFi scanner backend
│   ├── windows/            # Windows WiFi scanner backend
│   └── bw16/               # BW16 embedded microcontroller backend
├── packages/
│   ├── types/              # Zod schemas + TypeScript types
│   ├── websockets/         # WebSocket server utilities
│   └── engine/             # Shared state engine
│       ├── src/
│       │   ├── selectors/  # Zustand selectors
│       │   ├── utils/      # Utility functions
│       │   └── data/       # Static data (OUI database)
│       └── bin/            # Build scripts
└── tsconfig.json           # Base TypeScript config
```

## Important Notes

1. **No ESLint/Prettier**: The project relies solely on TypeScript for code quality. Run `bun run lint` before committing.

2. **Browser APIs**: Frontend has access to DOM and `dom-serial` types.

3. **Build Output**: Production builds go to `dist/` (gitignored).

4. **Monorepo Dependencies**: Frontend and backends depend on `@airscan/types`, `@airscan/websockets`, and `@airscan/engine` packages.

5. **Zod Version**: Using Zod v4 (`^4.3.6`) - API may differ from v3.

6. **Testing**: Use Bun's built-in test runner. No external test frameworks.

7. **Engine Package**: The engine package contains shared Zustand store logic used by frontend and potentially backends.

8. **OUI Database**: The engine package builds an OUI database from `oui-data` package. The database is automatically generated via a postinstall script after `bun install`. To manually update, run `bun run build` in `packages/engine`.

9. **TypeScript Extensions**: Always use `.ts`/`.tsx` extensions in imports due to `verbatimModuleSyntax: true`.

10. **React 19**: The project uses React 19+ features. Avoid deprecated patterns like `React.FC`.

11. **BW16 Backend**: The BW16 backend is an Arduino-based firmware for the Ai-Thinker BW16 microcontroller. It provides WiFi scanning and attack capabilities via serial communication.

## GitHub Workflows

Workflows exist for each package in `.github/workflows/`:
- `frontends-web.yml` - Frontend CI
- `packages-types.yml` - Types package CI
- `packages-websockets.yml` - WebSockets package CI
- `packages-engine.yml` - Engine package CI
- `backends-*.yml` - Backend CI pipelines
- `opencode.yml` - Agent workflow integration