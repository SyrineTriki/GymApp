import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../../constants/theme';

interface Props { icon: string; title: string; body?: string; }

export function EmptyState({ icon, title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  icon: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  body: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
