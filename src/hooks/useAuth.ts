// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { initRevenueCat, getCustomerInfo } from '@/lib/revenuecat';
import * as AppleAuthentication from 'expo-apple-authentication';
import { analytics, AnalyticsEvents } from '@/lib/analytics';
import { errorHandler } from '@/lib/error-handler';

export const useAuth = () => {
    const { user, session, setAuth, setLoading, signOut: clearAuth, setCustomerInfo } = useStore();

    useEffect(() => {
        // Load initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session?.user ?? null, session);
            if (session?.user) {
                initializeUser(session.user.id);
            }
        });

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setAuth(session?.user ?? null, session);
                if (session?.user) {
                    initializeUser(session.user.id);
                } else {
                    setCustomerInfo(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const initializeUser = async (userId: string) => {
        try {
            // Initialize RevenueCat
            await initRevenueCat(userId);
            const customerInfo = await getCustomerInfo();
            setCustomerInfo(customerInfo);

            // Make sure user record exists in Supabase
            const { error } = await supabase.from('users').upsert(
                {
                    id: userId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
            );

            if (error) {
                console.error('Error upserting user record:', error);
            }
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            analytics.track(AnalyticsEvents.SIGN_IN, { method: 'email' });
            return data;
        } catch (error) {
            errorHandler.handleAuthError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });
            if (error) throw error;
            analytics.track(AnalyticsEvents.SIGN_UP, { method: 'email' });
            return data;
        } catch (error) {
            errorHandler.handleAuthError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithMagicLink = async (email: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: 'reflect://auth/callback',
                },
            });
            if (error) throw error;
            return data;
        } finally {
            setLoading(false);
        }
    };

    const signInWithApple = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                if (error) throw error;
                return data;
            }
            return null;
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                // User cancelled → no error
                return null;
            }
            console.error('Apple sign-in error:', error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'reflect://auth/callback',
                },
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            analytics.track(AnalyticsEvents.SIGN_OUT);
            analytics.reset();
            clearAuth();
        } catch (error) {
            errorHandler.handleAuthError(error);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'reflect://auth/reset-password',
            });
            if (error) throw error;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    return {
        user,
        session,
        isAuthenticated: !!user,
        signInWithEmail,
        signUpWithEmail,
        signInWithMagicLink,
        signInWithApple,
        signInWithGoogle,
        signOut,
        resetPassword,
    };
};