import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ClientsService, CoachDirectoryEntry } from '../../services/clients.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { colors, font, spacing } from '../../constants/theme';

export default function CoachDirectory() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<CoachDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);

  async function load() {
    try { setCoaches(await ClientsService.directory()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function request(coach: CoachDirectoryEntry) {
    setRequesting(coach.id);
    try { await ClientsService.requestCoach(coach.id); load(); }
    catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setRequesting(null); }
  }

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Find a coach</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? <Loader accent={colors.teal} /> : (
          <FlatList
            data={coaches}
            keyExtractor={c => c.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
            ListEmptyComponent={<EmptyState icon="🏋️" title="No approved coaches yet" body="Check back soon — new coaches join regularly." />}
            renderItem={({ item }) => (
              <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <Avatar name={item.name} accent={colors.teal} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.years_of_experience != null && <Text style={styles.meta}>{item.years_of_experience} yrs experience</Text>}
                  </View>
                  {item.link_status && <Badge label={item.link_status} tone={item.link_status === 'active' ? 'success' : 'warning'} />}
                </View>
                {!!item.bio && <Text style={styles.bio}>{item.bio}</Text>}
                {!item.link_status && (
                  <TouchableOpacity style={styles.requestBtn} onPress={() => request(item)} disabled={requesting === item.id}>
                    <Text style={styles.requestText}>{requesting === item.id ? 'Sending…' : 'Request to connect'}</Text>
                  </TouchableOpacity>
                )}
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
  card: { marginBottom: 10, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: font.base, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  bio: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
  requestBtn: { backgroundColor: colors.tealDim, borderWidth: 1, borderColor: 'rgba(45,212,191,0.4)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  requestText: { color: colors.teal, fontWeight: '700', fontSize: font.sm },
});
