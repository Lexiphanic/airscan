import { Search, Wifi, Unlock, Lock, WifiOff, Ban } from 'lucide-react';
import Card from './ui/Card.tsx';
import Badge from './ui/Badge.tsx';
import useAppStore from '../store/useAppStore.ts';
import { useEngineStore } from '@airscan/engine/engine.ts';
import useDeviceConfig from '@airscan/engine/selectors/useDeviceConfig.ts';
import getManufacturerByMac from '../utils/getManufacturerByMac.ts';
import type { Client } from '@airscan/types/Client';
import id from '@airscan/engine/utils/id.ts';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard(props: ClientCardProps) {
  const addEnabledFeature = useAppStore(state => state.addEnabledFeature);
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const removeEnabledFeature = useAppStore(state => state.removeEnabledFeature);
  const setSearchTerm = useEngineStore(state => state.setSearchTerm);
  const deviceConfig = useDeviceConfig();
  const isUnassociated = props.client.bssid.length === 0;

  const clientFeature = enabledFeatures.find(feature =>
    feature.type === "deauth" &&
    (feature.options.station === props.client.mac || feature.options.station?.startsWith(props.client.mac.substr(0, 8))) &&
    (feature.options.accessPoint === "" || props.client.bssid.includes(feature.options.accessPoint!)) &&
    feature.isActive
  );

  const isEnabled = !!clientFeature;

  const handleDeauth = () => {
    if (isEnabled && clientFeature) {
      removeEnabledFeature(clientFeature);
    } else {
      addEnabledFeature({
        id: id(),
        type: "deauth",
        isActive: true,
        options: {
          accessPoint: props.client.bssid[0] || "",
          station: props.client.mac,
          channel: 0,
        },
      });
    }
  };

  return (
    <Card className={`p-0 border-l-4 transition-all overflow-visible ${isEnabled ? 'border-l-red-500' : 'border-l-transparent hover:border-l-cyan-500'
      }`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${isUnassociated ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {isUnassociated ? <Search className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-mono text-sm text-white flex items-center gap-2">
                {props.client.mac}
                {isEnabled && <Badge color="red" className="animate-pulse text-[10px]">ACTIVE</Badge>}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">

                <span>{getManufacturerByMac(props.client.mac) || "Unknown Device"}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-bold text-slate-300">-{props.client.rssi}&nbsp;dBm</div>
            <div className="text-[10px] text-slate-500">{props.client.packetCount} Pkts</div>
          </div>
        </div>

        {props.client.probes.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Probing For:</div>
            <div className="flex flex-wrap gap-1">
              {props.client.probes.map((probe, idx) => (
                <button key={idx} className="px-2 py-1 bg-slate-800 rounded text-xs text-cyan-300 border border-slate-700 font-mono cursor-pointer"
                  onClick={(e) => { e.preventDefault(); setSearchTerm(probe) }}>
                  {probe}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className={`text-xs flex items-center gap-1.5 ${isUnassociated ? 'text-amber-500' : 'text-emerald-500'}`}>
            {isUnassociated ? (
              <><Unlock className="w-3 h-3" /> Not Associated</>
            ) : (
              <><Lock className="w-3 h-3" /> Connected to: {props.client.bssid.map((bssid) => <a key={bssid} className="hover:underline cursor-pointer" onClick={() => setSearchTerm(bssid)}>{bssid}</a>)}</>
            )}
          </span>

          {deviceConfig.features.includes('deauth') && <button
            onClick={handleDeauth}
            disabled={isUnassociated && !isEnabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all border ${isUnassociated && !isEnabled
              ? "opacity-30 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700"
              : isEnabled
                ? "bg-red-500 text-white border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]"
                : "bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500 hover:text-white"
              }`}
          >
            {isEnabled ? (
              <><Ban className="w-3 h-3" /> Stop</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Deauth</>
            )}
          </button>}
        </div>
      </div>
    </Card>
  );
};