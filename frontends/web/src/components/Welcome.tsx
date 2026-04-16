import {
  Settings,
  Wifi,
  Shield,
  Zap,
  RadioTower,
  Smartphone,
  Crosshair,
} from "lucide-react";
import useAppStore from "../store/useAppStore.ts";
import { useCallback } from "react";

export default function Welcome() {
  const setTransportDialogState = useAppStore(
    (state) => state.setTransportDialogState,
  );

  const handleClick = useCallback(
    () => setTransportDialogState("open"),
    [setTransportDialogState],
  );

  return (
    <div className="flex items-center justify-center p-6 mt-12">
      <div className="max-w-md w-full">
        <div className="neobrutalist-card p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 flex items-center justify-center rounded-2xl border border-gray-200">
                <Wifi className="w-10 h-10 text-purple-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center border border-gray-200">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center border border-gray-200">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to AirScan
          </h1>

          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            Before you can start monitoring networks and clients, you need to
            configure your transport settings first.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 rounded-xl border border-gray-200">
              <RadioTower className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <span className="text-xs text-gray-600">Scan APs</span>
            </div>
            <div className="text-center p-3 rounded-xl border border-gray-200">
              <Smartphone className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <span className="text-xs text-gray-600">Monitor</span>
            </div>
            <div className="text-center p-3 rounded-xl border border-gray-200">
              <Crosshair className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <span className="text-xs text-gray-600">Target</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClick}
            className="cursor-pointer w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <Settings className="w-5 h-5" />
              <span>Configure Transport</span>
            </div>
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Supports WebSocket and Serial transports
          </p>
        </div>
      </div>
    </div>
  );
}
