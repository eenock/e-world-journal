import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { env, isDevelopment } from '@/config/env';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  originalError?: Error;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private initialized = false;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  initialize() {
    if (this.initialized) return;

    if (env.analytics.sentryDsn && !isDevelopment) {
      Sentry.init({
        dsn: env.analytics.sentryDsn,
        enableInExpoDevelopment: false,
        debug: isDevelopment,
        tracesSampleRate: 1.0,
      });
    }

    this.initialized = true;
  }

  handle(error: AppError) {
    // Log to console in development
    if (isDevelopment) {
      console.error('[AppError]', {
        message: error.message,
        code: error.code,
        severity: error.severity,
        context: error.context,
        originalError: error.originalError,
      });
    }

    // Send to Sentry
    if (this.initialized && env.analytics.sentryDsn) {
      Sentry.captureException(error.originalError || new Error(error.message), {
        level: this.mapSeverityToSentryLevel(error.severity),
        tags: {
          errorCode: error.code,
        },
        contexts: {
          error: error.context,
        },
      });
    }

    // Show user-friendly alert for critical errors
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  handleApiError(error: any, context?: Record<string, any>) {
    const message = error.message || 'Network request failed';
    const code = error.code || error.status?.toString() || 'UNKNOWN';

    this.handle({
      message,
      code,
      severity: ErrorSeverity.MEDIUM,
      context,
      originalError: error,
    });
  }

  handleAuthError(error: any) {
    this.handle({
      message: error.message || 'Authentication failed',
      code: 'AUTH_ERROR',
      severity: ErrorSeverity.HIGH,
      originalError: error,
    });
  }

  handleStorageError(error: any) {
    this.handle({
      message: 'Failed to access device storage',
      code: 'STORAGE_ERROR',
      severity: ErrorSeverity.MEDIUM,
      originalError: error,
    });
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    const mapping: Record<ErrorSeverity, Sentry.SeverityLevel> = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'fatal',
    };
    return mapping[severity];
  }
}

export const errorHandler = ErrorHandler.getInstance();