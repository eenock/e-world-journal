import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    emoji: string;
    title: string;
    description: string;
    gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
    {
        emoji: '✍️',
        title: 'Welcome to Reflect',
        description: 'Your private space for daily reflection, growth, and self-discovery.',
        gradient: ['#667eea', '#764ba2'],
    },
    {
        emoji: '🎯',
        title: 'Daily Prompts',
        description: 'Get inspired with thoughtful prompts designed to spark meaningful reflection.',
        gradient: ['#f093fb', '#f5576c'],
    },
    {
        emoji: '💬',
        title: 'AI Companion',
        description: 'Chat with your AI therapist that understands your journey and provides supportive guidance.',
        gradient: ['#4facfe', '#00f2fe'],
    },
    {
        emoji: '📊',
        title: 'Track Your Growth',
        description: 'See your emotional patterns, mood trends, and progress over time.',
        gradient: ['#43e97b', '#38f9d7'],
    },
    {
        emoji: '🔒',
        title: 'Private & Secure',
        description: 'Your thoughts are encrypted and protected. Optional biometric lock for extra security.',
        gradient: ['#fa709a', '#fee140'],
    },
];

export default function WelcomeScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleGetStarted();
        }
    };

    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.replace('/(onboarding)/biometric');
    };

    const handleSkip = () => {
        Haptics.selectionAsync();
        router.replace('/(tabs)');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
        <View style={styles.slide}>
            <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.slideGradient}
            >
                <Animated.View entering={FadeInUp.delay(200)} style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)} style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </LinearGradient>
        </View>
    );

    return (
        <View style={styles.container}>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                scrollEventThrottle={16}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Next Button */}
                <Pressable
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <LinearGradient
                        colors={SLIDES[currentIndex].gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextGradient}
                    >
                        <Text style={styles.nextText}>
                            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    slide: {
        width,
        flex: 1,
    },
    slideGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        marginBottom: 40,
    },
    emoji: {
        fontSize: 120,
        textAlign: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 38,
    },
    description: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 60,
        gap: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    dotActive: {
        width: 24,
        backgroundColor: '#667eea',
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    nextGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});