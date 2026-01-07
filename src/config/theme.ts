export const theme = {
    colors: {
        primary: '#667eea',
        primaryDark: '#5568d3',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#1a1a1a',
        textSecondary: '#666666',
        textTertiary: '#999999',
        border: '#e0e0e0',
        placeholder: '#999999',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },

    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        round: 999,
    },

    fontSize: {
        xs: 11,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
        huge: 32,
    },

    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },

    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
        },
    },

    gradients: {
        primary: ['#667eea', '#764ba2'],
        success: ['#10b981', '#059669'],
        sunset: ['#f093fb', '#f5576c'],
        ocean: ['#4facfe', '#00f2fe'],
        forest: ['#43e97b', '#38f9d7'],
    },
} as const;

export type Theme = typeof theme;