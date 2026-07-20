import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, radius, font } from '../constants/theme';

interface Props extends TextInputProps {
  label: string; error?: string; hint?: string;
  containerStyle?: ViewStyle; isPassword?: boolean;
}

export function StyledInput({ label, error, hint, containerStyle, isPassword, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, !!error && styles.inputError, isPassword && styles.inputPadRight]}
          placeholderTextColor={colors.textHint}
          secureTextEntry={isPassword && !show}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputWrap: { position: 'relative' },
  input: { backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, color: colors.text, fontSize: font.base, height: 48, paddingHorizontal: 14 },
  inputError: { borderColor: colors.error },
  inputPadRight: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 16 },
  errorText: { fontSize: 12, color: colors.error, lineHeight: 16 },
  hintText:  { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});