import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MessagesService, ChatMessage } from '../services/messages.service';
import { Loader } from './ui/Loader';
import { colors, font, radius, spacing } from '../constants/theme';

export function ChatThreadScreen({ accent }: { accent: string }) {
  const router = useRouter();
  const { conversationId, name } = useLocalSearchParams<{ conversationId: string; name?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function load() {
    try { setMessages(await MessagesService.getThread(conversationId)); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, [conversationId]));

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setSending(true);
    try {
      const msg = await MessagesService.send(conversationId, body);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerName}>{name || 'Conversation'}</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? <Loader accent={accent} /> : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.is_mine ? { alignSelf: 'flex-end', backgroundColor: accent + '2a', borderColor: accent + '55' } : { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.bubbleText}>{item.body}</Text>
              <Text style={styles.bubbleTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={colors.textHint}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: accent }]} onPress={send} disabled={sending || !draft.trim()}>
          <Feather name="send" size={16} color="#0a0a0f" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 30 },
  headerName: { fontSize: font.base, fontWeight: '800', color: colors.text },
  list: { padding: spacing.lg, gap: 10 },
  bubble: { maxWidth: '78%', borderWidth: 1, borderRadius: radius.md, padding: 12, marginBottom: 2 },
  bubbleText: { color: colors.text, fontSize: font.sm, lineHeight: 20 },
  bubbleTime: { color: colors.textHint, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, fontSize: font.sm },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
