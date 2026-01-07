import { useEffect } from 'react';
import { useStore } from '@/store';
import {
    getCustomerInfo,
    isProUser,
    canAccessFeature,
} from '@/lib/revenuecat';

// Define the allowed feature keys (must match your RevenueCat setup)
type ProFeature =
    | 'unlimited_history'
    | 'ai_insights'
    | 'export'
    | 'themes'
    | 'semantic_search';

export const useSubscription = () => {
    const { customerInfo, setCustomerInfo } = useStore();

    useEffect(() => {
        loadCustomerInfo();
    }, []);

    const loadCustomerInfo = async () => {
        try {
            const info = await getCustomerInfo();
            setCustomerInfo(info);
        } catch (error) {
            console.error('Error loading customer info:', error);
        }
    };

    const isPro = customerInfo ? isProUser(customerInfo) : false;

    const hasFeatureAccess = (feature: ProFeature): boolean => {
        return canAccessFeature(feature, customerInfo);
    };

    return {
        customerInfo,
        isPro,
        hasFeatureAccess,
        refreshCustomerInfo: loadCustomerInfo,
    };
};