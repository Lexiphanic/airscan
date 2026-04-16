import useAppStore from "../useAppStore.ts";

export default function useTransportDialogState() {
  return useAppStore((store) => store.transportDialogState);
}
