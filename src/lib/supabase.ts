import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';
import { errorHandler, ErrorSeverity } from './error-handler';
import { logger } from './logger';
import { Database } from '@/types/database.types';

interface AppError extends Error {
    code: string;
    severity: ErrorSeverity;
}

if (!env.supabase.url || !env.supabase.anonKey) {
    const message = 'Supabase configuration missing: url or anonKey is undefined';
    const configError = new Error(message) as AppError;
    configError.code = 'SUPABASE_CONFIG_ERROR';
    configError.severity = ErrorSeverity.CRITICAL;
    errorHandler.handle(configError);
    throw configError;
}

const SecureStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            logger.warn('SecureStore getItem failed', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            logger.error('SecureStore setItem failed', error instanceof Error ? error : new Error(String(error)));
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            logger.warn('SecureStore removeItem failed', error instanceof Error ? error : new Error(String(error)));
        }
    },
};

export const supabase = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
    auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
    },
});

export const uploadAttachment = async (
    userId: string,
    file: { uri: string; name: string; type: string }
) => {
    try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const formData = new FormData();
        const rnFile = {
            uri: file.uri,
            name: file.name,
            type: file.type || 'application/octet-stream',
        } as const;

        formData.append('file', rnFile as any);

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, formData, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
            });

        if (error) {
            errorHandler.handleApiError(error);
            throw error;
        }

        // Clean: no 'as any' – use satisfies or explicit type if logger expects one
        logger.info('Attachment uploaded', { fileName, path: data.path } satisfies Record<string, unknown>);
        return data;
    } catch (error) {
        errorHandler.handleStorageError(error);
        throw error;
    }
};

export const getPublicUrl = (path: string): string => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl ?? '';
};

export const deleteAttachment = async (path: string) => {
    try {
        const { error } = await supabase.storage.from('attachments').remove([path]);

        if (error) {
            errorHandler.handleApiError(error);
            throw error;
        }

        logger.info('Attachment deleted', { path } satisfies Record<string, unknown>);
    } catch (error) {
        errorHandler.handleStorageError(error);
        throw error;
    }
};