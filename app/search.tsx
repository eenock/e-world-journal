// Fixed search.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { searchEntriesSemantic } from '@/lib/groq';
import { useStore, selectIsProUser } from '@/store';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { debounce } from 'lodash';

interface SearchResult {
    id: string;
    title?: string;
    content_text?: string;
    entry_date: string;
    tags: string[];
    mood?: {
        emoji: string;
        name: string;
    };
    similarity?: number;
}

type SearchMode = 'text' | 'semantic';

export default function SearchScreen() {
    const router = useRouter();
    const { user } = useStore();
    const isPro = selectIsProUser(useStore.getState());

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('text');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        // Load from AsyncStorage or similar
        // For now, just placeholder
        setRecentSearches(['gratitude', 'work', 'family']);
    };

    const performTextSearch = async (searchQuery: string) => {
        if (!user || !searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('entries')
                .select(`
          id,
          title,
          content_text,
          entry_date,
          tags,
          moods (
            emoji,
            name
          )
        `)
                .eq('user_id', user.id)
                .or(`content_text.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
                .order('entry_date', { ascending: false })
                .limit(50);

            if (error) throw error;

            const formattedResults: SearchResult[] = data.map((entry: any) => ({
                id: entry.id,
                title: entry.title,
                content_text: entry.content_text,
                entry_date: entry.entry_date,
                tags: entry.tags || [],
                mood: entry.moods,
            }));

            setResults(formattedResults);
        } catch (error) {
            console.error('Text search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const performSemanticSearch = async (searchQuery: string) => {
        if (!user || !searchQuery.trim()) {
            setResults([]);
            return;
        }

        if (!isPro) {
            return;
        }

        setLoading(true);

        try {
            const semanticResults = await searchEntriesSemantic(searchQuery, user.id, 20);

            const formattedResults: SearchResult[] = semanticResults.map((entry: any) => ({
                id: entry.id,
                title: entry.title,
                content_text: entry.content_text,
                entry_date: entry.entry_date,
                tags: entry.tags || [],
                mood: entry.moods,
                similarity: entry.similarity,
            }));

            setResults(formattedResults);
        } catch (error) {
            console.error('Semantic search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedTextSearch = useCallback(
        debounce((q: string) => performTextSearch(q), 500),
        [user]
    );

    const debouncedSemanticSearch = useCallback(
        debounce((q: string) => performSemanticSearch(q), 800),
        [user, isPro]
    );

    const handleSearch = (text: string) => {
        setQuery(text);

        if (text.trim().length < 2) {
            setResults([]);
            return;
        }

        if (searchMode === 'semantic') {
            debouncedSemanticSearch(text);
        } else {
            debouncedTextSearch(text);
        }
    };

    const handleRecentSearch = (searchText: string) => {
        setQuery(searchText);
        handleSearch(searchText);
    };

    const toggleSearchMode = () => {
        if (!isPro && searchMode === 'text') {
            // Trying to switch to semantic but not pro
            return;
        }

        const newMode = searchMode === 'text' ? 'semantic' : 'text';
        setSearchMode(newMode);
        Haptics.selectionAsync();

        // Re-run search with new mode
        if (query.trim().length >= 2) {
            if (newMode === 'semantic') {
                performSemanticSearch(query);
            } else {
                performTextSearch(query);
            }
        }
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query || searchMode === 'semantic') return text;

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + query.length);
        const after = text.slice(index + query.length);

        return `${before}**${match}**${after}`;
    };

    const renderResult = ({ item, index }: { item: SearchResult; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 30)}>
            <Pressable
                style={styles.resultCard}
                onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/entry/${item.id}`);
                }}
            >
                <View style={styles.resultHeader}>
                    <View style={styles.resultMeta}>
                        {item.mood && (
                            <Text style={styles.resultMood}>{item.mood.emoji}</Text>
                        )}
                        <Text style={styles.resultDate}>
                            {format(new Date(item.entry_date), 'MMM d, yyyy')}
                        </Text>
                    </View>
                    {item.similarity && (
                        <Text style={styles.similarity}>
                            {Math.round(item.similarity * 100)}% match
                        </Text>
                    )}
                </View>

                {item.title && (
                    <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                )}

                <Text style={styles.resultContent} numberOfLines={3}>
                    {item.content_text || 'No content'}
                </Text>

                {item.tags.length > 0 && (
                    <View style={styles.resultTags}>
                        {item.tags.slice(0, 3).map((tag, i) => (
                            <View key={i} style={styles.resultTag}>
                                <Text style={styles.resultTagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );

    const renderEmpty = () => {
        if (loading) return null;

        if (query.trim().length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={styles.emptyTitle}>Search your journal</Text>
                    <Text style={styles.emptySubtitle}>
                        Find entries by keywords, topics, or feelings
                    </Text>

                    {recentSearches.length > 0 && (
                        <View style={styles.recentSearches}>
                            <Text style={styles.recentTitle}>Recent Searches</Text>
                            {recentSearches.map((search, i) => (
                                <Pressable
                                    key={i}
                                    style={styles.recentItem}
                                    onPress={() => handleRecentSearch(search)}
                                >
                                    <Text style={styles.recentIcon}>🕐</Text>
                                    <Text style={styles.recentText}>{search}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>
                    Try different keywords or check your spelling
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>

                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search entries..."
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={handleSearch}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <Pressable
                            onPress={() => {
                                setQuery('');
                                setResults([]);
                            }}
                        >
                            <Text style={styles.clearIcon}>✕</Text>
                        </Pressable>
                    )}
                </View>

                <View style={styles.searchModeContainer}>
                    <Pressable
                        style={[
                            styles.modeButton,
                            searchMode === 'text' && styles.modeButtonActive,
                        ]}
                        onPress={() => searchMode !== 'text' && toggleSearchMode()}
                    >
                        <Text
                            style={[
                                styles.modeText,
                                searchMode === 'text' && styles.modeTextActive,
                            ]}
                        >
                            Text
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.modeButton,
                            searchMode === 'semantic' && styles.modeButtonActive,
                            !isPro && styles.modeButtonDisabled,
                        ]}
                        onPress={() => isPro && searchMode !== 'semantic' && toggleSearchMode()}
                    >
                        <Text
                            style={[
                                styles.modeText,
                                searchMode === 'semantic' && styles.modeTextActive,
                                !isPro && styles.modeTextDisabled,
                            ]}
                        >
                            AI {!isPro && '🔒'}
                        </Text>
                    </Pressable>
                </View>

                {searchMode === 'semantic' && isPro && (
                    <Text style={styles.modeDescription}>
                        Semantic search finds entries by meaning, not just keywords
                    </Text>
                )}
            </View>

            <FlatList
                data={results}
                renderItem={renderResult}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resultsList}
                ListEmptyComponent={renderEmpty}
                ListHeaderComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#667eea" />
                            <Text style={styles.loadingText}>Searching...</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        fontSize: 17,
        color: '#667eea',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    searchIcon: {
        fontSize: 18,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
    },
    clearIcon: {
        fontSize: 18,
        color: '#999',
    },
    searchModeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: '#667eea',
    },
    modeButtonDisabled: {
        opacity: 0.5,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    modeTextActive: {
        color: '#fff',
    },
    modeTextDisabled: {
        color: '#999',
    },
    modeDescription: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    resultsList: {
        padding: 20,
        paddingBottom: 40,
    },
    resultCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    resultMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultMood: {
        fontSize: 18,
    },
    resultDate: {
        fontSize: 13,
        color: '#667eea',
        fontWeight: '600',
    },
    similarity: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
    resultTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    resultContent: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    resultTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12,
    },
    resultTag: {
        backgroundColor: '#f0f4ff',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    resultTagText: {
        fontSize: 11,
        color: '#667eea',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    recentSearches: {
        width: '100%',
        marginTop: 32,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    recentIcon: {
        fontSize: 18,
    },
    recentText: {
        fontSize: 16,
        color: '#1a1a1a',
    },
});