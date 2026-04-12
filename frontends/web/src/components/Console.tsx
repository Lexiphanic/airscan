import { useState } from 'react';
import { Terminal, Zap, ChevronUp } from 'lucide-react';
import { useEngineStore } from '@airscan/engine/engine.ts';

export default function Console() {
  const logs = useEngineStore(state => state.logs);
  const clearLogs = useEngineStore(state => state.clearLogs);
  const enabledFeatures = useEngineStore(state => state.enabledFeatures);
  const [isOpen, setIsOpen] = useState(false);

  // Collapsed state - floating icon in bottom right
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 group"
      >
        <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl hover:border-cyan-500/50 transition-all duration-200 hover:scale-105">
          <Terminal className="w-5 h-5 text-cyan-400" />
          {/* Notification badge for active features */}
          {enabledFeatures.length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          {/* Notification badge for new logs */}
          {logs.length > 0 && (
            <div className="absolute -top-1 -left-1 min-w-4.5 h-4.5 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black px-1">
              {logs.length > 99 ? '99+' : logs.length}
            </div>
          )}
        </div>
      </button>
    );
  }

  // Expanded state - full console
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-slate-800 z-30 h-1/2 min-h-96 max-h-3/4 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
      {/* Clickable header to close */}
      <div
        onClick={() => setIsOpen(false)}
        className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChevronUp className="w-4 h-4 text-slate-500" />
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300 font-mono uppercase">Log / Console</span>
          </div>
          {enabledFeatures.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded">
              <Zap className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400 font-mono">{enabledFeatures.length} ACTIVE FEATURES</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-600 uppercase font-bold">Click to minimize</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            className="text-[10px] text-slate-500 hover:text-white uppercase font-bold"
          >
            Clear Log
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <span className="text-slate-700 italic">Waiting for commands... System idle.</span>
        ) : (
          logs.map((log) => (
            <div key={log.timestamp.toISOString() + log.type} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
              <span className="text-slate-600 shrink-0">[{log.timestamp.toISOString()}]</span>
              <span className={
                log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-red-400' :
                      'text-slate-400'
              }>
                {log.type === 'warning' && '⚡ '}
                {log.type === 'success' && '✓ '}
                {log.type === 'error' && '✗ '}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};