import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { NutritionService, NutritionLog } from '../../services/nutrition.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { colors, font, spacing } from '../../constants/theme';

export default function NutritionHistory() {
  const router = useRouter();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setLogs(await NutritionService.listLogs()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const sections = useMemo(() => {
    const byDay: Record<string, NutritionLog[]> = {};
    for (const l of logs) {
      const day = new Date(l.logged_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      (byDay[day] ??= []).push(l);
    }
    return Object.entries(byDay).map(([title, data]) => ({ title, data }));
  }, [logs]);

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition log</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? <Loader accent={colors.teal} /> : (
          <SectionList
            sections={sections}
            keyExtractor={l => l.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={<EmptyState icon="🍽️" title="No entries yet" body="Log meals from the Log Food tab." />}
            renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
            renderItem={({ item }) => (
              <GlassCard style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.food_name}</Text>
                  <Text style={styles.meta}>{item.quantity} {item.unit}{item.calories ? ` · ${item.calories} kcal` : ''}</Text>
                </View>
                <Badge label={item.meal_type} tone="accent" accentColor={colors.teal} />
              </GlassCard>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: font.sm, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
});
