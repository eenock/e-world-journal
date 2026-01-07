import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface EntryCardProps {
    entry: {
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
    };
    onPress: () => void;
    onToggleFavorite: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
    entry,
    onPress,
    onToggleFavorite,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    };

    return (
        <Pressable
            style={styles.card}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
            android_ripple={{ color: '#e0e0e0' }}
        >
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    {entry.mood && (
                        <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>
                    )}
                    <Text style={styles.date}>{formatDate(entry.entry_date)}</Text>
                </View>

                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onToggleFavorite();
                    }}
                    hitSlop={8}
                >
                    <Text style={styles.favoriteIcon}>
                        {entry.is_favorite ? '⭐' : '☆'}
                    </Text>
                </Pressable>
            </View>

            {entry.title && (
                <Text style={styles.title} numberOfLines={1}>
                    {entry.title}
                </Text>
            )}

            <Text style={styles.preview} numberOfLines={3}>
                {entry.content_text || 'No content'}
            </Text>

            {entry.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {entry.tags.slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                    {entry.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
                    )}
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moodEmoji: {
        fontSize: 20,
    },
    date: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    favoriteIcon: {
        fontSize: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    preview: {
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
});