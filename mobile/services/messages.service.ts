import { api, errorMessage } from './apiClient';

export interface Conversation {
  id: string; coach_id: string; athlete_id: string;
  other_user_name: string; last_message?: string | null;
  last_message_at: string; unread_count: number;
}

export interface ChatMessage {
  id: string; conversation_id: string; sender_id: string;
  sender_name?: string | null; body: string; created_at: string; is_mine: boolean;
}

export const MessagesService = {
  async listConversations(): Promise<Conversation[]> {
    try { return (await api.get('/messages/conversations')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
    try { return (await api.post(`/messages/conversations/with/${otherUserId}`)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async getThread(conversationId: string): Promise<ChatMessage[]> {
    try { return (await api.get(`/messages/conversations/${conversationId}`)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async send(conversationId: string, body: string): Promise<ChatMessage> {
    try { return (await api.post(`/messages/conversations/${conversationId}`, { body })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
