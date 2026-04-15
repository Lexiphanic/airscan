import type { AccessPoint } from '@airscan/types/AccessPoint';
import useSearchTerm from './useSearchTerm.ts';
import useAccessPoints from './useAccessPoints.ts';
import useClients from './useClients.ts';

export default function useFilteredAccessPoints(): AccessPoint[] {
  const searchTerm = useSearchTerm();
  const accessPoints = useAccessPoints();
  const clients = useClients();

  if (!searchTerm) {
    return accessPoints;
  }

  const query = searchTerm.toLowerCase();

  return accessPoints.filter((accessPoint) => {
    if (accessPoint.ssid.toLowerCase().includes(query)) return true;
    if (accessPoint.bssid.toLowerCase().includes(query)) return true;

    const hasMatchingClient = clients.some((client) => {
      const isConnectedToThisAp = client.bssid.includes(accessPoint.bssid);
      if (!isConnectedToThisAp) return false;
      if (client.mac.toLowerCase().includes(query)) return true;
      if (client.probes.some((probe) => probe.toLowerCase().includes(query))) return true;
      return false;
    });
    return hasMatchingClient;
  });
}
