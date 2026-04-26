# Agent Guidelines for airscan

Monorepo using **Bun workspaces**. Always use `bun`, never `npm`/`pnpm`/`yarn`.

## Quick Start

```bash
bun install                    # Install all deps (also builds OUI db via postinstall)
bun run format                 # Biome format (root)
bun run lint                   # Biome lint (root)
```

## Workspace Layout

| Directory | Package | Entrypoint |
|---|---|---|
| `frontends/web/` | `@airscan/web` | `src/main.tsx` (Vite + React 19 + Tailwind v4 + Zustand) |
| `backends/tshark/` | `@airscan/backend-tshark` | `src/index.ts` (Linux, uses `meow` for CLI, `Bun.spawn` for subprocesses) |
| `backends/windows/` | `@airscan/backend-windows` | `src/index.ts` (Windows, cross-compiled with `--target=bun-windows-x64`) |
| `backends/bw16/` | `@airscan/backend-bw16` | Arduino firmware for BW16 (requires `arduino-cli` + AmebaD SDK 3.1.7) |
| `backends/mock/` | `@airscan/backend-mock` | `src/index.ts` (generates fake WiFi data with `@faker-js/faker`, uses `@airscan/websockets`) |
| `packages/types/` | `@airscan/types` | Zod schemas + TS types, re-exported via barrel `src/index.ts` |
| `packages/websockets/` | `@airscan/websockets` | WebSocket server utilities, exports `Server`, `Manager` |
| `packages/engine/` | `@airscan/engine` | Shared Zustand store + selectors, exports `createEngine`, `createEngineStore`, `useEngineStore` |

## Key Commands

### Per-package (all packages follow the same pattern)
```bash
bun run lint                   # Runs lint:tsc + lint:biome sequentially
bun run lint:tsc               # bunx tsc -b (type-check only)
bun run lint:biome             # bun run biome lint (lint only)
bun run format                 # bun run biome format
bun run format:fix             # bun run format --fix
bun run lint:fix               # bun run lint --fix
```

### Frontend (`frontends/web`)
```bash
bun run dev                    # Vite dev server on http://localhost:5173
bun run build                  # tsc -b && vite build (type-check first!)
bun run preview                # Vite preview on http://localhost:5173
bun run test                   # Alias for test:e2e
bun run test:e2e               # Playwright e2e tests (tests/e2e/)
bun run install:playwright     # Install PW browsers for CI
```

### Backend binaries
```bash
# tshark
bun run build                  # bun build --production --compile → dist/airscan-backend-tshark
bun run dev                    # bun ./src/index.ts <interface>

# Windows
bun run build                  # bun build --production --compile --target=bun-windows-x64
bun run dev                    # bun ./src/index.ts

# Mock (great for frontend dev without real hardware)
bun run build                  # bun build --production --compile → dist/airscan-backend-mock
bun run dev                    # bun ./src/index.ts [interface] [--channel, --ap-count, --client-count]
```

### Engine (`packages/engine`)
```bash
bun run build                  # Builds OUI database (bin/create-oui.ts), also runs via postinstall
```

### BW16 (`backends/bw16`)
```bash
bun run init:arduino           # First-time arduino-cli setup (config, board URL, core install)
bun run build                  # arduino-cli compile --fqbn realtek:AmebaD:Ai-Thinker_BW16
bun run upload                 # arduino-cli upload
```

### Type-check a single package
```bash
bunx tsc -b backends/tshark
bunx tsc -b frontends/web
bunx tsc -b packages/types
bunx tsc -b --showConfig       # Show resolved tsconfig
```

## Linting & Formatting

Uses **Biome 2.4.12** (not ESLint/Prettier). Root config is `biome.json` with VCS integration (git, default branch `main`). Frontend overrides at `frontends/web/biome.json` add React lint rules and Tailwind CSS parser. All packages have their own Biome config.

## Testing

E2E tests only (no unit tests). Uses **Playwright** via `@playwright/test`:
- Tests live in `frontends/web/tests/e2e/`
- Test runner auto-starts mock backend + Vite dev server (see `playwright.config.ts`)
- Run: `cd frontends/web && bun run test`
- CI runs with `bun run install:playwright` first

## TypeScript Quirks

- `verbatimModuleSyntax: true` — always include `.ts`/`.tsx` extensions in imports
- `noUncheckedIndexedAccess: true` — always check array/object access
- `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`
- Path aliases (defined in root `tsconfig.json`):
  - `@airscan/types/*` → `packages/types/src/*`
  - `@airscan/websockets/*` → `packages/websockets/src/*`
  - `@airscan/engine/*` → `packages/engine/src/*`
- Frontend `tsconfig.json` extends root with `lib: ["DOM", "DOM.Iterable"]` and `types: ["dom-serial"]`
- Frontend Vite config also defines `@airscan/types` and `@airscan/engine` aliases
- **Zod v4** (`^4.3.6`) — API differs from v3

## Architecture Notes

- **Engine is a global singleton**: `createEngine()` returns the same instance each call. The engine module exports `engineStore` (a Zustand store) and `useEngineStore` directly.
- **Frontend store** (`frontends/web/src/store/useAppStore.ts`) wraps the engine with transport layer (WebSocket/Serial). Transport factory in `transport/factory.ts` creates `WebSocketClient` or `SerialClient`.
- **Mock backend** uses `@airscan/websockets` + `@faker-js/faker` and is the easiest way to test the frontend without hardware. Run `bun run dev` in `backends/mock/`.
- **OUI database** (`packages/engine/src/data/oui.json`) is gitignored, auto-generated from `oui-data` package. Rebuild with `bun run build` in engine package or `bun install` at root.
- **Production build** outputs to `dist/` (gitignored). Frontend production base path is `/airscan/`.

## CI

Two workflows in `.github/workflows/`:
- `monorepo-build.yml` — builds all packages in devcontainer, runs e2e tests, deploys frontend to GitHub Pages, creates releases on tags
- `opencode.yml` — triggered by `/opencode` comments on issues/PRs, uses `deepseek/deepseek-reasoner`

All CI build steps run `bun install --frozen-lockfile` → `bun run lint` → `bun run build` (or just lint for packages without builds).

## Important

- `packages/engine/src/data/oui.json` is generated and **gitignored** — do not commit it
- Mock backend is in `backends/mock/` — not documented in README but referenced by CI
- Always run `bun run lint` (type-check) before committing — this is the sole quality gate
- E2E tests require the mock backend running; `playwright.config.ts` handles this automatically via `webServer`
- BW16 build requires `arduino-cli` with AmebaD board package and autoflash patch (see devcontainer Dockerfile)
