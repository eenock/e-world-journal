import Purchases, {
    PurchasesOfferings,
    CustomerInfo,
    PurchasesPackage
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// RevenueCat Public SDK Keys – must be exposed via EXPO_PUBLIC_ prefix
const REVENUECAT_IOS_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_KEY as string | undefined;
const REVENUECAT_ANDROID_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY as string | undefined;

const REVENUECAT_SDK_KEY = Platform.select({
    ios: REVENUECAT_IOS_KEY,
    android: REVENUECAT_ANDROID_KEY,
})!;

if (!REVENUECAT_SDK_KEY) {
    throw new Error('RevenueCat SDK key is missing. Check your app config and environment variables.');
}

export const initRevenueCat = async (userId: string) => {
    if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
        apiKey: REVENUECAT_SDK_KEY,
        appUserID: userId,
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

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
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

export const syncSubscriptionToSupabase = async (customerInfo: CustomerInfo) => {
    const isPro = isProUser(customerInfo);
    const activeEntitlement = customerInfo.entitlements.active['pro'];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // IMPORTANT: Column names must exactly match your Supabase 'subscriptions' table
    // Common variations: user_id vs userId – adjust based on your generated Database types
    await supabase.from('subscriptions').upsert({
        user_id: user.id,                              // ← change to `userId` if your column is camelCase
        revenue_cat_id: customerInfo.originalAppUserId,
        product_id: activeEntitlement?.productIdentifier ?? 'free',
        tier: isPro ? 'pro' : 'free',
        status: isPro ? 'active' : 'expired',           // adjust if your column has different values
        current_period_start: activeEntitlement?.latestPurchaseDate
            ? new Date(activeEntitlement.latestPurchaseDate).toISOString()
            : null,
        current_period_end: activeEntitlement?.expirationDate
            ? new Date(activeEntitlement.expirationDate).toISOString()
            : null,
    }, {
        onConflict: 'user_id',                         // matches constraint in DB (usually user_id)
        ignoreDuplicates: false,
    });
};

export const ENTITLEMENTS = {
    PRO: 'pro',
} as const;

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