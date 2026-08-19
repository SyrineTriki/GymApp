import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthService } from '../../../services/auth.service';
import { ClientsService, Link } from '../../../services/clients.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { colors, font, radius, spacing } from '../../../constants/theme';

const MENU: { icon: keyof typeof Feather.glyphMap; label: string; path: string }[] = [
  { icon: 'message-circle', label: 'Messages',    path: '/(athlete)/messages' },
  { icon: 'clipboard',      label: 'Nutrition log', path: '/(athlete)/nutrition' },
  { icon: 'dollar-sign',    label: 'Budget optimizer', path: '/(athlete)/budget' },
  { icon: 'trending-up',    label: 'Progress',     path: '/(athlete)/progress' },
  { icon: 'award',          label: 'Achievements', path: '/(athlete)/achievements' },
  { icon: 'shopping-bag',   label: 'Marketplace',  path: '/(athlete)/marketplace' },
];

export default function AthleteProfile() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [coach, setCoach] = useState<Link | null>(null);

  useFocusEffect(useCallback(() => {
    AuthService.getName().then(n => setName(n ?? ''));
    ClientsService.myCoach().then(setCoach).catch(() => {});
  }, []));

  async function logout() { await AuthService.logout(); router.replace('/(auth)/login'); }

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profile}>
          <Avatar name={name || '?'} size={76} accent={colors.teal} />
          <Text style={styles.name}>{name}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(coach ? '/(athlete)/messages' : '/(athlete)/coach-directory')}
        >
          <GlassCard style={styles.coachCard} glowColor={colors.teal}>
            <Feather name="user-check" size={20} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>{coach ? coach.coach_name : 'No coach yet'}</Text>
              <Text style={styles.coachSub}>{coach ? (coach.status === 'active' ? 'Your active coach' : 'Request pending') : 'Tap to find a coach'}</Text>
            </View>
            {coach && <Badge label={coach.status} tone={coach.status === 'active' ? 'success' : 'warning'} />}
          </GlassCard>
        </TouchableOpacity>

        <View style={styles.menu}>
          {MENU.map(item => (
            <TouchableOpacity key={item.path} style={styles.menuRow} onPress={() => router.push(item.path as any)} activeOpacity={0.8}>
              <Feather name={item.icon} size={18} color={colors.teal} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Feather name="log-out" size={16} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  profile: { alignItems: 'center', gap: 10, marginBottom: spacing.lg },
  name: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.lg },
  coachTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  coachSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: font.sm, fontWeight: '600', color: colors.text },
  logoutBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14 },
  logoutText: { color: colors.error, fontSize: font.sm, fontWeight: '700' },
});
