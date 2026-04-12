import type { Client } from '@airscan/types/Client';
import useClients from './useClients.ts';

export default function useConnectedClients(bssid: string): Client[] {
  const clients = useClients();
  return clients.filter((client) => client.bssid?.includes(bssid) ?? false);
}
