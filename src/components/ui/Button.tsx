import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled,
    icon,
    onPress,
    style,
    ...props
}) => {
    const handlePress = (e: any) => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.(e);
        }
    };

    return (
        <Pressable
            style={[
                styles.button,
                styles[variant],
                styles[size],
                (disabled || loading) && styles.disabled,
                style,
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? '#fff' : '#667eea'}
                />
            ) : (
                <>
                    {icon && <Text style={styles.icon}>{icon}</Text>}
                    <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        gap: 8,
    },
    primary: {
        backgroundColor: '#667eea',
    },
    secondary: {
        backgroundColor: '#f5f5f5',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#667eea',
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    medium: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: '#1a1a1a',
    },
    outlineText: {
        color: '#667eea',
    },
    ghostText: {
        color: '#667eea',
    },
    icon: {
        fontSize: 20,
    },
});