import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';
import { colors, font, radius } from '../../constants/theme';

export default function CoachPendingScreen() {
  const router = useRouter();
  async function logout() { await AuthService.logout(); router.replace('/(auth)/login'); }

  return (
    <View style={styles.shell}>
      <View style={styles.card}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>Application under review</Text>
        <Text style={styles.body}>
          Your coach account is pending admin approval.{'\n\n'}
          We'll send you an email once your account is reviewed. This usually takes 1–2 business days.
        </Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDone]}><Text style={styles.stepNum}>✓</Text></View>
            <Text style={styles.stepText}>Account created</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDone]}><Text style={styles.stepNum}>✓</Text></View>
            <Text style={styles.stepText}>Email verified</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepPending]}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.stepText}>Admin approval</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 28, alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  step: { alignItems: 'center', gap: 6 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:    { backgroundColor: colors.success },
  stepPending: { backgroundColor: colors.border, borderWidth: 2, borderColor: colors.warning },
  stepNum:     { color: colors.bg, fontWeight: '700', fontSize: 12 },
  stepText:    { fontSize: 10, color: colors.textMuted, textAlign: 'center', maxWidth: 60 },
  stepLine:    { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4, marginBottom: 16 },

  logoutBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 10, paddingHorizontal: 28,
  },
  logoutText: { color: colors.textMuted, fontSize: font.sm, fontWeight: '600' },
});
