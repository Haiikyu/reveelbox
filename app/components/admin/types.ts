import type { Database } from '@/app/types/database';

// Types de base extraits de database.ts
export type LootBox = Database['public']['Tables']['loot_boxes']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];

export type BoxItem = Database['public']['Tables']['loot_box_items']['Row'] & {
  items?: Item | null;
};

// Types pour les formulaires d'admin
export interface BoxForm {
  name: string;
  description: string;
  image_url: string;
  banner_url?: string; // Support bannière d'arrière-plan
  price_virtual: string;
  is_active: boolean;
  is_daily_free: boolean;
  is_featured: boolean;
  required_level: string;
}

export interface ItemForm {
  name: string;
  description: string;
  image_url: string;
  market_value: string;
  rarity: string;
}

export interface BoxItemForm {
  item_id: string;
  probability: string;
  display_order: string;
}

export interface Errors {
  [key: string]: string;
}

export interface Stats {
  boxes?: number;
  items?: number;
  users?: number;
  transactions?: number;
  activeBoxes?: number;
  featuredBoxes?: number;
  totalRevenue?: number;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}