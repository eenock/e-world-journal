import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface Prompt {
    id: string;
    text: string;
    category?: string;
    tier: 'free' | 'pro';
}

export default function HomeScreen() {
    const router = useRouter();
    const { user, todayPrompt, setTodayPrompt, streak } = useStore();
    const [loading, setLoading] = useState(true);
    const [hasWrittenToday, setHasWrittenToday] = useState(false);

    useEffect(() => {
        loadDailyData();
    }, [user]);

    const loadDailyData = async () => {
        if (!user) return;

        try {
            // Check if user wrote today
            const today = new Date().toISOString().split('T')[0];
            const { data: todayEntry } = await supabase
                .from('entries')
                .select('id')
                .eq('user_id', user.id)
                .eq('entry_date', today)
                .single();

            setHasWrittenToday(!!todayEntry);

            // Get streak
            const { data: userData } = await supabase
                .from('users')
                .select('streak_count')
                .eq('id', user.id)
                .single();

            if (userData) {
                useStore.getState().setStreak(userData.streak_count);
            }

            // Get today's prompt (weighted random)
            if (!todayPrompt) {
                await fetchTodayPrompt();
            }
        } catch (error) {
            console.error('Error loading daily data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayPrompt = async () => {
        try {
            const { data: prompts, error } = await supabase
                .from('prompts')
                .select('*')
                .eq('is_active', true)
                .eq('tier', 'free'); // TODO: Add pro prompts for pro users

            if (error) throw error;
            if (!prompts || prompts.length === 0) return;

            // Weighted random selection
            const totalWeight = prompts.reduce((sum, p) => sum + (p.weight || 1), 0);
            let random = Math.random() * totalWeight;

            for (const prompt of prompts) {
                random -= prompt.weight || 1;
                if (random <= 0) {
                    setTodayPrompt(prompt as Prompt);
                    break;
                }
            }
        } catch (error) {
            console.error('Error fetching prompt:', error);
        }
    };

    const handleStartWriting = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
            pathname: '/entry/new',
            params: { promptId: todayPrompt?.id },
        });
    };

    const handleSkipPrompt = async () => {
        Haptics.selectionAsync();
        await fetchTodayPrompt();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header with Streak */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                <Text style={styles.greeting}>
                    {getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
                </Text>

                <View style={styles.streakContainer}>
                    <Text style={styles.streakNumber}>{streak}</Text>
                    <Text style={styles.streakLabel}>day streak 🔥</Text>
                </View>
            </Animated.View>

            {/* Today's Status */}
            {hasWrittenToday && (
                <Animated.View entering={FadeInUp.delay(200)} style={styles.statusCard}>
                    <Text style={styles.statusEmoji}>✅</Text>
                    <Text style={styles.statusText}>You wrote today! Great work.</Text>
                </Animated.View>
            )}

            {/* Daily Prompt Card */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.promptCard}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promptGradient}
                >
                    <Text style={styles.promptLabel}>Today's Prompt</Text>
                    <Text style={styles.promptText}>
                        {todayPrompt?.text || "What's on your mind today?"}
                    </Text>

                    <View style={styles.promptActions}>
                        <Pressable
                            style={styles.skipButton}
                            onPress={handleSkipPrompt}
                        >
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </Pressable>

                        <Pressable
                            style={styles.writeButton}
                            onPress={handleStartWriting}
                        >
                            <Text style={styles.writeButtonText}>Start Writing</Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInUp.delay(400)} style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>

                <Pressable
                    style={styles.actionCard}
                    onPress={() => router.push('/entry/new')}
                >
                    <Text style={styles.actionEmoji}>✍️</Text>
                    <Text style={styles.actionText}>Free Write</Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/journal')}
                >
                    <Text style={styles.actionEmoji}>📖</Text>
                    <Text style={styles.actionText}>Browse Entries</Text>
                </Pressable>

                <Pressable
                    style={styles.actionCard}
                    onPress={() => router.push('/(tabs)/chat')}
                >
                    <Text style={styles.actionEmoji}>💬</Text>
                    <Text style={styles.actionText}>Talk to AI</Text>
                </Pressable>
            </Animated.View>
        </ScrollView>
    );
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
        color: '#666',
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: '#667eea',
    },
    streakLabel: {
        fontSize: 18,
        color: '#666',
    },
    statusCard: {
        backgroundColor: '#d4edda',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusEmoji: {
        fontSize: 24,
    },
    statusText: {
        flex: 1,
        fontSize: 16,
        color: '#155724',
        fontWeight: '600',
    },
    promptCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    promptGradient: {
        padding: 24,
    },
    promptLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    promptText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 20,
        lineHeight: 28,
    },
    promptActions: {
        flexDirection: 'row',
        gap: 12,
    },
    skipButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    writeButton: {
        flex: 2,
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    writeButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '700',
    },
    quickActions: {
        gap: 12,
    },
    quickActionsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    actionEmoji: {
        fontSize: 32,
    },
    actionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
});