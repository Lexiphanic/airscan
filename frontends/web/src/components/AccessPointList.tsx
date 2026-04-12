import { Server, RadioTower } from 'lucide-react';
import AccessPointCard from './AccessPointCard.tsx';
import useFilteredAccessPoints from '@airscan/engine/selectors/useFilteredAccessPoints.ts';
import Card from './ui/Card.tsx';

export default function AccessPointList() {
  const filteredAccessPoints = useFilteredAccessPoints();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4" /> Access Points ({filteredAccessPoints.length})
        </h2>
      </div>

      <div className="space-y-3">
        {filteredAccessPoints.map((accessPoint) => (
          <AccessPointCard key={accessPoint.bssid} accessPoint={accessPoint} />
        ))}

        {filteredAccessPoints.length === 0 && (
          <Card className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <RadioTower className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500">No access points found.</p>
          </Card>
        )}
      </div>
    </div>
  );
};