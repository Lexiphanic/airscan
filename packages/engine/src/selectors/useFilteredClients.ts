import { useEngineStore } from '../engine.ts';
import type { Client } from '@airscan/types/Client';
import useSearchTerm from './useSearchTerm.ts';

export default function useFilteredClients(): Client[] {
  const searchTerm = useSearchTerm();
  const clientsMap = useEngineStore((state) => state.clients);
  const accessPointsMap = useEngineStore((state) => state.accessPoints);
  const clients = Object.values(clientsMap);
  if (!searchTerm) return clients;
  const q = searchTerm.toLowerCase();
  return clients.filter((client) => {
    if (client.mac.toLowerCase().includes(q)) return true;
    if (client.probes.some((probe) => probe.toLowerCase().includes(q))) return true;
    const connectedSsid = client.bssid
      .map((b) => accessPointsMap[b]?.ssid)
      .filter((ssid): ssid is string => typeof ssid === 'string')
      .some((ssid) => ssid.toLowerCase().includes(q));
    return connectedSsid;
  });
}
