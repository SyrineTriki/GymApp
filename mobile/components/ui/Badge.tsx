import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

interface Props { label: string; tone?: 'success' | 'warning' | 'error' | 'muted' | 'accent'; accentColor?: string; }

export function Badge({ label, tone = 'muted', accentColor }: Props) {
  const map = {
    success: { bg: 'rgba(74,222,128,0.14)', fg: colors.success },
    warning: { bg: 'rgba(250,204,21,0.14)', fg: colors.warning },
    error:   { bg: 'rgba(248,113,113,0.14)', fg: colors.error },
    muted:   { bg: colors.surface2, fg: colors.textMuted },
    accent:  { bg: (accentColor ?? colors.accent) + '22', fg: accentColor ?? colors.accent },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={[styles.text, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: font.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
