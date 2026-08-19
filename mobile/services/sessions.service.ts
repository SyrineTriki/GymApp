import { api, errorMessage } from './apiClient';

export interface TrainingSession {
  id: string; coach_id: string; coach_name?: string | null;
  athlete_id: string; athlete_name?: string | null;
  title: string; scheduled_at: string; duration_minutes: number;
  location?: string | null; notes?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface SessionCreateInput {
  athlete_id: string; title: string; scheduled_at: string;
  duration_minutes?: number; location?: string; notes?: string;
}

export const SessionsService = {
  async list(): Promise<TrainingSession[]> {
    try { return (await api.get('/sessions')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async create(input: SessionCreateInput): Promise<TrainingSession> {
    try { return (await api.post('/sessions', input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async update(id: string, patch: Partial<SessionCreateInput> & { status?: string }): Promise<TrainingSession> {
    try { return (await api.patch(`/sessions/${id}`, patch)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async remove(id: string): Promise<void> {
    try { await api.delete(`/sessions/${id}`); }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
