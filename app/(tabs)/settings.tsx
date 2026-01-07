import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Switch,
    Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useStore, selectIsProUser } from '@/store';
import { getOfferings, restorePurchases, isProUser } from '@/lib/revenuecat';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { customerInfo, setCustomerInfo } = useStore();
    const isPro = selectIsProUser(useStore.getState());

    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        checkBiometricAvailability();
        loadSettings();
    }, []);

    const checkBiometricAvailability = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled);
    };

    const loadSettings = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('biometric_enabled, theme_preference')
            .eq('id', user.id)
            .single();

        if (data) {
            setBiometricEnabled(data.biometric_enabled);
            setDarkMode(data.theme_preference === 'dark');
        }
    };

    const toggleBiometric = async () => {
        if (!biometricAvailable) {
            Alert.alert(
                'Biometric Not Available',
                'Please enable Face ID or Touch ID in your device settings.'
            );
            return;
        }

        const newValue = !biometricEnabled;

        if (newValue) {
            // Test biometric authentication
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable biometric lock',
                fallbackLabel: 'Use passcode',
            });

            if (!result.success) {
                Alert.alert('Authentication Failed', 'Please try again.');
                return;
            }
        }

        const { error } = await supabase
            .from('users')
            .update({ biometric_enabled: newValue })
            .eq('id', user!.id);

        if (error) {
            Alert.alert('Error', 'Failed to update setting');
            return;
        }

        setBiometricEnabled(newValue);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const toggleDarkMode = async () => {
        const newValue = !darkMode;
        const theme = newValue ? 'dark' : 'light';

        const { error } = await supabase
            .from('users')
            .update({ theme_preference: theme })
            .eq('id', user!.id);

        if (error) {
            Alert.alert('Error', 'Failed to update theme');
            return;
        }

        setDarkMode(newValue);
        Haptics.selectionAsync();
        // TODO: Implement theme switching
    };

    const handleUpgrade = async () => {
        try {
            const offerings = await getOfferings();
            if (!offerings?.current) {
                Alert.alert('Error', 'No subscription plans available');
                return;
            }

            // Navigate to paywall (we'll create this next)
            router.push('/paywall');
        } catch (error) {
            Alert.alert('Error', 'Failed to load subscription plans');
        }
    };

    const handleRestore = async () => {
        try {
            const info = await restorePurchases();
            setCustomerInfo(info);

            if (isProUser(info)) {
                Alert.alert('Success', 'Your Pro subscription has been restored!');
            } else {
                Alert.alert('No Subscription', 'No active subscription found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases');
        }
    };

    const handleExportData = async () => {
        if (!isPro) {
            Alert.alert(
                'Pro Feature',
                'Data export is available for Pro users. Upgrade to unlock this feature.'
            );
            return;
        }

        Alert.alert(
            'Export Journal Data',
            'This will create a JSON file with all your entries.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export',
                    onPress: async () => {
                        try {
                            const { data: entries } = await supabase
                                .from('entries')
                                .select('*')
                                .eq('user_id', user!.id)
                                .order('entry_date', { ascending: false });

                            const exportData = {
                                exportDate: new Date().toISOString(),
                                entries: entries || [],
                            };

                            const fileName = `reflect-export-${Date.now()}.json`;
                            const fileUri = FileSystem.documentDirectory + fileName;

                            await FileSystem.writeAsStringAsync(
                                fileUri,
                                JSON.stringify(exportData, null, 2)
                            );

                            await Share.share({
                                url: fileUri,
                                message: 'Your Reflect journal data',
                            });

                            Alert.alert('Success', 'Export completed!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to export data');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your journal entries. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete user data (cascades via FK constraints)
                            const { error } = await supabase.auth.admin.deleteUser(user!.id);

                            if (error) throw error;

                            await signOut();
                            Alert.alert('Account Deleted', 'Your account has been deleted.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    const SettingSection = ({ title, children }: any) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const SettingRow = ({
        icon,
        label,
        value,
        onPress,
        showArrow = true,
        rightElement,
    }: any) => (
        <Pressable
            style={styles.settingRow}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{icon}</Text>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {rightElement || (
                    <>
                        {value && <Text style={styles.settingValue}>{value}</Text>}
                        {showArrow && onPress && <Text style={styles.arrow}>›</Text>}
                    </>
                )}
            </View>
        </Pressable>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            {/* Profile Section */}
            <SettingSection title="Profile">
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                            {user?.user_metadata?.full_name || 'User'}
                        </Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
                        {isPro && (
                            <View style={styles.proBadge}>
                                <Text style={styles.proText}>PRO</Text>
                            </View>
                        )}
                    </View>
                </View>
            </SettingSection>

            {/* Subscription */}
            {!isPro && (
                <SettingSection title="Subscription">
                    <Pressable style={styles.upgradeCard} onPress={handleUpgrade}>
                        <Text style={styles.upgradeEmoji}>✨</Text>
                        <View style={styles.upgradeContent}>
                            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                            <Text style={styles.upgradeSubtitle}>
                                Unlimited history, AI insights, export, and more
                            </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </Pressable>
                </SettingSection>
            )}

            {isPro && (
                <SettingSection title="Subscription">
                    <SettingRow
                        icon="⭐"
                        label="Pro Subscription"
                        value="Active"
                        onPress={() => router.push('/paywall')}
                    />
                    <SettingRow
                        icon="🔄"
                        label="Restore Purchases"
                        onPress={handleRestore}
                        showArrow={false}
                    />
                </SettingSection>
            )}

            {/* Security */}
            <SettingSection title="Security & Privacy">
                <SettingRow
                    icon="🔐"
                    label="Biometric Lock"
                    rightElement={
                        <Switch
                            value={biometricEnabled}
                            onValueChange={toggleBiometric}
                            trackColor={{ false: '#ccc', true: '#667eea' }}
                            disabled={!biometricAvailable}
                        />
                    }
                    showArrow={false}
                />
                {!biometricAvailable && (
                    <Text style={styles.helperText}>
                        Enable Face ID or Touch ID in your device settings
                    </Text>
                )}
            </SettingSection>

            {/* Appearance */}
            <SettingSection title="Appearance">
                <SettingRow
                    icon="🌙"
                    label="Dark Mode"
                    rightElement={
                        <Switch
                            value={darkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: '#ccc', true: '#667eea' }}
                        />
                    }
                    showArrow={false}
                />
            </SettingSection>

            {/* Data */}
            <SettingSection title="Data">
                <SettingRow
                    icon="📤"
                    label="Export Data"
                    onPress={handleExportData}
                />
                {!isPro && (
                    <Text style={styles.helperText}>Pro feature: Export as JSON</Text>
                )}
            </SettingSection>

            {/* Support */}
            <SettingSection title="Support">
                <SettingRow
                    icon="💬"
                    label="Help & Feedback"
                    onPress={() => Alert.alert('Help', 'Contact: support@reflect.app')}
                />
                <SettingRow
                    icon="📄"
                    label="Privacy Policy"
                    onPress={() => Alert.alert('Privacy', 'View at reflect.app/privacy')}
                />
                <SettingRow
                    icon="📜"
                    label="Terms of Service"
                    onPress={() => Alert.alert('Terms', 'View at reflect.app/terms')}
                />
            </SettingSection>

            {/* Account Actions */}
            <SettingSection title="Account">
                <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>

                <Pressable
                    style={styles.deleteButton}
                    onPress={handleDeleteAccount}
                >
                    <Text style={styles.deleteText}>Delete Account</Text>
                </Pressable>
            </SettingSection>

            <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    proBadge: {
        backgroundColor: '#ffd700',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    proText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
    },
    upgradeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        padding: 20,
        borderRadius: 16,
        gap: 16,
    },
    upgradeEmoji: {
        fontSize: 32,
    },
    upgradeContent: {
        flex: 1,
    },
    upgradeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    upgradeSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingIcon: {
        fontSize: 20,
    },
    settingLabel: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 15,
        color: '#666',
    },
    arrow: {
        fontSize: 24,
        color: '#ccc',
        fontWeight: '300',
    },
    helperText: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
        marginLeft: 16,
    },
    signOutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
    deleteButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff3b30',
    },
    version: {
        textAlign: 'center',
        fontSize: 13,
        color: '#999',
        marginTop: 24,
    },
});