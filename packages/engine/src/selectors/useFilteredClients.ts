import { useEngineStore } from '../engine.ts';
import type { Client } from '@airscan/types/Client';
import useSearchTerm from './useSearchTerm.ts';
import useClients from './useClients.ts';

export default function useFilteredClients(): Client[] {
  const searchTerm = useSearchTerm();
  const clients = useClients();
  const accessPointsMap = useEngineStore((state) => state.accessPoints);
  if (!searchTerm) return clients;

  const q = searchTerm.toLowerCase();

  return clients.filter((client) => {
    if (client.mac.toLowerCase().includes(q)) return true;
    if (client.probes.some((probe) => probe.toLowerCase().includes(q))) return true;

    const connectedToMatchingAp = client.bssid.some((b) => {
      const ap = accessPointsMap[b];
      if (!ap) return false;
      if (ap.ssid.toLowerCase().includes(q)) return true;
      if (ap.bssid.toLowerCase().includes(q)) return true;
      return false;
    });
    return connectedToMatchingAp;
  });
}
