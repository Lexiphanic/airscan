import type { AccessPoint } from '@airscan/types/AccessPoint';
import useSearchTerm from './useSearchTerm.ts';
import useAccessPoints from './useAccessPoints.ts';

export default function useFilteredAccessPoints(): AccessPoint[] {
  const searchTerm = useSearchTerm();
  const accessPoints = useAccessPoints();
  if (!searchTerm) {
    return accessPoints;
  };

  const query = searchTerm.toLowerCase();

  return accessPoints.filter((accessPoint) =>
    accessPoint.ssid.toLowerCase().includes(query) ||
    accessPoint.bssid.toLowerCase().includes(query)
  );
}
