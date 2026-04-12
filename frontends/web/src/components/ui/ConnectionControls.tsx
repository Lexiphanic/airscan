import { WifiOff, Zap, Loader2, Settings } from 'lucide-react';
import useAppStore from '../../store/useAppStore.ts';
import useTransportState from '../../store/selectors/useTransportState.ts';
import useTransportConfig from '../../store/selectors/useTransportConfig.ts';

export default function ConnectionControls() {
  const transportState = useTransportState();
  const connect = useAppStore(state => state.connect);
  const disconnect = useAppStore(state => state.disconnect);
  const setTransportDialogState = useAppStore(state => state.setTransportDialogState);
  const transportConfig = useTransportConfig();

  if (transportState === 'disconnected') {
    return (
      <div className="flex items-stretch">
        <button
          onClick={connect}
          className="flex cursor-pointer items-center gap-2 px-4 py-1.5 rounded-l-full text-sm font-medium transition-all bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 border-r-0"
        >
          <WifiOff className="w-4 h-4" />
          <span>{transportConfig.type === "none" ? "Missing Config" : "Not Connected"}</span>
        </button>
        <button
          onClick={() => setTransportDialogState('open')}
          className="flex cursor-pointer items-center justify-center w-9 rounded-r-full text-sm font-medium transition-all bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"
          aria-label="Transport settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (transportState === 'connecting' || transportState === 'reconnecting') {
    return (
      <button
        className="flex cursor-pointer items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-amber-500/10 text-amber-400 border border-amber-500/50"
        onClick={disconnect}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {transportState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
      </button>
    );
  }

  if (transportState === 'connected') {
    return (
      <button
        onClick={disconnect}
        className="flex cursor-pointer items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20"
      >
        <Zap className="w-4 h-4" />
        Connected
      </button>
    );
  }

  return null;
}
