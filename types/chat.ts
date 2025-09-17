// Fichier: types/chat.ts
// Types TypeScript stricts pour le système de chat

import { Database } from './database';

// Types de base pour les messages
export type ChatMessageType = 'text' | 'system' | 'giveaway' | 'poll' | 'donation' | 'game' | 'image';

export interface ChatMessage {
  id: string;
  user_id: string | null;
  content: string;
  message_type: ChatMessageType;
  is_bot: boolean;
  created_at: string;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  translated_text: Record<string, string> | null;
  reply_to: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ChatUser {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  virtual_currency: number;
  theme: UserTheme;
  grade: string | null;
  is_admin: boolean;
  is_banned: boolean;
  banned_until: string | null;
}

export interface UserTheme {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  textColor?: string;
}

// Types pour les giveaways
export interface ChatGiveaway {
  id: string;
  created_by: string;
  title: string;
  amount: number;
  winners_count: number;
  max_participants: number | null;
  ends_at: string;
  status: 'active' | 'completed' | 'cancelled';
  message_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  entered_at: string;
}

export interface GiveawayWinner {
  id: string;
  giveaway_id: string;
  user_id: string;
  amount_won: number;
  selected_at: string;
}

export interface CreateGiveawayParams {
  title: string;
  amount: number;
  winners_count: number;
  max_participants: number | null;
  duration_minutes: number;
}

// Types pour les sondages
export interface ChatPoll {
  id: string;
  created_by: string;
  title: string;
  options: string[];
  ends_at: string;
  status: 'active' | 'completed' | 'cancelled';
  message_id: string | null;
  created_at: string;
  total_votes: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  voted_at: string;
}

export interface CreatePollParams {
  title: string;
  options: string[];
  duration_minutes: number;
}

export interface PollResults {
  poll: ChatPoll;
  votes: Array<{
    option_index: number;
    option_text: string;
    vote_count: number;
    percentage: number;
  }>;
}

// Types pour les donations
export interface ChatDonation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  message: string | null;
  message_id: string | null;
  created_at: string;
}

export interface CreateDonationParams {
  to_user_id: string;
  amount: number;
  message?: string;
}

// Types pour les réactions
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasUserReacted: boolean;
}

// Types pour les mini-jeux
export type MiniGameType = 'spin' | 'dice' | 'coinflip' | 'roulette';

export interface MiniGame {
  id: string;
  user_id: string;
  game_type: MiniGameType;
  bet_amount: number;
  result: MiniGameResult;
  payout: number;
  message_id: string | null;
  created_at: string;
}

export interface MiniGameResult {
  outcome: string;
  multiplier: number;
  details: Record<string, unknown>;
}

export interface PlayMiniGameParams {
  game_type: MiniGameType;
  bet_amount: number;
}

// Types pour les logs admin
export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_message_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type AdminAction = 
  | 'create_giveaway'
  | 'select_giveaway_winners'
  | 'create_poll'
  | 'pin_message'
  | 'unpin_message'
  | 'ban_user'
  | 'unban_user'
  | 'set_user_grade'
  | 'update_user_theme'
  | 'delete_message'
  | 'timeout_user';

// Types pour l'interface utilisateur
export interface ChatState {
  messages: ChatMessage[];
  users: Map<string, ChatUser>;
  activeGiveaways: ChatGiveaway[];
  activePolls: ChatPoll[];
  pinnedMessage: ChatMessage | null;
  isLoading: boolean;
  error: string | null;
  lastMessageId: string | null;
}

export interface AdminPanelState {
  isOpen: boolean;
  activeTab: AdminTab;
  giveaways: ChatGiveaway[];
  polls: ChatPoll[];
  users: ChatUser[];
  logs: AdminLog[];
  isLoading: boolean;
}

export type AdminTab = 'giveaways' | 'polls' | 'users' | 'moderation' | 'logs';

// Types pour les props des composants
export interface ChatContainerProps {
  initialMessages?: ChatMessage[];
  userId: string;
  userProfile: ChatUser;
}

export interface MessageItemProps {
  message: ChatMessage;
  user: ChatUser | null;
  currentUserId: string;
  isAdmin: boolean;
  onPin: (messageId: string) => Promise<void>;
  onTranslate: (messageId: string, targetLang: string) => Promise<void>;
  onDonate: (toUserId: string) => void;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onReply: (messageId: string) => void;
}

export interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export interface GiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateGiveawayParams) => Promise<void>;
  isLoading: boolean;
}

export interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreatePollParams) => Promise<void>;
  isLoading: boolean;
}

export interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  targetUserId: string;
  currentTheme: UserTheme;
  onSave: (theme: UserTheme) => Promise<void>;
}

export interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export interface UserProfilePopoverProps {
  user: ChatUser;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  onDonate: (toUserId: string) => void;
  onSetGrade: (userId: string, grade: string) => Promise<void>;
  onBan: (userId: string, reason: string, duration: number) => Promise<void>;
  onEditTheme: (userId: string) => void;
}

// Types pour les WebSockets
export interface SocketMessage {
  type: SocketMessageType;
  payload: unknown;
  timestamp: string;
}

export type SocketMessageType = 
  | 'new_message'
  | 'message_pinned'
  | 'message_unpinned'
  | 'giveaway_created'
  | 'giveaway_entry'
  | 'giveaway_completed'
  | 'poll_created'
  | 'poll_vote'
  | 'donation_sent'
  | 'user_banned'
  | 'user_unbanned'
  | 'user_joined'
  | 'user_left'
  | 'reaction_added'
  | 'mini_game_played'
  | 'theme_updated';

// Types pour les APIs
export interface ChatAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SendMessageRequest {
  content: string;
  message_type?: ChatMessageType;
  reply_to?: string;
  metadata?: Record<string, unknown>;
}

export interface TranslateMessageRequest {
  message_id: string;
  target_language: string;
}

export interface BanUserRequest {
  user_id: string;
  reason: string;
  duration_hours: number;
}

export interface SetGradeRequest {
  user_id: string;
  grade: string;
}

export interface UpdateThemeRequest {
  user_id: string;
  theme: UserTheme;
}

// Types pour les validations
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Types pour les hooks
export interface UseChatReturn {
  state: ChatState;
  actions: {
    sendMessage: (content: string, type?: ChatMessageType) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    pinMessage: (messageId: string) => Promise<void>;
    unpinMessage: (messageId: string) => Promise<void>;
    translateMessage: (messageId: string, lang: string) => Promise<void>;
    reactToMessage: (messageId: string, emoji: string) => Promise<void>;
    replyToMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
  };
  loading: {
    sendingMessage: boolean;
    loadingMessages: boolean;
    translating: string | null;
  };
}

export interface UseAdminPanelReturn {
  state: AdminPanelState;
  actions: {
    createGiveaway: (params: CreateGiveawayParams) => Promise<void>;
    selectGiveawayWinners: (giveawayId: string) => Promise<void>;
    cancelGiveaway: (giveawayId: string) => Promise<void>;
    createPoll: (params: CreatePollParams) => Promise<void>;
    closePoll: (pollId: string) => Promise<void>;
    banUser: (userId: string, reason: string, hours: number) => Promise<void>;
    unbanUser: (userId: string) => Promise<void>;
    setUserGrade: (userId: string, grade: string) => Promise<void>;
    updateUserTheme: (userId: string, theme: UserTheme) => Promise<void>;
    loadAdminLogs: () => Promise<void>;
  };
  loading: {
    creatingGiveaway: boolean;
    selectingWinners: boolean;
    creatingPoll: boolean;
    updatingUser: boolean;
  };
}

export interface UseSocketReturn {
  isConnected: boolean;
  lastMessage: SocketMessage | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (type: SocketMessageType, callback: (payload: unknown) => void) => () => void;
  unsubscribe: (type: SocketMessageType) => void;
  emit: (type: SocketMessageType, payload: unknown) => void;
}

// Types pour les filtres et recherche
export interface ChatFilter {
  user?: string;
  type?: ChatMessageType;
  dateFrom?: Date;
  dateTo?: Date;
  content?: string;
  hasReactions?: boolean;
  isPinned?: boolean;
}

export interface ChatSearchParams {
  query: string;
  filters: ChatFilter;
  sortBy: 'created_at' | 'reactions' | 'relevance';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

// Types pour les statistiques
export interface ChatStats {
  totalMessages: number;
  totalUsers: number;
  activeUsers: number;
  messagesPerHour: number;
  topUsers: Array<{
    user_id: string;
    username: string;
    message_count: number;
  }>;
  messageTypes: Record<ChatMessageType, number>;
  averageMessageLength: number;
  peakHours: Array<{
    hour: number;
    message_count: number;
  }>;
}

export interface GiveawayStats {
  totalGiveaways: number;
  totalAmountGiven: number;
  averageParticipation: number;
  completionRate: number;
  topGiveaways: Array<{
    id: string;
    title: string;
    amount: number;
    participants: number;
  }>;
}

// Types pour les configurations
export interface ChatConfig {
  maxMessageLength: number;
  allowedImageTypes: string[];
  maxImageSize: number;
  rateLimits: {
    messagesPerMinute: number;
    giveawaysPerHour: number;
    donationsPerHour: number;
  };
  autoModeration: {
    enabled: boolean;
    bannedWords: string[];
    maxCapsPercentage: number;
    maxEmojisPerMessage: number;
  };
  features: {
    translations: boolean;
    miniGames: boolean;
    donations: boolean;
    polls: boolean;
    reactions: boolean;
    themes: boolean;
  };
}

// Types pour les événements personnalisés
export interface ChatEvent {
  id: string;
  type: 'announcement' | 'maintenance' | 'update' | 'celebration';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// Export de tous les types pour faciliter l'importation
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate
} from './database';