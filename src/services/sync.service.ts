import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import * as Haptics from 'expo-haptics';

interface PendingEntry {
    id: string;
    user_id: string;
    title?: string;
    content: any;
    content_text?: string;
    mood_id?: string;
    mood_intensity?: number;
    prompt_id?: string;
    tags: string[];
    entry_date: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

class SyncService {
    private isSyncing = false;
    private syncQueue: PendingEntry[] = [];

    constructor() {
        this.initializeNetworkListener();
    }

    private initializeNetworkListener() {
        NetInfo.addEventListener((state) => {
            if (state.isConnected && state.isInternetReachable && !this.isSyncing) {
                this.syncPendingEntries();
            }
        });
    }

    async addToQueue(entry: PendingEntry) {
        const { pendingEntries, addPendingEntry } = useStore.getState();
        addPendingEntry(entry);
        this.syncQueue = [...pendingEntries, entry];

        // Try to sync immediately if online
        const netState = await NetInfo.fetch();
        if (netState.isConnected && netState.isInternetReachable) {
            await this.syncPendingEntries();
        }
    }

    async syncPendingEntries() {
        const { pendingEntries, removePendingEntry, addEntry, setSyncing } = useStore.getState();

        if (this.isSyncing || pendingEntries.length === 0) {
            return;
        }

        this.isSyncing = true;
        setSyncing(true);

        console.log(`Syncing ${pendingEntries.length} pending entries...`);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const entry of pendingEntries) {
            try {
                // Remove temporary ID and add to Supabase
                const { id: tempId, ...entryData } = entry;

                const { data, error } = await supabase
                    .from('entries')
                    .insert(entryData)
                    .select()
                    .single();

                if (error) throw error;

                // Update store with real ID from server
                addEntry(data);
                removePendingEntry(tempId);

                // Generate embeddings
                await supabase.functions.invoke('generate-embeddings', {
                    body: { entryId: data.id },
                }).catch(console.error);

                results.success++;
            } catch (error: any) {
                console.error('Sync error for entry:', error);
                results.failed++;
                results.errors.push(error.message);
            }
        }

        console.log('Sync complete:', results);

        if (results.success > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        this.isSyncing = false;
        setSyncing(false);

        return results;
    }

    async forceSyncNow() {
        const netState = await NetInfo.fetch();

        if (!netState.isConnected || !netState.isInternetReachable) {
            throw new Error('No internet connection');
        }

        return await this.syncPendingEntries();
    }

    getPendingCount() {
        const { pendingEntries } = useStore.getState();
        return pendingEntries.length;
    }

    isSyncInProgress() {
        return this.isSyncing;
    }
}

export const syncService = new SyncService();

// Hook for components to use sync
export const useSyncStatus = () => {
    const { pendingEntries, isSyncing } = useStore();

    return {
        pendingCount: pendingEntries.length,
        isSyncing,
        syncNow: () => syncService.forceSyncNow(),
    };
};