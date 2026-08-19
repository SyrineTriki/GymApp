import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessagesService, Conversation } from '../services/messages.service';
import { AmbientBackground } from './ui/AmbientBackground';
import { ScreenHeader } from './ui/ScreenHeader';
import { GlassCard } from './ui/GlassCard';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { Loader } from './ui/Loader';
import { colors, font, spacing } from '../constants/theme';

interface Props { accent: string; secondaryAccent: string; basePath: string; }

export function ConversationsListScreen({ accent, secondaryAccent, basePath }: Props) {
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setConvos(await MessagesService.listConversations()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={accent} colorB={secondaryAccent} />
      <View style={styles.content}>
        <ScreenHeader title="Messages" subtitle="Stay in touch" accent={accent} />

        {loading ? <Loader accent={accent} /> : (
          <FlatList
            data={convos}
            keyExtractor={c => c.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />}
            ListEmptyComponent={<EmptyState icon="💬" title="No conversations yet" body="Messages with your coach or athletes will appear here." />}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`${basePath}/${item.id}?name=${encodeURIComponent(item.other_user_name)}`)}>
                <GlassCard style={styles.row}>
                  <Avatar name={item.other_user_name} accent={accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.other_user_name}</Text>
                    <Text style={styles.preview} numberOfLines={1}>{item.last_message ?? 'Say hello 👋'}</Text>
                  </View>
                  {item.unread_count > 0 && (
                    <View style={[styles.unreadDot, { backgroundColor: accent }]}>
                      <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  name: { fontSize: font.base, fontWeight: '700', color: colors.text },
  preview: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  unreadDot: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontSize: 11, fontWeight: '800', color: '#0a0a0f' },
});
