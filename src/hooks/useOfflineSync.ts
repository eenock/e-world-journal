import { useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { storage, StorageKeys } from '@/utils/storage';
import { logger } from '@/lib/logger';
import { errorHandler, ErrorSeverity } from '@/lib/error-handler';

export const useOfflineSync = () => {
  const { user, pendingEntries, addPendingEntry, removePendingEntry, setSyncing, clearPending } =
    useStore();

  const syncPendingEntries = useCallback(async () => {
    if (!user || pendingEntries.length === 0) return;

    setSyncing(true);
    logger.info(`Syncing ${pendingEntries.length} pending entries`);

    try {
      for (const entry of pendingEntries) {
        try {
          const { error } = await supabase.from('entries').insert({
            ...entry,
            user_id: user.id,
          });

          if (error) throw error;

          removePendingEntry(entry.id);
          logger.info(`Synced entry: ${entry.id}`);
        } catch (error) {
          logger.error(`Failed to sync entry: ${entry.id}`, error as Error);
          // Keep in pending for next sync attempt
        }
      }

      // Save pending entries to storage
      await storage.set(StorageKeys.PENDING_ENTRIES, useStore.getState().pendingEntries);
    } catch (error) {
      errorHandler.handle({
        message: 'Failed to sync pending entries',
        code: 'SYNC_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
    } finally {
      setSyncing(false);
    }
  }, [user, pendingEntries]);

  useEffect(() => {
    // Load pending entries from storage on mount
    const loadPendingEntries = async () => {
      const pending = await storage.get(StorageKeys.PENDING_ENTRIES);
      if (pending && Array.isArray(pending)) {
        pending.forEach((entry: any) => addPendingEntry(entry));
      }
    };

    loadPendingEntries();
  }, []);

  useEffect(() => {
    // Listen to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        logger.info('Network connection restored, syncing pending entries');
        syncPendingEntries();
      }
    });

    return () => unsubscribe();
  }, [syncPendingEntries]);

  const savePendingEntry = useCallback(
    async (entry: any) => {
      addPendingEntry(entry);
      await storage.set(StorageKeys.PENDING_ENTRIES, useStore.getState().pendingEntries);
    },
    [addPendingEntry]
  );

  return {
    syncPendingEntries,
    savePendingEntry,
    hasPendingEntries: pendingEntries.length > 0,
    pendingCount: pendingEntries.length,
  };
};