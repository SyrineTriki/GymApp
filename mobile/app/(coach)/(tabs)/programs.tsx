import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ProgramsService, Program } from '../../../services/programs.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, spacing } from '../../../constants/theme';

export default function CoachPrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setPrograms(await ProgramsService.list()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.violet} />
      <View style={styles.content}>
        <ScreenHeader title="Plans" subtitle="Programs you've built" accent={colors.amber} />

        {loading ? <Loader accent={colors.amber} /> : (
          <FlatList
            data={programs}
            keyExtractor={p => p.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.amber} />}
            ListEmptyComponent={<EmptyState icon="📋" title="No programs yet" body="Tap the + button to build your first training plan." />}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/(coach)/program/${item.id}`)}>
                <GlassCard style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>{item.weeks} weeks · {item.exercises.length} exercises</Text>
                    <Text style={styles.meta}>{item.athlete_name ? `Assigned to ${item.athlete_name}` : 'Unassigned template'}</Text>
                  </View>
                  <Badge label={item.athlete_name ? 'Assigned' : 'Template'} tone={item.athlete_name ? 'success' : 'muted'} />
                </GlassCard>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(coach)/program/new')} activeOpacity={0.85}>
          <Feather name="plus" size={24} color="#0a0a0f" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingTop: 56 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  title: { fontSize: font.base, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  fab: {
    position: 'absolute', right: 4, bottom: 100, width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.amber, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});
