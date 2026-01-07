import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/revenuecat';
import { useStore } from '@/store';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface Feature {
    icon: string;
    title: string;
    description: string;
    isPro: boolean;
}

const FEATURES: Feature[] = [
    {
        icon: '📚',
        title: 'Unlimited History',
        description: 'Access all your entries, not just the last 30 days',
        isPro: true,
    },
    {
        icon: '📊',
        title: 'AI Insights',
        description: 'Mood trends, theme analysis, and weekly summaries',
        isPro: true,
    },
    {
        icon: '🔍',
        title: 'Semantic Search',
        description: 'Find entries by meaning, not just keywords',
        isPro: true,
    },
    {
        icon: '📤',
        title: 'Export Data',
        description: 'Download your journal as JSON anytime',
        isPro: true,
    },
    {
        icon: '🎨',
        title: 'Custom Themes',
        description: 'Personalize your journaling experience',
        isPro: true,
    },
    {
        icon: '☁️',
        title: 'Cloud Sync',
        description: 'Automatic backup and sync across devices',
        isPro: false,
    },
    {
        icon: '🔒',
        title: 'Privacy First',
        description: 'End-to-end encryption and biometric lock',
        isPro: false,
    },
    {
        icon: '💬',
        title: 'AI Therapist',
        description: 'Unlimited conversations (10/day on free)',
        isPro: true,
    },
];

export default function PaywallScreen() {
    const router = useRouter();
    const { setCustomerInfo } = useStore();

    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await getOfferings();
            if (offerings?.current) {
                setOffering(offerings.current);
                // Select monthly by default
                const monthly = offerings.current.availablePackages.find(
                    (pkg) => pkg.identifier.includes('monthly')
                );
                setSelectedPackage(monthly || offerings.current.availablePackages[0]);
            }
        } catch (error) {
            console.error('Error loading offerings:', error);
            Alert.alert('Error', 'Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        setPurchasing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const customerInfo = await purchasePackage(selectedPackage);
            setCustomerInfo(customerInfo);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                'Welcome to Pro! 🎉',
                'You now have access to all premium features.',
                [
                    {
                        text: 'Start Exploring',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            if (error.userCancelled) {
                // User cancelled, do nothing
                return;
            }

            console.error('Purchase error:', error);
            Alert.alert(
                'Purchase Failed',
                'There was an error processing your purchase. Please try again.'
            );
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        Haptics.selectionAsync();

        try {
            const customerInfo = await restorePurchases();
            setCustomerInfo(customerInfo);

            const hasPro = customerInfo.entitlements.active['pro'] !== undefined;

            if (hasPro) {
                Alert.alert(
                    'Restored!',
                    'Your Pro subscription has been restored.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('No Subscription', 'No active subscription found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases');
        }
    };

    const getPackagePrice = (pkg: PurchasesPackage) => {
        return pkg.product.priceString;
    };

    const getPackagePeriod = (pkg: PurchasesPackage) => {
        if (pkg.identifier.includes('monthly')) return '/month';
        if (pkg.identifier.includes('yearly')) return '/year';
        return '';
    };

    const getSavingsText = (pkg: PurchasesPackage) => {
        if (pkg.identifier.includes('yearly')) {
            return 'Save 40%';
        }
        return null;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <Pressable style={styles.closeButton} onPress={() => router.back()}>
                        <Text style={styles.closeText}>✕</Text>
                    </Pressable>

                    <Text style={styles.badge}>✨ UPGRADE TO PRO</Text>
                    <Text style={styles.headerTitle}>Unlock Your Full{'\n'}Journaling Potential</Text>
                    <Text style={styles.headerSubtitle}>
                        Everything you need for deeper self-reflection
                    </Text>
                </LinearGradient>

                {/* Features Grid */}
                <View style={styles.featuresContainer}>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <Text style={styles.featureEmoji}>{feature.icon}</Text>
                                {feature.isPro && (
                                    <View style={styles.proBadgeSmall}>
                                        <Text style={styles.proBadgeText}>PRO</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Pricing */}
                {offering && (
                    <View style={styles.pricingContainer}>
                        <Text style={styles.pricingTitle}>Choose Your Plan</Text>

                        {offering.availablePackages.map((pkg) => {
                            const isSelected = selectedPackage?.identifier === pkg.identifier;
                            const savings = getSavingsText(pkg);

                            return (
                                <Pressable
                                    key={pkg.identifier}
                                    style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedPackage(pkg);
                                    }}
                                >
                                    {savings && (
                                        <View style={styles.savingsBadge}>
                                            <Text style={styles.savingsText}>{savings}</Text>
                                        </View>
                                    )}

                                    <View style={styles.packageContent}>
                                        <View style={styles.packageLeft}>
                                            <Text style={[styles.packageName, isSelected && styles.packageNameSelected]}>
                                                {pkg.product.title.replace('(Reflect)', '').trim()}
                                            </Text>
                                            <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                                                {getPackagePrice(pkg)}{getPackagePeriod(pkg)}
                                            </Text>
                                        </View>

                                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* Purchase Button */}
                <Pressable
                    style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
                    onPress={handlePurchase}
                    disabled={purchasing || !selectedPackage}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.purchaseGradient}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.purchaseButtonText}>
                                Start Pro Trial
                            </Text>
                        )}
                    </LinearGradient>
                </Pressable>

                {/* Fine Print */}
                <Text style={styles.finePrint}>
                    7-day free trial, then {selectedPackage ? getPackagePrice(selectedPackage) : ''}{selectedPackage ? getPackagePeriod(selectedPackage) : ''}.
                    Cancel anytime.
                </Text>

                {/* Restore */}
                <Pressable onPress={handleRestore}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </Pressable>

                {/* Legal */}
                <View style={styles.legalLinks}>
                    <Pressable onPress={() => Alert.alert('Terms', 'View at reflect.app/terms')}>
                        <Text style={styles.legalText}>Terms</Text>
                    </Pressable>
                    <Text style={styles.legalSeparator}>•</Text>
                    <Pressable onPress={() => Alert.alert('Privacy', 'View at reflect.app/privacy')}>
                        <Text style={styles.legalText}>Privacy</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingBottom: 40,
    },
    headerGradient: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '300',
    },
    badge: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 38,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    featuresContainer: {
        padding: 24,
        gap: 16,
    },
    featureCard: {
        flexDirection: 'row',
        gap: 16,
    },
    featureIcon: {
        position: 'relative',
    },
    featureEmoji: {
        fontSize: 32,
    },
    proBadgeSmall: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#ffd700',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
    },
    proBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#000',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    pricingContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    pricingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
        textAlign: 'center',
    },
    packageCard: {
        position: 'relative',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    packageCardSelected: {
        backgroundColor: '#f0f4ff',
        borderColor: '#667eea',
    },
    savingsBadge: {
        position: 'absolute',
        top: -8,
        right: 16,
        backgroundColor: '#10b981',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    savingsText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
    },
    packageContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageLeft: {
        flex: 1,
    },
    packageName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    packageNameSelected: {
        color: '#667eea',
    },
    packagePrice: {
        fontSize: 15,
        color: '#666',
    },
    packagePriceSelected: {
        color: '#667eea',
        fontWeight: '600',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#667eea',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#667eea',
    },
    purchaseButton: {
        marginHorizontal: 24,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    purchaseButtonDisabled: {
        opacity: 0.6,
    },
    purchaseGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    finePrint: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 40,
    },
    restoreText: {
        fontSize: 15,
        color: '#667eea',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 24,
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    legalText: {
        fontSize: 13,
        color: '#999',
    },
    legalSeparator: {
        fontSize: 13,
        color: '#999',
    },
});