export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          affiliate_code: string
          clicked_at: string | null
          conversion_date: string | null
          converted: boolean | null
          id: string
          ip_address: unknown | null
          referrer_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          clicked_at?: string | null
          conversion_date?: string | null
          converted?: boolean | null
          id?: string
          ip_address?: unknown | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          clicked_at?: string | null
          conversion_date?: string | null
          converted?: boolean | null
          id?: string
          ip_address?: unknown | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          amount: number
          id: string
          method: string | null
          notes: string | null
          processed_at: string | null
          requested_at: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          method?: string | null
          notes?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          method?: string | null
          notes?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_profiles: {
        Row: {
          affiliate_code: string
          claimed_earnings: number | null
          clicks_count: number | null
          commission_rate: number | null
          conversions_count: number | null
          created_at: string | null
          custom_share_message: string | null
          id: string
          is_active: boolean | null
          pending_earnings: number | null
          referrals_count: number | null
          tier_level: number | null
          tier_name: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          claimed_earnings?: number | null
          clicks_count?: number | null
          commission_rate?: number | null
          conversions_count?: number | null
          created_at?: string | null
          custom_share_message?: string | null
          id?: string
          is_active?: boolean | null
          pending_earnings?: number | null
          referrals_count?: number | null
          tier_level?: number | null
          tier_name?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          claimed_earnings?: number | null
          clicks_count?: number | null
          commission_rate?: number | null
          conversions_count?: number | null
          created_at?: string | null
          custom_share_message?: string | null
          id?: string
          is_active?: boolean | null
          pending_earnings?: number | null
          referrals_count?: number | null
          tier_level?: number | null
          tier_name?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_code: string
          commission_earned: number | null
          conversion_date: string | null
          created_at: string | null
          deposit_amount: number
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string | null
        }
        Insert: {
          affiliate_code: string
          commission_earned?: number | null
          conversion_date?: string | null
          created_at?: string | null
          deposit_amount: number
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string | null
        }
        Update: {
          affiliate_code?: string
          commission_earned?: number | null
          conversion_date?: string | null
          created_at?: string | null
          deposit_amount?: number
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          event_name: string
          id: string
          ip_address: unknown | null
          properties: Json | null
          timestamp: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_name: string
          id?: string
          ip_address?: unknown | null
          properties?: Json | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          ip_address?: unknown | null
          properties?: Json | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      battle_boxes: {
        Row: {
          battle_id: string
          cost_per_box: number
          created_at: string | null
          id: string
          loot_box_id: string
          order_position: number
          quantity: number
        }
        Insert: {
          battle_id: string
          cost_per_box: number
          created_at?: string | null
          id?: string
          loot_box_id: string
          order_position: number
          quantity?: number
        }
        Update: {
          battle_id?: string
          cost_per_box?: number
          created_at?: string | null
          id?: string
          loot_box_id?: string
          order_position?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_boxes_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_boxes_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_boxes_loot_box_id_fkey"
            columns: ["loot_box_id"]
            isOneToOne: false
            referencedRelation: "loot_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_chat: {
        Row: {
          battle_id: string
          created_at: string | null
          id: string
          message: string
          message_type: string
          metadata: Json | null
          participant_id: string | null
          user_id: string | null
        }
        Insert: {
          battle_id: string
          created_at?: string | null
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          participant_id?: string | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          participant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_chat_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_chat_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_chat_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "battle_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_chat_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "battle_participants_with_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_invitations: {
        Row: {
          battle_id: string
          created_at: string | null
          expires_at: string | null
          from_user_id: string
          id: string
          message: string | null
          responded_at: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          battle_id: string
          created_at?: string | null
          expires_at?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          battle_id?: string
          created_at?: string | null
          expires_at?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_invitations_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_invitations_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_openings: {
        Row: {
          battle_id: string
          box_instance: number
          id: string
          item_id: string
          item_rarity: string
          item_value: number
          loot_box_id: string
          opened_at: string | null
          opening_hash: string | null
          opening_seed: string
          participant_id: string
        }
        Insert: {
          battle_id: string
          box_instance?: number
          id?: string
          item_id: string
          item_rarity: string
          item_value: number
          loot_box_id: string
          opened_at?: string | null
          opening_hash?: string | null
          opening_seed?: string
          participant_id: string
        }
        Update: {
          battle_id?: string
          box_instance?: number
          id?: string
          item_id?: string
          item_rarity?: string
          item_value?: number
          loot_box_id?: string
          opened_at?: string | null
          opening_hash?: string | null
          opening_seed?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_openings_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_openings_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_openings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_openings_loot_box_id_fkey"
            columns: ["loot_box_id"]
            isOneToOne: false
            referencedRelation: "loot_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_openings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "battle_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_openings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "battle_participants_with_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_participants: {
        Row: {
          battle_id: string
          bot_avatar_url: string | null
          bot_name: string | null
          final_rank: number | null
          has_paid: boolean | null
          id: string
          is_bot: boolean | null
          is_ready: boolean | null
          is_winner: boolean | null
          items_won: Json | null
          joined_at: string | null
          position: number
          team: number | null
          total_value: number | null
          user_id: string | null
        }
        Insert: {
          battle_id: string
          bot_avatar_url?: string | null
          bot_name?: string | null
          final_rank?: number | null
          has_paid?: boolean | null
          id?: string
          is_bot?: boolean | null
          is_ready?: boolean | null
          is_winner?: boolean | null
          items_won?: Json | null
          joined_at?: string | null
          position: number
          team?: number | null
          total_value?: number | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string
          bot_avatar_url?: string | null
          bot_name?: string | null
          final_rank?: number | null
          has_paid?: boolean | null
          id?: string
          is_bot?: boolean | null
          is_ready?: boolean | null
          is_winner?: boolean | null
          items_won?: Json | null
          joined_at?: string | null
          position?: number
          team?: number | null
          total_value?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_spectators: {
        Row: {
          battle_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          battle_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          battle_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_spectators_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_spectators_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          bots_count: number | null
          box_order: string
          client_seed: string | null
          combined_hash: string | null
          countdown_starts_at: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          current_box: number | null
          description: string | null
          entry_cost: number
          expires_at: string | null
          finished_at: string | null
          has_bots: boolean | null
          id: string
          is_private: boolean | null
          max_players: number
          metadata: Json | null
          mode: string
          name: string
          nonce: number | null
          password: string | null
          password_hash: string | null
          player_distribution: string
          server_seed: string
          started_at: string | null
          status: string
          team_mode: boolean | null
          teams_count: number | null
          total_boxes: number
          total_prize: number
          updated_at: string | null
          winner_team: number | null
          winner_user_id: string | null
          winning_value: number | null
        }
        Insert: {
          bots_count?: number | null
          box_order?: string
          client_seed?: string | null
          combined_hash?: string | null
          countdown_starts_at?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_box?: number | null
          description?: string | null
          entry_cost: number
          expires_at?: string | null
          finished_at?: string | null
          has_bots?: boolean | null
          id?: string
          is_private?: boolean | null
          max_players: number
          metadata?: Json | null
          mode?: string
          name?: string
          nonce?: number | null
          password?: string | null
          password_hash?: string | null
          player_distribution?: string
          server_seed?: string
          started_at?: string | null
          status?: string
          team_mode?: boolean | null
          teams_count?: number | null
          total_boxes?: number
          total_prize?: number
          updated_at?: string | null
          winner_team?: number | null
          winner_user_id?: string | null
          winning_value?: number | null
        }
        Update: {
          bots_count?: number | null
          box_order?: string
          client_seed?: string | null
          combined_hash?: string | null
          countdown_starts_at?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_box?: number | null
          description?: string | null
          entry_cost?: number
          expires_at?: string | null
          finished_at?: string | null
          has_bots?: boolean | null
          id?: string
          is_private?: boolean | null
          max_players?: number
          metadata?: Json | null
          mode?: string
          name?: string
          nonce?: number | null
          password?: string | null
          password_hash?: string | null
          player_distribution?: string
          server_seed?: string
          started_at?: string | null
          status?: string
          team_mode?: boolean | null
          teams_count?: number | null
          total_boxes?: number
          total_prize?: number
          updated_at?: string | null
          winner_team?: number | null
          winner_user_id?: string | null
          winning_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_giveaway_participants_new: {
        Row: {
          captcha_token: string | null
          captcha_verified: boolean
          captcha_verified_at: string | null
          giveaway_id: string
          id: string
          ip_address: unknown | null
          joined_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          captcha_token?: string | null
          captcha_verified?: boolean
          captcha_verified_at?: string | null
          giveaway_id: string
          id?: string
          ip_address?: unknown | null
          joined_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          captcha_token?: string | null
          captcha_verified?: boolean
          captcha_verified_at?: string | null
          giveaway_id?: string
          id?: string
          ip_address?: unknown | null
          joined_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_giveaway_participants_new_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "chat_giveaways_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_giveaway_participants_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_giveaway_winners_new: {
        Row: {
          amount_won: number
          awarded_at: string | null
          giveaway_id: string
          id: string
          position: number
          selected_at: string | null
          selection_hash: string | null
          selection_seed: string | null
          user_id: string
        }
        Insert: {
          amount_won: number
          awarded_at?: string | null
          giveaway_id: string
          id?: string
          position: number
          selected_at?: string | null
          selection_hash?: string | null
          selection_seed?: string | null
          user_id: string
        }
        Update: {
          amount_won?: number
          awarded_at?: string | null
          giveaway_id?: string
          id?: string
          position?: number
          selected_at?: string | null
          selection_hash?: string | null
          selection_seed?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_giveaway_winners_new_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "chat_giveaways_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_giveaway_winners_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_giveaways_new: {
        Row: {
          announcement_message_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          duration_minutes: number | null
          ends_at: string
          id: string
          results_message_id: string | null
          room_id: string
          status: string | null
          title: string
          total_amount: number
          winners_count: number
        }
        Insert: {
          announcement_message_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          duration_minutes?: number | null
          ends_at: string
          id?: string
          results_message_id?: string | null
          room_id: string
          status?: string | null
          title: string
          total_amount: number
          winners_count: number
        }
        Update: {
          announcement_message_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          duration_minutes?: number | null
          ends_at?: string
          id?: string
          results_message_id?: string | null
          room_id?: string
          status?: string | null
          title?: string
          total_amount?: number
          winners_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_giveaways_new_announcement_message_id_fkey"
            columns: ["announcement_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_giveaways_new_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_giveaways_new_results_message_id_fkey"
            columns: ["results_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_giveaways_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages_new: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          room_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          room_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_messages: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_messages?: number | null
          name?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_messages?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crash_bets: {
        Row: {
          bet_amount: number
          cashed_out: boolean | null
          cashed_out_at: string | null
          cashout_amount: number | null
          cashout_multiplier: number | null
          cashout_time: string | null
          id: string
          placed_at: string | null
          round_id: string | null
          user_id: string | null
        }
        Insert: {
          bet_amount: number
          cashed_out?: boolean | null
          cashed_out_at?: string | null
          cashout_amount?: number | null
          cashout_multiplier?: number | null
          cashout_time?: string | null
          id?: string
          placed_at?: string | null
          round_id?: string | null
          user_id?: string | null
        }
        Update: {
          bet_amount?: number
          cashed_out?: boolean | null
          cashed_out_at?: string | null
          cashout_amount?: number | null
          cashout_multiplier?: number | null
          cashout_time?: string | null
          id?: string
          placed_at?: string | null
          round_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crash_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "crash_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crash_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crash_rounds: {
        Row: {
          betting_end_time: string | null
          betting_start_time: string | null
          crash_multiplier: number | null
          crash_time: string | null
          created_at: string | null
          final_multiplier: number | null
          id: string
          round_number: number
          round_start_time: string | null
          status: string | null
          total_bet_amount: number | null
          total_bets: number | null
          total_players: number | null
        }
        Insert: {
          betting_end_time?: string | null
          betting_start_time?: string | null
          crash_multiplier?: number | null
          crash_time?: string | null
          created_at?: string | null
          final_multiplier?: number | null
          id?: string
          round_number: number
          round_start_time?: string | null
          status?: string | null
          total_bet_amount?: number | null
          total_bets?: number | null
          total_players?: number | null
        }
        Update: {
          betting_end_time?: string | null
          betting_start_time?: string | null
          crash_multiplier?: number | null
          crash_time?: string | null
          created_at?: string | null
          final_multiplier?: number | null
          id?: string
          round_number?: number
          round_start_time?: string | null
          status?: string | null
          total_bet_amount?: number | null
          total_bets?: number | null
          total_players?: number | null
        }
        Relationships: []
      }
      crash_server_state: {
        Row: {
          betting_duration_seconds: number | null
          countdown_duration_seconds: number | null
          crash_delay_after_seconds: number | null
          current_round_id: string | null
          id: number
          server_started_at: string | null
          server_status: string | null
          total_rounds_played: number | null
          updated_at: string | null
        }
        Insert: {
          betting_duration_seconds?: number | null
          countdown_duration_seconds?: number | null
          crash_delay_after_seconds?: number | null
          current_round_id?: string | null
          id?: number
          server_started_at?: string | null
          server_status?: string | null
          total_rounds_played?: number | null
          updated_at?: string | null
        }
        Update: {
          betting_duration_seconds?: number | null
          countdown_duration_seconds?: number | null
          crash_delay_after_seconds?: number | null
          current_round_id?: string | null
          id?: number
          server_started_at?: string | null
          server_status?: string | null
          total_rounds_played?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_box_claims: {
        Row: {
          claimed_date: string
          created_at: string
          daily_box_id: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          claimed_date?: string
          created_at?: string
          daily_box_id: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          claimed_date?: string
          created_at?: string
          daily_box_id?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_box_claims_daily_box_id_fkey"
            columns: ["daily_box_id"]
            isOneToOne: false
            referencedRelation: "loot_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_box_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_claims: {
        Row: {
          bonus_applied: boolean | null
          claim_date: string | null
          claimed_at: string
          created_at: string | null
          daily_box_id: string
          id: string
          item_id: string | null
          streak_day: number | null
          user_id: string
        }
        Insert: {
          bonus_applied?: boolean | null
          claim_date?: string | null
          claimed_at?: string
          created_at?: string | null
          daily_box_id: string
          id?: string
          item_id?: string | null
          streak_day?: number | null
          user_id: string
        }
        Update: {
          bonus_applied?: boolean | null
          claim_date?: string | null
          claimed_at?: string
          created_at?: string | null
          daily_box_id?: string
          id?: string
          item_id?: string | null
          streak_day?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      giveaway_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          giveaway_id: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          giveaway_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          giveaway_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_audit_logs_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "chat_giveaways_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_sales: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          item_id: string | null
          original_value: number
          quantity: number
          sell_price: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_id?: string | null
          original_value: number
          quantity?: number
          sell_price: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_id?: string | null
          original_value?: number
          quantity?: number
          sell_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "sellable_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "user_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          battle_value: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_battle_item: boolean | null
          market_value: number
          name: string
          rarity: string
          rarity_tier: number | null
        }
        Insert: {
          battle_value?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_battle_item?: boolean | null
          market_value: number
          name: string
          rarity: string
          rarity_tier?: number | null
        }
        Update: {
          battle_value?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_battle_item?: boolean | null
          market_value?: number
          name?: string
          rarity?: string
          rarity_tier?: number | null
        }
        Relationships: []
      }
      loot_box_items: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_guaranteed: boolean | null
          item_id: string | null
          loot_box_id: string | null
          max_quantity: number | null
          min_quantity: number | null
          probability: number
          rarity_boost: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_guaranteed?: boolean | null
          item_id?: string | null
          loot_box_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          probability: number
          rarity_boost?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_guaranteed?: boolean | null
          item_id?: string | null
          loot_box_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          probability?: number
          rarity_boost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loot_box_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_box_items_loot_box_id_fkey"
            columns: ["loot_box_id"]
            isOneToOne: false
            referencedRelation: "loot_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      loot_boxes: {
        Row: {
          animation_url: string | null
          banner_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_battle_eligible: boolean | null
          is_daily_free: boolean | null
          is_featured: boolean | null
          max_reward_value: number | null
          min_level: number | null
          name: string
          price_real: number | null
          price_virtual: number
          rarity: string | null
          required_level: number | null
          times_opened: number | null
          updated_at: string | null
        }
        Insert: {
          animation_url?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_battle_eligible?: boolean | null
          is_daily_free?: boolean | null
          is_featured?: boolean | null
          max_reward_value?: number | null
          min_level?: number | null
          name: string
          price_real?: number | null
          price_virtual: number
          rarity?: string | null
          required_level?: number | null
          times_opened?: number | null
          updated_at?: string | null
        }
        Update: {
          animation_url?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_battle_eligible?: boolean | null
          is_daily_free?: boolean | null
          is_featured?: boolean | null
          max_reward_value?: number | null
          min_level?: number | null
          name?: string
          price_real?: number | null
          price_virtual?: number
          rarity?: string | null
          required_level?: number | null
          times_opened?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_listings: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          inventory_item_id: string | null
          is_active: boolean | null
          price: number
          seller_id: string | null
          sold_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          is_active?: boolean | null
          price: number
          seller_id?: string | null
          sold_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          is_active?: boolean | null
          price?: number
          seller_id?: string | null
          sold_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "sellable_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "user_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_new"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          banned_until: string | null
          bio: string | null
          birth_date: string | null
          coins_balance: number | null
          consecutive_days: number | null
          created_at: string | null
          current_level_xp: number | null
          current_streak: number | null
          email: string | null
          grade: string | null
          id: string
          is_admin: boolean
          is_banned: boolean | null
          last_activity: string | null
          last_freedrop_claim: string | null
          level: number | null
          location: string | null
          longest_streak: number | null
          loyalty_points: number
          next_level_xp: number | null
          notifications_email: boolean | null
          notifications_push: boolean | null
          phone: string | null
          privacy_profile: string | null
          role: string
          theme: Json | null
          total_exp: number | null
          updated_at: string | null
          username: string | null
          virtual_currency: number
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          coins_balance?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          current_level_xp?: number | null
          current_streak?: number | null
          email?: string | null
          grade?: string | null
          id: string
          is_admin?: boolean
          is_banned?: boolean | null
          last_activity?: string | null
          last_freedrop_claim?: string | null
          level?: number | null
          location?: string | null
          longest_streak?: number | null
          loyalty_points?: number
          next_level_xp?: number | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          privacy_profile?: string | null
          role?: string
          theme?: Json | null
          total_exp?: number | null
          updated_at?: string | null
          username?: string | null
          virtual_currency?: number
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          coins_balance?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          current_level_xp?: number | null
          current_streak?: number | null
          email?: string | null
          grade?: string | null
          id?: string
          is_admin?: boolean
          is_banned?: boolean | null
          last_activity?: string | null
          last_freedrop_claim?: string | null
          level?: number | null
          location?: string | null
          longest_streak?: number | null
          loyalty_points?: number
          next_level_xp?: number | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          privacy_profile?: string | null
          role?: string
          theme?: Json | null
          total_exp?: number | null
          updated_at?: string | null
          username?: string | null
          virtual_currency?: number
          website?: string | null
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          phone: string | null
          postal_code: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          phone?: string | null
          postal_code: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_rewards: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          required_days: number
          reward_type: string
          reward_value: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          required_days: number
          reward_type: string
          reward_value: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          required_days?: number
          reward_type?: string
          reward_value?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          battle_id: string | null
          created_at: string | null
          description: string | null
          id: string
          item_id: string | null
          loot_box_id: string | null
          metadata: Json | null
          reference_id: string | null
          stripe_payment_id: string | null
          type: string
          user_id: string | null
          virtual_amount: number | null
        }
        Insert: {
          amount?: number | null
          battle_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          loot_box_id?: string | null
          metadata?: Json | null
          reference_id?: string | null
          stripe_payment_id?: string | null
          type: string
          user_id?: string | null
          virtual_amount?: number | null
        }
        Update: {
          amount?: number | null
          battle_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          loot_box_id?: string | null
          metadata?: Json | null
          reference_id?: string | null
          stripe_payment_id?: string | null
          type?: string
          user_id?: string | null
          virtual_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_attempts: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_value: number
          success: boolean
          target_multiplier: number
          user_id: string
          won_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_value: number
          success?: boolean
          target_multiplier: number
          user_id: string
          won_value?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_value?: number
          success?: boolean
          target_multiplier?: number
          user_id?: string
          won_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_attempts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          delivered_at: string | null
          id: string
          is_daily_reward: boolean | null
          is_on_market: boolean | null
          is_shipped: boolean | null
          is_sold: boolean
          item_id: string | null
          market_price: number | null
          obtained_at: string | null
          obtained_from: string | null
          quantity: number | null
          sell_price: number | null
          shipping_address_id: string | null
          sold_at: string | null
          source: string | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          is_daily_reward?: boolean | null
          is_on_market?: boolean | null
          is_shipped?: boolean | null
          is_sold?: boolean
          item_id?: string | null
          market_price?: number | null
          obtained_at?: string | null
          obtained_from?: string | null
          quantity?: number | null
          sell_price?: number | null
          shipping_address_id?: string | null
          sold_at?: string | null
          source?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          delivered_at?: string | null
          id?: string
          is_daily_reward?: boolean | null
          is_on_market?: boolean | null
          is_shipped?: boolean | null
          is_sold?: boolean
          item_id?: string | null
          market_price?: number | null
          obtained_at?: string | null
          obtained_from?: string | null
          quantity?: number | null
          sell_price?: number | null
          shipping_address_id?: string | null
          sold_at?: string | null
          source?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_shipping_address_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_claim_date: string | null
          longest_streak: number | null
          streak_rewards_claimed: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_claim_date?: string | null
          longest_streak?: number | null
          streak_rewards_claimed?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_claim_date?: string | null
          longest_streak?: number | null
          streak_rewards_claimed?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_upgrades: {
        Row: {
          created_at: string
          final_value: number
          id: string
          inventory_item_id: string
          item_id: string
          item_name: string
          multiplier: number
          original_value: number
          success: boolean
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          final_value: number
          id?: string
          inventory_item_id: string
          item_id: string
          item_name: string
          multiplier: number
          original_value: number
          success: boolean
          target_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          final_value?: number
          id?: string
          inventory_item_id?: string
          item_id?: string
          item_name?: string
          multiplier?: number
          original_value?: number
          success?: boolean
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_upgrades_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_upgrades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_stats: {
        Row: {
          active_boxes: number | null
          avg_level: number | null
          featured_boxes: number | null
          total_boxes: number | null
          total_coins: number | null
          total_items: number | null
          total_revenue: number | null
          total_transactions: number | null
          total_users: number | null
          users_with_coins: number | null
        }
        Relationships: []
      }
      affiliate_stats_view: {
        Row: {
          affiliate_code: string | null
          claimed_earnings: number | null
          clicks_count: number | null
          commission_rate: number | null
          conversion_rate: number | null
          conversions_count: number | null
          created_at: string | null
          custom_share_message: string | null
          id: string | null
          is_active: boolean | null
          pending_earnings: number | null
          referrals_count: number | null
          referrals_last_30_days: number | null
          successful_conversions: number | null
          tier_level: number | null
          tier_name: string | null
          total_clicks: number | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      battle_participants_with_profiles: {
        Row: {
          avatar_url: string | null
          battle_id: string | null
          bot_avatar_url: string | null
          bot_name: string | null
          final_rank: number | null
          has_paid: boolean | null
          id: string | null
          is_bot: boolean | null
          is_ready: boolean | null
          is_winner: boolean | null
          items_won: Json | null
          joined_at: string | null
          level: number | null
          position: number | null
          team: number | null
          total_value: number | null
          user_id: string | null
          username: string | null
          virtual_currency: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_statistics: {
        Row: {
          avg_boxes: number | null
          avg_entry_cost: number | null
          avg_players: number | null
          avg_prize: number | null
          battle_count: number | null
          first_battle: string | null
          last_battle: string | null
          mode: string | null
          status: string | null
        }
        Relationships: []
      }
      battles_with_stats: {
        Row: {
          bot_count: number | null
          bots_count: number | null
          box_order: string | null
          client_seed: string | null
          combined_hash: string | null
          countdown_starts_at: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          current_box: number | null
          description: string | null
          entry_cost: number | null
          expires_at: string | null
          fill_status: string | null
          finished_at: string | null
          has_bots: boolean | null
          human_count: number | null
          id: string | null
          is_private: boolean | null
          max_players: number | null
          metadata: Json | null
          mode: string | null
          name: string | null
          nonce: number | null
          participant_count: number | null
          password: string | null
          password_hash: string | null
          player_distribution: string | null
          seconds_until_expiry: number | null
          server_seed: string | null
          started_at: string | null
          status: string | null
          team_mode: boolean | null
          teams_count: number | null
          total_boxes: number | null
          total_prize: number | null
          updated_at: string | null
          winner_team: number | null
          winner_user_id: string | null
          winning_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_claim_stats: {
        Row: {
          avg_item_value: number | null
          claim_date: string | null
          total_claims: number | null
          total_value_claimed: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      sellable_inventory: {
        Row: {
          id: string | null
          image_url: string | null
          item_id: string | null
          item_name: string | null
          market_value: number | null
          obtained_at: string | null
          quantity: number | null
          rarity: string | null
          sell_price: number | null
          total_sell_value: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_upgrades: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          final_value: number | null
          id: string | null
          item_name: string | null
          multiplier: number | null
          original_value: number | null
          username: string | null
          value_gained: number | null
        }
        Relationships: []
      }
      upgrade_global_stats: {
        Row: {
          global_success_rate: number | null
          total_attempts: number | null
          total_failures: number | null
          total_successes: number | null
          total_value_created: number | null
          total_value_destroyed: number | null
          unique_upgraders: number | null
        }
        Relationships: []
      }
      user_streak_summary: {
        Row: {
          current_streak: number | null
          last_claim_date: string | null
          longest_streak: number | null
          streak_status: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_friend_request: {
        Args: { p_friendship_id: string }
        Returns: boolean
      }
      add_bot_to_battle: {
        Args: {
          p_battle_id: string
          p_bot_avatar_url?: string
          p_bot_name?: string
        }
        Returns: Json
      }
      add_bot_to_battle_simple: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      add_experience: {
        Args: { p_exp_amount: number; p_user_id: string }
        Returns: Json
      }
      add_friend: {
        Args: { p_friend_username: string }
        Returns: Json
      }
      add_track_to_playlist: {
        Args: { p_added_by: string; p_title: string; p_url: string }
        Returns: string
      }
      advance_crash_game: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      attempt_upgrade_item: {
        Args: {
          p_inventory_id: string
          p_multiplier: number
          p_user_id: string
        }
        Returns: Json
      }
      backup_chat_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_affiliate_tier: {
        Args: { referral_count: number }
        Returns: {
          commission_rate: number
          tier_level: number
          tier_name: string
        }[]
      }
      calculate_level_from_exp: {
        Args: { experience: number }
        Returns: number
      }
      calculate_user_level: {
        Args: { user_exp: number }
        Returns: number
      }
      can_claim_daily_box: {
        Args: { p_box_id: string; p_required_level: number; p_user_id: string }
        Returns: boolean
      }
      can_user_participate_giveaway: {
        Args: { p_giveaway_id: string; p_user_id: string }
        Returns: Json
      }
      check_daily_claim_status: {
        Args: { p_box_id: string; p_user_id: string }
        Returns: Json
      }
      check_total_probability: {
        Args: { box_id: string }
        Returns: number
      }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      claim_daily_box: {
        Args: { p_box_id: string; p_item_id: string; p_user_id: string }
        Returns: Json
      }
      claim_daily_box_fixed: {
        Args: { p_box_id: string; p_item_id: string; p_user_id: string }
        Returns: Json
      }
      claim_daily_freedrop: {
        Args:
          | { p_box_id: string; p_item_id: string; p_user_id: string }
          | { p_box_id: string; p_item_id: string; p_user_id: string }
        Returns: Json
      }
      claim_loyalty_bonus: {
        Args: { p_bonus_type: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_battles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_battles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_chat_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_chat_messages: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_stuck_battles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      crash_cashout: {
        Args: { p_multiplier: number; p_round_id: string }
        Returns: Json
      }
      create_battle: {
        Args: {
          p_box_ids: string[]
          p_is_private?: boolean
          p_max_players: number
          p_mode: string
          p_name: string
          p_password?: string
          p_user_id: string
        }
        Returns: Json
      }
      create_chat_giveaway: {
        Args: {
          p_admin_id: string
          p_amount: number
          p_duration_minutes?: number
          p_max_participants?: number
          p_title: string
          p_winners_count?: number
        }
        Returns: string
      }
      create_chat_poll: {
        Args: {
          p_created_by: string
          p_duration_minutes?: number
          p_options: string[]
          p_question: string
        }
        Returns: string
      }
      create_test_battles: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      distribute_rewards_simple: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      donate_coins_to_user: {
        Args: {
          p_amount: number
          p_from_user_id: string
          p_message?: string
          p_to_user_id: string
        }
        Returns: string
      }
      enter_chat_giveaway: {
        Args: { p_giveaway_id: string; p_user_id: string }
        Returns: boolean
      }
      finalize_battle: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      finalize_expired_giveaways: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      finish_battle: {
        Args: { p_battle_id: string; p_results: Json }
        Returns: Json
      }
      force_start_battle: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      generate_unique_username: {
        Args: { base_username: string }
        Returns: string
      }
      get_affiliate_stats: {
        Args: { p_user_id: string }
        Returns: {
          conversion_rate: number
          current_tier: string
          next_tier_requirement: number
          total_clicks: number
          total_earnings: number
          total_referrals: number
        }[]
      }
      get_chat_messages_with_reactions: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          badges: Json
          content: string
          created_at: string
          id: string
          is_bot: boolean
          is_pinned: boolean
          language: string
          level: number
          message_type: string
          mood: string
          reactions: Json
          reply_to: string
          translated_text: string
          user_id: string
          username: string
        }[]
      }
      get_chat_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_detailed_giveaway_history: {
        Args: { p_limit?: number }
        Returns: Json
      }
      get_giveaway_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          ends_at: string
          id: string
          participants_count: number
          status: string
          title: string
          total_amount: number
          winners_count: number
        }[]
      }
      get_loot_box_items_with_probabilities: {
        Args: { p_loot_box_id: string }
        Returns: {
          is_guaranteed: boolean
          item_battle_value: number
          item_id: string
          item_image_url: string
          item_name: string
          item_rarity: string
          max_quantity: number
          min_quantity: number
          probability: number
        }[]
      }
      get_loot_box_stats: {
        Args: { box_id: string }
        Returns: {
          avg_item_value: number
          max_item_value: number
          min_item_value: number
          rarity_distribution: Json
          total_items: number
          total_probability: number
        }[]
      }
      get_online_users_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_or_create_affiliate_data: {
        Args: { p_user_id: string }
        Returns: {
          clicks_count: number
          code: string
          commission_rate: number
          conversions_count: number
          id: string
          referrals_count: number
          total_earnings: number
          user_id: string
        }[]
      }
      get_or_create_affiliate_profile: {
        Args: { p_user_id: string; p_username?: string }
        Returns: {
          affiliate_code: string
          claimed_earnings: number | null
          clicks_count: number | null
          commission_rate: number | null
          conversions_count: number | null
          created_at: string | null
          custom_share_message: string | null
          id: string
          is_active: boolean | null
          pending_earnings: number | null
          referrals_count: number | null
          tier_level: number | null
          tier_name: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string
        }
      }
      get_signup_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          top_referrer_code: string
          top_referrer_count: number
          total_users: number
          users_this_month: number
          users_with_referral: number
        }[]
      }
      get_user_daily_claims: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          box_id: string
          box_name: string
          claimed_at: string
          item_id: string
          item_name: string
          item_value: number
        }[]
      }
      get_user_daily_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_freedrop_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_level: {
        Args: { user_exp: number }
        Returns: number
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_upgrade_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          final_value: number
          id: string
          item_name: string
          multiplier: number
          original_value: number
          success: boolean
          target_value: number
        }[]
      }
      get_user_upgrade_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      initialize_user_profile: {
        Args: { p_email?: string; p_user_id: string }
        Returns: Json
      }
      join_battle_simple: {
        Args: { p_battle_id: string; p_password?: string; p_user_id: string }
        Returns: Json
      }
      mark_item_as_shipped: {
        Args: { p_inventory_id: string; p_shipping_address_id?: string }
        Returns: boolean
      }
      open_battle_box: {
        Args: {
          p_battle_id: string
          p_box_instance: number
          p_participant_id: string
        }
        Returns: Json
      }
      open_loot_box: {
        Args: { p_loot_box_id: string; p_user_id: string }
        Returns: Json
      }
      participate_in_game: {
        Args: { p_answer: string; p_game_id: string; p_user_id: string }
        Returns: Json
      }
      place_crash_bet: {
        Args: { p_bet_amount: number }
        Returns: Json
      }
      process_box_opening: {
        Args: {
          p_cost: number
          p_item_id: string
          p_loot_box_id: string
          p_user_id: string
        }
        Returns: Json
      }
      purchase_coins: {
        Args: {
          p_amount: number
          p_stripe_payment_id: string
          p_user_id: string
        }
        Returns: Json
      }
      purchase_loot_box: {
        Args: { p_loot_box_id: string; p_user_id: string }
        Returns: Json
      }
      put_item_on_market: {
        Args: { p_inventory_id: string; p_market_price: number }
        Returns: boolean
      }
      register_affiliate_click: {
        Args: {
          p_affiliate_code: string
          p_ip_address?: unknown
          p_referrer_url?: string
          p_user_agent?: string
        }
        Returns: boolean
      }
      register_referral: {
        Args: { p_affiliate_code: string; p_referred_user_id: string }
        Returns: boolean
      }
      reset_chat_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      select_giveaway_winners: {
        Args: { p_admin_id: string; p_giveaway_id: string }
        Returns: string[]
      }
      sell_inventory_item: {
        Args: { p_inventory_item_id: string; p_sell_price?: number }
        Returns: Json
      }
      sell_inventory_item_fixed: {
        Args: { p_inventory_item_id: string }
        Returns: Json
      }
      sell_inventory_item_simple: {
        Args: { p_inventory_item_id: string; p_sell_price?: number }
        Returns: Json
      }
      sell_multiple_items: {
        Args: { p_inventory_item_ids: string[] }
        Returns: Json
      }
      sell_multiple_items_fixed: {
        Args: { p_inventory_item_ids: string[] }
        Returns: Json
      }
      sell_multiple_items_simple: {
        Args: { p_inventory_item_ids: string[] }
        Returns: Json
      }
      simulate_battle_box_opening: {
        Args: {
          p_battle_id: string
          p_loot_box_id: string
          p_participant_id: string
        }
        Returns: Json
      }
      simulate_loot_box_opening: {
        Args: { p_loot_box_id: string; p_quantity?: number }
        Returns: Json
      }
      start_battle_simple: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      start_mini_game: {
        Args: {
          p_challenge_data: Json
          p_duration_seconds?: number
          p_game_type: string
          p_name: string
          p_started_by: string
        }
        Returns: string
      }
      stop_active_giveaway: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      stop_giveaway: {
        Args: { p_giveaway_id: string }
        Returns: Json
      }
      test_daily_box_opening: {
        Args: { box_name: string }
        Returns: {
          item_name: string
          market_value: number
          probability: number
          rarity: string
        }[]
      }
      test_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          can_delete: boolean
          can_insert: boolean
          can_select: boolean
          can_update: boolean
          table_name: string
        }[]
      }
      toggle_message_reaction: {
        Args: { p_emoji: string; p_message_id: string; p_user_id: string }
        Returns: Json
      }
      toggle_pin_message: {
        Args: { p_message_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_battle_system: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          details: string
          status: string
        }[]
      }
      validate_referral_code: {
        Args: { code_to_check: string }
        Returns: {
          is_valid: boolean
          referrer_id: string
          referrer_username: string
        }[]
      }
      vote_music_track: {
        Args: { p_track_id: string; p_user_id: string; p_vote_type: string }
        Returns: boolean
      }
      vote_on_poll: {
        Args: { p_option_index: number; p_poll_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
