import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { Alert } from 'react-native';

export const useEntries = () => {
    const {
        user,
        entries,
        setEntries,
        addEntry,
        updateEntry,
        deleteEntry,
        currentEntry,
        setCurrentEntry,
    } = useStore();

    const loadEntries = useCallback(async () => {
        if (!user) return;

        try {
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
          moods (
            id,
            emoji,
            name,
            color
          )
        `)
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false });

            if (error) throw error;

            const formattedEntries = data.map((entry: any) => ({
                id: entry.id,
                user_id: entry.user_id || user.id,
                title: entry.title,
                content: entry.content || {},
                content_text: entry.content_text,
                mood_id: entry.moods?.id,
                mood: entry.moods,
                mood_intensity: entry.mood_intensity,
                prompt_id: entry.prompt_id,
                tags: entry.tags || [],
                entry_date: entry.entry_date,
                is_favorite: entry.is_favorite,
                created_at: entry.created_at,
                updated_at: entry.updated_at || entry.created_at,
            }));

            setEntries(formattedEntries as any);
        } catch (error) {
            console.error('Error loading entries:', error);
            Alert.alert('Error', 'Failed to load entries');
        }
    }, [user]);

    const loadEntry = useCallback(async (entryId: string) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('entries')
                .select(`
          *,
          moods (
            id,
            name,
            emoji,
            color
          )
        `)
                .eq('id', entryId)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            setCurrentEntry({ ...data, mood: data.moods });
            return data;
        } catch (error) {
            console.error('Error loading entry:', error);
            Alert.alert('Error', 'Failed to load entry');
            return null;
        }
    }, [user]);

    const createEntry = useCallback(async (entryData: any) => {
        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from('entries')
                .insert({
                    ...entryData,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            addEntry(data);

            // Trigger embedding generation
            supabase.functions
                .invoke('generate-embeddings', { body: { entryId: data.id } })
                .catch(console.error);

            return data;
        } catch (error) {
            console.error('Error creating entry:', error);
            Alert.alert('Error', 'Failed to create entry');
            return null;
        }
    }, [user]);

    const updateEntryById = useCallback(async (entryId: string, updates: any) => {
        try {
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

            updateEntry(entryId, data);
            return data;
        } catch (error) {
            console.error('Error updating entry:', error);
            Alert.alert('Error', 'Failed to update entry');
            return null;
        }
    }, []);

    const deleteEntryById = useCallback(async (entryId: string) => {
        try {
            const { error } = await supabase
                .from('entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;

            deleteEntry(entryId);
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
            Alert.alert('Error', 'Failed to delete entry');
            return false;
        }
    }, []);

    const toggleFavorite = useCallback(async (entryId: string, isFavorite: boolean) => {
        try {
            const { error } = await supabase
                .from('entries')
                .update({ is_favorite: !isFavorite })
                .eq('id', entryId);

            if (error) throw error;

            updateEntry(entryId, { is_favorite: !isFavorite });
            return true;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadEntries();
        }
    }, [user]);

    return {
        entries,
        currentEntry,
        loadEntries,
        loadEntry,
        createEntry,
        updateEntry: updateEntryById,
        deleteEntry: deleteEntryById,
        toggleFavorite,
    };
};