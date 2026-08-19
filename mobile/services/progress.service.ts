import { api, errorMessage } from './apiClient';

export interface ProgressEntry {
  id: string; date: string; weight_kg?: number | null; body_fat_pct?: number | null; notes?: string | null;
}

export interface ProgressSummary {
  entries: ProgressEntry[];
  starting_weight_kg?: number | null;
  current_weight_kg?: number | null;
  weight_change_kg?: number | null;
}

export const ProgressService = {
  async summary(): Promise<ProgressSummary> {
    try { return (await api.get('/progress')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async add(entry: { date?: string; weight_kg?: number; body_fat_pct?: number; notes?: string }): Promise<ProgressEntry> {
    try { return (await api.post('/progress', entry)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
