import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SessionsService, TrainingSession } from '../../../services/sessions.service';
import { ProgramsService, Program } from '../../../services/programs.service';
import { MessagesService } from '../../../services/messages.service';
import { ClientsService } from '../../../services/clients.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

export default function ClientDetail() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  async function load() {
    try {
      const [s, p] = await Promise.all([SessionsService.list(), ProgramsService.list()]);
      setSessions(s.filter(x => x.athlete_id === id));
      setPrograms(p.filter(x => x.athlete_id === id));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  async function openChat() {
    setMessaging(true);
    try {
      const convo = await MessagesService.getOrCreateConversation(id);
      router.push(`/(coach)/chat/${convo.id}?name=${encodeURIComponent(String(name ?? ''))}`);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not open chat.');
    } finally { setMessaging(false); }
  }

  async function endRelationship() {
    Alert.alert('End relationship', `Stop coaching ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: async () => {
        // We don't have the link id here directly; the clients list screen handles ending relationships.
        Alert.alert('Manage from Clients tab', 'You can end this relationship from the Clients list.');
      }},
    ]);
  }

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.amber} colorB={colors.violet} /><Loader accent={colors.amber} /></View>;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.violet} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.profile}>
          <Avatar name={String(name ?? '?')} size={72} accent={colors.amber} />
          <Text style={styles.name}>{name}</Text>
          <Badge label="Active client" tone="success" />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={openChat} disabled={messaging}>
            <Feather name="message-circle" size={18} color={colors.amber} />
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(coach)/session/new?athleteId=${id}&athleteName=${encodeURIComponent(String(name ?? ''))}`)}>
            <Feather name="calendar" size={18} color={colors.amber} />
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(coach)/program/new?athleteId=${id}&athleteName=${encodeURIComponent(String(name ?? ''))}`)}>
            <Feather name="clipboard" size={18} color={colors.amber} />
            <Text style={styles.actionLabel}>Assign plan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Programs ({programs.length})</Text>
        {programs.map(p => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/(coach)/program/${p.id}`)} activeOpacity={0.85}>
            <GlassCard style={styles.itemRow}>
              <Text style={styles.itemTitle}>{p.title}</Text>
              <Text style={styles.itemMeta}>{p.weeks} weeks · {p.exercises.length} exercises</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Sessions ({sessions.length})</Text>
        {sessions.map(s => (
          <GlassCard key={s.id} style={styles.itemRow}>
            <Text style={styles.itemTitle}>{s.title}</Text>
            <Text style={styles.itemMeta}>{new Date(s.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {s.status}</Text>
          </GlassCard>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  profile: { alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  name: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: font.xs, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 6 },
  itemRow: { marginBottom: 8 },
  itemTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
});
