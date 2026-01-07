import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { streamChat, ChatMessage } from '@/lib/groq';
import { useStore } from '@/store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Message extends ChatMessage {
    id: string;
    timestamp: Date;
}

export default function ChatScreen() {
    const { user } = useStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm here to support you through your journaling journey. How are you feeling today?",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const sessionId = useRef(crypto.randomUUID());

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .eq('session_id', sessionId.current)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error loading chat history:', error);
            return;
        }

        if (data && data.length > 0) {
            const loadedMessages: Message[] = data.map((msg) => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at),
            }));
            setMessages(loadedMessages);
        }
    };

    const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
        if (!user) return;

        await supabase.from('chat_messages').insert({
            user_id: user.id,
            session_id: sessionId.current,
            role,
            content,
        });
    };

    const handleSend = async () => {
        if (!inputText.trim() || isStreaming) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Save user message
        await saveChatMessage('user', userMessage.content);

        // Create placeholder for assistant response
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);

        try {
            // Prepare message history (last 10 messages)
            const chatHistory: ChatMessage[] = messages
                .slice(-10)
                .map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

            chatHistory.push({ role: 'user', content: userMessage.content });

            let fullResponse = '';

            await streamChat(
                chatHistory,
                (token) => {
                    fullResponse += token;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: fullResponse }
                                : msg
                        )
                    );
                },
                async () => {
                    setIsStreaming(false);
                    setStreamingMessageId(null);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                    // Save assistant message
                    await saveChatMessage('assistant', fullResponse);
                },
                user!.id
            );
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                        : msg
                )
            );
            setIsStreaming(false);
            setStreamingMessageId(null);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        const isStreaming = item.id === streamingMessageId;

        return (
            <Animated.View
                entering={FadeInUp}
                style={[styles.messageContainer, isUser && styles.userMessageContainer]}
            >
                <View style={[styles.messageBubble, isUser && styles.userBubble]}>
                    <Text style={[styles.messageText, isUser && styles.userText]}>
                        {item.content}
                    </Text>
                    {isStreaming && (
                        <View style={styles.streamingIndicator}>
                            <View style={styles.streamingDot} />
                            <View style={[styles.streamingDot, styles.streamingDotDelay1]} />
                            <View style={[styles.streamingDot, styles.streamingDotDelay2]} />
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>💬 AI Therapist</Text>
                <Text style={styles.headerSubtitle}>
                    A supportive space to explore your thoughts
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    editable={!isStreaming}
                />
                <Pressable
                    style={[styles.sendButton, (!inputText.trim() || isStreaming) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isStreaming}
                >
                    {isStreaming ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 18,
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#667eea',
    },
    messageText: {
        fontSize: 16,
        color: '#1a1a1a',
        lineHeight: 22,
    },
    userText: {
        color: '#fff',
    },
    streamingIndicator: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 8,
    },
    streamingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#999',
        opacity: 0.4,
    },
    streamingDotDelay1: {
        opacity: 0.6,
    },
    streamingDotDelay2: {
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1a1a1a',
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#667eea',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});