import type { AccessPoint } from '@airscan/types/AccessPoint';
import { useEngineStore } from '../engine.ts';

export default function useAccessPoints(): AccessPoint[] {
  const accessPointsMap = useEngineStore((state) => state.accessPoints);

  return Object
    .values(accessPointsMap)
    .sort((a, b) => {
      if (isNaN(a.rssi)) {
        return 1;
      }
      return Math.abs(a.rssi) > Math.abs(b.rssi) ? 1 : -1;
    });
}
