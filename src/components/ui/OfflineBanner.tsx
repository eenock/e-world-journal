import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.banner}>
      <Text style={styles.emoji}>📡</Text>
      <Text style={styles.text}>You're offline. Changes will sync when connected.</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});