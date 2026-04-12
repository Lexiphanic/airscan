import { Settings, Wifi, Shield, Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore.ts';
import { useCallback } from 'react';

export default function Welcome() {
  const setTransportDialogState = useAppStore(state => state.setTransportDialogState);

  const handleClick = useCallback(() => setTransportDialogState("open"), [setTransportDialogState])

  return (
    <div className="bg-slate-950 flex items-center justify-center p-6 mt-12">
      <div className="max-w-md w-full">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Icon cluster */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-linear-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-slate-700">
                <Wifi className="w-10 h-10 text-cyan-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-slate-100 mb-2">
            Welcome to AirScan
          </h1>

          {/* Description */}
          <p className="text-slate-400 text-center mb-8 leading-relaxed">
            Before you can start monitoring networks and clients, you need to configure your transport settings first.
          </p>

          {/* Feature hints */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-2xl mb-1 block">📡</span>
              <span className="text-xs text-slate-500">Scan APs</span>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-2xl mb-1 block">💻</span>
              <span className="text-xs text-slate-500">Monitor Clients</span>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-2xl mb-1 block">🎯</span>
              <span className="text-xs text-slate-500">Target Control</span>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="cursor-pointer w-full group relative overflow-hidden bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span>Configure Transport</span>
            </div>
          </button>

          <p className="text-center text-slate-500 text-sm mt-4">
            Supports <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" target="_blank" className="underline hover:text-white">WebSocket</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API" target="_blank" className="underline hover:text-white">Serial</a> transports
          </p>
        </div>
      </div>
    </div>
  );
}