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
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return false;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }

        return true;
    };

    const handleEmailSignUp = async () => {
        if (!validateForm()) return;

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await signUpWithEmail(email, password, fullName);
            Alert.alert(
                'Success!',
                'Account created successfully. Please check your email to verify your account.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(onboarding)/welcome'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignUp = async () => {
        try {
            await signInWithApple();
            router.replace('/(onboarding)/welcome');
        } catch (error: any) {
            if (!error.message?.includes('canceled')) {
                Alert.alert('Sign Up Failed', error.message);
            }
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await signInWithGoogle();
            router.replace('/(onboarding)/welcome');
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
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
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.emoji}>✨</Text>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your journaling journey</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor="#999"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

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
                            placeholder="Password (min 6 characters)"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Pressable
                            style={styles.signUpButton}
                            onPress={handleEmailSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#667eea" />
                            ) : (
                                <Text style={styles.signUpButtonText}>Create Account</Text>
                            )}
                        </Pressable>

                        <Text style={styles.termsText}>
                            By signing up, you agree to our Terms of Service and Privacy Policy
                        </Text>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {Platform.OS === 'ios' && (
                            <Pressable style={styles.socialButton} onPress={handleAppleSignUp}>
                                <Text style={styles.socialIcon}>🍎</Text>
                                <Text style={styles.socialButtonText}>Sign up with Apple</Text>
                            </Pressable>
                        )}

                        <Pressable style={styles.socialButton} onPress={handleGoogleSignUp}>
                            <Text style={styles.socialIcon}>🔵</Text>
                            <Text style={styles.socialButtonText}>Sign up with Google</Text>
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Pressable onPress={() => router.back()}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </Pressable>
                    </View>
                </ScrollView>
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
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
    signUpButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    signUpButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    termsText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 18,
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
        marginTop: 24,
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