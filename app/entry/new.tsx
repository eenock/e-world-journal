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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';

interface Mood {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

export default function NewEntryScreen() {
    const router = useRouter();
    const { promptId } = useLocalSearchParams();
    const { user, addEntry, addPendingEntry, moods, setMoods } = useStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [moodIntensity, setMoodIntensity] = useState(3);
    const [tags, setTags] = useState<string[]>([]);
    const [prompt, setPrompt] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMoods();
        if (promptId) {
            loadPrompt();
        }
    }, []);

    const loadMoods = async () => {
        if (moods.length > 0) return;

        const { data, error } = await supabase.from('moods').select('*');
        if (error) {
            console.error('Error loading moods:', error);
            return;
        }
        setMoods(data || []);
    };

    const loadPrompt = async () => {
        const { data } = await supabase
            .from('prompts')
            .select('text')
            .eq('id', promptId)
            .single();

        if (data) {
            setPrompt(data.text);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Empty Entry', 'Please write something before saving.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const netState = await NetInfo.fetch();
            const isOnline = netState.isConnected && netState.isInternetReachable;

            const entryData = {
                id: `${Date.now()}-${Math.random()}`,
                user_id: user!.id,
                title: title.trim() || undefined,
                content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
                content_text: content,
                mood_id: selectedMood || undefined,
                mood_intensity: selectedMood ? moodIntensity : undefined,
                prompt_id: (promptId as string) || undefined,
                tags,
                entry_date: new Date().toISOString().split('T')[0],
                is_favorite: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            if (isOnline) {
                // Save to Supabase
                const { data, error } = await supabase
                    .from('entries')
                    .insert(entryData)
                    .select()
                    .single();

                if (error) throw error;

                addEntry(data);

                // Trigger embedding generation (fire and forget)
                supabase.functions.invoke('generate-embeddings', {
                    body: { entryId: data.id },
                }).catch(console.error);

                Alert.alert('Success', 'Your entry has been saved!');
            } else {
                // Save locally for offline sync
                addPendingEntry(entryData as any);
                Alert.alert('Saved Offline', 'Your entry will sync when you're back online.');
      }

            router.back();
        } catch (error) {
            console.error('Error saving entry:', error);
            Alert.alert('Error', 'Failed to save entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {/* Prompt Display */}
                {prompt && (
                    <View style={styles.promptBanner}>
                        <Text style={styles.promptBannerText}>{prompt}</Text>
                    </View>
                )}

                {/* Title Input */}
                <TextInput
                    style={styles.titleInput}
                    placeholder="Title (optional)"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                {/* Content Editor */}
                <TextInput
                    style={styles.contentInput}
                    placeholder="Start writing..."
                    placeholderTextColor="#999"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                />

                {/* Mood Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How are you feeling?</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodList}>
                        {moods.map((mood) => (
                            <Pressable
                                key={mood.id}
                                style={[
                                    styles.moodItem,
                                    selectedMood === mood.id && styles.moodItemSelected,
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedMood(mood.id);
                                }}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={styles.moodName}>{mood.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Intensity Slider */}
                    {selectedMood && (
                        <View style={styles.intensityContainer}>
                            <Text style={styles.intensityLabel}>Intensity</Text>
                            <View style={styles.intensitySlider}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <Pressable
                                        key={level}
                                        style={[
                                            styles.intensityDot,
                                            moodIntensity >= level && styles.intensityDotActive,
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setMoodIntensity(level);
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Tags Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tags (optional)</Text>
                    <TextInput
                        style={styles.tagsInput}
                        placeholder="Add tags separated by commas..."
                        placeholderTextColor="#999"
                        value={tags.join(', ')}
                        onChangeText={(text) => {
                            const newTags = text.split(',').map((t) => t.trim()).filter(Boolean);
                            setTags(newTags);
                        }}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
    promptBanner: {
        backgroundColor: '#f0f4ff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    promptBannerText: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '500',
        lineHeight: 22,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
        padding: 0,
    },
    contentInput: {
        fontSize: 17,
        color: '#1a1a1a',
        lineHeight: 26,
        minHeight: 200,
        padding: 0,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    moodList: {
        flexDirection: 'row',
        gap: 12,
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
    moodEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    moodName: {
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