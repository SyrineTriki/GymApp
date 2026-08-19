import { api, errorMessage } from './apiClient';
import type { ExerciseSummary } from './exercises.service';

export interface PlanExerciseInput {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
}

export interface PlanExercise {
  id: string;
  exercise: ExerciseSummary;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds?: number | null;
  notes?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  exercises: PlanExercise[];
}

export interface PlanSummary {
  id: string;
  name: string;
  description?: string | null;
  exercise_count: number;
  updated_at: string;
}

export interface PlanInput {
  name: string;
  description?: string;
  exercises?: PlanExerciseInput[];
}

export const PlansService = {
  async list(): Promise<PlanSummary[]> {
    try { return (await api.get('/plans')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async get(id: string): Promise<Plan> {
    try { return (await api.get(`/plans/${id}`)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async create(input: PlanInput): Promise<Plan> {
    try { return (await api.post('/plans', input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async update(id: string, input: Partial<PlanInput>): Promise<Plan> {
    try { return (await api.put(`/plans/${id}`, input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async remove(id: string): Promise<void> {
    try { await api.delete(`/plans/${id}`); }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
