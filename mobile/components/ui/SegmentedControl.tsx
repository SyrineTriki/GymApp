import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

interface Props { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void; accent?: string; }

export function SegmentedControl({ options, value, onChange, accent = colors.accent }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, active && { backgroundColor: accent + '22' }]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.text, active && { color: accent }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  text: { fontSize: font.sm, fontWeight: '700', color: colors.textMuted },
});
