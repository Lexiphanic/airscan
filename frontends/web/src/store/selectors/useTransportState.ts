import useAppStore from "../useAppStore.ts";

export default function useTransportState() {
  return useAppStore((store) => store.transportState);
}