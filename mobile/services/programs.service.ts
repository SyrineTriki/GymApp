import { api, errorMessage } from './apiClient';

export interface ProgramExercise {
  id?: string; day_index: number; day_label?: string | null; name: string;
  sets: number; reps: string; rest_seconds?: number | null; notes?: string | null; order_index: number;
}

export interface Program {
  id: string; coach_id: string; coach_name?: string | null;
  athlete_id?: string | null; athlete_name?: string | null;
  title: string; description?: string | null; weeks: number;
  created_at: string; exercises: ProgramExercise[];
}

export interface ProgramInput {
  athlete_id?: string | null; title: string; description?: string;
  weeks?: number; exercises: ProgramExercise[];
}

export const ProgramsService = {
  async list(): Promise<Program[]> {
    try { return (await api.get('/programs')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async get(id: string): Promise<Program> {
    try { return (await api.get(`/programs/${id}`)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async create(input: ProgramInput): Promise<Program> {
    try { return (await api.post('/programs', input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async update(id: string, input: Partial<ProgramInput>): Promise<Program> {
    try { return (await api.patch(`/programs/${id}`, input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async remove(id: string): Promise<void> {
    try { await api.delete(`/programs/${id}`); }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
