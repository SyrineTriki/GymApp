import { api, errorMessage } from './apiClient';

export interface CoachDirectoryEntry {
  id: string; name: string; email: string;
  years_of_experience?: number | null; bio?: string | null;
  link_status: 'pending' | 'active' | 'ended' | null;
}

export interface Link {
  id: string; coach_id: string; coach_name?: string | null;
  athlete_id: string; athlete_name?: string | null;
  status: 'pending' | 'active' | 'ended'; created_at: string;
}

export const ClientsService = {
  async directory(): Promise<CoachDirectoryEntry[]> {
    try { return (await api.get('/coaches/directory')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async requestCoach(coachId: string): Promise<Link> {
    try { return (await api.post('/clients/request', { coach_id: coachId })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async myCoach(): Promise<Link | null> {
    try { return (await api.get('/athlete/coach')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async listClients(status: 'all' | 'pending' | 'active' | 'ended' = 'all'): Promise<Link[]> {
    try { return (await api.get('/clients', { params: { status } })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async respond(linkId: string, action: 'approve' | 'decline'): Promise<Link> {
    try { return (await api.post(`/clients/${linkId}/respond`, { action })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async end(linkId: string): Promise<void> {
    try { await api.delete(`/clients/${linkId}`); }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
