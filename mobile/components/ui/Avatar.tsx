import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../../constants/theme';

interface Props { name: string; size?: number; accent?: string; }

export function Avatar({ name, size = 40, accent = colors.accent }: Props) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: accent + '33', borderColor: accent }]}>
      <Text style={[styles.text, { color: accent, fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  text: { fontWeight: '800' },
});
