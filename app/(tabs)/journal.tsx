import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore, selectIsProUser } from '@/store';
import { format, isToday, isYesterday } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Entry {
    id: string;
    title?: string;
    content_text?: string;
    entry_date: string;
    mood?: {
        emoji: string;
        name: string;
        color: string;
    };
    tags: string[];
    is_favorite: boolean;
    created_at: string;
}

type FilterType = 'all' | 'favorites' | 'this_week' | 'this_month';

export default function JournalScreen() {
    const router = useRouter();
    const { user, entries, setEntries, customerInfo } = useStore();
    const isPro = selectIsProUser(useStore.getState());

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        loadEntries();
    }, [user, filter]);

    const loadEntries = async () => {
        if (!user) return;

        try {
            let query = supabase
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
            emoji,
            name,
            color
          )
        `)
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false });

            // Apply filters
            if (filter === 'favorites') {
                query = query.eq('is_favorite', true);
            } else if (filter === 'this_week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('entry_date', weekAgo.toISOString().split('T')[0]);
            } else if (filter === 'this_month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                query = query.gte('entry_date', monthAgo.toISOString().split('T')[0]);
            }

            // Free tier: limit to last 30 days
            if (!isPro) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                query = query.gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]);
            }

            const { data, error } = await query;

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
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadEntries();
    }, [filter]);

    const toggleFavorite = async (entry: Entry) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const { error } = await supabase
            .from('entries')
            .update({ is_favorite: !entry.is_favorite })
            .eq('id', entry.id);

        if (error) {
            Alert.alert('Error', 'Failed to update favorite');
            return;
        }

        useStore.getState().updateEntry(entry.id, { is_favorite: !entry.is_favorite });
    };

    const handleEntryPress = (entryId: string) => {
        Haptics.selectionAsync();
        router.push(`/entry/${entryId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    };

    const renderEntry = ({ item, index }: { item: Entry; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50)}>
            <Pressable
                style={styles.entryCard}
                onPress={() => handleEntryPress(item.id)}
                android_ripple={{ color: '#e0e0e0' }}
            >
                <View style={styles.entryHeader}>
                    <View style={styles.entryDateContainer}>
                        {item.mood && (
                            <Text style={styles.moodEmoji}>{item.mood.emoji}</Text>
                        )}
                        <Text style={styles.entryDate}>{formatDate(item.entry_date)}</Text>
                    </View>

                    <Pressable
                        onPress={() => toggleFavorite(item)}
                        hitSlop={8}
                    >
                        <Text style={styles.favoriteIcon}>
                            {item.is_favorite ? '⭐' : '☆'}
                        </Text>
                    </Pressable>
                </View>

                {item.title && (
                    <Text style={styles.entryTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                )}

                <Text style={styles.entryPreview} numberOfLines={3}>
                    {item.content_text || 'No content'}
                </Text>

                {item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                        {item.tags.length > 3 && (
                            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
                        )}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Journal</Text>
            <Text style={styles.headerSubtitle}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>

            <View style={styles.filterContainer}>
                {(['all', 'favorites', 'this_week', 'this_month'] as FilterType[]).map((f) => (
                    <Pressable
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setFilter(f);
                        }}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'All' : f === 'favorites' ? 'Favorites' :
                                f === 'this_week' ? 'Week' : 'Month'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {!isPro && (
                <Pressable
                    style={styles.upgradePrompt}
                    onPress={() => router.push('/settings')}
                >
                    <Text style={styles.upgradeText}>
                        🔒 Upgrade to Pro for unlimited history
                    </Text>
                </Pressable>
            )}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
                Start journaling to see your entries here
            </Text>
            <Pressable
                style={styles.emptyButton}
                onPress={() => router.push('/entry/new')}
            >
                <Text style={styles.emptyButtonText}>Write First Entry</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={entries}
                renderItem={renderEntry}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={!loading ? renderEmpty : null}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#667eea"
                    />
                }
            />

            <Pressable
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/entry/new');
                }}
            >
                <Text style={styles.fabIcon}>+</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContent: {
        paddingBottom: 100,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    filterButtonActive: {
        backgroundColor: '#667eea',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    upgradePrompt: {
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    upgradeText: {
        fontSize: 14,
        color: '#856404',
        fontWeight: '600',
        textAlign: 'center',
    },
    entryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moodEmoji: {
        fontSize: 20,
    },
    entryDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    favoriteIcon: {
        fontSize: 20,
    },
    entryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    entryPreview: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        backgroundColor: '#f0f4ff',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        color: '#667eea',
        fontWeight: '600',
    },
    moreTagsText: {
        fontSize: 12,
        color: '#999',
        alignSelf: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#667eea',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
    },
});