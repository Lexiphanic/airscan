import { Radar } from 'lucide-react';
import Card from '../../ui/Card.tsx';
import useAppStore from '../../../store/useAppStore.ts';
import useTransportState from '../../../store/selectors/useTransportState.ts';
import useEnabledFeatures from '@airscan/engine/selectors/useEnabledFeatures.ts';

export default function ScanFeature() {
  const enabledFeatures = useEnabledFeatures();
  console.log({enabledFeatures})
  const isScanning = enabledFeatures.some(f => f.type === 'scan' && f.isActive);
  const toggleScanning = useAppStore(state => state.toggleScanning);
  const connectionState = useTransportState();
  const isConnected = connectionState === 'connected';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Radar className="w-4 h-4" /> Scan
        </h2>
      </div>

      <Card className={`p-3 transition-all ${isScanning ? 'border-l-4 border-l-cyan-500' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Radar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Scan</div>
              <div className="text-xs text-slate-500 font-mono">
                {isScanning ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleScanning}
            disabled={!isConnected}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isScanning
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isScanning ? 'Stop' : 'Start'}
          </button>
        </div>
      </Card>
    </div>
  );
}