import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { WorkoutsService, TodayWorkout } from '../../../services/workouts.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

export default function AthleteWorkout() {
  const [data, setData] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [logging, setLogging] = useState<string | null>(null);

  async function load() {
    try { setData(await WorkoutsService.today()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function logExercise(exerciseId: string, name: string, sets: number, reps: string) {
    setLogging(exerciseId);
    try {
      await WorkoutsService.log({
        exercise_name: name, day_label: data?.day_label ?? undefined,
        sets_completed: sets, reps_completed: reps,
        weight_kg: weights[exerciseId] ? Number(weights[exerciseId]) : undefined,
      });
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not log this set.');
    } finally { setLogging(null); }
  }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.teal} colorB={colors.violet} /><Loader accent={colors.teal} /></View>;

  const doneNames = new Set(data?.completed_exercise_names ?? []);

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
      >
        <ScreenHeader title="Train" subtitle={data?.program_title ?? 'No active program'} accent={colors.teal} />

        {!data?.exercises.length ? (
          <GlassCard><EmptyState icon="🏋️" title="No workout scheduled today" body="Your coach hasn't assigned exercises for today, or you don't have an active program yet." /></GlassCard>
        ) : (
          data.exercises.map(ex => {
            const done = ex.id ? doneNames.has(ex.name) : false;
            return (
              <GlassCard key={ex.id} style={[styles.card, done && { borderColor: 'rgba(45,212,191,0.5)' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{ex.name}</Text>
                    <Text style={styles.meta}>{ex.sets} sets × {ex.reps}{ex.rest_seconds ? ` · rest ${ex.rest_seconds}s` : ''}</Text>
                    {!!ex.notes && <Text style={styles.notes}>{ex.notes}</Text>}
                  </View>
                  {done && <Feather name="check-circle" size={22} color={colors.teal} />}
                </View>

                {!done && (
                  <View style={styles.logRow}>
                    <TextInput
                      style={styles.weightInput}
                      placeholder="kg (optional)"
                      placeholderTextColor={colors.textHint}
                      keyboardType="numeric"
                      value={weights[ex.id ?? ''] ?? ''}
                      onChangeText={v => setWeights(w => ({ ...w, [ex.id ?? '']: v }))}
                    />
                    <TouchableOpacity
                      style={styles.logBtn}
                      disabled={logging === ex.id}
                      onPress={() => logExercise(ex.id ?? '', ex.name, ex.sets, ex.reps)}
                    >
                      <Text style={styles.logBtnText}>{logging === ex.id ? 'Logging…' : 'Mark done'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  card: { marginBottom: 10, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: font.base, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 3 },
  notes: { fontSize: font.xs, color: colors.textHint, fontStyle: 'italic', marginTop: 4 },
  logRow: { flexDirection: 'row', gap: 8 },
  weightInput: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: font.sm, paddingHorizontal: 10, paddingVertical: 8 },
  logBtn: { backgroundColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { color: '#0a0a0f', fontWeight: '800', fontSize: font.xs },
});
