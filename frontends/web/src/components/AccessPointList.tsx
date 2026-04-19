import { Server, RadioTower } from "lucide-react";
import AccessPointCard from "./AccessPointCard.tsx";
import useFilteredAccessPoints from "@airscan/engine/selectors/useFilteredAccessPoints.ts";
import Card from "./ui/Card.tsx";

export default function AccessPointList() {
  const filteredAccessPoints = useFilteredAccessPoints();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-(--nb-text-muted)">
          <Server className="w-4 h-4" /> Access Points (
          {filteredAccessPoints.length})
        </h2>
      </div>

      <div className="space-y-3 grid grid-cols-1 print:grid-cols-2 print:gap-2">
        {filteredAccessPoints.map((accessPoint) => (
          <AccessPointCard key={accessPoint.bssid} accessPoint={accessPoint} />
        ))}

        {filteredAccessPoints.length === 0 && (
          <Card className="print:col-span-2 text-center py-12 border-2 border-dashed border-(--nb-border)">
            <RadioTower className="w-8 h-8 mx-auto mb-2 text-(--nb-text-muted)" />
            <p className="text-(--nb-text-muted)">No access points found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
