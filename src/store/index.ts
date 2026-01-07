import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { CustomerInfo } from 'react-native-purchases';

// Types
interface Entry {
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

interface Mood {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

interface Prompt {
    id: string;
    text: string;
    category?: string;
    tier: 'free' | 'pro';
}

// Auth Slice
interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    setAuth: (user: User | null, session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => void;
}

// Entries Slice
interface EntriesState {
    entries: Entry[];
    currentEntry: Entry | null;
    isLoading: boolean;
    setEntries: (entries: Entry[]) => void;
    addEntry: (entry: Entry) => void;
    updateEntry: (id: string, updates: Partial<Entry>) => void;
    deleteEntry: (id: string) => void;
    setCurrentEntry: (entry: Entry | null) => void;
    setLoading: (loading: boolean) => void;
}

// App State Slice
interface AppState {
    moods: Mood[];
    prompts: Prompt[];
    todayPrompt: Prompt | null;
    streak: number;
    customerInfo: CustomerInfo | null;
    setMoods: (moods: Mood[]) => void;
    setPrompts: (prompts: Prompt[]) => void;
    setTodayPrompt: (prompt: Prompt) => void;
    setStreak: (streak: number) => void;
    setCustomerInfo: (info: CustomerInfo | null) => void;
}

// Offline Slice
interface OfflineState {
    pendingEntries: Entry[];
    isSyncing: boolean;
    addPendingEntry: (entry: Entry) => void;
    removePendingEntry: (id: string) => void;
    setSyncing: (syncing: boolean) => void;
    clearPending: () => void;
}

// Combined Store
interface AppStore extends AuthState, EntriesState, AppState, OfflineState { }

export const useStore = create<AppStore>((set, get) => ({
    // Auth
    user: null,
    session: null,
    isLoading: true,
    setAuth: (user, session) => set({ user, session, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    signOut: () => set({ user: null, session: null, entries: [], currentEntry: null }),

    // Entries
    entries: [],
    currentEntry: null,
    setEntries: (entries) => set({ entries }),
    addEntry: (entry) => set((state) => ({
        entries: [entry, ...state.entries],
        streak: state.streak + 1
    })),
    updateEntry: (id, updates) => set((state) => ({
        entries: state.entries.map((e) => e.id === id ? { ...e, ...updates } : e),
        currentEntry: state.currentEntry?.id === id
            ? { ...state.currentEntry, ...updates }
            : state.currentEntry,
    })),
    deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
    })),
    setCurrentEntry: (entry) => set({ currentEntry: entry }),

    // App State
    moods: [],
    prompts: [],
    todayPrompt: null,
    streak: 0,
    customerInfo: null,
    setMoods: (moods) => set({ moods }),
    setPrompts: (prompts) => set({ prompts }),
    setTodayPrompt: (prompt) => set({ todayPrompt: prompt }),
    setStreak: (streak) => set({ streak }),
    setCustomerInfo: (info) => set({ customerInfo: info }),

    // Offline
    pendingEntries: [],
    isSyncing: false,
    addPendingEntry: (entry) => set((state) => ({
        pendingEntries: [...state.pendingEntries, entry],
    })),
    removePendingEntry: (id) => set((state) => ({
        pendingEntries: state.pendingEntries.filter((e) => e.id !== id),
    })),
    setSyncing: (syncing) => set({ isSyncing: syncing }),
    clearPending: () => set({ pendingEntries: [] }),
}));

// Selectors
export const selectIsProUser = (state: AppStore) =>
    state.customerInfo?.entitlements.active['pro'] !== undefined;

export const selectEntriesForDateRange = (start: Date, end: Date) => (state: AppStore) =>
    state.entries.filter((e) => {
        const date = new Date(e.entry_date);
        return date >= start && date <= end;
    });