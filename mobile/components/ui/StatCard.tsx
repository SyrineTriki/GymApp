import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

interface Props { icon: string; label: string; value: string; accent?: string; }

export function StatCard({ icon, label, value, accent = colors.accent }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, gap: 4 },
  icon: { fontSize: 18, marginBottom: 2 },
  value: { fontSize: font.lg, fontWeight: '800' },
  label: { fontSize: font.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
});
