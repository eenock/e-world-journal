export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    biometric_enabled: boolean;
    theme_preference: 'light' | 'dark' | 'system';
    streak_count: number;
    last_entry_date?: string;
    created_at: string;
    updated_at: string;
}

export interface Mood {
    id: string;
    name: string;
    emoji: string;
    color: string;
    created_at: string;
}

export interface Prompt {
    id: string;
    text: string;
    category?: string;
    weight: number;
    is_active: boolean;
    tier: 'free' | 'pro';
    created_at: string;
    updated_at: string;
}

export interface Entry {
    id: string;
    user_id: string;
    title?: string;
    content: any; // TipTap JSON format
    content_text?: string;
    mood_id?: string;
    mood?: Mood;
    mood_intensity?: number;
    prompt_id?: string;
    tags: string[];
    entry_date: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

// Simplified type for display purposes
export interface EntryDisplay {
    id: string;
    title?: string;
    content_text?: string;
    entry_date: string;
    mood?: {
        id?: string;
        emoji: string;
        name: string;
        color: string;
    };
    tags: string[];
    is_favorite: boolean;
    created_at: string;
}

// Type for creating new entries
export interface CreateEntryInput {
    title?: string;
    content: any;
    content_text: string;
    mood_id?: string;
    mood_intensity?: number;
    prompt_id?: string;
    tags?: string[];
    entry_date?: string;
    is_favorite?: boolean;
}

export interface Attachment {
    id: string;
    entry_id: string;
    user_id: string;
    type: 'image' | 'audio';
    storage_path: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    duration_seconds?: number;
    transcription?: string;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

export interface Insight {
    id: string;
    user_id: string;
    insight_type: 'weekly_summary' | 'mood_trend' | 'themes';
    data: any;
    period_start: string;
    period_end: string;
    created_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    revenue_cat_id: string;
    product_id: string;
    tier: 'free' | 'pro';
    status: 'active' | 'canceled' | 'expired' | 'trial';
    current_period_start?: string;
    current_period_end?: string;
    cancel_at?: string;
    created_at: string;
    updated_at: string;
}