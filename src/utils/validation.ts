export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
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

export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

export const validateTagName = (tag: string): boolean => {
    return tag.length > 0 && tag.length <= 30 && /^[a-zA-Z0-9\s-_]+$/.test(tag);
};