import React, { useState } from 'react';
import {
    TextInput,
    StyleSheet,
    TextInputProps,
    Platform,
    NativeSyntheticEvent,
    TextInputContentSizeChangeEventData
} from 'react-native';

interface RichEditorProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
}

export const RichEditor = React.forwardRef<TextInput, RichEditorProps>(({
    value,
    onChangeText,
    placeholder = 'Start writing...',
    minHeight = 150,
    maxHeight = 400,
    style,
    ...props
}, ref) => {
    const [inputHeight, setInputHeight] = useState(minHeight);

    // Auto-grow logic: adjusts height based on content size
    const handleContentSizeChange = (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
        const contentHeight = event.nativeEvent.contentSize.height;
        if (contentHeight >= minHeight && contentHeight <= maxHeight) {
            setInputHeight(contentHeight);
        }
    };

    return (
        <TextInput
            ref={ref}
            style={[
                styles.editor,
                { height: inputHeight }, // Dynamic height for production feel
                style
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#A0A0A0"
            multiline
            textAlignVertical="top" // Essential for Android vertical alignment
            onContentSizeChange={handleContentSizeChange}
            scrollEnabled={false} // Let the outer ScrollView handle scrolling
            enablesReturnKeyAutomatically // iOS polish: disables return key if empty
            {...props}
        />
    );
});

const styles = StyleSheet.create({
    editor: {
        fontSize: 16,
        color: '#2D2D2D',
        lineHeight: 24,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12,
        // Use a platform-specific font stack for a native feel
        ...Platform.select({
            ios: { fontFamily: 'System' },
            android: { fontFamily: 'sans-serif' },
        }),
    },
});

export default RichEditor;