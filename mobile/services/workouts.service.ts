import { api, errorMessage } from './apiClient';
import type { ProgramExercise } from './programs.service';

export interface WorkoutLog {
  id: string; athlete_id: string; program_id?: string | null; date: string;
  exercise_name: string; day_label?: string | null;
  sets_completed?: number | null; reps_completed?: string | null;
  weight_kg?: number | null; duration_minutes?: number | null; notes?: string | null;
}

export interface WorkoutLogInput {
  program_id?: string; date?: string; exercise_name: string; day_label?: string;
  sets_completed?: number; reps_completed?: string; weight_kg?: number;
  duration_minutes?: number; notes?: string;
}

export interface TodayWorkout {
  program_id?: string | null; program_title?: string | null; day_label?: string | null;
  exercises: ProgramExercise[]; completed_exercise_names: string[];
}

export const WorkoutsService = {
  async today(): Promise<TodayWorkout> {
    try { return (await api.get('/workouts/today')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async list(): Promise<WorkoutLog[]> {
    try { return (await api.get('/workouts')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async log(input: WorkoutLogInput): Promise<WorkoutLog> {
    try { return (await api.post('/workouts', input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
