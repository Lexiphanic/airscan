import { Trash2, Pause, Play, Zap } from "lucide-react";
import Card from "./ui/Card.tsx";
import Badge from "./ui/Badge.tsx";
import useAppStore from "../store/useAppStore.ts";
import { useEngineStore } from "@airscan/engine/engine.ts";
import FeatureIcon from "./ui/FeatureIcon.tsx";
import getFeatureDescription from "../utils/getFeatureDescription.ts";
import useDeviceConfig from "@airscan/engine/selectors/useDeviceConfig.ts";
import ScanFeature from "./features/scan/index.tsx";
import DeauthFeature from "./features/deauth/index.tsx";

export default function FeatureMonitor() {
  const enabledFeatures = useEngineStore((state) => state.enabledFeatures);
  const deviceConfig = useDeviceConfig();

  const hasScanSupport = deviceConfig.features.includes("scan");
  const hasDeauthSupport = deviceConfig.features.includes("deauth");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--nb-text-muted)]">
          <Zap className="w-4 h-4" /> Features
          {enabledFeatures.length > 0 && (
            <Badge color="red" className="animate-pulse uppercase">
              {enabledFeatures.length} Active
            </Badge>
          )}
        </h2>
      </div>

      {hasScanSupport && <ScanFeature />}
      {hasDeauthSupport && <DeauthFeature />}
    </div>
  );
}
