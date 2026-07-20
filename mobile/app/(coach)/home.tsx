import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';
import { colors, font, radius } from '../../constants/theme';

export default function CoachHome() {
  const router = useRouter();
  async function logout() { await AuthService.logout(); router.replace('/(auth)/login'); }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Text style={styles.brand}>⚡ GymApp</Text>
        <TouchableOpacity onPress={logout}><Text style={styles.logoutBtn}>Log out</Text></TouchableOpacity>
      </View>

      <Text style={styles.welcome}>🏋️ Coach Dashboard</Text>
      <Text style={styles.sub}>Manage your athletes, programs, and schedule here.</Text>

      {[
        { emoji: '👥', title: 'My Athletes',  desc: 'View and manage your clients' },
        { emoji: '📋', title: 'Programs',     desc: 'Create and assign workout plans' },
        { emoji: '📅', title: 'Schedule',     desc: 'Manage your sessions' },
      ].map(item => (
        <View key={item.title} style={styles.featureCard}>
          <Text style={styles.featureEmoji}>{item.emoji}</Text>
          <View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  brand: { fontSize: font.md, fontWeight: '800', color: colors.text },
  logoutBtn: { fontSize: font.sm, color: colors.accent, fontWeight: '600' },
  welcome: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sub: { fontSize: font.sm, color: colors.textMuted, marginBottom: 28, lineHeight: 20 },
  featureCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 18, flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 12,
  },
  featureEmoji: { fontSize: 28 },
  featureTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  featureDesc: { fontSize: font.sm, color: colors.textMuted },
});
