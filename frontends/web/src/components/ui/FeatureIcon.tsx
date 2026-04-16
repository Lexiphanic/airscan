import type { ReactNode } from "react";
import { RadioTower, Smartphone, Zap } from "lucide-react";
import type { EnabledFeature } from "@airscan/types/EnabledFeature";

export default function FeatureIcon(props: {
  feature: EnabledFeature;
}): ReactNode {
  if (props.feature.type === "deauth") {
    if (props.feature.options.station && props.feature.options.accessPoint)
      return <RadioTower className="w-4 h-4 text-red-400" />;
    if (props.feature.options.station)
      return <Smartphone className="w-4 h-4 text-amber-400" />;
    if (props.feature.options.accessPoint)
      return <RadioTower className="w-4 h-4 text-amber-400" />;
    return <RadioTower className="w-4 h-4 text-red-400" />;
  }
  return <Zap className="w-4 h-4 text-cyan-400" />;
}
