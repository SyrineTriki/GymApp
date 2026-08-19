import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ClientsService, Link } from '../../../services/clients.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { colors, font, spacing } from '../../../constants/theme';

export default function CoachClients() {
  const router = useRouter();
  const [filter, setFilter] = useState<'active' | 'pending'>('active');
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(f = filter) {
    try { setLinks(await ClientsService.listClients(f)); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { setLoading(true); load(filter); }, [filter]));

  async function respond(link: Link, action: 'approve' | 'decline') {
    setBusyId(link.id);
    try {
      await ClientsService.respond(link.id, action);
      load(filter);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setBusyId(null); }
  }

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.violet} />
      <View style={styles.content}>
        <ScreenHeader title="Clients" subtitle="Your athlete roster" accent={colors.amber} />
        <SegmentedControl
          accent={colors.amber}
          value={filter}
          onChange={(v) => setFilter(v as 'active' | 'pending')}
          options={[{ label: 'Active', value: 'active' }, { label: 'Requests', value: 'pending' }]}
        />

        {loading ? <Loader accent={colors.amber} /> : (
          <FlatList
            data={links}
            keyExtractor={l => l.id}
            contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(filter); }} tintColor={colors.amber} />}
            ListEmptyComponent={
              <EmptyState
                icon={filter === 'pending' ? '⏳' : '👥'}
                title={filter === 'pending' ? 'No pending requests' : 'No active clients yet'}
                body={filter === 'pending' ? 'New athlete requests will show up here.' : 'Approved athletes will appear in this list.'}
              />
            }
            renderItem={({ item }) => (
              <GlassCard style={styles.row}>
                <TouchableOpacity
                  style={styles.rowMain}
                  activeOpacity={0.8}
                  disabled={filter !== 'active'}
                  onPress={() => router.push(`/(coach)/client/${item.athlete_id}?name=${encodeURIComponent(item.athlete_name ?? '')}`)}
                >
                  <Avatar name={item.athlete_name ?? '?'} accent={colors.amber} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.athlete_name}</Text>
                    <Text style={styles.meta}>Since {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  {filter === 'active' && <Badge label="Active" tone="success" />}
                </TouchableOpacity>

                {filter === 'pending' && (
                  <View style={styles.actions}>
                    <PrimaryButton
                      label="Decline" loading={busyId === item.id}
                      onPress={() => respond(item, 'decline')}
                      style={{ flex: 1, backgroundColor: colors.surface2, height: 40 }}
                    />
                    <PrimaryButton
                      label="Approve" loading={busyId === item.id}
                      onPress={() => respond(item, 'approve')}
                      style={{ flex: 1, backgroundColor: colors.amber, height: 40 }}
                    />
                  </View>
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
  row: { marginBottom: 10, gap: 12 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: font.base, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
});
