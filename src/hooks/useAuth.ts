import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { initRevenueCat, getCustomerInfo } from '@/lib/revenuecat';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';

export const useAuth = () => {
    const { user, session, setAuth, setLoading, signOut: clearAuth, setCustomerInfo } = useStore();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session?.user ?? null, session);
            if (session?.user) {
                initializeUser(session.user.id);
            }
        });

        // Listen for auth changes
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

            // Ensure user record exists
            const { error } = await supabase.from('users').upsert({
                id: userId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

            if (error) console.error('Error upserting user:', error);
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) throw error;
        return data;
    };

    const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        setLoading(false);
        if (error) throw error;
        return data;
    };

    const signInWithMagicLink = async (email: string) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: 'reflect://auth/callback',
            },
        });
        setLoading(false);
        if (error) throw error;
        return data;
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
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                // User canceled
                return null;
            }
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        // Note: Requires proper Google OAuth setup in Supabase and Expo config
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'reflect://auth/callback',
            },
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        clearAuth();
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'reflect://auth/reset-password',
        });
        if (error) throw error;
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