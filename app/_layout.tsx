import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { errorHandler } from '@/lib/error-handler';
import { analytics } from '@/lib/analytics';
import { env, validateEnv } from '@/config/env';
import { logger } from '@/lib/logger';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { user, session } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    const [fontsLoaded] = useFonts({
        // Add custom fonts here if needed
    });

    useEffect(() => {
        // Initialize services
        const initializeApp = async () => {
            try {
                // Validate environment
                const { isValid, errors } = validateEnv();
                if (!isValid) {
                    logger.error('Environment validation failed', new Error(errors.join(', ')));
                }

                // Initialize error handling
                errorHandler.initialize();

                // Initialize analytics
                await analytics.initialize();

                logger.info('App initialized successfully');
            } catch (error) {
                logger.error('App initialization failed', error as Error);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        if (!fontsLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';

        if (!user && !session) {
            // User not authenticated - redirect to auth
            if (!inAuthGroup) {
                router.replace('/(auth)/sign-in');
            }
        } else {
            // User authenticated
            if (inAuthGroup) {
                // Check if user has completed onboarding
                // For now, skip straight to tabs
                router.replace('/(tabs)');
            }
        }
    }, [user, session, segments, fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={styles.container}>
                <Slot />
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});