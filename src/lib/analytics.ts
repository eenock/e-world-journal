import { env, isDevelopment } from '@/config/env';
import posthog from 'posthog-react-native';

class Analytics {
  private static instance: Analytics;
  private posthog: any = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (env.analytics.posthogApiKey && !isDevelopment) {
        this.posthog = await posthog.initAsync(env.analytics.posthogApiKey, {
          host: env.analytics.posthogHost,
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (this.posthog && !isDevelopment) {
      this.posthog.identify(userId, properties);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (isDevelopment) {
      console.log('[Analytics]', event, properties);
      return;
    }

    if (this.posthog) {
      this.posthog.capture(event, properties);
    }
  }

  screen(screenName: string, properties?: Record<string, any>) {
    this.track(`Screen: ${screenName}`, properties);
  }

  reset() {
    if (this.posthog) {
      this.posthog.reset();
    }
  }
}

export const analytics = Analytics.getInstance();

// Event names
export const AnalyticsEvents = {
  // Auth
  SIGN_UP: 'user_sign_up',
  SIGN_IN: 'user_sign_in',
  SIGN_OUT: 'user_sign_out',

  // Entry
  ENTRY_CREATED: 'entry_created',
  ENTRY_UPDATED: 'entry_updated',
  ENTRY_DELETED: 'entry_deleted',
  ENTRY_FAVORITED: 'entry_favorited',

  // Chat
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_SESSION_STARTED: 'chat_session_started',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',

  // Features
  FEATURE_USED: 'feature_used',
  EXPORT_COMPLETED: 'export_completed',
  SEARCH_PERFORMED: 'search_performed',
} as const;