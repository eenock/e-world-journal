import Purchases, {
    PurchasesOfferings,
    CustomerInfo,
    PurchasesPackage
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// RevenueCat Public SDK Keys (get from RevenueCat Dashboard → Project Settings → API Keys)
const REVENUECAT_SDK_KEY = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
})!;

export const initRevenueCat = async (userId: string) => {
    // Enable debug logs in development
    if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with your public SDK key
    await Purchases.configure({
        apiKey: REVENUECAT_SDK_KEY,
        appUserID: userId, // Link RevenueCat user to your Supabase user
    });
};

export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
    try {
        return await Purchases.getOfferings();
    } catch (error) {
        console.error('Error fetching offerings:', error);
        return null;
    }
};

export const purchasePackage = async (
    pkg: PurchasesPackage
): Promise<CustomerInfo> => {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    await syncSubscriptionToSupabase(customerInfo);
    return customerInfo;
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
    const customerInfo = await Purchases.restorePurchases();
    await syncSubscriptionToSupabase(customerInfo);
    return customerInfo;
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
    return await Purchases.getCustomerInfo();
};

export const isProUser = (customerInfo: CustomerInfo): boolean => {
    return customerInfo.entitlements.active['pro'] !== undefined;
};

export const syncSubscriptionToSupabase = async (
    customerInfo: CustomerInfo
) => {
    const isPro = isProUser(customerInfo);
    const activeEntitlement = customerInfo.entitlements.active['pro'];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('subscriptions').upsert({
        user_id: user.id,
        revenue_cat_id: customerInfo.originalAppUserId,
        product_id: activeEntitlement?.productIdentifier || 'free',
        tier: isPro ? 'pro' : 'free',
        status: isPro ? 'active' : 'expired',
        current_period_start: activeEntitlement?.latestPurchaseDate
            ? new Date(activeEntitlement.latestPurchaseDate).toISOString()
            : null,
        current_period_end: activeEntitlement?.expirationDate
            ? new Date(activeEntitlement.expirationDate).toISOString()
            : null,
    });
};

// Entitlement IDs (configure in RevenueCat dashboard)
export const ENTITLEMENTS = {
    PRO: 'pro',
} as const;

// Feature gates
export const canAccessFeature = (
    feature: 'unlimited_history' | 'ai_insights' | 'export' | 'themes',
    customerInfo: CustomerInfo | null
): boolean => {
    if (!customerInfo) return false;

    const isPro = isProUser(customerInfo);

    const featureMap = {
        unlimited_history: isPro,
        ai_insights: isPro,
        export: isPro,
        themes: isPro,
    };

    return featureMap[feature];
};