import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

interface Props { children: React.ReactNode; style?: ViewStyle; glowColor?: string; }

export function GlassCard({ children, style, glowColor }: Props) {
  return (
    <View style={[
      styles.card,
      glowColor ? { shadowColor: glowColor, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 } : null,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
});
