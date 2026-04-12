import { useState } from 'react';
import { X, Globe, Cable, Check, AlertCircle } from 'lucide-react';
import type { TransportConfig } from '@airscan/types/Transport.ts';

const BAUD_RATE_OPTIONS = [9600, 19200, 38400, 57600, 115200, 230400, 460800, "custom"] as const;

export default function TransportSettingsModal(props: {
  config: TransportConfig,
  isOpen: boolean,
  onClose: () => void,
  onSave: (config: TransportConfig) => void
}) {
  const [transportType, setTransportType] = useState<TransportConfig["type"]>(props.config.type);
  const [wsUrl, setWsUrl] = useState(props.config.type === 'websocket' ? props.config.url : 'ws://localhost:8080');
  const [selectedPort, setSelectedPort] = useState<SerialPort | undefined>(props.config.type === 'serial' ? props.config.serialPort : undefined);
  const [isRequestingPort, setIsRequestingPort] = useState(false);
  const [baudRate, setBaudRate] = useState<number | "custom">(props.config.type === 'serial' ? props.config.baudRate : BAUD_RATE_OPTIONS[4]);
  const [customBaudRate, setCustomBaudRate] = useState<string>(
    props.config.type === 'serial' && !BAUD_RATE_OPTIONS.includes(props.config.baudRate as any)
      ? props.config.baudRate.toString()
      : ""
  );

  const isSerialUnsupported = !('serial' in navigator);

  if (!props.isOpen) return null;

  const handleRequestSerialPort = async () => {
    if (isSerialUnsupported) {
      alert('Web Serial API not supported in this browser. Use Chrome/Edge or ensure Experiment Flags are enabled.');
      return;
    }

    setIsRequestingPort(true);
    try {
      const port = await navigator.serial.requestPort();
      setSelectedPort(port);
    } catch (_e) {
      console.log('Port selection cancelled');
    } finally {
      setIsRequestingPort(false);
    }
  };

  const getEffectiveBaudRate = () => {
    if (baudRate === 'custom') {
      const custom = parseInt(customBaudRate, 10);
      return isNaN(custom) ? 115200 : custom;
    }
    return baudRate;
  };

  const handleSave = () => {
    let config: TransportConfig = {
      type: "none"
    };
    if (transportType === 'serial') {
      if (!selectedPort) {
        return;
      }
      config = {
        type: 'serial',
        serialPort: selectedPort,
        baudRate: getEffectiveBaudRate(),
      }
    }
    if (transportType === "websocket") {
      try {
        new URL(wsUrl);
      } catch (_e) {
        // Invalid URL.
        return;
      }
      config = {
        type: 'websocket',
        url: wsUrl,
      };
    }
    props.onSave(config);
    props.onClose();
  };

  const isSaveDisabled = transportType === 'serial' && !selectedPort;
  const isCustomBaudValid = baudRate !== 'custom' || (customBaudRate && !isNaN(parseInt(customBaudRate, 10)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Transport Settings</h2>
          <button
            onClick={props.onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transport Type Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-zinc-400">Transport Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTransportType('websocket')}
              className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg border transition-all ${transportType === 'websocket'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
            >
              <Globe className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-medium">WebSocket</div>
                <div className="text-xs opacity-70">Network transport</div>
              </div>
            </button>

            <button
              onClick={() => setTransportType('serial')}
              className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg border transition-all ${transportType === 'serial'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              disabled={isSerialUnsupported}
            >
              <Cable className="w-5 h-5" />
              {
                isSerialUnsupported
                  ? <div className="text-left">
                    <div className="text-sm font-medium">Serial (unavailable)</div>
                    <div className="text-xs opacity-70">Missing Browser Support</div>
                  </div>
                  : <div className="text-left">
                    <div className="text-sm font-medium">Serial</div>
                    <div className="text-xs opacity-70">USB/COM port</div>
                  </div>
              }
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4">
          {transportType === 'websocket' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">WebSocket URL</label>
              <input
                type="url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <p className="text-xs text-zinc-500">
                Enter the WebSocket endpoint of your runner
              </p>
            </div>
          )}
          {transportType === "serial" && (
            <div className="space-y-4">
              {/* Serial Port Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400">Serial Port</label>

                {selectedPort ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-emerald-400">
                          Device Selected
                        </div>
                        <div className="text-xs text-emerald-400/70">
                          No other information available.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPort(undefined)}
                      className="p-1.5 rounded-md text-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestSerialPort}
                    disabled={isRequestingPort}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
                  >
                    <Cable className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {isRequestingPort ? 'Waiting for selection...' : 'Select Serial Port'}
                    </span>
                  </button>
                )}
              </div>

              {/* Baud Rate Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Baud Rate</label>
                <div className="grid grid-cols-4 gap-2">
                  {BAUD_RATE_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setBaudRate(rate)}
                      className={`cursor-pointer px-2 py-2 rounded-lg text-xs font-medium transition-all ${baudRate === rate
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>

                {baudRate === 'custom' && (
                  <input
                    type="number"
                    value={customBaudRate}
                    onChange={(e) => setCustomBaudRate(e.target.value)}
                    placeholder="Enter baud rate..."
                    className="w-full mt-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Click "Select Serial Port" to open the browser's device picker.
                  Ensure your Device is connected via USB.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={props.onClose}
            className="cursor-pointer flex-1 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={isSaveDisabled || (transportType === 'serial' && !isCustomBaudValid)}
            className={`cursor-pointer flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSaveDisabled || (transportType === 'serial' && !isCustomBaudValid)
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20'
              }`}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}