import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CloudCheck, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    syncFailed,
    lastSyncError,
    triggerSync,
  } = useNetworkStatus();

  // If online, not syncing, no pending items, and no failure, render nothing
  if (isOnline && !isSyncing && pendingCount === 0 && !syncFailed) {
    return null;
  }

  return (
    <aside
      aria-label="Network and synchronization status"
      className={`w-full px-4 py-2 text-xs font-medium border-b transition-colors flex flex-wrap items-center justify-between gap-2 shadow-xs ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
          : syncFailed
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-900'
          : isSyncing
          ? 'bg-teal-500/10 border-teal-500/30 text-teal-900'
          : 'bg-sky-500/10 border-sky-500/30 text-sky-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Viewing preloaded content. Offline changes will automatically sync when connection returns.
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
            <span>Syncing pending offline mutations with server...</span>
          </>
        ) : syncFailed ? (
          <>
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Sync failed ({lastSyncError || 'Server error'}). Changes remain safely stored in outbox.
            </span>
          </>
        ) : (
          <>
            <CloudCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Connected. {pendingCount} {pendingCount === 1 ? 'mutation' : 'mutations'} queued for synchronization.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-slate-900/10 text-[11px] font-bold">
            {pendingCount} pending
          </span>
        )}

        {isOnline && (
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-[11px] font-bold transition-all shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};

