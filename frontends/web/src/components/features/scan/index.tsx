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
      <Card className={`p-3 ${isScanning ? 'border-l-red-600' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border-2 border-[var(--nb-border)] bg-[var(--nb-accent)]">
              <Radar className="w-5 h-5 text-[var(--nb-bg)]" />
            </div>
            <div>
              <div className="text-sm font-bold">Scan</div>
              <div className="text-xs text-[var(--nb-text-muted)] font-mono">
                {isScanning ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleScanning}
            disabled={!isConnected}
            className={`px-4 py-2 neobrutalist-btn-outline ${
              isScanning
                ? '!bg-red-600 !text-white hover:!bg-red-700'
                : '!bg-emerald-500 !text-white hover:!bg-emerald-600'
            }`}
          >
            {isScanning ? 'Stop' : 'Start'}
          </button>
        </div>
      </Card>
    </div>
  );
}