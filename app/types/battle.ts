// types/battle.ts
export interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  username?: string;
  virtual_currency: number;
  loyalty_points: number;
  total_exp: number;
  avatar_url?: string;
}

export interface LootBox {
  id: string;
  name: string;
  description?: string;
  price_virtual: number;
  price_real: number;
  image_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
  is_active: boolean;
  is_battle_eligible?: boolean;
  min_level?: number;
  avg_value?: number;
  max_value?: number;
  item_count?: number;
  loot_box_items?: LootBoxItem[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image_url?: string;
  market_value: number;
  battle_value?: number;
  is_battle_item?: boolean;
}

export interface LootBoxItem {
  id: string;
  loot_box_id: string;
  item_id: string;
  probability: number;
  min_quantity: number;
  max_quantity: number;
  item?: Item;
}

export interface Battle {
  id: string;
  name: string;
  description: string | null;
  mode: 'classic' | 'crazy' | 'shared' | 'fast' | 'jackpot' | 'terminal' | 'clutch';
  max_players: number;
  entry_cost: number;
  total_prize: number;
  status: 'waiting' | 'countdown' | 'active' | 'finished' | 'cancelled' | 'expired';
  is_private: boolean;
  total_boxes: number;
  current_box: number;
  expires_at: string;
  created_at: string;
  creator_id: string | null;
  participants: BattleParticipant[];
  battle_boxes: BattleBox[];
  creator: {
    username: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string | null;
  is_bot: boolean;
  bot_name: string | null;
  bot_avatar_url: string | null;
  position: number;
  team: number;
  total_value: number;
  is_ready: boolean;
  is_winner: boolean;
  final_rank: number | null;
  joined_at: string;
  has_paid: boolean;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
}

export interface BattleBox {
  id: string;
  loot_box_id: string;
  quantity: number;
  order_position: number;
  cost_per_box: number;
  loot_boxes: {
    id: string;
    name: string;
    image_url: string | null;
    price_virtual: number;
  } | null;
}

export interface BattleOpening {
  id: string;
  battle_id: string;
  user_id: string;
  loot_box_id: string;
  item_id: string;
  quantity: number;
  value: number;
  opened_at: string;
}

export interface OpeningResult {
  items: OpenedItem[];
  totalValue: number;
  participant: BattleParticipant;
}

export interface OpenedItem {
  id: string;
  name: string;
  value: number;
  rarity: string;
  quantity: number;
  boxId: string;
  boxName: string;
  image_url?: string;
}

export interface ChatMessage {
  id: string | number;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface BattleConfig {
  mode: '1v1' | '2v2' | 'group';
  selectedBoxes: (LootBox & { quantity: number })[];
  isPrivate: boolean;
  password: string;
  invitedFriends: User[];
  autoStart: boolean;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: User;
  addressee?: User;
}

export interface BattleFilters {
  mode: 'all' | '1v1' | '2v2' | 'group';
  status: 'all' | 'waiting' | 'countdown' | 'opening' | 'finished';
  priceRange: 'all' | 'low' | 'medium' | 'high';
  friends: boolean;
}

export interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}