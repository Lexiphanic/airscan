import { WifiOff, Zap, Loader2, Settings } from "lucide-react";
import useAppStore from "../../store/useAppStore.ts";
import useTransportState from "../../store/selectors/useTransportState.ts";
import useTransportConfig from "../../store/selectors/useTransportConfig.ts";

export default function ConnectionControls() {
  const transportState = useTransportState();
  const connect = useAppStore((state) => state.connect);
  const disconnect = useAppStore((state) => state.disconnect);
  const setTransportDialogState = useAppStore(
    (state) => state.setTransportDialogState,
  );
  const transportConfig = useTransportConfig();

  if (transportState === "disconnected") {
    return (
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={connect}
          className="flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm font-bold border-2 border-r border-(--nb-border) bg-red-500 text-white hover:bg-red-600 rounded-l-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span>
            {transportConfig.type === "none" ? "Missing Config" : "Connect"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTransportDialogState("open")}
          className="flex cursor-pointer items-center justify-center w-9 py-1.5 text-sm font-bold border-2 border-l border-(--nb-border) bg-red-500 text-white hover:bg-red-600 rounded-r-lg"
          aria-label="Transport settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (transportState === "connecting" || transportState === "reconnecting") {
    return (
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm font-bold border-2 border-(--nb-border) bg-amber-400 text-black hover:bg-amber-500 rounded-lg"
        onClick={disconnect}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {transportState === "reconnecting"
          ? "Reconnecting..."
          : "Connecting..."}
      </button>
    );
  }

  if (transportState === "connected") {
    return (
      <button
        type="button"
        onClick={disconnect}
        className="flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm font-bold border-2 border-(--nb-border) bg-(--nb-accent) text-(--nb-bg) rounded-lg"
      >
        <Zap className="w-4 h-4" />
        Connected
      </button>
    );
  }

  return null;
}
