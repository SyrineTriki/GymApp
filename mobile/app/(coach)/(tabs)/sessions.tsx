import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SessionsService, TrainingSession } from '../../../services/sessions.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

const TONE: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
  scheduled: 'warning', completed: 'success', cancelled: 'error',
};

export default function CoachSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await SessionsService.list();
      data.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      setSessions(data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.violet} />
      <View style={styles.content}>
        <ScreenHeader title="Sessions" subtitle="Your training schedule" accent={colors.amber} />

        {loading ? <Loader accent={colors.amber} /> : (
          <FlatList
            data={sessions}
            keyExtractor={s => s.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.amber} />}
            ListEmptyComponent={<EmptyState icon="📅" title="No sessions yet" body="Tap the + button to schedule your first session." />}
            renderItem={({ item }) => (
              <GlassCard style={styles.row}>
                <Avatar name={item.athlete_name ?? '?'} accent={colors.amber} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>{item.athlete_name}</Text>
                  <Text style={styles.meta}>{new Date(item.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {item.duration_minutes}m{item.location ? ` · ${item.location}` : ''}</Text>
                </View>
                <Badge label={item.status} tone={TONE[item.status]} />
              </GlassCard>
            )}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(coach)/session/new')} activeOpacity={0.85}>
          <Feather name="plus" size={24} color="#0a0a0f" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingTop: 56 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  title: { fontSize: font.base, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  fab: {
    position: 'absolute', right: 4, bottom: 100, width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.amber, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});
