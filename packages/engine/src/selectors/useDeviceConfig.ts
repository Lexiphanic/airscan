import { useEngineStore } from "../engine.ts";

export default function useDeviceConfig() {
  return useEngineStore((state) => state.deviceConfig);
}
