import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, font, spacing } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  rightLabel?: string;
  onRightPress?: () => void;
}

export function ScreenHeader({ title, subtitle, accent, rightLabel, onRightPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {!!rightLabel && (
        <TouchableOpacity onPress={onRightPress} style={[styles.rightBtn, { borderColor: accent }]}>
          <Text style={[styles.rightBtnText, { color: accent }]}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.lg },
  accentBar: { width: 28, height: 3, borderRadius: 2, marginBottom: 8 },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  rightBtn: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  rightBtnText: { fontSize: font.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
