import type { EnabledFeature } from "@airscan/types/EnabledFeature.ts";

export default function getFeatureDescription(feature: EnabledFeature): string {
  if (feature.type === "deauth") {
    if (feature.options.accessPoint && feature.options.station)
      return `${feature.options.station} ↔ ${feature.options.accessPoint}`;
    if (feature.options.accessPoint)
      return `All clients on ${feature.options.accessPoint}`;
    if (feature.options.station)
      return `Client ${feature.options.station} (any AP)`;
    return "Global deauth (all devices)";
  }
  if (feature.type === "scan") {
    return "WiFi scanning";
  }
  // if (feature.type === "fake-ap") {
  //   return `Fake AP: ${feature.options.essid}`;
  // }
  throw new Error(`Unexpected feature: ${JSON.stringify(feature)}`);
}
