import { api, errorMessage } from './apiClient';

export interface AICoachMessage {
  id: string; role: 'user' | 'assistant'; content: string; created_at: string;
}

export const AICoachService = {
  async history(): Promise<AICoachMessage[]> {
    try { return (await api.get('/ai-coach/history')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async send(content: string): Promise<AICoachMessage[]> {
    try { return (await api.post('/ai-coach/message', { content })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
