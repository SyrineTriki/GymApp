import { api, errorMessage } from './apiClient';

export interface Achievement {
  id: string; code: string; title: string; description: string;
  icon: string; category: string; points: number;
  earned: boolean; earned_at?: string | null;
}

export const AchievementsService = {
  async list(): Promise<Achievement[]> {
    try { return (await api.get('/achievements')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
