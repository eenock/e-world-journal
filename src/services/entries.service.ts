import { supabase } from '@/lib/supabase';

export const entriesService = {
    async getAll(userId: string) {
        const { data, error } = await supabase
            .from('entries')
            .select(`
        id,
        title,
        content_text,
        entry_date,
        tags,
        is_favorite,
        created_at,
        moods (id, emoji, name, color)
        `)
            .eq('user_id', userId)
            .order('entry_date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(entryId: string, userId: string) {
        const { data, error } = await supabase
            .from('entries')
            .select(`*, moods (id, name, emoji, color)`)
            .eq('id', entryId)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async create(userId: string, entryData: any) {
        const { data, error } = await supabase
            .from('entries')
            .insert({
                ...entryData,
                user_id: userId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(entryId: string, updates: any) {
        const { data, error } = await supabase
            .from('entries')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', entryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(entryId: string) {
        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', entryId);

        if (error) throw error;
    },

    async search(userId: string, query: string) {
        const { data, error } = await supabase
            .from('entries')
            .select(`
        id,
        title,
        content_text,
        entry_date,
        tags,
        moods (emoji, name)
      `)
            .eq('user_id', userId)
            .or(`content_text.ilike.%${query}%,title.ilike.%${query}%`)
            .order('entry_date', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    },

    async getByDateRange(userId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .gte('entry_date', startDate)
            .lte('entry_date', endDate)
            .order('entry_date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getFavorites(userId: string) {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .eq('is_favorite', true)
            .order('entry_date', { ascending: false });

        if (error) throw error;
        return data;
    },
};