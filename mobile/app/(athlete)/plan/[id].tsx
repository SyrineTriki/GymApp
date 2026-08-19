import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Modal, FlatList, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PlansService, PlanExerciseInput } from '../../../services/plans.service';
import { ExercisesService, ExerciseSummary, imgSrc } from '../../../services/exercises.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

interface DraftExercise extends PlanExerciseInput {
  key: string;             // stable list key (exercise_id isn't unique if added twice... but we keep it simple: 1x each)
  name: string;
  image_filename?: string | null;
}

export default function PlanEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (isNew) return;
    PlansService.get(id).then(plan => {
      setName(plan.name);
      setDescription(plan.description ?? '');
      setExercises(plan.exercises.map(pe => ({
        key: pe.id, exercise_id: pe.exercise.id, name: pe.exercise.name,
        image_filename: pe.exercise.image_filename, sets: pe.sets, reps: pe.reps,
        rest_seconds: pe.rest_seconds ?? undefined, notes: pe.notes ?? undefined,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, isNew]);

  function addExercise(ex: ExerciseSummary) {
    if (exercises.some(e => e.exercise_id === ex.id)) { setPickerOpen(false); return; }
    setExercises(prev => [...prev, {
      key: `${ex.id}-${Date.now()}`, exercise_id: ex.id, name: ex.name,
      image_filename: ex.image_filename, sets: 3, reps: '10',
    }]);
    setPickerOpen(false);
  }

  function removeExercise(key: string) {
    setExercises(prev => prev.filter(e => e.key !== key));
  }

  function updateExercise(key: string, patch: Partial<DraftExercise>) {
    setExercises(prev => prev.map(e => e.key === key ? { ...e, ...patch } : e));
  }

  function move(index: number, dir: -1 | 1) {
    setExercises(prev => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Name required', 'Give your routine a name before saving.'); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: exercises.map(e => ({
        exercise_id: e.exercise_id, sets: e.sets, reps: e.reps,
        rest_seconds: e.rest_seconds, notes: e.notes,
      })),
    };
    try {
      if (isNew) await PlansService.create(payload);
      else await PlansService.update(id, payload);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save this plan.');
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.rose} colorB={colors.amber} /><Loader accent={colors.rose} /></View>;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.rose} colorB={colors.amber} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
            <Text style={styles.headerTitle}>{isNew ? 'New routine' : 'Edit routine'}</Text>
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.nameInput}
            placeholder="Routine name"
            placeholderTextColor={colors.textHint}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textHint}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setPickerOpen(true)}>
              <Feather name="plus" size={14} color={colors.rose} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {!exercises.length && (
            <Text style={styles.emptyText}>No exercises yet. Tap Add to pull from the library.</Text>
          )}

          {exercises.map((e, i) => (
            <View key={e.key} style={styles.exCard}>
              {imgSrc(e.image_filename) ? (
                <Image source={{ uri: imgSrc(e.image_filename) }} style={styles.exThumb} />
              ) : (
                <View style={[styles.exThumb, styles.exThumbFallback]}><Feather name="image" size={16} color={colors.textHint} /></View>
              )}
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.exName} numberOfLines={1}>{e.name}</Text>
                <View style={styles.fieldRow}>
                  <TextInput
                    style={styles.miniInput} keyboardType="numeric" placeholder="Sets"
                    placeholderTextColor={colors.textHint} value={String(e.sets)}
                    onChangeText={v => updateExercise(e.key, { sets: Number(v) || 0 })}
                  />
                  <TextInput
                    style={styles.miniInput} placeholder="Reps"
                    placeholderTextColor={colors.textHint} value={e.reps}
                    onChangeText={v => updateExercise(e.key, { reps: v })}
                  />
                  <TextInput
                    style={styles.miniInput} keyboardType="numeric" placeholder="Rest s"
                    placeholderTextColor={colors.textHint} value={e.rest_seconds ? String(e.rest_seconds) : ''}
                    onChangeText={v => updateExercise(e.key, { rest_seconds: v ? Number(v) : undefined })}
                  />
                </View>
              </View>
              <View style={styles.exActions}>
                <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={8}>
                  <Feather name="chevron-up" size={16} color={i === 0 ? colors.textHint : colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => move(i, 1)} disabled={i === exercises.length - 1} hitSlop={8}>
                  <Feather name="chevron-down" size={16} color={i === exercises.length - 1 ? colors.textHint : colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeExercise(e.key)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercise} />
    </View>
  );
}

function ExercisePickerModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (ex: ExerciseSummary) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const t = setTimeout(() => {
      ExercisesService.list({ q: q || undefined, limit: 40 })
        .then(res => setResults(res.items))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerShell}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Add exercise</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.text} /></TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput} placeholder="Search exercises…" placeholderTextColor={colors.textHint}
            value={q} onChangeText={setQ} autoFocus
          />
        </View>
        {loading ? <Loader accent={colors.rose} /> : (
          <FlatList
            data={results}
            keyExtractor={e => e.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerRow} onPress={() => onPick(item)}>
                {imgSrc(item.image_filename) ? (
                  <Image source={{ uri: imgSrc(item.image_filename) }} style={styles.pickerThumb} />
                ) : (
                  <View style={[styles.pickerThumb, styles.exThumbFallback]}><Feather name="image" size={14} color={colors.textHint} /></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.pickerMeta}>{item.target_muscle} · {item.equipment}</Text>
                </View>
                <Feather name="plus-circle" size={20} color={colors.rose} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  saveText: { fontSize: font.sm, fontWeight: '800', color: colors.rose },
  nameInput: { fontSize: font.md, fontWeight: '700', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8, marginBottom: spacing.sm },
  descInput: { fontSize: font.sm, color: colors.textMuted, minHeight: 40, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.sm, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.rose, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: colors.rose, fontSize: font.xs, fontWeight: '800' },
  emptyText: { color: colors.textHint, fontSize: font.sm, textAlign: 'center', paddingVertical: spacing.xl },
  exCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10, marginBottom: 8,
  },
  exThumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  exThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  exName: { fontSize: font.sm, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  fieldRow: { flexDirection: 'row', gap: 6 },
  miniInput: {
    flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, color: colors.text, fontSize: font.xs, paddingHorizontal: 8, paddingVertical: 6,
  },
  exActions: { alignItems: 'center', gap: 8 },
  pickerShell: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, paddingHorizontal: spacing.lg },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pickerTitle: { fontSize: font.md, fontWeight: '800', color: colors.text },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 44, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.sm },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerThumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  pickerMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
});
