import { api, errorMessage } from './apiClient';

// Pinned to the same commit openGym itself builds against (see its
// .github/workflows/pages.yml), so image/gif URLs never change under us.
const MEDIA_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd';

export interface ExerciseSummary {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target_muscle: string;
  image_filename?: string | null;
}

export interface Exercise extends ExerciseSummary {
  secondary_muscles: string[];
  instructions: string[];
  gif_filename?: string | null;
}

export interface ExerciseListResponse {
  items: ExerciseSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExerciseFilters {
  body_parts: string[];
  equipment: string[];
}

export interface ExerciseQuery {
  q?: string;
  body_part?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
}

export const imgSrc = (filename?: string | null) => filename ? `${MEDIA_BASE}/images/${filename}` : undefined;
export const gifSrc = (filename?: string | null) => filename ? `${MEDIA_BASE}/videos/${filename}` : undefined;

export const ExercisesService = {
  async list(query: ExerciseQuery = {}): Promise<ExerciseListResponse> {
    try { return (await api.get('/exercises', { params: query })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async filters(): Promise<ExerciseFilters> {
    try { return (await api.get('/exercises/filters')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async get(id: string): Promise<Exercise> {
    try { return (await api.get(`/exercises/${id}`)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
