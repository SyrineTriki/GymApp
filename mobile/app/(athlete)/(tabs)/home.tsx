import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthService } from '../../../services/auth.service';
import { ClientsService, Link } from '../../../services/clients.service';
import { WorkoutsService, TodayWorkout } from '../../../services/workouts.service';
import { AchievementsService } from '../../../services/achievements.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

export default function AthleteHome() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [coach, setCoach] = useState<Link | null>(null);
  const [today, setToday] = useState<TodayWorkout | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [n, c, t, ach] = await Promise.all([
        AuthService.getName(), ClientsService.myCoach(), WorkoutsService.today(), AchievementsService.list(),
      ]);
      setName(n ?? ''); setCoach(c); setToday(t);
      setBadgeCount(ach.filter(a => a.earned).length);
    } catch { /* soft-fail */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function logout() { await AuthService.logout(); router.replace('/(auth)/login'); }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.teal} colorB={colors.violet} /><Loader accent={colors.teal} /></View>;

  const doneCount = today?.completed_exercise_names.length ?? 0;
  const totalCount = today?.exercises.length ?? 0;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>⚡ GymApp — Athlete</Text>
            <Text style={styles.greeting}>Hey{name ? `, ${name.split(' ')[0]}` : ''} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout}><Feather name="log-out" size={20} color={colors.textMuted} /></TouchableOpacity>
        </View>

        {!coach && (
          <TouchableOpacity onPress={() => router.push('/(athlete)/coach-directory')} activeOpacity={0.85}>
            <GlassCard glowColor={colors.teal} style={styles.alertCard}>
              <Text style={styles.alertText}>🤝 Find a coach to build your training plan</Text>
              <Feather name="chevron-right" size={18} color={colors.teal} />
            </GlassCard>
          </TouchableOpacity>
        )}
        {coach?.status === 'pending' && (
          <GlassCard style={styles.alertCard}>
            <Text style={styles.alertText}>⏳ Waiting for {coach.coach_name} to accept your request</Text>
          </GlassCard>
        )}

        <View style={styles.statsRow}>
          <StatCard icon="🏋️" label="Today" value={`${doneCount}/${totalCount}`} accent={colors.teal} />
          <StatCard icon="🏆" label="Badges" value={String(badgeCount)} accent={colors.amber} />
          <StatCard icon="🤝" label="Coach" value={coach?.status === 'active' ? 'Linked' : '—'} accent={colors.violet} />
        </View>

        <Text style={styles.sectionTitle}>Today's workout</Text>
        {!today?.exercises.length ? (
          <GlassCard><EmptyState icon="🏋️" title="Nothing scheduled today" body={coach ? "Check the Train tab once your coach assigns a plan." : "Connect with a coach to get a personalized program."} /></GlassCard>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(athlete)/(tabs)/workout')} activeOpacity={0.85}>
            <GlassCard glowColor={colors.teal}>
              <Text style={styles.programTitle}>{today.program_title}</Text>
              <Text style={styles.programMeta}>{today.day_label ?? 'Today'} · {totalCount} exercises</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%`, backgroundColor: colors.teal }]} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Quick links</Text>
        <View style={styles.quickGrid}>
          <QuickLink icon="dollar-sign" label="Budget" onPress={() => router.push('/(athlete)/budget')} />
          <QuickLink icon="trending-up" label="Progress" onPress={() => router.push('/(athlete)/progress')} />
          <QuickLink icon="award" label="Achievements" onPress={() => router.push('/(athlete)/achievements')} />
          <QuickLink icon="shopping-bag" label="Marketplace" onPress={() => router.push('/(athlete)/marketplace')} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function QuickLink({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon} size={20} color={colors.teal} />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  brand: { fontSize: font.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  greeting: { fontSize: font.xl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  alertCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, borderColor: 'rgba(45,212,191,0.35)' },
  alertText: { flex: 1, color: colors.text, fontSize: font.sm, fontWeight: '600', marginRight: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 6 },
  programTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  programMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 4, marginBottom: 10 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  quickBtn: { width: '47.5%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', gap: 6 },
  quickLabel: { fontSize: font.xs, color: colors.text, fontWeight: '700' },
});
