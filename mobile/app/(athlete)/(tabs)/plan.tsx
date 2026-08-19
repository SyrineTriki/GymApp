import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PlansService, PlanSummary } from '../../../services/plans.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, spacing } from '../../../constants/theme';

export default function PlanList() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setPlans(await PlansService.list()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function confirmDelete(plan: PlanSummary) {
    Alert.alert('Delete plan', `Delete "${plan.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await PlansService.remove(plan.id); load(); }
        catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete this plan.'); }
      } },
    ]);
  }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.rose} colorB={colors.amber} /><Loader accent={colors.rose} /></View>;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.rose} colorB={colors.amber} />
      <View style={styles.content}>
        <ScreenHeader
          title="Plans" subtitle={`${plans.length} routine${plans.length === 1 ? '' : 's'}`}
          accent={colors.rose} rightLabel="+ New" onRightPress={() => router.push('/(athlete)/plan/new')}
        />

        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.rose} />}
          ListEmptyComponent={<GlassCard><EmptyState icon="📋" title="No routines yet" body="Build a routine from the exercise library and it'll show up here." /></GlassCard>}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/(athlete)/plan/${item.id}`)}>
              <GlassCard style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.description && <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>}
                  <Text style={styles.meta}>{item.exercise_count} exercise{item.exercise_count === 1 ? '' : 's'}</Text>
                </View>
                <TouchableOpacity hitSlop={10} onPress={() => confirmDelete(item)}>
                  <Feather name="trash-2" size={18} color={colors.textHint} />
                </TouchableOpacity>
              </GlassCard>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingTop: 56 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  name: { fontSize: font.base, fontWeight: '700', color: colors.text },
  desc: { fontSize: font.xs, color: colors.textMuted, marginTop: 3 },
  meta: { fontSize: 11, color: colors.textHint, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
});
