import { Crosshair, Smartphone } from "lucide-react";
import useAppStore from "../../store/useAppStore.ts";
import { useEngineStore } from "@airscan/engine/engine.ts";
import useDeviceConfig from "@airscan/engine/selectors/useDeviceConfig.ts";
import getManufacturerByMac from "../../utils/getManufacturerByMac.ts";
import type { Client } from "@airscan/types/Client";
import id from "@airscan/engine/utils/id.ts";

export default function ClientRow(props: { client: Client, accessPointBssid: string }) {
  const addEnabledFeature = useAppStore(state => state.addEnabledFeature);
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const removeEnabledFeature = useAppStore(state => state.removeEnabledFeature);
  const deviceConfig = useDeviceConfig();

  const clientFeature = enabledFeatures.find(feature =>
    feature.type === "deauth" &&
    (feature.options.station === props.client.mac || feature.options.station?.startsWith(props.client.mac.substr(0, 8))) &&
    (feature.options.accessPoint === props.accessPointBssid || feature.options.accessPoint === "") &&
    feature.isActive
  );

  const isEnabled = !!clientFeature;

  const handleDeauth = () => {
    if (isEnabled && clientFeature) {
      removeEnabledFeature(clientFeature);
    } else {
      addEnabledFeature({
        id: id(),
        type: "deauth",
        isActive: true,
        options: {
          accessPoint: props.accessPointBssid || "",
          station: props.client.mac,
          channel: 0,
        }
      });
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-800 group/client hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-3">
        <Smartphone className="w-4 h-4 text-slate-500" />
        <div>
          <div className="font-mono text-sm text-slate-300">{props.client.mac}</div>
          <div className="text-[10px] text-slate-500">{getManufacturerByMac(props.client.mac) || "Unknown"}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-slate-500">-{props.client.rssi}&nbsp;dBm</span>

        {deviceConfig.features.includes('deauth') && <button
          onClick={handleDeauth}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${isEnabled
            ? "bg-red-500 text-white opacity-100"
            : "group-hover/client:opacity-100 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50"
            }`}
          title={isEnabled ? "Stop deauth on this client" : "Disconnect this specific client"}
        >
          <Crosshair className="w-3 h-3" />
          {isEnabled ? "Stop" : "Deauth"}
        </button>}
      </div>
    </div>
  );
};