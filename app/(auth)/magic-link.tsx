import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function MagicLinkScreen() {
    const router = useRouter();
    const { signInWithMagicLink } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendMagicLink = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await signInWithMagicLink(email);
            setSent(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <Text style={styles.successEmoji}>📧</Text>
                        <Text style={styles.successTitle}>Check Your Email</Text>
                        <Text style={styles.successMessage}>
                            We've sent a magic link to{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>
                        <Text style={styles.instructionText}>
                            Click the link in the email to sign in. The link will expire in 1 hour.
                        </Text>

                        <Pressable
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonText}>Back to Sign In</Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Pressable style={styles.backIcon} onPress={() => router.back()}>
                        <Text style={styles.backIconText}>←</Text>
                    </Pressable>

                    <Text style={styles.emoji}>✨</Text>
                    <Text style={styles.title}>Magic Link Sign In</Text>
                    <Text style={styles.subtitle}>
                        Enter your email and we'll send you a link to sign in
                    </Text>

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
                            autoFocus
                        />

                        <Pressable
                            style={styles.sendButton}
                            onPress={handleSendMagicLink}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#667eea" />
                            ) : (
                                <Text style={styles.sendButtonText}>Send Magic Link</Text>
                            )}
                        </Pressable>
                    </View>

                    <Text style={styles.infoText}>
                        No password needed. Just click the link we send you.
                    </Text>
                </View>
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
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    backIcon: {
        marginBottom: 20,
    },
    backIconText: {
        fontSize: 32,
        color: '#fff',
    },
    emoji: {
        fontSize: 64,
        textAlign: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    form: {
        gap: 12,
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    sendButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    sendButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    successEmoji: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
    },
    successMessage: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 26,
    },
    emailText: {
        fontWeight: '700',
    },
    instructionText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});