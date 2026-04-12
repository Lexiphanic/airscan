import { Crosshair, Factory, Trash2, Pause, Play } from 'lucide-react';
import Card from '../../ui/Card.tsx';
import Badge from '../../ui/Badge.tsx';
import useAppStore from '../../../store/useAppStore.ts';
import { useEngineStore } from '@airscan/engine/engine.ts';
import useGroupedManufacturers from '@airscan/engine/selectors/useGroupedManufacturers.ts';
import convertMacToOui from "../../../utils/convertMacToOui.ts";
import type { EnabledFeatureDeauthType } from "@airscan/types/EnabledFeature";
import getManufacturerByMac from '../../../utils/getManufacturerByMac.ts';

function normalizeManufacturerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export default function DeauthFeatureList() {
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const deauthFeatures = enabledFeatures.filter((enabledFeature) => enabledFeature.type === 'deauth');
  const removeEnabledFeature = useAppStore(state => state.removeEnabledFeature);
  const resumeEnabledFeature = useAppStore(state => state.resumeEnabledFeature);
  const pauseEnabledFeature = useAppStore(state => state.pauseEnabledFeature);
  const manufacturers = useGroupedManufacturers();

  const handleStopManufacturer = (normalizedName: string, type: 'accessPoint' | 'station') => {
    // Find the raw manufacturer name that normalizes to the given name
    const rawName = Object.keys(manufacturers).find(
      name => normalizeManufacturerName(name) === normalizedName
    );
    
    if (!rawName) return;
    
    const macs = manufacturers[rawName]!;
    deauthFeatures.forEach(feature => {
      if (
        macs.some(mac => (type === "accessPoint" ? feature.options.accessPoint! : feature.options.station!).startsWith(mac))
      ) {
        removeEnabledFeature(feature)
      }
    });
  };

  const groupedByManufacturer: Record<string, {rawName: string, type: 'accessPoint' | 'station', features: EnabledFeatureDeauthType[]}> = {};
  for (const activeFeature of deauthFeatures) {    
    const apMac = activeFeature.options.accessPoint;
    const clientMac = activeFeature.options.station;
    
    if (apMac && !clientMac) {
      const mac = convertMacToOui(apMac);
      const entry = getManufacturerByMac(mac);
      if (entry) {
        const normalizedName = normalizeManufacturerName(entry);
        const key = `${normalizedName}-accessPoint`;
        if (!groupedByManufacturer[key]) {
          groupedByManufacturer[key] = { rawName: entry, type: 'accessPoint', features: [] };
        }
        groupedByManufacturer[key].features.push(activeFeature);
      }
    } else if (clientMac && !apMac) {
      const mac = convertMacToOui(clientMac);
      const entry = getManufacturerByMac(mac);
      if (entry) {
        const normalizedName = normalizeManufacturerName(entry);
        const key = `${normalizedName}-station`;
        if (!groupedByManufacturer[key]) {
          groupedByManufacturer[key] = { rawName: entry, type: 'station', features: [] };
        }
        groupedByManufacturer[key].features.push(activeFeature);
      }
    }
  }

  // Individual deauth features (not grouped by manufacturer)
  const individualDeauthFeatures = deauthFeatures.filter((feature) => 
    !Object.values(groupedByManufacturer).some(group => 
      group.features.includes(feature)
    )
  );

  return (
    <div className="space-y-4">
      {/* Individual Deauths */}
      {individualDeauthFeatures.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase text-slate-500 font-bold">Individual Deauths</h3>
          {individualDeauthFeatures.map((feature) => (
            <Card
              key={feature.id}
              className={`p-3 transition-all ${!feature.isActive ? 'opacity-50' : 'border-l-4 border-l-red-500'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-500/10 rounded">
                    <Crosshair className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Deauth: {feature.options.accessPoint || 'Any'} → {feature.options.station || 'Any'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <span>CH: {feature.options.channel || 'Any'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => feature.isActive ? pauseEnabledFeature(feature) : resumeEnabledFeature(feature)}
                    className={`p-1.5 rounded transition-colors ${feature.isActive
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    title={feature.isActive ? "Pause feature" : "Resume feature"}
                  >
                    {feature.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeEnabledFeature(feature)}
                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Remove feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Active Manufacturer Features */}
      {Object.keys(groupedByManufacturer).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase text-slate-500 font-bold">Manufacturer Deauths</h3>
           {Object.entries(groupedByManufacturer).map(([key, { rawName, type, features }]) => {
             const normalizedName = key.replace(/-accessPoint$|-station$/, '');
             return (
               <Card key={key} className="p-3 border-l-4 border-l-purple-500">
                 <div className="flex items-center justify-between">
                   <div>
                     <div className="font-bold text-white flex items-center gap-2">
                       <Factory className="w-4 h-4 text-purple-400" />
                       {rawName} ({type === 'accessPoint' ? 'Access Points' : 'Stations'})
                     </div>
                     <div className="text-xs text-slate-500 mt-1">
                       {features.length} prefix rules active • {features.filter(feature => feature.isActive).length} enabled
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => handleStopManufacturer(normalizedName, type)}
                       className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                       title="Disable all features for this manufacturer"
                     >
                       <Crosshair className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {features.slice(0, 3).map(feature => (
                    <Badge key={feature.id} color={feature.isActive ? "red" : "gray"} className="text-[10px]">
                      {type === 'accessPoint' ? feature.options.accessPoint : feature.options.station}
                    </Badge>
                  ))}
                  {features.length > 3 && (
                    <Badge color="gray" className="text-[10px]">+{features.length - 3} more</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}