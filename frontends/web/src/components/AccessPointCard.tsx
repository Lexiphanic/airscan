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
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/20'
    };
  }

  if (isMulticast && isLocal) {
    return {
      type: 'laa-multicast',
      label: 'Local Multicast',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/20',
      description: 'Locally administered multicast group'
    };
  }

  if (isMulticast) {
    return {
      type: 'multicast',
      label: 'Multicast',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/20'
    };
  }

  if (isLocal) {
    return {
      type: 'laa',
      label: 'Local Admin',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-500/20',
      description: 'Randomized or virtual MAC'
    };
  }

  return {
    type: 'uaa',
    label: null,
    color: 'text-[var(--nb-text-muted)]',
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
      className={`group overflow-hidden hover:bg-red-400`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-[var(--nb-text)] group-hover:text-[var(--nb-accent)]">
                {accessPoint.ssid
                  ? <button className="cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    setSearchTerm(accessPoint.ssid);
                  }}>{accessPoint.ssid}</button>
                  : <em className="text-[var(--nb-text-muted)]">
                    {macInfo.label || '[hidden]'}
                  </em>
                }
              </h3>
              {accessPoint.encryption === "NONE" && <ShieldAlert className="w-4 h-4 text-red-600" />}
              {isEnabled && <Badge color="red" className="animate-pulse font-bold">ACTIVE</Badge>}
            </div>

            <div className="font-mono text-xs text-[var(--nb-text-muted)] flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[var(--nb-text)]">
                  {accessPoint.bssid}
                </span>

                {macInfo.type === 'laa' && !manufacturer && (
                  <span className="text-xs italic text-[var(--nb-accent)]">
                    (virtual)
                  </span>
                )}
              </div>

              {(manufacturer || macInfo.type === 'laa') && <div className="flex items-center gap-2 text-[var(--nb-text-muted)]">
                <span className="w-1 h-1 rounded-full bg-[var(--nb-border)]" />
                <span>
                  {manufacturer || 'No OUI vendor'}
                </span>
              </div>}
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="text-2xl font-mono font-bold text-[var(--nb-text)]">
              -{accessPoint.rssi}&nbsp;<span className="text-sm text-[var(--nb-text-muted)] font-normal">dBm</span>
            </div>

            {deviceConfig.features.includes('deauth') && <button
              onClick={handleToggleFeature}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border-2 border-[var(--nb-border)] ${isEnabled
                ? "bg-red-600 text-white"
                : "bg-[var(--nb-bg)] text-red-600 hover:bg-red-600 hover:text-white"
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
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t-2 border-[var(--nb-border)]">
          <div className="flex flex-col col-span-2">
            <span className="text-[10px] uppercase text-[var(--nb-text-muted)] font-bold">Security</span>
            <AuthenticationAndEncryptionText className="text-sm" authentication={accessPoint.authentication} encryption={accessPoint.encryption} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[var(--nb-text-muted)] font-bold">Packets</span>
            <span className="uppercase font-mono font-medium">{accessPoint.packetCount?.toLocaleString() ?? '--'}</span>
          </div>
          <div className="flex flex-col items-end justify-center">
            <Badge color={accessPoint.rssi > 60 ? "green" : accessPoint.rssi > 40 ? "yellow" : "red"}>
              {accessPoint.rssi > 60 ? "Strong" : accessPoint.rssi > 40 ? "Fair" : "Weak"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-[var(--nb-bg-secondary)] border-t-2 border-[var(--nb-border)]">
        <button
          onClick={() => setShowClients(!showClients)}
          disabled={connectedClients.length === 0}
          className={`w-full px-4 py-2 flex items-center justify-between text-xs font-bold uppercase cursor-pointer ${
            connectedClients.length > 0 ? 'hover:bg-[var(--nb-accent)] hover:text-[var(--nb-bg)]' : 'cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            {connectedClients.length === 0 ? 'No Associated Clients' : `View Associated Clients (${connectedClients.length})`}
          </span>
          {connectedClients.length > 0 && (showClients ? <span className="text-[10px]">HIDE</span> : <span className="text-[10px]">SHOW</span>)}
        </button>

        {showClients && (
          <div className="p-4 space-y-2">
            {connectedClients.length > 0 ? (
              connectedClients.map(client => (
                <ClientRow key={client.mac} client={client} accessPointBssid={accessPoint.bssid} />
              ))
            ) : (
              <div className="text-xs text-[var(--nb-text-muted)] italic py-2">No clients currently associated.</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};