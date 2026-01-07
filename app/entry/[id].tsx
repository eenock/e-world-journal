import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

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
    mood?: {
        id: string;
        name: string;
        emoji: string;
        color: string;
    };
}

export default function EntryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, updateEntry, deleteEntry, moods } = useStore();

    const [entry, setEntry] = useState<Entry | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedMoodId, setEditedMoodId] = useState<string | null>(null);
    const [editedMoodIntensity, setEditedMoodIntensity] = useState(3);
    const [editedTags, setEditedTags] = useState<string[]>([]);

    useEffect(() => {
        loadEntry();
    }, [id]);

    const loadEntry = async () => {
        if (!id || !user) return;

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
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            setEntry(data);
            setEditedTitle(data.title || '');
            setEditedContent(data.content_text || '');
            setEditedMoodId(data.mood_id);
            setEditedMoodIntensity(data.mood_intensity || 3);
            setEditedTags(data.tags || []);
        } catch (error) {
            console.error('Error loading entry:', error);
            Alert.alert('Error', 'Failed to load entry');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!entry) return;

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const updates = {
                title: editedTitle.trim() || null,
                content: {
                    type: 'doc',
                    content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: editedContent }]
                    }]
                },
                content_text: editedContent,
                mood_id: editedMoodId,
                mood_intensity: editedMoodId ? editedMoodIntensity : null,
                tags: editedTags,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('entries')
                .update(updates)
                .eq('id', entry.id);

            if (error) throw error;

            updateEntry(entry.id, updates);

            // Update local state
            setEntry({ ...entry, ...updates });
            setIsEditing(false);

            Alert.alert('Success', 'Entry updated successfully');
        } catch (error) {
            console.error('Error updating entry:', error);
            Alert.alert('Error', 'Failed to update entry');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!entry) return;

                        const { error } = await supabase
                            .from('entries')
                            .delete()
                            .eq('id', entry.id);

                        if (error) {
                            Alert.alert('Error', 'Failed to delete entry');
                            return;
                        }

                        deleteEntry(entry.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.back();
                    },
                },
            ]
        );
    };

    const toggleFavorite = async () => {
        if (!entry) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const { error } = await supabase
            .from('entries')
            .update({ is_favorite: !entry.is_favorite })
            .eq('id', entry.id);

        if (error) {
            Alert.alert('Error', 'Failed to update favorite');
            return;
        }

        updateEntry(entry.id, { is_favorite: !entry.is_favorite });
        setEntry({ ...entry, is_favorite: !entry.is_favorite });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!entry) return null;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>

                <View style={styles.headerActions}>
                    {isEditing ? (
                        <>
                            <Pressable
                                onPress={() => setIsEditing(false)}
                                style={styles.headerButton}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                disabled={saving}
                                style={styles.headerButton}
                            >
                                <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable onPress={toggleFavorite} style={styles.headerButton}>
                                <Text style={styles.headerIcon}>
                                    {entry.is_favorite ? '⭐' : '☆'}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setIsEditing(true)}
                                style={styles.headerButton}
                            >
                                <Text style={styles.headerIcon}>✏️</Text>
                            </Pressable>
                            <Pressable onPress={handleDelete} style={styles.headerButton}>
                                <Text style={styles.headerIcon}>🗑️</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Date & Mood Header */}
                <View style={styles.metaContainer}>
                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>
                            {format(new Date(entry.entry_date), 'EEEE, MMMM d, yyyy')}
                        </Text>
                        <Text style={styles.time}>
                            {format(new Date(entry.created_at), 'h:mm a')}
                        </Text>
                    </View>

                    {entry.mood && !isEditing && (
                        <View
                            style={[
                                styles.moodBadge,
                                { backgroundColor: entry.mood.color + '20' }
                            ]}
                        >
                            <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>
                            <Text style={styles.moodName}>{entry.mood.name}</Text>
                            {entry.mood_intensity && (
                                <Text style={styles.moodIntensity}>
                                    {Array(entry.mood_intensity).fill('•').join('')}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Title */}
                {isEditing ? (
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Title (optional)"
                        placeholderTextColor="#999"
                        value={editedTitle}
                        onChangeText={setEditedTitle}
                        maxLength={100}
                    />
                ) : entry.title ? (
                    <Text style={styles.title}>{entry.title}</Text>
                ) : null}

                {/* Content */}
                {isEditing ? (
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Write your thoughts..."
                        placeholderTextColor="#999"
                        value={editedContent}
                        onChangeText={setEditedContent}
                        multiline
                        textAlignVertical="top"
                    />
                ) : (
                    <Text style={styles.contentText}>{entry.content_text}</Text>
                )}

                {/* Mood Selector (Edit Mode) */}
                {isEditing && (
                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>Mood</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {moods.map((mood) => (
                                <Pressable
                                    key={mood.id}
                                    style={[
                                        styles.moodItem,
                                        editedMoodId === mood.id && styles.moodItemSelected,
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setEditedMoodId(mood.id);
                                    }}
                                >
                                    <Text style={styles.moodItemEmoji}>{mood.emoji}</Text>
                                    <Text style={styles.moodItemName}>{mood.name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {editedMoodId && (
                            <View style={styles.intensityContainer}>
                                <Text style={styles.intensityLabel}>Intensity</Text>
                                <View style={styles.intensitySlider}>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <Pressable
                                            key={level}
                                            style={[
                                                styles.intensityDot,
                                                editedMoodIntensity >= level && styles.intensityDotActive,
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEditedMoodIntensity(level);
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Tags */}
                {isEditing ? (
                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>Tags</Text>
                        <TextInput
                            style={styles.tagsInput}
                            placeholder="Comma separated tags..."
                            placeholderTextColor="#999"
                            value={editedTags.join(', ')}
                            onChangeText={(text) => {
                                const newTags = text.split(',').map((t) => t.trim()).filter(Boolean);
                                setEditedTags(newTags);
                            }}
                        />
                    </View>
                ) : entry.tags.length > 0 ? (
                    <View style={styles.tagsContainer}>
                        {entry.tags.map((tag, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backText: {
        fontSize: 17,
        color: '#667eea',
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    headerIcon: {
        fontSize: 20,
    },
    cancelText: {
        fontSize: 17,
        color: '#666',
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#667eea',
    },
    saveTextDisabled: {
        color: '#ccc',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    metaContainer: {
        marginBottom: 20,
    },
    dateContainer: {
        marginBottom: 12,
    },
    date: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    time: {
        fontSize: 14,
        color: '#999',
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
    },
    moodEmoji: {
        fontSize: 20,
    },
    moodName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        textTransform: 'capitalize',
    },
    moodIntensity: {
        fontSize: 12,
        color: '#666',
        letterSpacing: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 16,
        lineHeight: 36,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 16,
        padding: 0,
    },
    contentText: {
        fontSize: 17,
        color: '#333',
        lineHeight: 26,
        marginBottom: 24,
    },
    contentInput: {
        fontSize: 17,
        color: '#333',
        lineHeight: 26,
        minHeight: 200,
        padding: 0,
        marginBottom: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    tag: {
        backgroundColor: '#f0f4ff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 13,
        color: '#667eea',
        fontWeight: '600',
    },
    editSection: {
        marginBottom: 24,
    },
    editSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    moodItem: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        marginRight: 12,
    },
    moodItemSelected: {
        backgroundColor: '#667eea',
    },
    moodItemEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    moodItemName: {
        fontSize: 12,
        color: '#666',
    },
    intensityContainer: {
        marginTop: 16,
    },
    intensityLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    intensitySlider: {
        flexDirection: 'row',
        gap: 8,
    },
    intensityDot: {
        width: 40,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    intensityDotActive: {
        backgroundColor: '#667eea',
    },
    tagsInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1a1a1a',
    },
});