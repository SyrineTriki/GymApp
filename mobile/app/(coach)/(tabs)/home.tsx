import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthService } from '../../../services/auth.service';
import { ClientsService, Link } from '../../../services/clients.service';
import { SessionsService, TrainingSession } from '../../../services/sessions.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

export default function CoachHome() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [clients, setClients] = useState<Link[]>([]);
  const [pending, setPending] = useState<Link[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [n, active, pend, sess] = await Promise.all([
        AuthService.getName(),
        ClientsService.listClients('active'),
        ClientsService.listClients('pending'),
        SessionsService.list(),
      ]);
      setName(n ?? '');
      setClients(active);
      setPending(pend);
      setSessions(sess.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()).slice(0, 4));
    } catch { /* soft-fail on dashboard */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function logout() { await AuthService.logout(); router.replace('/(auth)/login'); }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.amber} colorB={colors.violet} /><Loader accent={colors.amber} /></View>;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.violet} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.amber} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>⚡ GymApp — Coach</Text>
            <Text style={styles.greeting}>Welcome back{name ? `, ${name.split(' ')[0]}` : ''} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout}><Feather name="log-out" size={20} color={colors.textMuted} /></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="👥" label="Active Clients" value={String(clients.length)} accent={colors.amber} />
          <StatCard icon="📅" label="Upcoming" value={String(sessions.length)} accent={colors.violet} />
          <StatCard icon="⏳" label="Requests" value={String(pending.length)} accent={colors.rose} />
        </View>

        {pending.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(coach)/(tabs)/clients')} activeOpacity={0.85}>
            <GlassCard glowColor={colors.rose} style={styles.alertCard}>
              <Text style={styles.alertText}>🔔 {pending.length} new client request{pending.length > 1 ? 's' : ''} waiting for your response</Text>
              <Feather name="chevron-right" size={18} color={colors.rose} />
            </GlassCard>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Upcoming sessions</Text>
        {sessions.length === 0 ? (
          <GlassCard><EmptyState icon="📅" title="No upcoming sessions" body="Schedule one from the Sessions tab." /></GlassCard>
        ) : (
          sessions.map(s => (
            <GlassCard key={s.id} style={styles.sessionRow}>
              <Avatar name={s.athlete_name ?? '?'} accent={colors.amber} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>{s.title}</Text>
                <Text style={styles.sessionMeta}>{s.athlete_name} · {new Date(s.scheduled_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</Text>
              </View>
              <Badge label={`${s.duration_minutes}m`} tone="accent" accentColor={colors.amber} />
            </GlassCard>
          ))
        )}

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          <QuickAction icon="user-plus" label="Schedule" onPress={() => router.push('/(coach)/session/new')} />
          <QuickAction icon="clipboard" label="New Plan" onPress={() => router.push('/(coach)/program/new')} />
          <QuickAction icon="users" label="Clients" onPress={() => router.push('/(coach)/(tabs)/clients')} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon} size={20} color={colors.amber} />
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  alertCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, borderColor: 'rgba(251,113,133,0.35)' },
  alertText: { flex: 1, color: colors.text, fontSize: font.sm, fontWeight: '600', marginRight: 8 },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 6 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sessionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  sessionMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  quickBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', gap: 6 },
  quickLabel: { fontSize: font.xs, color: colors.text, fontWeight: '700' },
});
