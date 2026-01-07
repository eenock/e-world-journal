import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function MoodSetupScreen() {
    const router = useRouter();
    const { moods, setMoods } = useStore();

    useEffect(() => {
        loadMoods();
    }, []);

    const loadMoods = async () => {
        const { data, error } = await supabase.from('moods').select('*');

        if (error) {
            console.error('Error loading moods:', error);
            return;
        }

        setMoods(data || []);
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
                        <Text style={styles.emoji}>😊</Text>
                        <Text style={styles.title}>Track Your Emotions</Text>
                        <Text style={styles.description}>
                            Every entry can include your mood. Here's what you can track:
                        </Text>
                    </Animated.View>

                    <View style={styles.moodsGrid}>
                        {moods.map((mood, index) => (
                            <Animated.View
                                key={mood.id}
                                entering={FadeInDown.delay(300 + index * 50)}
                                style={[
                                    styles.moodCard,
                                    { backgroundColor: mood.color + '20' },
                                ]}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={styles.moodName}>{mood.name}</Text>
                            </Animated.View>
                        ))}
                    </View>

                    <Animated.View entering={FadeInDown.delay(800)} style={styles.infoBox}>
                        <Text style={styles.infoEmoji}>💡</Text>
                        <Text style={styles.infoText}>
                            Track your moods over time to understand patterns and gain insights into your emotional well-being.
                        </Text>
                    </Animated.View>

                    <Pressable style={styles.continueButton} onPress={handleContinue}>
                        <View style={styles.continueButtonContent}>
                            <Text style={styles.continueButtonText}>Start Journaling</Text>
                        </View>
                    </Pressable>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        lineHeight: 26,
    },
    moodsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    moodCard: {
        width: '47%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        gap: 8,
    },
    moodEmoji: {
        fontSize: 40,
    },
    moodName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'capitalize',
    },
    infoBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    infoEmoji: {
        fontSize: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        lineHeight: 22,
    },
    continueButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    continueButtonContent: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#667eea',
    },
});