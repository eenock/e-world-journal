import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
    label: string;
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'small' | 'medium' | 'large';
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'primary',
    size = 'medium',
    style,
    ...props
}) => {
    return (
        <View
            style={[styles.badge, styles[variant], styles[size], style]}
            {...props}
        >
            <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    primary: {
        backgroundColor: '#f0f4ff',
    },
    success: {
        backgroundColor: '#d1fae5',
    },
    warning: {
        backgroundColor: '#fef3c7',
    },
    error: {
        backgroundColor: '#fee2e2',
    },
    neutral: {
        backgroundColor: '#f5f5f5',
    },
    small: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    medium: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    large: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    text: {
        fontWeight: '600',
    },
    primaryText: {
        color: '#667eea',
    },
    successText: {
        color: '#059669',
    },
    warningText: {
        color: '#d97706',
    },
    errorText: {
        color: '#dc2626',
    },
    neutralText: {
        color: '#666',
    },
    smallText: {
        fontSize: 10,
    },
    mediumText: {
        fontSize: 12,
    },
    largeText: {
        fontSize: 14,
    },
});