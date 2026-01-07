import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Mood Selector Component
 * 
 * Allows users to select their current mood and intensity level.
 * Features:
 * - Horizontal scrollable mood list
 * - Visual feedback on selection
 * - Intensity slider (1-5 dots)
 * - Haptic feedback on interaction
 */

interface Mood {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

interface MoodSelectorProps {
    moods: Mood[];
    selectedMoodId: string | null;
    onSelectMood: (moodId: string) => void;
    intensity?: number;
    onIntensityChange?: (intensity: number) => void;
    showIntensity?: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
    moods,
    selectedMoodId,
    onSelectMood,
    intensity = 3,
    onIntensityChange,
    showIntensity = true,
}) => {
    const handleMoodPress = (moodId: string) => {
        Haptics.selectionAsync();
        onSelectMood(moodId);
    };

    const handleIntensityPress = (level: number) => {
        if (onIntensityChange) {
            Haptics.selectionAsync();
            onIntensityChange(level);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>How are you feeling?</Text>

            {/* Mood List */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.moodScrollView}
                contentContainerStyle={styles.moodList}
            >
                {moods.map((mood) => {
                    const isSelected = selectedMoodId === mood.id;

                    return (
                        <Pressable
                            key={mood.id}
                            style={[
                                styles.moodItem,
                                isSelected && [
                                    styles.moodItemSelected,
                                    { backgroundColor: mood.color + '33' } // 33 = 20% opacity
                                ],
                            ]}
                            onPress={() => handleMoodPress(mood.id)}
                        >
                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                            <Text
                                style={[
                                    styles.moodName,
                                    isSelected && styles.moodNameSelected
                                ]}
                            >
                                {mood.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Intensity Slider */}
            {showIntensity && selectedMoodId && (
                <View style={styles.intensityContainer}>
                    <Text style={styles.intensityLabel}>Intensity</Text>
                    <View style={styles.intensitySlider}>
                        {[1, 2, 3, 4, 5].map((level) => {
                            const isActive = intensity >= level;

                            return (
                                <Pressable
                                    key={level}
                                    style={[
                                        styles.intensityDot,
                                        isActive && styles.intensityDotActive,
                                    ]}
                                    onPress={() => handleIntensityPress(level)}
                                    hitSlop={8}
                                />
                            );
                        })}
                    </View>
                    <View style={styles.intensityLabels}>
                        <Text style={styles.intensityLabelText}>Low</Text>
                        <Text style={styles.intensityLabelText}>High</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    moodScrollView: {
        marginHorizontal: -4,
    },
    moodList: {
        paddingHorizontal: 4,
    },
    moodItem: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        marginRight: 12,
        minWidth: 80,
    },
    moodItemSelected: {
        borderWidth: 2,
        borderColor: '#667eea',
    },
    moodEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    moodName: {
        fontSize: 13,
        color: '#666',
        textTransform: 'capitalize',
        fontWeight: '500',
    },
    moodNameSelected: {
        color: '#667eea',
        fontWeight: '700',
    },
    intensityContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    intensityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    intensitySlider: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    intensityDot: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    intensityDotActive: {
        backgroundColor: '#667eea',
    },
    intensityLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    intensityLabelText: {
        fontSize: 12,
        color: '#999',
    },
});

// Export default for easier importing
export default MoodSelector;