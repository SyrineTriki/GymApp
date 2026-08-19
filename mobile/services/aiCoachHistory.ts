import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ai-coach-history-v1';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export async function loadHistory(): Promise<StoredMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(messages: StoredMessage[]): Promise<void> {
  try {
    // Keep local storage bounded — no need to persist unlimited history.
    await AsyncStorage.setItem(KEY, JSON.stringify(messages.slice(-200)));
  } catch { /* best-effort */ }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
