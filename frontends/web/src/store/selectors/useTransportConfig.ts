import useAppStore from "../useAppStore.ts";

export default function useTransportConfig() {
  return useAppStore((store) => store.transportConfig);
}