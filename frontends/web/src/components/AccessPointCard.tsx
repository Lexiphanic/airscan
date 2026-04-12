import { ShieldAlert, Activity, RadioTower, Ban } from 'lucide-react';
import Card from './ui/Card.tsx';
import Badge from './ui/Badge.tsx';
import useAppStore from '../store/useAppStore.ts';
import { useEngineStore } from '@airscan/engine/engine.ts';
import useConnectedClients from '@airscan/engine/selectors/useConnectedClients.ts';
import { useState } from 'react';
import getManufacturerByMac from '../utils/getManufacturerByMac.ts';
import ClientRow from './ui/ClientRow.tsx';
import AuthenticationAndEncryptionText from './ui/AuthenticationAndEncryptionText.tsx';
import useDeviceConfig from '@airscan/engine/selectors/useDeviceConfig.ts';
import type { AccessPoint } from '@airscan/types/AccessPoint';
import id from '@airscan/engine/utils/id.ts';

interface AccessPointCardProps {
  accessPoint: AccessPoint;
}

function analyzeMacAddress(bssid: string) {
  if (!bssid) return { type: 'unknown', label: 'Unknown', icon: null };

  // Remove separators and get first octet
  const cleanMac = bssid.replace(/[:-]/g, '');
  const firstOctet = parseInt(cleanMac.substring(0, 2), 16);

  const isMulticast = (firstOctet & 0x01) === 1;      // I/G bit (least significant)
  const isLocal = (firstOctet & 0x02) === 2;          // U/L bit (second least significant)

  if (cleanMac === 'FFFFFFFFFFFF') {
    return {
      type: 'broadcast',
      label: 'Broadcast',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    };
  }

  if (isMulticast && isLocal) {
    return {
      type: 'laa-multicast',
      label: 'Local Multicast',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      description: 'Locally administered multicast group'
    };
  }

  if (isMulticast) {
    return {
      type: 'multicast',
      label: 'Multicast',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    };
  }

  if (isLocal) {
    return {
      type: 'laa',
      label: 'Local Admin',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      description: 'Randomized or virtual MAC'
    };
  }

  return {
    type: 'uaa',
    label: null,  // Normal hardware MAC, no badge needed
    color: 'text-slate-400',
    bgColor: null
  };
};


export default function AccessPointCard(props: AccessPointCardProps) {
  const accessPoint = props.accessPoint;
  const [showClients, setShowClients] = useState<boolean>(false);
  const addEnabledFeature = useAppStore(state => state.addEnabledFeature);
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const removeEnabledFeature = useAppStore(state => state.removeEnabledFeature);
  const connectedClients = useConnectedClients(accessPoint.bssid);
  const deviceConfig = useDeviceConfig();
  const setSearchTerm = useEngineStore(state => state.setSearchTerm);

  const accessPointFeature = enabledFeatures.find(feature =>
    feature.type === "deauth" && feature.options.accessPoint === accessPoint.bssid && feature.options.station === "" && feature.isActive
  );

  const isEnabled = !!accessPointFeature;

  const handleToggleFeature = () => {
    if (isEnabled && accessPointFeature) {
      removeEnabledFeature(accessPointFeature);
    } else {
      addEnabledFeature({
        id: id(),
        type: "deauth",
        isActive: true,
        options: {
          accessPoint: accessPoint.bssid,
          station: "",
          channel: accessPoint.channel,
        }
      });
    }
  };

  const manufacturer = getManufacturerByMac(accessPoint.bssid);
  const macInfo = analyzeMacAddress(accessPoint.bssid);

  return (
    <Card
      className={`group transition-all duration-200 hover:border-cyan-500/30 hover:ring-1 ring-cyan-500 border-cyan-500`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                {accessPoint.ssid
                  ? <button className="cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    setSearchTerm(accessPoint.ssid);
                  }}>{accessPoint.ssid}</button>
                  : <em className="text-slate-400">
                    {macInfo.label || '[hidden]'}
                  </em>
                }
              </h3>
              {accessPoint.encryption === "NONE" && <ShieldAlert className="w-4 h-4 text-red-500" />}
              {isEnabled && <Badge color="red" className="animate-pulse">ACTIVE</Badge>}
            </div>

            <div className="font-mono text-xs text-slate-500 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {accessPoint.bssid}
                </span>

                {/* NEW: Show LAA indicator when no manufacturer found */}
                {macInfo.type === 'laa' && !manufacturer && (
                  <span className="text-xs italic text-cyan-500/60">
                    (virtual)
                  </span>
                )}
              </div>

              {(manufacturer || macInfo.type === 'laa') && <div className="flex items-center gap-2 text-slate-500">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>
                  {manufacturer || 'No OUI vendor'}
                </span>
              </div>}
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="text-2xl font-mono font-bold text-white">
              -{accessPoint.rssi}&nbsp;<span className="text-sm text-slate-500 font-normal">dBm</span>
            </div>

            {deviceConfig.features.includes('deauth') && <button
              onClick={handleToggleFeature}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${isEnabled
                ? "bg-red-500 text-white border border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]"
                : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              title={isEnabled ? "Stop deauth feature" : "Deauthenticate all clients on this network"}
            >
              {isEnabled ? (
                <><Ban className="w-3 h-3" /> Stop</>
              ) : (
                <><RadioTower className="w-3 h-3" /> Deauth All</>
              )}
            </button>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col col-span-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold">Security</span>
            <AuthenticationAndEncryptionText className="text-sm" authentication={accessPoint.authentication} encryption={accessPoint.encryption} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 font-bold">Packets</span>
            <span className="text-sm font-mono text-slate-300">{accessPoint.packetCount?.toLocaleString() ?? '--'}</span>
          </div>
          <div className="flex flex-col items-end justify-center">
            <Badge color={accessPoint.rssi > 60 ? "green" : accessPoint.rssi > 40 ? "yellow" : "red"}>
              {accessPoint.rssi > 60 ? "Strong" : accessPoint.rssi > 40 ? "Fair" : "Weak"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/50 border-t border-slate-800">
        <button
          onClick={() => setShowClients(!showClients)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            View Associated Clients ({connectedClients.length})
          </span>
          {showClients ? <span className="text-[10px]">HIDE</span> : <span className="text-[10px]">SHOW</span>}
        </button>

        {showClients && (
          <div className="p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {connectedClients.length > 0 ? (
              connectedClients.map(client => (
                <ClientRow key={client.mac} client={client} accessPointBssid={accessPoint.bssid} />
              ))
            ) : (
              <div className="text-xs text-slate-600 italic py-2">No clients currently associated.</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};