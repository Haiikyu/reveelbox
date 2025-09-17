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
          clicked_at: string
          converted: boolean
          id: string
          ip_address: unknown | null
          referrer_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          clicked_at?: string
          converted?: boolean
          id?: string
          ip_address?: unknown | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          clicked_at?: string
          converted?: boolean
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
          created_at: string
          id: string
          method: string
          processed_at: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          clicks_count: number
          code: string
          commission_rate: number
          conversions_count: number
          created_at: string
          id: string
          is_active: boolean
          referrals_count: number
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks_count?: number
          code: string
          commission_rate?: number
          conversions_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referrals_count?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks_count?: number
          code?: string
          commission_rate?: number
          conversions_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referrals_count?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      battle_boxes: {
        Row: {
          battle_id: string | null
          created_at: string | null
          id: string
          loot_box_id: string | null
          order_position: number | null
          quantity: number | null
        }
        Insert: {
          battle_id?: string | null
          created_at?: string | null
          id?: string
          loot_box_id?: string | null
          order_position?: number | null
          quantity?: number | null
        }
        Update: {
          battle_id?: string | null
          created_at?: string | null
          id?: string
          loot_box_id?: string | null
          order_position?: number | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_boxes_loot_box_id_fkey"
            columns: ["loot_box_id"]
            isOneToOne: false
            referencedRelation: "loot_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_invitations: {
        Row: {
          battle_id: string | null
          created_at: string | null
          expires_at: string | null
          from_user_id: string | null
          id: string
          status: string | null
          to_user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          from_user_id?: string | null
          id?: string
          status?: string | null
          to_user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          from_user_id?: string | null
          id?: string
          status?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_invitations_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_messages: {
        Row: {
          battle_id: string
          created_at: string | null
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          battle_id: string
          created_at?: string | null
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          battle_id?: string
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_messages_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_openings: {
        Row: {
          battle_id: string | null
          box_instance: number | null
          id: string
          item_id: string | null
          item_value: number
          loot_box_id: string | null
          opened_at: string | null
          user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          box_instance?: number | null
          id?: string
          item_id?: string | null
          item_value: number
          loot_box_id?: string | null
          opened_at?: string | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          box_instance?: number | null
          id?: string
          item_id?: string | null
          item_value?: number
          loot_box_id?: string | null
          opened_at?: string | null
          user_id?: string | null
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
        ]
      }
      battle_participants: {
        Row: {
          battle_id: string | null
          id: string
          is_ready: boolean | null
          joined_at: string | null
          position: number | null
          team: number | null
          total_value: number | null
          user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          position?: number | null
          team?: number | null
          total_value?: number | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          position?: number | null
          team?: number | null
          total_value?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      battle_players: {
        Row: {
          battle_id: string | null
          is_winner: boolean | null
          joined_at: string | null
          total_value: number | null
          user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          is_winner?: boolean | null
          joined_at?: string | null
          total_value?: number | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          is_winner?: boolean | null
          joined_at?: string | null
          total_value?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      battle_spectators: {
        Row: {
          battle_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_spectators_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          current_box: number | null
          entry_cost: number
          expires_at: string | null
          finished_at: string | null
          id: string
          is_private: boolean | null
          max_players: number
          mode: string
          password: string | null
          started_at: string | null
          status: string | null
          total_boxes: number | null
          total_prize: number
          updated_at: string | null
          winner_id: string | null
          winner_team: number | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_box?: number | null
          entry_cost: number
          expires_at?: string | null
          finished_at?: string | null
          id?: string
          is_private?: boolean | null
          max_players: number
          mode: string
          password?: string | null
          started_at?: string | null
          status?: string | null
          total_boxes?: number | null
          total_prize: number
          updated_at?: string | null
          winner_id?: string | null
          winner_team?: number | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          current_box?: number | null
          entry_cost?: number
          expires_at?: string | null
          finished_at?: string | null
          id?: string
          is_private?: boolean | null
          max_players?: number
          mode?: string
          password?: string | null
          started_at?: string | null
          status?: string | null
          total_boxes?: number | null
          total_prize?: number
          updated_at?: string | null
          winner_id?: string | null
          winner_team?: number | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_bot: boolean | null
          message_type: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          message_type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          message_type?: string | null
          user_id?: string | null
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
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      giveaway_participants: {
        Row: {
          giveaway_id: string | null
          id: string
          participated_at: string | null
          user_id: string | null
        }
        Insert: {
          giveaway_id?: string | null
          id?: string
          participated_at?: string | null
          user_id?: string | null
        }
        Update: {
          giveaway_id?: string | null
          id?: string
          participated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          created_at: string | null
          ends_at: string
          id: string
          min_level: number
          starts_at: string | null
          status: string | null
          title: string
          total_amount: number
          winners_count: number
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          id?: string
          min_level?: number
          starts_at?: string | null
          status?: string | null
          title: string
          total_amount: number
          winners_count?: number
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          id?: string
          min_level?: number
          starts_at?: string | null
          status?: string | null
          title?: string
          total_amount?: number
          winners_count?: number
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          coins_balance: number | null
          consecutive_days: number | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean
          last_freedrop_claim: string | null
          level: number | null
          location: string | null
          loyalty_points: number
          notifications_email: boolean | null
          notifications_push: boolean | null
          phone: string | null
          privacy_profile: string | null
          role: string
          total_exp: number | null
          updated_at: string | null
          username: string | null
          virtual_currency: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          coins_balance?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          last_freedrop_claim?: string | null
          level?: number | null
          location?: string | null
          loyalty_points?: number
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          privacy_profile?: string | null
          role?: string
          total_exp?: number | null
          updated_at?: string | null
          username?: string | null
          virtual_currency?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          coins_balance?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          last_freedrop_claim?: string | null
          level?: number | null
          location?: string | null
          loyalty_points?: number
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          privacy_profile?: string | null
          role?: string
          total_exp?: number | null
          updated_at?: string | null
          username?: string | null
          virtual_currency?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          affiliate_code: string
          commission_earned: number
          conversion_date: string | null
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string
        }
        Insert: {
          affiliate_code: string
          commission_earned?: number
          conversion_date?: string | null
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
        }
        Update: {
          affiliate_code?: string
          commission_earned?: number
          conversion_date?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
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
          stripe_payment_id?: string | null
          type?: string
          user_id?: string | null
          virtual_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      add_experience: {
        Args: { p_exp_amount: number; p_user_id: string }
        Returns: Json
      }
      add_friend: {
        Args: { p_friend_username: string }
        Returns: Json
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
        Args: { p_box_id: string; p_item_id: string; p_user_id: string }
        Returns: Json
      }
      claim_loyalty_bonus: {
        Args: { p_bonus_type: string; p_user_id: string }
        Returns: Json
      }
      crash_cashout: {
        Args: { p_multiplier: number; p_round_id: string }
        Returns: Json
      }
      create_battle: {
        Args:
          | {
              p_box_configs: Json
              p_entry_cost: number
              p_is_private?: boolean
              p_max_players: number
              p_mode: string
              p_password?: string
            }
          | {
              p_box_configs: Json
              p_entry_cost: number
              p_is_private?: boolean
              p_max_players: number
              p_mode: string
              p_password?: string
            }
        Returns: string
      }
      create_battle_rpc: {
        Args: {
          p_entry_cost: number
          p_is_private?: boolean
          p_max_players: number
          p_mode: string
          p_password?: string
          p_total_prize?: number
        }
        Returns: Json
      }
      create_battle_with_boxes: {
        Args: {
          p_boxes: Json
          p_entry_cost: number
          p_is_private: boolean
          p_max_players: number
          p_mode: string
          p_password?: string
          p_total_prize: number
        }
        Returns: string
      }
      create_simple_battle: {
        Args: { p_entry_cost?: number; p_mode?: string }
        Returns: string
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
      get_battle_status: {
        Args: { p_battle_id: string }
        Returns: Json
      }
      get_detailed_giveaway_history: {
        Args: { p_limit?: number }
        Returns: Json
      }
      get_giveaway_history: {
        Args: { p_limit?: number }
        Returns: Json
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
      join_battle: {
        Args: { p_battle_id: string }
        Returns: boolean
      }
      join_battle_rpc: {
        Args: { p_battle_id: string; p_password?: string }
        Returns: Json
      }
      join_simple_battle: {
        Args: { p_battle_id: string }
        Returns: boolean
      }
      mark_item_as_shipped: {
        Args: { p_inventory_id: string; p_shipping_address_id?: string }
        Returns: boolean
      }
      open_battle_boxes: {
        Args:
          | { p_battle_id: string }
          | { p_battle_id: string; p_user_id: string }
        Returns: Json
      }
      open_loot_box: {
        Args: { p_loot_box_id: string; p_user_id: string }
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
      simulate_loot_box_opening: {
        Args: { p_loot_box_id: string; p_quantity?: number }
        Returns: Json
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
      validate_referral_code: {
        Args: { code_to_check: string }
        Returns: {
          is_valid: boolean
          referrer_id: string
          referrer_username: string
        }[]
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
