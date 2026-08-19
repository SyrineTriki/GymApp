import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ClientsService, Link } from '../../../services/clients.service';
import { SessionsService } from '../../../services/sessions.service';
import { StyledInput } from '../../../components/StyledInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { PickerField } from '../../../components/ui/PickerField';
import { colors, font, spacing } from '../../../constants/theme';

const DURATIONS = [30, 45, 60, 75, 90];

export default function NewSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ athleteId?: string; athleteName?: string }>();
  const [clients, setClients] = useState<Link[]>([]);
  const [athleteId, setAthleteId] = useState(params.athleteId ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');       // YYYY-MM-DD
  const [time, setTime] = useState('');       // HH:MM
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { ClientsService.listClients('active').then(setClients).catch(() => {}); }, []);

  async function submit() {
    setError('');
    if (!athleteId) { setError('Select an athlete.'); return; }
    if (!title.trim()) { setError('Give the session a title.'); return; }
    if (!date || !time) { setError('Pick a date and time.'); return; }

    const scheduled_at = `${date}T${time}:00`;
    if (isNaN(new Date(scheduled_at).getTime())) { setError('Enter date as YYYY-MM-DD and time as HH:MM.'); return; }

    setLoading(true);
    try {
      await SessionsService.create({ athlete_id: athleteId, title: title.trim(), scheduled_at, duration_minutes: duration, location: location || undefined, notes: notes || undefined });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule session</Text>
          <View style={{ width: 22 }} />
        </View>

        <PickerField
          label="Athlete" placeholder="Select a client" accent={colors.amber}
          value={athleteId}
          options={clients.map(c => ({ label: c.athlete_name ?? '', value: c.athlete_id }))}
          onSelect={setAthleteId}
        />

        <StyledInput label="Title" placeholder="e.g. Upper body strength" value={title} onChangeText={setTitle} containerStyle={styles.field} />

        <View style={styles.row}>
          <StyledInput label="Date" placeholder="2026-08-01" value={date} onChangeText={setDate} containerStyle={[styles.field, { flex: 1 }]} />
          <StyledInput label="Time" placeholder="18:00" value={time} onChangeText={setTime} containerStyle={[styles.field, { flex: 1 }]} />
        </View>

        <Text style={styles.label}>Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d} onPress={() => setDuration(d)} style={[styles.durationChip, duration === d && { backgroundColor: colors.amberDim, borderColor: colors.amber }]}>
              <Text style={[styles.durationText, duration === d && { color: colors.amber }]}>{d}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <StyledInput label="Location (optional)" placeholder="e.g. FitForge Gym, Studio 2" value={location} onChangeText={setLocation} containerStyle={styles.field} />
        <StyledInput label="Notes (optional)" placeholder="Anything to prepare…" value={notes} onChangeText={setNotes} multiline numberOfLines={3} containerStyle={styles.field} />

        {!!error && <Text style={styles.error}>⚠️ {error}</Text>}

        <PrimaryButton label="Schedule session" onPress={submit} loading={loading} style={{ backgroundColor: colors.amber, marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  field: { marginBottom: 0 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: -6 },
  durationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  durationText: { fontSize: font.sm, fontWeight: '700', color: colors.textMuted },
  error: { color: colors.error, fontSize: font.sm },
});
