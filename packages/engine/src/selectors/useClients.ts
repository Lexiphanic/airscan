import { useEngineStore } from '../engine.ts';
import type { Client } from '@airscan/types/Client';

export default function useClients(): Client[] {
  const clientsMap = useEngineStore((state) => state.clients);

  return Object.values(clientsMap);
}
