import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
    tags,
    onTagsChange,
    placeholder = 'Add tags (comma separated)...',
}) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleTextChange = (text: string) => {
        setInputValue(text);

        // Auto-add tag on comma
        if (text.endsWith(',')) {
            const newTag = text.slice(0, -1).trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
                setInputValue('');
                Haptics.selectionAsync();
            } else {
                setInputValue('');
            }
        }
    };

    const handleBlur = () => {
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
            onTagsChange([...tags, newTag]);
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Tags (optional)</Text>

            {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                            <Pressable
                                onPress={() => removeTag(tag)}
                                hitSlop={8}
                                style={styles.removeButton}
                            >
                                <Text style={styles.removeIcon}>×</Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            )}

            <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={handleTextChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                placeholderTextColor="#999"
                returnKeyType="done"
            />

            <Text style={styles.hint}>
                Press comma or return to add a tag
            </Text>
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
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingVertical: 6,
        paddingLeft: 12,
        paddingRight: 8,
        borderRadius: 16,
        gap: 4,
    },
    tagText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
    removeButton: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        fontSize: 18,
        color: '#667eea',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1a1a1a',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },
});