import { useEngineStore } from "../engine.ts";
import type { EnabledFeature } from "@airscan/types/EnabledFeature";

export default function useEnabledFeatures(): EnabledFeature[] {
  return useEngineStore((state) => state.enabledFeatures);
}
