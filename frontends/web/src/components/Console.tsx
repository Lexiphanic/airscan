import { useState } from 'react';
import { Terminal, Zap, ChevronUp } from 'lucide-react';
import { useEngineStore } from '@airscan/engine/engine.ts';

export default function Console() {
  const logs = useEngineStore(state => state.logs);
  const clearLogs = useEngineStore(state => state.clearLogs);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 cursor-pointer"
      >
        <div className="neobrutalist-card p-3">
          <Terminal className="w-5 h-5 text-[var(--nb-accent)]" />
          {logs.length > 0 && (
            <div className="absolute -top-1 -left-1 min-w-4.5 h-4.5 bg-[var(--nb-accent)] border-2 border-[var(--nb-border)] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
              {logs.length > 99 ? '99+' : logs.length}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--nb-bg)] border-t-4 border-[var(--nb-border)] z-30 h-1/2 min-h-96 max-h-3/4 flex flex-col">
      <div
        onClick={() => setIsOpen(false)}
        className="bg-[var(--nb-bg-secondary)] px-4 py-2 border-b-4 border-[var(--nb-border)] flex items-center justify-between hover:bg-[var(--nb-accent)] hover:text-[var(--nb-bg)] cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChevronUp className="w-4 h-4" />
            <Terminal className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Log / Console</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase">Click to minimize</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            className="text-[10px] font-bold uppercase hover:text-white"
          >
            Clear Log
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5">
        {logs.length === 0 ? (
          <span className="text-[var(--nb-text-muted)] italic">Waiting for commands... System idle.</span>
        ) : (
          logs.map((log) => (
            <div key={log.timestamp.toISOString() + log.type} className="flex gap-3">
              <span className="text-[var(--nb-text-muted)] shrink-0">[{log.timestamp.toISOString()}]</span>
              <span className={
                log.type === 'warning' ? 'text-amber-600' :
                  log.type === 'success' ? 'text-emerald-600' :
                    log.type === 'error' ? 'text-red-600' :
                      'text-[var(--nb-text-muted)]'
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