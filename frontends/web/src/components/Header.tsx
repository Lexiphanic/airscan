import { Wifi, Search, Radio } from "lucide-react";
import { useEngineStore } from "@airscan/engine/engine.ts";
import useTransportState from "../store/selectors/useTransportState.ts";
import ConnectionControls from "./ui/ConnectionControls.tsx";
import useDeviceConfig from "@airscan/engine/selectors/useDeviceConfig.ts";

export default function Header() {
  const searchTerm = useEngineStore((state) => state.searchTerm);
  const setSearchTerm = useEngineStore((state) => state.setSearchTerm);
  const enabledFeatures = useEngineStore((state) => state.enabledFeatures);
  const connectionState = useTransportState();
  const deviceConfig = useDeviceConfig();

  return (
    <header className="border-b-4 border-[var(--nb-border)] bg-[var(--nb-bg-secondary)] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-lg bg-purple-100">
              <Wifi className="w-6 h-6 text-[var(--nb-accent)]" />
            </div>
            {connectionState === "connected" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-[var(--nb-text)] flex items-center gap-2">
              AirScan{" "}
              <span className="text-xs font-mono text-[var(--nb-text-muted)] font-normal">
                v2.4.0
              </span>
            </h1>
            {connectionState === "connected" ? (
              <div className="flex items-center gap-2 text-xs text-[var(--nb-text-muted)] font-mono">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  <abbr title={deviceConfig.driver}>{deviceConfig.name}</abbr>
                </span>
                {deviceConfig.channels && (
                  <>
                    <span className="w-1 h-1 rounded-lg bg-[var(--nb-border)]" />
                    <span>CH: {deviceConfig.channels.join(",")}</span>
                  </>
                )}
                {enabledFeatures.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-lg bg-[var(--nb-border)]" />
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      ACTIVE
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[var(--nb-text-muted)] font-mono">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Not Connected
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-text-muted)]" />
            <input
              type="text"
              placeholder="Filter SSID, BSSID, MAC..."
              className="neobrutalist-input pl-10 pr-4 py-1.5 text-sm w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ConnectionControls />
        </div>
      </div>
    </header>
  );
}
