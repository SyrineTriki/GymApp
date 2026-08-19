import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ClientsService, Link } from '../services/clients.service';
import { ProgramsService, Program, ProgramExercise } from '../services/programs.service';
import { StyledInput } from './StyledInput';
import { PrimaryButton } from './PrimaryButton';
import { PickerField } from './ui/PickerField';
import { colors, font, radius, spacing } from '../constants/theme';

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

interface Props {
  mode: 'new' | 'edit';
  programId?: string;
  initialAthleteId?: string;
  initialAthleteName?: string;
}

let _tempId = 0;
function tempId() { return `tmp-${_tempId++}`; }

export function ProgramForm({ mode, programId, initialAthleteId, initialAthleteName }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Link[]>([]);
  const [athleteId, setAthleteId] = useState(initialAthleteId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [exercises, setExercises] = useState<(ProgramExercise & { _id: string })[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => { ClientsService.listClients('active').then(setClients).catch(() => {}); }, []);

  useEffect(() => {
    if (mode === 'edit' && programId) {
      ProgramsService.get(programId).then((p: Program) => {
        setTitle(p.title);
        setDescription(p.description ?? '');
        setWeeks(String(p.weeks));
        setAthleteId(p.athlete_id ?? '');
        setExercises(p.exercises.map(e => ({ ...e, _id: tempId() })));
      }).catch(e => setError(e instanceof Error ? e.message : 'Could not load program.'))
        .finally(() => setLoading(false));
    }
  }, [mode, programId]);

  function addExercise() {
    setExercises(prev => [...prev, {
      _id: tempId(), day_index: selectedDay, day_label: DAY_LABELS[selectedDay],
      name: '', sets: 3, reps: '8-12', rest_seconds: 60, notes: '', order_index: prev.length,
    }]);
  }

  function updateExercise(id: string, patch: Partial<ProgramExercise>) {
    setExercises(prev => prev.map(e => e._id === id ? { ...e, ...patch } : e));
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e._id !== id));
  }

  async function submit() {
    setError('');
    if (!title.trim()) { setError('Give the program a title.'); return; }
    if (exercises.length === 0) { setError('Add at least one exercise.'); return; }
    if (exercises.some(e => !e.name.trim())) { setError('Every exercise needs a name.'); return; }

    setSaving(true);
    try {
      const payload = {
        athlete_id: athleteId || undefined,
        title: title.trim(), description: description || undefined, weeks: Number(weeks) || 4,
        exercises: exercises.map(({ _id, ...rest }) => rest),
      };
      if (mode === 'new') await ProgramsService.create(payload);
      else await ProgramsService.update(programId!, payload);
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setSaving(false); }
  }

  const dayExercises = exercises.filter(e => e.day_index === selectedDay);

  if (loading) return <View style={styles.shell} />;

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{mode === 'new' ? 'New program' : 'Edit program'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <StyledInput label="Title" placeholder="e.g. Push/Pull/Legs — 12wk" value={title} onChangeText={setTitle} containerStyle={styles.field} />
        <StyledInput label="Description (optional)" placeholder="Goal, focus, notes for the athlete…" value={description} onChangeText={setDescription} multiline numberOfLines={3} containerStyle={styles.field} />
        <View style={styles.row}>
          <StyledInput label="Weeks" placeholder="4" value={weeks} onChangeText={setWeeks} keyboardType="numeric" containerStyle={[styles.field, { flex: 1 }]} />
          <View style={{ flex: 2 }}>
            <PickerField
              label="Assign to (optional)" placeholder="Unassigned template" accent={colors.amber}
              value={athleteId}
              options={clients.map(c => ({ label: c.athlete_name ?? '', value: c.athlete_id }))}
              onSelect={setAthleteId}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Training days</Text>
        <View style={styles.dayRow}>
          {DAYS.map(d => {
            const count = exercises.filter(e => e.day_index === d).length;
            const active = d === selectedDay;
            return (
              <TouchableOpacity key={d} onPress={() => setSelectedDay(d)} style={[styles.dayChip, active && { backgroundColor: colors.amberDim, borderColor: colors.amber }]}>
                <Text style={[styles.dayChipText, active && { color: colors.amber }]}>{DAY_LABELS[d]}</Text>
                {count > 0 && <View style={[styles.dayDot, { backgroundColor: colors.amber }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {dayExercises.map(ex => (
          <View key={ex._id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TextInput
                style={styles.exerciseNameInput}
                placeholder="Exercise name"
                placeholderTextColor={colors.textHint}
                value={ex.name}
                onChangeText={v => updateExercise(ex._id, { name: v })}
              />
              <TouchableOpacity onPress={() => removeExercise(ex._id)}>
                <Feather name="x" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.exerciseFieldsRow}>
              <MiniField label="Sets" value={String(ex.sets)} onChangeText={v => updateExercise(ex._id, { sets: Number(v) || 0 })} keyboardType="numeric" />
              <MiniField label="Reps" value={ex.reps} onChangeText={v => updateExercise(ex._id, { reps: v })} />
              <MiniField label="Rest (s)" value={String(ex.rest_seconds ?? '')} onChangeText={v => updateExercise(ex._id, { rest_seconds: Number(v) || undefined })} keyboardType="numeric" />
            </View>
            <TextInput
              style={styles.exerciseNotesInput}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textHint}
              value={ex.notes ?? ''}
              onChangeText={v => updateExercise(ex._id, { notes: v })}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise} activeOpacity={0.8}>
          <Feather name="plus" size={16} color={colors.amber} />
          <Text style={styles.addExerciseText}>Add exercise to {DAY_LABELS[selectedDay]}</Text>
        </TouchableOpacity>

        {!!error && <Text style={styles.error}>⚠️ {error}</Text>}

        <PrimaryButton label={mode === 'new' ? 'Create program' : 'Save changes'} onPress={submit} loading={saving} style={{ backgroundColor: colors.amber, marginTop: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MiniField({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'numeric' }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput style={styles.miniInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={colors.textHint} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  field: { marginBottom: 0 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sectionLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text, marginTop: 4 },
  dayRow: { flexDirection: 'row', gap: 8 },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, gap: 4 },
  dayChipText: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  exerciseCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 10, marginBottom: 10 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseNameInput: { flex: 1, color: colors.text, fontSize: font.base, fontWeight: '700' },
  exerciseFieldsRow: { flexDirection: 'row', gap: 10 },
  miniLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  miniInput: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: font.sm, paddingHorizontal: 10, paddingVertical: 8 },
  exerciseNotesInput: { color: colors.textMuted, fontSize: font.xs, fontStyle: 'italic' },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.amber, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 12 },
  addExerciseText: { color: colors.amber, fontSize: font.sm, fontWeight: '700' },
  error: { color: colors.error, fontSize: font.sm },
});
