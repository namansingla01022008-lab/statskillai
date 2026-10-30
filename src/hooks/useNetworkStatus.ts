import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../services/apiService';
import { OfflineStorage } from '../services/offlineStorage';
import { SyncService } from '../services/syncService';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const isProbingRef = useRef(false);

  // Refresh count of items in outbox
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await OfflineStorage.getPendingCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  // Trigger outbox sync
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFailed(false);
    setLastSyncError(null);

    try {
      const result = await SyncService.syncOutbox();
      if (result.failedCount > 0) {
        setSyncFailed(true);
        setLastSyncError(result.errors[0] || 'Sync failed for one or more mutations.');
      } else {
        setSyncFailed(false);
      }
    } catch (err: any) {
      setSyncFailed(true);
      setLastSyncError(err.message || 'Synchronization failed.');
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [isSyncing, refreshPendingCount]);

  // Probe real connectivity via health endpoint + navigator.onLine
  const checkConnectivity = useCallback(async () => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    if (isProbingRef.current) return;
    isProbingRef.current = true;

    try {
      const hasServer = await ApiService.pingHealth();
      setIsOnline(hasServer);

      // If healthy and there are pending mutations, trigger sync
      if (hasServer) {
        const count = await OfflineStorage.getPendingCount();
        setPendingCount(count);
        if (count > 0 && !isSyncing) {
          triggerSync();
        }
      }
    } catch {
      setIsOnline(false);
    } finally {
      isProbingRef.current = false;
    }
  }, [isSyncing, triggerSync]);

  useEffect(() => {
    refreshPendingCount();
    checkConnectivity();

    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnectivity();
        refreshPendingCount();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic probe every 25 seconds
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkConnectivity();
        refreshPendingCount();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [checkConnectivity, refreshPendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncFailed,
    lastSyncError,
    triggerSync,
    refreshPendingCount,
  };
}

