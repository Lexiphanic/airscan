import { Wifi, Search, Radio, Zap } from 'lucide-react';
import { useEngineStore } from '@airscan/engine/engine.ts';
import useTransportState from '../store/selectors/useTransportState.ts';
import ConnectionControls from './ui/ConnectionControls.tsx';
import useDeviceConfig from '@airscan/engine/selectors/useDeviceConfig.ts';

export default function Header() {
  const searchTerm = useEngineStore(state => state.searchTerm);
  const setSearchTerm = useEngineStore(state => state.setSearchTerm);
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const connectionState = useTransportState();
  const deviceConfig = useDeviceConfig();

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Wifi className="w-6 h-6 text-cyan-400" />
            {connectionState === "connected" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              AirScan <span className="text-xs font-mono text-slate-500 font-normal">v2.4.0</span>
            </h1>
            {connectionState === 'connected'
              ? <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  <abbr title={deviceConfig.driver}>{deviceConfig.name}</abbr>
                </span>
                {deviceConfig.channels && <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>CH: {deviceConfig.channels.join(",")}</span>
                </>}
                {enabledFeatures.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="flex items-center gap-1 text-red-400 uppercase">
                      <Zap className="w-3 h-3" />
                      {enabledFeatures.length} Active Feature
                    </span>
                  </>
                )}
              </div>
              : <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> Not Connected</span>
              </div>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter SSID, BSSID, MAC..."
              className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ConnectionControls />

        </div>
      </div>
    </header>
  );
};