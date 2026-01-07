import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { errorHandler, ErrorSeverity } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

const STORAGE_PREFIX = '@eworld:';

export const storage = {
  async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(STORAGE_PREFIX + key, jsonValue);
    } catch (error) {
      errorHandler.handle({
        message: `Failed to save ${key} to storage`,
        code: 'STORAGE_SET_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_PREFIX + key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      errorHandler.handle({
        message: `Failed to retrieve ${key} from storage`,
        code: 'STORAGE_GET_ERROR',
        severity: ErrorSeverity.LOW,
        originalError: error as Error,
      });
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      errorHandler.handle({
        message: `Failed to remove ${key} from storage`,
        code: 'STORAGE_REMOVE_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      errorHandler.handle({
        message: 'Failed to clear storage',
        code: 'STORAGE_CLEAR_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
    }
  },
};

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_PREFIX + key, value);
    } catch (error) {
      errorHandler.handle({
        message: `Failed to save ${key} to secure storage`,
        code: 'SECURE_STORAGE_SET_ERROR',
        severity: ErrorSeverity.HIGH,
        originalError: error as Error,
      });
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_PREFIX + key);
    } catch (error) {
      errorHandler.handle({
        message: `Failed to retrieve ${key} from secure storage`,
        code: 'SECURE_STORAGE_GET_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_PREFIX + key);
    } catch (error) {
      errorHandler.handle({
        message: `Failed to remove ${key} from secure storage`,
        code: 'SECURE_STORAGE_REMOVE_ERROR',
        severity: ErrorSeverity.MEDIUM,
        originalError: error as Error,
      });
    }
  },
};

// Storage keys
export const StorageKeys = {
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_SYNC: 'last_sync',
  PENDING_ENTRIES: 'pending_entries',
  DRAFT_ENTRY: 'draft_entry',
  THEME: 'theme',
} as const;