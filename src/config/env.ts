import Constants from 'expo-constants';

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  revenueCat: {
    ios: string;
    android: string;
  };
  ai: {
    groqApiKey: string;
    openaiApiKey: string;
  };
  analytics: {
    posthogApiKey: string;
    posthogHost: string;
    sentryDsn: string;
  };
  app: {
    env: 'development' | 'staging' | 'production';
    apiTimeout: number;
  };
}

const getEnvVar = (key: string, fallback: string = ''): string => {
  return (
    Constants.expoConfig?.extra?.[key] ||
    process.env[key] ||
    fallback
  );
};

export const env: EnvConfig = {
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'https://oydpgdajkoydptdbcdfa.supabase.co'),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  },
  revenueCat: {
    ios: getEnvVar('EXPO_PUBLIC_REVENUECAT_IOS_KEY', ''),
    android: getEnvVar('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', ''),
  },
  ai: {
    groqApiKey: getEnvVar('EXPO_PUBLIC_GROQ_API_KEY', ''),
    openaiApiKey: getEnvVar('EXPO_PUBLIC_OPENAI_API_KEY', ''),
  },
  analytics: {
    posthogApiKey: getEnvVar('EXPO_PUBLIC_POSTHOG_API_KEY', ''),
    posthogHost: getEnvVar('EXPO_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com'),
    sentryDsn: getEnvVar('EXPO_PUBLIC_SENTRY_DSN', ''),
  },
  app: {
    env: (getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as EnvConfig['app']['env']),
    apiTimeout: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000'), 10),
  },
};

export const isDevelopment = env.app.env === 'development';
export const isProduction = env.app.env === 'production';
export const isStaging = env.app.env === 'staging';

// Validation
export const validateEnv = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!env.supabase.url) errors.push('EXPO_PUBLIC_SUPABASE_URL is required');
  if (!env.supabase.anonKey) errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');

  return {
    isValid: errors.length === 0,
    errors,
  };
};