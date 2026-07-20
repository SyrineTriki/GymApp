import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';
import { StyledInput } from '../../components/StyledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, font } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [touched,  setTouched]  = useState({ email: false, password: false });

  const emailError    = touched.email    && !email    ? 'Email is required.'    :
                        touched.email    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email.' : undefined;
  const passwordError = touched.password && !password ? 'Password is required.' : undefined;

  async function submit() {
    setTouched({ email: true, password: true });
    if (!email || !password) return;
    setLoading(true); setError('');
    try {
      const res = await AuthService.login(email, password);
      if (res.role === 'athlete') router.replace('/(athlete)/home');
      else if (res.role === 'coach') router.replace('/(coach)/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      // Coach pending — navigate to pending screen but save partial session
      if (msg.includes('pending')) {
        router.replace('/(coach)/pending');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.brand}>
            <Text style={styles.brandIcon}>⚡</Text>
            <Text style={styles.brandName}>GymApp</Text>
          </View>

          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Log in to your account to continue.</Text>

          <StyledInput label="Email address" placeholder="jane@example.com"
            value={email} onChangeText={setEmail}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            error={emailError} keyboardType="email-address" autoComplete="email"
            containerStyle={styles.field} />

          <StyledInput label="Password" placeholder="Your password"
            value={password} onChangeText={setPassword}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            error={passwordError} isPassword containerStyle={styles.field} />

          {!!error && (
            <View style={styles.alertError}>
              <Text style={styles.alertText}>⚠️ {error}</Text>
            </View>
          )}

          <PrimaryButton label="Log in" onPress={submit} loading={loading} style={styles.submitBtn} />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.switchWrap}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell:      { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },
  card:       { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 28 },
  brand:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  brandIcon:  { fontSize: 20 },
  brandName:  { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  cardTitle:  { fontSize: font.xl, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 6 },
  cardSub:    { fontSize: font.sm, color: colors.textMuted, marginBottom: 24 },
  field:      { marginBottom: 16 },
  alertError: { backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 12, marginBottom: 16 },
  alertText:  { color: colors.error, fontSize: font.sm },
  submitBtn:  { marginTop: 8 },
  switchWrap: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: font.sm, color: colors.textMuted },
  switchLink: { color: colors.accent, fontWeight: '700' },
});
