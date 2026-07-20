import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, font } from '../constants/theme';

interface Props {
  label: string; onPress: () => void;
  loading?: boolean; disabled?: boolean; style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, (disabled || loading) && styles.btnDisabled, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.45 },
  label: { color: '#fff', fontSize: font.base, fontWeight: '700' },
});