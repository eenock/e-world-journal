import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function SignInScreen() {
    const router = useRouter();
    const { signInWithEmail, signInWithApple, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await signInWithEmail(email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
            router.replace('/(tabs)');
        } catch (error: any) {
            if (!error.message?.includes('canceled')) {
                Alert.alert('Sign In Failed', error.message);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.emoji}>✍️</Text>
                        <Text style={styles.title}>Welcome to Reflect</Text>
                        <Text style={styles.subtitle}>Your private journaling companion</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Pressable
                            style={styles.signInButton}
                            onPress={handleEmailSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#667eea" />
                            ) : (
                                <Text style={styles.signInButtonText}>Sign In</Text>
                            )}
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {Platform.OS === 'ios' && (
                            <Pressable style={styles.socialButton} onPress={handleAppleSignIn}>
                                <Text style={styles.socialIcon}>🍎</Text>
                                <Text style={styles.socialButtonText}>Continue with Apple</Text>
                            </Pressable>
                        )}

                        <Pressable style={styles.socialButton} onPress={handleGoogleSignIn}>
                            <Text style={styles.socialIcon}>🔵</Text>
                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                            <Text style={styles.footerLink}>Sign Up</Text>
                        </Pressable>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
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
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
    },
    emoji: {
        fontSize: 64,
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    form: {
        gap: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    signInButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    signInButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dividerText: {
        color: '#fff',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    socialIcon: {
        fontSize: 20,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: 15,
    },
    footerLink: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});