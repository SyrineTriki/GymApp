import { api, errorMessage } from './apiClient';

export interface MarketplaceItem {
  id: string; name: string; description?: string | null; category: string;
  price: number; currency: string; seller_name: string;
  rating?: number | null; image_url?: string | null; in_stock: boolean;
}

export const MarketplaceService = {
  async list(category?: string): Promise<MarketplaceItem[]> {
    try { return (await api.get('/marketplace', { params: category ? { category } : {} })).data; }
    catch (e) { throw new Error(errorMessage(e)); }
  },
};
