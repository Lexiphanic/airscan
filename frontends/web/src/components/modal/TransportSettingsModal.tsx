import { useState } from "react";
import { X, Globe, Cable, Check, AlertCircle } from "lucide-react";
import type { TransportConfig } from "@airscan/types/Transport.ts";

const BAUD_RATE_OPTIONS = [
  9600,
  19200,
  38400,
  57600,
  115200,
  230400,
  460800,
  "custom",
] as const;

export default function TransportSettingsModal(props: {
  config: TransportConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: TransportConfig) => void;
}) {
  const [transportType, setTransportType] = useState<TransportConfig["type"]>(
    props.config.type,
  );
  const [wsUrl, setWsUrl] = useState(
    props.config.type === "websocket"
      ? props.config.url
      : "ws://localhost:8080",
  );
  const [selectedPort, setSelectedPort] = useState<SerialPort | undefined>(
    props.config.type === "serial" ? props.config.serialPort : undefined,
  );
  const [isRequestingPort, setIsRequestingPort] = useState(false);
  const [baudRate, setBaudRate] = useState<number | "custom">(
    props.config.type === "serial"
      ? props.config.baudRate
      : BAUD_RATE_OPTIONS[4],
  );
  const [customBaudRate, setCustomBaudRate] = useState<string>(
    props.config.type === "serial" &&
      !BAUD_RATE_OPTIONS.includes(props.config.baudRate as any)
      ? props.config.baudRate.toString()
      : "",
  );

  const isSerialUnsupported = !("serial" in navigator);

  if (!props.isOpen) return null;

  const handleRequestSerialPort = async () => {
    if (isSerialUnsupported) {
      alert(
        "Web Serial API not supported in this browser. Use Chrome/Edge or ensure Experiment Flags are enabled.",
      );
      return;
    }

    setIsRequestingPort(true);
    try {
      const port = await navigator.serial.requestPort();
      setSelectedPort(port);
    } catch (_e) {
      console.log("Port selection cancelled");
    } finally {
      setIsRequestingPort(false);
    }
  };

  const getEffectiveBaudRate = () => {
    if (baudRate === "custom") {
      const custom = parseInt(customBaudRate, 10);
      return Number.isNaN(custom) ? 115200 : custom;
    }
    return baudRate;
  };

  const handleSave = () => {
    let config: TransportConfig = {
      type: "none",
    };
    if (transportType === "serial") {
      if (!selectedPort) {
        return;
      }
      config = {
        type: "serial",
        serialPort: selectedPort,
        baudRate: getEffectiveBaudRate(),
      };
    }
    if (transportType === "websocket") {
      try {
        new URL(wsUrl);
      } catch (_e) {
        // Invalid URL.
        return;
      }
      config = {
        type: "websocket",
        url: wsUrl,
      };
    }
    props.onSave(config);
    props.onClose();
  };

  const isFormValid =
    (transportType === "websocket" && wsUrl) ||
    (transportType === "serial" && selectedPort);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md neobrutalist-card p-6 border-3! shadow-[8px_8px_0px_0px_var(--nb-border)]!">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Transport Settings</h2>
          <button
            type="button"
            onClick={props.onClose}
            className="p-1 rounded-lg cursor-pointer hover:bg-(--nb-accent) hover:text-(--nb-bg)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transport Type Selection */}
        <div className="space-y-3 mb-6">
          <span className="text-sm font-bold text-(--nb-text-muted)">
            Transport Type
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransportType("websocket")}
              className={`cursor-pointer flex items-center gap-3 p-3 border-2 border-(--nb-border) rounded-lg ${
                transportType === "websocket"
                  ? "bg-(--nb-accent) text-(--nb-bg)"
                  : "bg-(--nb-bg) text-(--nb-text) hover:bg-(--nb-bg-secondary)"
              }`}
            >
              <Globe className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">WebSocket</div>
                <div className="text-xs opacity-80">Network</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTransportType("serial")}
              className={`cursor-pointer flex items-center gap-3 p-3 border-2 border-(--nb-border) rounded-lg ${
                transportType === "serial"
                  ? "bg-(--nb-accent) text-(--nb-bg)"
                  : "bg-(--nb-bg) text-(--nb-text) hover:bg-(--nb-bg-secondary)"
              }`}
              disabled={isSerialUnsupported}
            >
              <Cable className="w-5 h-5" />
              {isSerialUnsupported ? (
                <div className="text-left">
                  <div className="text-sm font-bold">Serial</div>
                  <div className="text-xs opacity-80">Unavailable</div>
                </div>
              ) : (
                <div className="text-left">
                  <div className="text-sm font-bold">Serial</div>
                  <div className="text-xs opacity-80">USB/COM</div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4">
          {transportType === "websocket" && (
            <div className="space-y-2">
              <label
                htmlFor="websocket-url"
                className="text-sm font-bold text-(--nb-text-muted)"
              >
                WebSocket URL
              </label>
              <input
                id="websocket-url"
                type="url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                className="w-full neobrutalist-input pl-3!"
              />
              <p className="text-xs text-(--nb-text-muted)">
                Enter the WebSocket endpoint
              </p>
            </div>
          )}
          {transportType === "serial" && (
            <div className="space-y-4">
              {/* Serial Port Selection */}
              <div className="space-y-3">
                <span className="text-sm font-bold text-(--nb-text-muted)">
                  Serial Port
                </span>

                {selectedPort ? (
                  <div className="flex items-center justify-between p-3 border-2 border-(--nb-border) rounded-lg bg-emerald-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-black/20 rounded">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          Device Selected
                        </div>
                        <div className="text-xs text-white/70">
                          No other info available.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPort(undefined)}
                      className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestSerialPort}
                    disabled={isRequestingPort}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-(--nb-border) rounded-lg bg-(--nb-bg-secondary) text-(--nb-text) hover:bg-(--nb-accent) hover:text-(--nb-bg)"
                  >
                    <Cable className="w-5 h-5" />
                    <span className="text-sm font-bold">
                      {isRequestingPort ? "Waiting..." : "Select Port"}
                    </span>
                  </button>
                )}
              </div>

              {/* Baud Rate Selection */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-(--nb-text-muted)">
                  Baud Rate
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {BAUD_RATE_OPTIONS.map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      onClick={() => setBaudRate(rate)}
                      className={`cursor-pointer px-2 py-2 text-xs font-bold border-2 border-(--nb-border) rounded-lg ${
                        baudRate === rate
                          ? "bg-(--nb-accent) text-(--nb-bg)"
                          : "bg-(--nb-bg) text-(--nb-text) hover:bg-(--nb-bg-secondary)"
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>

                {baudRate === "custom" && (
                  <input
                    type="number"
                    value={customBaudRate}
                    onChange={(e) => setCustomBaudRate(e.target.value)}
                    placeholder="Enter baud rate..."
                    className="w-full mt-2 neobrutalist-input pl-3!"
                  />
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-(--nb-text-muted)">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Select a serial port to connect.</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={props.onClose}
            className="cursor-pointer flex-1 px-4 py-2 neobrutalist-btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={!isFormValid}
            className={`cursor-pointer flex-1 px-4 py-2 ${isFormValid ? "neobrutalist-btn" : "neobrutalist-btn-outline"}`}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
