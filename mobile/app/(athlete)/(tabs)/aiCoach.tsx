import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as LocalAI from '../../../services/localAiCoach';
import { loadHistory, saveHistory, StoredMessage } from '../../../services/aiCoachHistory';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { colors, font, radius, spacing } from '../../../constants/theme';

const SUGGESTIONS = ['I feel sore today', "I'm not motivated", 'Tips on protein intake', "I've hit a plateau"];

type ModelState = 'checking' | 'needs-download' | 'downloading' | 'loading' | 'ready' | 'error';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function AthleteAICoach() {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [modelState, setModelState] = useState<ModelState>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorText, setErrorText] = useState('');
  const [draft, setDraft] = useState('');
  const [streamingReply, setStreamingReply] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory().then(setMessages);
    checkModel();
    // Release the model's native memory when the screen (and app) unmounts.
    return () => { LocalAI.releaseModel(); };
  }, []);

  useFocusEffect(useCallback(() => {
    // Re-check in case the user backgrounded the app mid-download.
    if (modelState === 'checking') checkModel();
  }, [modelState]));

  async function checkModel() {
    setModelState('checking');
    const exists = await LocalAI.isModelDownloaded();
    if (!exists) { setModelState('needs-download'); return; }
    await loadModelIntoMemory();
  }

  async function startDownload() {
    setModelState('downloading');
    setDownloadProgress(0);
    try {
      await LocalAI.downloadModel(setDownloadProgress);
      await loadModelIntoMemory();
    } catch (e: unknown) {
      setModelState('error');
      setErrorText(e instanceof Error ? e.message : 'Download failed.');
    }
  }

  async function loadModelIntoMemory() {
    setModelState('loading');
    try {
      await LocalAI.preloadModel();
      setModelState('ready');
    } catch (e: unknown) {
      setModelState('error');
      setErrorText(e instanceof Error ? e.message : 'Could not load the model. Your device may be low on memory.');
    }
  }

  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || sending || modelState !== 'ready') return;

    const userMsg: StoredMessage = { id: uid(), role: 'user', content: body, createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);
    setStreamingReply('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const history = nextMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const finalText = await LocalAI.sendMessage(history, body, (partial) => {
        setStreamingReply(partial);
        listRef.current?.scrollToEnd({ animated: true });
      });

      const assistantMsg: StoredMessage = { id: uid(), role: 'assistant', content: finalText, createdAt: new Date().toISOString() };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (e: unknown) {
      Alert.alert('AI Coach', e instanceof Error ? e.message : 'Something went wrong generating a reply.');
    } finally {
      setStreamingReply(null);
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <View style={styles.header}>
        <Text style={styles.title}>⚡ AI Coach</Text>
        <Text style={styles.subtitle}>
          {modelState === 'ready' ? 'Running on-device · private & offline' : 'Quick training & nutrition tips'}
        </Text>
      </View>

      {modelState !== 'ready' && (
        <ModelSetupCard
          state={modelState}
          progress={downloadProgress}
          errorText={errorText}
          onDownload={startDownload}
          onRetry={checkModel}
        />
      )}

      {modelState === 'ready' && (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Ask me anything about training or nutrition</Text>
                <View style={styles.suggestRow}>
                  {SUGGESTIONS.map(s => (
                    <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => send(s)}>
                      <Text style={styles.suggestText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item }) => <Bubble role={item.role} content={item.content} />}
            ListFooterComponent={streamingReply !== null ? <Bubble role="assistant" content={streamingReply || '…'} /> : null}
          />

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Ask about training, recovery, nutrition…"
              placeholderTextColor={colors.textHint}
              value={draft}
              onChangeText={setDraft}
              multiline
              editable={!sending}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={sending || !draft.trim()}>
              {sending ? <ActivityIndicator size="small" color="#0a0a0f" /> : <Feather name="send" size={16} color="#0a0a0f" />}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  return (
    <View style={[styles.bubble, role === 'user'
      ? { alignSelf: 'flex-end', backgroundColor: colors.tealDim, borderColor: 'rgba(45,212,191,0.4)' }
      : { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border }]}>
      {role === 'assistant' && <Text style={styles.assistantTag}>⚡ AI Coach</Text>}
      <Text style={styles.bubbleText}>{content}</Text>
    </View>
  );
}

function ModelSetupCard({
  state, progress, errorText, onDownload, onRetry,
}: {
  state: ModelState; progress: number; errorText: string;
  onDownload: () => void; onRetry: () => void;
}) {
  return (
    <View style={styles.setupWrap}>
      {state === 'checking' && (
        <>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={styles.setupTitle}>Checking for the on-device model…</Text>
        </>
      )}

      {state === 'needs-download' && (
        <>
          <Text style={styles.setupIcon}>🧠</Text>
          <Text style={styles.setupTitle}>Download the AI Coach model</Text>
          <Text style={styles.setupBody}>
            About 1.1 GB, downloaded once and stored on your device. After that, AI Coach
            works fully offline — nothing you type ever leaves your phone. Use Wi-Fi if you can.
          </Text>
          <TouchableOpacity style={styles.setupBtn} onPress={onDownload}>
            <Text style={styles.setupBtnText}>Download model</Text>
          </TouchableOpacity>
        </>
      )}

      {state === 'downloading' && (
        <>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={styles.setupTitle}>Downloading model… {Math.round(progress * 100)}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]} />
          </View>
        </>
      )}

      {state === 'loading' && (
        <>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={styles.setupTitle}>Loading model into memory…</Text>
          <Text style={styles.setupBody}>This takes a few seconds the first time each session.</Text>
        </>
      )}

      {state === 'error' && (
        <>
          <Text style={styles.setupIcon}>⚠️</Text>
          <Text style={styles.setupTitle}>Something went wrong</Text>
          <Text style={styles.setupBody}>{errorText}</Text>
          <TouchableOpacity style={styles.setupBtn} onPress={onRetry}>
            <Text style={styles.setupBtnText}>Try again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  list: { padding: spacing.lg, gap: 10, flexGrow: 1 },
  bubble: { maxWidth: '82%', borderWidth: 1, borderRadius: radius.md, padding: 12, marginBottom: 2 },
  assistantTag: { fontSize: 10, fontWeight: '800', color: colors.teal, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { color: colors.text, fontSize: font.sm, lineHeight: 20 },
  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: 14 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 20 },
  suggestChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  suggestText: { fontSize: font.xs, color: colors.text, fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, fontSize: font.sm },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.teal },
  setupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  setupIcon: { fontSize: 40 },
  setupTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, textAlign: 'center' },
  setupBody: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  setupBtn: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  setupBtnText: { color: '#0a0a0f', fontWeight: '800', fontSize: font.sm },
  progressTrack: { width: '80%', height: 8, borderRadius: 4, backgroundColor: colors.surface2, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.teal },
});
