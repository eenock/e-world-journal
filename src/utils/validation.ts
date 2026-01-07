import { z } from 'zod';

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

// Enhanced email validation with Zod
export const emailSchema = z.string().email('Invalid email address');

export const validateEmail = (email: string): boolean => {
    try {
        emailSchema.parse(email);
        return true;
    } catch {
        return false;
    }
};

// Enhanced password validation with requirements
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const validatePassword = (
    password: string
): { isValid: boolean; errors: string[] } => {
    try {
        passwordSchema.parse(password);
        return { isValid: true, errors: [] };
    } catch (error: any) {
        const errors = error.errors?.map((e: any) => e.message) || ['Invalid password'];
        return { isValid: false, errors };
    }
};

export const validateEntryData = (data: {
    title?: string;
    content_text: string;
    tags?: string[];
}): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.content_text || data.content_text.trim().length === 0) {
        errors.push('Content cannot be empty');
    }

    if (data.title && data.title.length > 100) {
        errors.push('Title must be less than 100 characters');
    }

    if (data.tags && data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

// Enhanced entry validation with Zod
export const entrySchema = z.object({
    title: z.string().max(200, 'Title too long').optional(),
    content: z.any(),
    content_text: z.string().min(1, 'Entry cannot be empty'),
    mood_id: z.string().uuid().optional(),
    mood_intensity: z.number().min(1).max(5).optional(),
    tags: z.array(z.string()).max(10, 'Too many tags').optional(),
    entry_date: z.string().optional(),
});

export const validateEntry = (data: any) => {
    return entrySchema.safeParse(data);
};

export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

export const validateTagName = (tag: string): boolean => {
    return tag.length > 0 && tag.length <= 30 && /^[a-zA-Z0-9\s-_]+$/.test(tag);
};