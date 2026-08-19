import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ProgressService, ProgressSummary } from '../../services/progress.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { StyledInput } from '../../components/StyledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Loader } from '../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../constants/theme';

export default function ProgressScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try { setSummary(await ProgressService.summary()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function submit() {
    if (!weight && !bodyFat) { Alert.alert('Missing info', 'Enter at least a weight or body fat %.'); return; }
    setSaving(true);
    try {
      await ProgressService.add({ weight_kg: weight ? Number(weight) : undefined, body_fat_pct: bodyFat ? Number(bodyFat) : undefined, notes: notes || undefined });
      setWeight(''); setBodyFat(''); setNotes('');
      load();
    } catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.teal} colorB={colors.violet} /><Loader accent={colors.teal} /></View>;

  const entries = summary?.entries ?? [];
  const weights = entries.map(e => e.weight_kg).filter((w): w is number => w != null);
  const maxW = weights.length ? Math.max(...weights) : 0;
  const minW = weights.length ? Math.min(...weights) : 0;
  const range = Math.max(maxW - minW, 1);

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.summaryRow}>
          <SummaryPill label="Start" value={summary?.starting_weight_kg != null ? `${summary.starting_weight_kg} kg` : '—'} />
          <SummaryPill label="Current" value={summary?.current_weight_kg != null ? `${summary.current_weight_kg} kg` : '—'} accent={colors.teal} />
          <SummaryPill
            label="Change"
            value={summary?.weight_change_kg != null ? `${summary.weight_change_kg > 0 ? '+' : ''}${summary.weight_change_kg} kg` : '—'}
            accent={summary?.weight_change_kg != null && summary.weight_change_kg < 0 ? colors.success : colors.textMuted}
          />
        </View>

        {weights.length > 1 && (
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartRow}>
              {entries.filter(e => e.weight_kg != null).slice(-10).map(e => {
                const h = 10 + ((e.weight_kg! - minW) / range) * 70;
                return <View key={e.id} style={[styles.bar, { height: h, backgroundColor: colors.teal }]} />;
              })}
            </View>
          </GlassCard>
        )}

        <Text style={styles.sectionTitle}>Add check-in</Text>
        <GlassCard style={{ gap: 12, marginBottom: spacing.lg }}>
          <View style={styles.row}>
            <StyledInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" containerStyle={{ flex: 1, marginBottom: 0 }} />
            <StyledInput label="Body fat %" value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" containerStyle={{ flex: 1, marginBottom: 0 }} />
          </View>
          <StyledInput label="Notes (optional)" value={notes} onChangeText={setNotes} containerStyle={{ marginBottom: 0 }} />
          <PrimaryButton label="Save check-in" onPress={submit} loading={saving} style={{ backgroundColor: colors.teal }} />
        </GlassCard>

        <Text style={styles.sectionTitle}>History</Text>
        {entries.length === 0 ? (
          <EmptyState icon="📈" title="No check-ins yet" body="Log your first weight above to start tracking." />
        ) : (
          [...entries].reverse().map(e => (
            <GlassCard key={e.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
              <Text style={styles.historyValue}>{e.weight_kg != null ? `${e.weight_kg} kg` : '—'}</Text>
              <Text style={styles.historyValue}>{e.body_fat_pct != null ? `${e.body_fat_pct}%` : '—'}</Text>
            </GlassCard>
          ))
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function SummaryPill({ label, value, accent = colors.text }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color: accent }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  pill: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  pillValue: { fontSize: font.base, fontWeight: '800' },
  pillLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 },
  chartCard: { marginBottom: spacing.lg },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 },
  bar: { flex: 1, borderRadius: 3, minHeight: 6 },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyDate: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  historyValue: { fontSize: font.sm, color: colors.text, fontWeight: '700' },
});
