import { api, errorMessage } from './apiClient';

export interface NutritionLog {
  id: string; food_id?: string | null; food_name: string; quantity: number;
  unit: string; meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number | null; logged_at: string;
}

export interface NutritionLogInput {
  food_id?: string; food_name: string; quantity?: number; unit?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories?: number;
}

export interface BudgetOptimizerItem {
  food_id: string; name: string; category: string; price: number;
  currency: string; unit: string; suggested_units: number; subtotal: number;
}

export interface BudgetOptimizerResult {
  budget: number; currency: string; total_spent: number; remaining: number;
  items: BudgetOptimizerItem[];
}

export const NutritionService = {
  async listLogs(): Promise<NutritionLog[]> {
    try { return (await api.get('/nutrition/log')).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async log(input: NutritionLogInput): Promise<NutritionLog> {
    try { return (await api.post('/nutrition/log', input)).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
  async budgetOptimizer(budget: number): Promise<BudgetOptimizerResult> {
    try { return (await api.get('/nutrition/budget-optimizer', { params: { budget } })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
