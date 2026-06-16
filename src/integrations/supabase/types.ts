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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          emoji: string
          guild_id: string
          hidden: boolean
          id: string
          name: string
          points: number
          reward_badge_id: string | null
          reward_coins: number
          reward_xp: number
          trigger_type: string
          trigger_value: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string
          emoji?: string
          guild_id: string
          hidden?: boolean
          id?: string
          name: string
          points?: number
          reward_badge_id?: string | null
          reward_coins?: number
          reward_xp?: number
          trigger_type?: string
          trigger_value?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          emoji?: string
          guild_id?: string
          hidden?: boolean
          id?: string
          name?: string
          points?: number
          reward_badge_id?: string | null
          reward_coins?: number
          reward_xp?: number
          trigger_type?: string
          trigger_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          guild_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          guild_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          guild_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      automod_config: {
        Row: {
          anti_caps_enabled: boolean
          anti_caps_threshold: number
          anti_flood_enabled: boolean
          anti_flood_threshold: number
          anti_invite_enabled: boolean
          anti_link_enabled: boolean
          anti_mention_enabled: boolean
          anti_mention_threshold: number
          anti_spam_enabled: boolean
          anti_spam_interval: number
          anti_spam_threshold: number
          blacklist_punishment: string
          blacklist_words: string[]
          created_at: string
          enabled: boolean
          guild_id: string
          invite_punishment: string
          link_punishment: string
          punishment: string
          spam_punishment: string
          spam_punishment_duration: number
          updated_at: string
          updated_by: string | null
          warn_user_on_delete: boolean
          whitelist_channels: string[]
          whitelist_roles: string[]
          whitelist_users: string[]
        }
        Insert: {
          anti_caps_enabled?: boolean
          anti_caps_threshold?: number
          anti_flood_enabled?: boolean
          anti_flood_threshold?: number
          anti_invite_enabled?: boolean
          anti_link_enabled?: boolean
          anti_mention_enabled?: boolean
          anti_mention_threshold?: number
          anti_spam_enabled?: boolean
          anti_spam_interval?: number
          anti_spam_threshold?: number
          blacklist_punishment?: string
          blacklist_words?: string[]
          created_at?: string
          enabled?: boolean
          guild_id: string
          invite_punishment?: string
          link_punishment?: string
          punishment?: string
          spam_punishment?: string
          spam_punishment_duration?: number
          updated_at?: string
          updated_by?: string | null
          warn_user_on_delete?: boolean
          whitelist_channels?: string[]
          whitelist_roles?: string[]
          whitelist_users?: string[]
        }
        Update: {
          anti_caps_enabled?: boolean
          anti_caps_threshold?: number
          anti_flood_enabled?: boolean
          anti_flood_threshold?: number
          anti_invite_enabled?: boolean
          anti_link_enabled?: boolean
          anti_mention_enabled?: boolean
          anti_mention_threshold?: number
          anti_spam_enabled?: boolean
          anti_spam_interval?: number
          anti_spam_threshold?: number
          blacklist_punishment?: string
          blacklist_words?: string[]
          created_at?: string
          enabled?: boolean
          guild_id?: string
          invite_punishment?: string
          link_punishment?: string
          punishment?: string
          spam_punishment?: string
          spam_punishment_duration?: number
          updated_at?: string
          updated_by?: string | null
          warn_user_on_delete?: boolean
          whitelist_channels?: string[]
          whitelist_roles?: string[]
          whitelist_users?: string[]
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          color: string
          created_at: string
          description: string
          emoji: string
          guild_id: string
          hidden: boolean
          icon_url: string | null
          id: string
          name: string
          rarity: string
          updated_at: string
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          guild_id: string
          hidden?: boolean
          icon_url?: string | null
          id?: string
          name: string
          rarity?: string
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          guild_id?: string
          hidden?: boolean
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      blacklisted_words: {
        Row: {
          active: boolean
          created_at: string
          delete_message: boolean
          guild_id: string
          id: string
          punishment: string
          updated_at: string
          word: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delete_message?: boolean
          guild_id: string
          id?: string
          punishment?: string
          updated_at?: string
          word: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delete_message?: boolean
          guild_id?: string
          id?: string
          punishment?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      command_permissions: {
        Row: {
          allowed_channels: string[]
          allowed_roles: string[]
          command_name: string
          cooldown_override: number | null
          created_at: string
          denied_channels: string[]
          denied_roles: string[]
          enabled: boolean
          guild_id: string
          hidden_from_help: boolean
          premium_guild_only: boolean
          staff_only: boolean
          updated_at: string
          updated_by: string | null
          vip_only: boolean
        }
        Insert: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          command_name: string
          cooldown_override?: number | null
          created_at?: string
          denied_channels?: string[]
          denied_roles?: string[]
          enabled?: boolean
          guild_id: string
          hidden_from_help?: boolean
          premium_guild_only?: boolean
          staff_only?: boolean
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Update: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          command_name?: string
          cooldown_override?: number | null
          created_at?: string
          denied_channels?: string[]
          denied_roles?: string[]
          enabled?: boolean
          guild_id?: string
          hidden_from_help?: boolean
          premium_guild_only?: boolean
          staff_only?: boolean
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Relationships: []
      }
      community_config: {
        Row: {
          created_at: string
          guild_id: string
          polls_allow_anonymous: boolean
          polls_enabled: boolean
          polls_log_channel_id: string | null
          polls_max_options: number
          suggestions_allow_anonymous: boolean
          suggestions_allow_voting: boolean
          suggestions_channel_id: string | null
          suggestions_enabled: boolean
          suggestions_log_channel_id: string | null
          suggestions_require_reason: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          polls_allow_anonymous?: boolean
          polls_enabled?: boolean
          polls_log_channel_id?: string | null
          polls_max_options?: number
          suggestions_allow_anonymous?: boolean
          suggestions_allow_voting?: boolean
          suggestions_channel_id?: string | null
          suggestions_enabled?: boolean
          suggestions_log_channel_id?: string | null
          suggestions_require_reason?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          polls_allow_anonymous?: boolean
          polls_enabled?: boolean
          polls_log_channel_id?: string | null
          polls_max_options?: number
          suggestions_allow_anonymous?: boolean
          suggestions_allow_voting?: boolean
          suggestions_channel_id?: string | null
          suggestions_enabled?: boolean
          suggestions_log_channel_id?: string | null
          suggestions_require_reason?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      custom_commands: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          embed: Json | null
          enabled: boolean
          guild_id: string
          id: string
          name: string
          required_roles: string[]
          response_text: string | null
          updated_at: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          embed?: Json | null
          enabled?: boolean
          guild_id: string
          id?: string
          name: string
          required_roles?: string[]
          response_text?: string | null
          updated_at?: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          embed?: Json | null
          enabled?: boolean
          guild_id?: string
          id?: string
          name?: string
          required_roles?: string[]
          response_text?: string | null
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      dashboard_permissions: {
        Row: {
          areas: string[]
          created_at: string
          guild_id: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          areas?: string[]
          created_at?: string
          guild_id: string
          id?: string
          role_id: string
          updated_at?: string
        }
        Update: {
          areas?: string[]
          created_at?: string
          guild_id?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      economy_config: {
        Row: {
          created_at: string
          currency_emoji: string
          currency_name: string
          daily_amount: number
          enabled: boolean
          guild_id: string
          updated_at: string
          updated_by: string | null
          work_cooldown_seconds: number
          work_max: number
          work_min: number
        }
        Insert: {
          created_at?: string
          currency_emoji?: string
          currency_name?: string
          daily_amount?: number
          enabled?: boolean
          guild_id: string
          updated_at?: string
          updated_by?: string | null
          work_cooldown_seconds?: number
          work_max?: number
          work_min?: number
        }
        Update: {
          created_at?: string
          currency_emoji?: string
          currency_name?: string
          daily_amount?: number
          enabled?: boolean
          guild_id?: string
          updated_at?: string
          updated_by?: string | null
          work_cooldown_seconds?: number
          work_max?: number
          work_min?: number
        }
        Relationships: []
      }
      economy_missions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          goal: number
          guild_id: string
          id: string
          kind: string
          reward: number
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal?: number
          guild_id: string
          id?: string
          kind: string
          reward?: number
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal?: number
          guild_id?: string
          id?: string
          kind?: string
          reward?: number
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      economy_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          guild_id: string
          id: string
          kind: string
          metadata: Json
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          guild_id: string
          id?: string
          kind: string
          metadata?: Json
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          guild_id?: string
          id?: string
          kind?: string
          metadata?: Json
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      embed_templates: {
        Row: {
          created_at: string
          created_by: string | null
          embed: Json
          guild_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          embed: Json
          guild_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          embed?: Json
          guild_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      guild_autoroles: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          role_id: string
          target: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          role_id: string
          target?: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          role_id?: string
          target?: string
        }
        Relationships: []
      }
      guild_configs: {
        Row: {
          created_at: string
          guild_id: string
          updated_at: string
          updated_by: string | null
          welcome_channel_id: string | null
          welcome_embed_color: string
          welcome_embed_enabled: boolean
          welcome_enabled: boolean
          welcome_message: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          updated_at?: string
          updated_by?: string | null
          welcome_channel_id?: string | null
          welcome_embed_color?: string
          welcome_embed_enabled?: boolean
          welcome_enabled?: boolean
          welcome_message?: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          updated_at?: string
          updated_by?: string | null
          welcome_channel_id?: string | null
          welcome_embed_color?: string
          welcome_embed_enabled?: boolean
          welcome_enabled?: boolean
          welcome_message?: string
        }
        Relationships: []
      }
      guild_logs_config: {
        Row: {
          channel_channel_id: string | null
          channel_create: boolean
          channel_delete: boolean
          channel_update: boolean
          created_at: string
          emoji_update: boolean
          guild_id: string
          ignored_channels: string[]
          ignored_roles: string[]
          ignored_users: string[]
          invite_channel_id: string | null
          invite_create: boolean
          invite_delete: boolean
          log_channel_id: string | null
          member_ban: boolean
          member_channel_id: string | null
          member_join: boolean
          member_kick: boolean
          member_leave: boolean
          member_nickname_update: boolean
          member_role_update: boolean
          member_timeout: boolean
          member_unban: boolean
          message_bulk_delete: boolean
          message_channel_id: string | null
          message_delete: boolean
          message_edit: boolean
          mod_channel_id: string | null
          role_channel_id: string | null
          role_create: boolean
          role_delete: boolean
          role_update: boolean
          server_channel_id: string | null
          server_update: boolean
          updated_at: string
          updated_by: string | null
          user_update: boolean
          voice_channel_id: string | null
          voice_state_update: boolean
        }
        Insert: {
          channel_channel_id?: string | null
          channel_create?: boolean
          channel_delete?: boolean
          channel_update?: boolean
          created_at?: string
          emoji_update?: boolean
          guild_id: string
          ignored_channels?: string[]
          ignored_roles?: string[]
          ignored_users?: string[]
          invite_channel_id?: string | null
          invite_create?: boolean
          invite_delete?: boolean
          log_channel_id?: string | null
          member_ban?: boolean
          member_channel_id?: string | null
          member_join?: boolean
          member_kick?: boolean
          member_leave?: boolean
          member_nickname_update?: boolean
          member_role_update?: boolean
          member_timeout?: boolean
          member_unban?: boolean
          message_bulk_delete?: boolean
          message_channel_id?: string | null
          message_delete?: boolean
          message_edit?: boolean
          mod_channel_id?: string | null
          role_channel_id?: string | null
          role_create?: boolean
          role_delete?: boolean
          role_update?: boolean
          server_channel_id?: string | null
          server_update?: boolean
          updated_at?: string
          updated_by?: string | null
          user_update?: boolean
          voice_channel_id?: string | null
          voice_state_update?: boolean
        }
        Update: {
          channel_channel_id?: string | null
          channel_create?: boolean
          channel_delete?: boolean
          channel_update?: boolean
          created_at?: string
          emoji_update?: boolean
          guild_id?: string
          ignored_channels?: string[]
          ignored_roles?: string[]
          ignored_users?: string[]
          invite_channel_id?: string | null
          invite_create?: boolean
          invite_delete?: boolean
          log_channel_id?: string | null
          member_ban?: boolean
          member_channel_id?: string | null
          member_join?: boolean
          member_kick?: boolean
          member_leave?: boolean
          member_nickname_update?: boolean
          member_role_update?: boolean
          member_timeout?: boolean
          member_unban?: boolean
          message_bulk_delete?: boolean
          message_channel_id?: string | null
          message_delete?: boolean
          message_edit?: boolean
          mod_channel_id?: string | null
          role_channel_id?: string | null
          role_create?: boolean
          role_delete?: boolean
          role_update?: boolean
          server_channel_id?: string | null
          server_update?: boolean
          updated_at?: string
          updated_by?: string | null
          user_update?: boolean
          voice_channel_id?: string | null
          voice_state_update?: boolean
        }
        Relationships: []
      }
      level_config: {
        Row: {
          cooldown_seconds: number
          created_at: string
          delete_level_up_after_seconds: number
          enabled: boolean
          global_multiplier: number
          guild_id: string
          id: string
          level_up_channel_id: string | null
          level_up_message: string
          level_up_message_mode: string
          max_xp_per_message: number
          min_message_length: number
          min_xp_per_message: number
          send_level_up_message: boolean
          updated_at: string
          vip_multiplier: number
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string
          delete_level_up_after_seconds?: number
          enabled?: boolean
          global_multiplier?: number
          guild_id: string
          id?: string
          level_up_channel_id?: string | null
          level_up_message?: string
          level_up_message_mode?: string
          max_xp_per_message?: number
          min_message_length?: number
          min_xp_per_message?: number
          send_level_up_message?: boolean
          updated_at?: string
          vip_multiplier?: number
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string
          delete_level_up_after_seconds?: number
          enabled?: boolean
          global_multiplier?: number
          guild_id?: string
          id?: string
          level_up_channel_id?: string | null
          level_up_message?: string
          level_up_message_mode?: string
          max_xp_per_message?: number
          min_message_length?: number
          min_xp_per_message?: number
          send_level_up_message?: boolean
          updated_at?: string
          vip_multiplier?: number
        }
        Relationships: []
      }
      level_logs: {
        Row: {
          action: string
          amount: number | null
          created_at: string
          details: Json | null
          guild_id: string
          id: string
          level: number | null
          user_id: string
        }
        Insert: {
          action: string
          amount?: number | null
          created_at?: string
          details?: Json | null
          guild_id: string
          id?: string
          level?: number | null
          user_id: string
        }
        Update: {
          action?: string
          amount?: number | null
          created_at?: string
          details?: Json | null
          guild_id?: string
          id?: string
          level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      level_rewards: {
        Row: {
          active: boolean
          created_at: string
          guild_id: string
          id: string
          level: number
          remove_previous_roles: boolean
          reward_type: string
          reward_value: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          guild_id: string
          id?: string
          level: number
          remove_previous_roles?: boolean
          reward_type: string
          reward_value: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          guild_id?: string
          id?: string
          level?: number
          remove_previous_roles?: boolean
          reward_type?: string
          reward_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_rewards_legacy: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          level: number
          role_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          level: number
          role_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          level?: number
          role_id?: string
        }
        Relationships: []
      }
      level_season_users: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          level: number
          messages_count: number
          season_id: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          level?: number
          messages_count?: number
          season_id: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          level?: number
          messages_count?: number
          season_id?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_season_users_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "level_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      level_seasons: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          guild_id: string
          id: string
          is_active: boolean
          name: string
          starts_at: string
          updated_at: string
          xp_multiplier: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          guild_id: string
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string
          updated_at?: string
          xp_multiplier?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          guild_id?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string
          updated_at?: string
          xp_multiplier?: number
        }
        Relationships: []
      }
      level_users: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          last_xp_at: string | null
          level: number
          messages_count: number
          total_xp: number
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          last_xp_at?: string | null
          level?: number
          messages_count?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          last_xp_at?: string | null
          level?: number
          messages_count?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      leveling_config_legacy: {
        Row: {
          cooldown_seconds: number
          created_at: string
          enabled: boolean
          guild_id: string
          level_up_channel_id: string | null
          level_up_dm: boolean
          level_up_message: string
          no_xp_channels: string[]
          no_xp_roles: string[]
          stack_rewards: boolean
          updated_at: string
          updated_by: string | null
          xp_per_message_max: number
          xp_per_message_min: number
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string
          enabled?: boolean
          guild_id: string
          level_up_channel_id?: string | null
          level_up_dm?: boolean
          level_up_message?: string
          no_xp_channels?: string[]
          no_xp_roles?: string[]
          stack_rewards?: boolean
          updated_at?: string
          updated_by?: string | null
          xp_per_message_max?: number
          xp_per_message_min?: number
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string
          enabled?: boolean
          guild_id?: string
          level_up_channel_id?: string | null
          level_up_dm?: boolean
          level_up_message?: string
          no_xp_channels?: string[]
          no_xp_roles?: string[]
          stack_rewards?: boolean
          updated_at?: string
          updated_by?: string | null
          xp_per_message_max?: number
          xp_per_message_min?: number
        }
        Relationships: []
      }
      mod_appeals: {
        Row: {
          case_number: number
          created_at: string
          guild_id: string
          id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number: number
          created_at?: string
          guild_id: string
          id?: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: number
          created_at?: string
          guild_id?: string
          id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mod_cases: {
        Row: {
          action: string
          active: boolean
          case_number: number
          created_at: string
          duration_seconds: number | null
          edited_at: string | null
          edited_by: string | null
          expires_at: string | null
          guild_id: string
          id: string
          moderator_id: string
          moderator_tag: string | null
          proof_url: string | null
          reason: string | null
          severity: string | null
          source: string
          user_id: string
          user_tag: string | null
        }
        Insert: {
          action: string
          active?: boolean
          case_number: number
          created_at?: string
          duration_seconds?: number | null
          edited_at?: string | null
          edited_by?: string | null
          expires_at?: string | null
          guild_id: string
          id?: string
          moderator_id: string
          moderator_tag?: string | null
          proof_url?: string | null
          reason?: string | null
          severity?: string | null
          source?: string
          user_id: string
          user_tag?: string | null
        }
        Update: {
          action?: string
          active?: boolean
          case_number?: number
          created_at?: string
          duration_seconds?: number | null
          edited_at?: string | null
          edited_by?: string | null
          expires_at?: string | null
          guild_id?: string
          id?: string
          moderator_id?: string
          moderator_tag?: string | null
          proof_url?: string | null
          reason?: string | null
          severity?: string | null
          source?: string
          user_id?: string
          user_tag?: string | null
        }
        Relationships: []
      }
      moderation_configs: {
        Row: {
          allow_temporary_ban: boolean
          allow_temporary_mute: boolean
          appeal_url: string | null
          audit_log_enabled: boolean
          created_at: string
          default_mute_duration: number
          default_warn_punishment: string
          default_warn_punishment_duration: number
          delete_punished_messages: boolean
          dm_punished_user: boolean
          embed_color: number
          embed_footer: string
          embed_icon_url: string | null
          enabled: boolean
          enabled_log_events: string[]
          guild_id: string
          log_channel_id: string | null
          logs_retention_days: number
          max_warnings: number
          mute_role_id: string | null
          protected_role_ids: string[]
          protected_user_ids: string[]
          punishment_dm_template: string
          updated_at: string
          warn_expiry_days: number
          warn_points_high: number
          warn_points_low: number
          warn_points_medium: number
        }
        Insert: {
          allow_temporary_ban?: boolean
          allow_temporary_mute?: boolean
          appeal_url?: string | null
          audit_log_enabled?: boolean
          created_at?: string
          default_mute_duration?: number
          default_warn_punishment?: string
          default_warn_punishment_duration?: number
          delete_punished_messages?: boolean
          dm_punished_user?: boolean
          embed_color?: number
          embed_footer?: string
          embed_icon_url?: string | null
          enabled?: boolean
          enabled_log_events?: string[]
          guild_id: string
          log_channel_id?: string | null
          logs_retention_days?: number
          max_warnings?: number
          mute_role_id?: string | null
          protected_role_ids?: string[]
          protected_user_ids?: string[]
          punishment_dm_template?: string
          updated_at?: string
          warn_expiry_days?: number
          warn_points_high?: number
          warn_points_low?: number
          warn_points_medium?: number
        }
        Update: {
          allow_temporary_ban?: boolean
          allow_temporary_mute?: boolean
          appeal_url?: string | null
          audit_log_enabled?: boolean
          created_at?: string
          default_mute_duration?: number
          default_warn_punishment?: string
          default_warn_punishment_duration?: number
          delete_punished_messages?: boolean
          dm_punished_user?: boolean
          embed_color?: number
          embed_footer?: string
          embed_icon_url?: string | null
          enabled?: boolean
          enabled_log_events?: string[]
          guild_id?: string
          log_channel_id?: string | null
          logs_retention_days?: number
          max_warnings?: number
          mute_role_id?: string | null
          protected_role_ids?: string[]
          protected_user_ids?: string[]
          punishment_dm_template?: string
          updated_at?: string
          warn_expiry_days?: number
          warn_points_high?: number
          warn_points_low?: number
          warn_points_medium?: number
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          guild_id: string
          id: number
          moderator_id: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          guild_id: string
          id?: number
          moderator_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          guild_id?: string
          id?: number
          moderator_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moderation_permission_roles: {
        Row: {
          can_ban: boolean
          can_clear_messages: boolean
          can_kick: boolean
          can_lock_channel: boolean
          can_manage_automod: boolean
          can_manage_blacklist: boolean
          can_manage_moderation_config: boolean
          can_mute: boolean
          can_remove_warn: boolean
          can_unban: boolean
          can_unlock_channel: boolean
          can_unmute: boolean
          can_use_moderation: boolean
          can_view_history: boolean
          can_view_logs: boolean
          can_warn: boolean
          created_at: string
          guild_id: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          can_ban?: boolean
          can_clear_messages?: boolean
          can_kick?: boolean
          can_lock_channel?: boolean
          can_manage_automod?: boolean
          can_manage_blacklist?: boolean
          can_manage_moderation_config?: boolean
          can_mute?: boolean
          can_remove_warn?: boolean
          can_unban?: boolean
          can_unlock_channel?: boolean
          can_unmute?: boolean
          can_use_moderation?: boolean
          can_view_history?: boolean
          can_view_logs?: boolean
          can_warn?: boolean
          created_at?: string
          guild_id: string
          id?: string
          role_id: string
          updated_at?: string
        }
        Update: {
          can_ban?: boolean
          can_clear_messages?: boolean
          can_kick?: boolean
          can_lock_channel?: boolean
          can_manage_automod?: boolean
          can_manage_blacklist?: boolean
          can_manage_moderation_config?: boolean
          can_mute?: boolean
          can_remove_warn?: boolean
          can_unban?: boolean
          can_unlock_channel?: boolean
          can_unmute?: boolean
          can_use_moderation?: boolean
          can_view_history?: boolean
          can_view_logs?: boolean
          can_warn?: boolean
          created_at?: string
          guild_id?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          anonymous: boolean
          channel_id: string
          created_at: string
          created_by: string
          ends_at: string | null
          guild_id: string
          id: string
          message_id: string | null
          multiple_choice: boolean
          options: Json
          question: string
          status: string
          updated_at: string
        }
        Insert: {
          anonymous?: boolean
          channel_id: string
          created_at?: string
          created_by: string
          ends_at?: string | null
          guild_id: string
          id?: string
          message_id?: string | null
          multiple_choice?: boolean
          options: Json
          question: string
          status?: string
          updated_at?: string
        }
        Update: {
          anonymous?: boolean
          channel_id?: string
          created_at?: string
          created_by?: string
          ends_at?: string | null
          guild_id?: string
          id?: string
          message_id?: string | null
          multiple_choice?: boolean
          options?: Json
          question?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_activation_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          max_uses: number
          notes: string | null
          plan_id: string
          type: string
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          notes?: string | null
          plan_id: string
          type: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          notes?: string | null
          plan_id?: string
          type?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "premium_activation_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_activations: {
        Row: {
          activated_at: string
          code_id: string
          guild_id: string | null
          id: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string
          code_id: string
          guild_id?: string | null
          id?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string
          code_id?: string
          guild_id?: string | null
          id?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_activations_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "premium_activation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_activations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "premium_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json
          id: string
          plan_id: string | null
          target_guild_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          plan_id?: string | null
          target_guild_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          plan_id?: string | null
          target_guild_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_audit_log_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_benefits: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          plan_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          plan_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          plan_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "premium_benefits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_feature_usage: {
        Row: {
          created_at: string
          feature_key: string
          guild_id: string | null
          id: string
          limit_amount: number
          reset_at: string | null
          updated_at: string
          used_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          guild_id?: string | null
          id?: string
          limit_amount?: number
          reset_at?: string | null
          updated_at?: string
          used_amount?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          guild_id?: string | null
          id?: string
          limit_amount?: number
          reset_at?: string | null
          updated_at?: string
          used_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      premium_guild_config: {
        Row: {
          allow_vip_shop_items: boolean
          allow_vip_tickets: boolean
          appearance: Json
          created_at: string
          guild_id: string
          premium_log_channel_id: string | null
          premium_role_id: string | null
          show_premium_badges: boolean
          updated_at: string
          vip_role_id: string | null
        }
        Insert: {
          allow_vip_shop_items?: boolean
          allow_vip_tickets?: boolean
          appearance?: Json
          created_at?: string
          guild_id: string
          premium_log_channel_id?: string | null
          premium_role_id?: string | null
          show_premium_badges?: boolean
          updated_at?: string
          vip_role_id?: string | null
        }
        Update: {
          allow_vip_shop_items?: boolean
          allow_vip_tickets?: boolean
          appearance?: Json
          created_at?: string
          guild_id?: string
          premium_log_channel_id?: string | null
          premium_role_id?: string | null
          show_premium_badges?: boolean
          updated_at?: string
          vip_role_id?: string | null
        }
        Relationships: []
      }
      premium_plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string | null
          description: string | null
          duration_days: number | null
          features: Json
          id: string
          limits: Json
          name: string
          price: number | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json
          id?: string
          limits?: Json
          name: string
          price?: number | null
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json
          id?: string
          limits?: Json
          name?: string
          price?: number | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          guild_id: string | null
          id: string
          notes: string | null
          plan_id: string
          source: string | null
          starts_at: string
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          guild_id?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          source?: string | null
          starts_at?: string
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          guild_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          source?: string | null
          starts_at?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      punishments: {
        Row: {
          active: boolean
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          guild_id: string
          id: number
          metadata: Json
          moderator_id: string
          moderator_name: string | null
          reason: string | null
          type: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id: string
          id?: number
          metadata?: Json
          moderator_id: string
          moderator_name?: string | null
          reason?: string | null
          type: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id?: string
          id?: number
          metadata?: Json
          moderator_id?: string
          moderator_name?: string | null
          reason?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reaction_roles: {
        Row: {
          channel_id: string
          created_at: string
          emoji: string
          group_key: string | null
          guild_id: string
          id: string
          message_id: string
          mode: string
          role_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          emoji: string
          group_key?: string | null
          guild_id: string
          id?: string
          message_id: string
          mode?: string
          role_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          emoji?: string
          group_key?: string | null
          guild_id?: string
          id?: string
          message_id?: string
          mode?: string
          role_id?: string
        }
        Relationships: []
      }
      reputation_logs: {
        Row: {
          created_at: string
          from_user_id: string
          guild_id: string
          id: string
          message: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          guild_id: string
          id?: string
          message?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          guild_id?: string
          id?: string
          message?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      server_audit_logs: {
        Row: {
          actor_id: string | null
          actor_tag: string | null
          after: Json | null
          before: Json | null
          category: string
          channel_id: string | null
          created_at: string
          event: string
          guild_id: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_tag: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_tag?: string | null
          after?: Json | null
          before?: Json | null
          category: string
          channel_id?: string | null
          created_at?: string
          event: string
          guild_id: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_tag?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_tag?: string | null
          after?: Json | null
          before?: Json | null
          category?: string
          channel_id?: string | null
          created_at?: string
          event?: string
          guild_id?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_tag?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          guild_id: string
          id: string
          name: string
          price: number
          role_id: string | null
          stock: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          guild_id: string
          id?: string
          name: string
          price: number
          role_id?: string | null
          stock?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          guild_id?: string
          id?: string
          name?: string
          price?: number
          role_id?: string | null
          stock?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_rotation_config: {
        Row: {
          created_at: string
          enabled: boolean
          guild_id: string
          max_discount_pct: number
          rotation_hours: number
          slot_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          guild_id: string
          max_discount_pct?: number
          rotation_hours?: number
          slot_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          guild_id?: string
          max_discount_pct?: number
          rotation_hours?: number
          slot_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_rotations: {
        Row: {
          created_at: string
          discount_pct: number
          expires_at: string
          guild_id: string
          id: string
          item_name: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          expires_at: string
          guild_id: string
          id?: string
          item_name: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          expires_at?: string
          guild_id?: string
          id?: string
          item_name?: string
        }
        Relationships: []
      }
      social_config: {
        Row: {
          achievements_enabled: boolean
          active_season_id: string | null
          card_accent_color: string
          card_background_color: string
          card_style: string
          card_text_color: string
          created_at: string
          embed_color: string
          enabled: boolean
          guild_id: string
          id: string
          ignored_channel_ids: string[]
          ignored_role_ids: string[]
          level_enabled: boolean
          log_channel_id: string | null
          profile_enabled: boolean
          reputation_enabled: boolean
          updated_at: string
        }
        Insert: {
          achievements_enabled?: boolean
          active_season_id?: string | null
          card_accent_color?: string
          card_background_color?: string
          card_style?: string
          card_text_color?: string
          created_at?: string
          embed_color?: string
          enabled?: boolean
          guild_id: string
          id?: string
          ignored_channel_ids?: string[]
          ignored_role_ids?: string[]
          level_enabled?: boolean
          log_channel_id?: string | null
          profile_enabled?: boolean
          reputation_enabled?: boolean
          updated_at?: string
        }
        Update: {
          achievements_enabled?: boolean
          active_season_id?: string | null
          card_accent_color?: string
          card_background_color?: string
          card_style?: string
          card_text_color?: string
          created_at?: string
          embed_color?: string
          enabled?: boolean
          guild_id?: string
          id?: string
          ignored_channel_ids?: string[]
          ignored_role_ids?: string[]
          level_enabled?: boolean
          log_channel_id?: string | null
          profile_enabled?: boolean
          reputation_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_config_active_season_id_fkey"
            columns: ["active_season_id"]
            isOneToOne: false
            referencedRelation: "level_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          accent_color: string | null
          background_color: string | null
          banner_url: string | null
          bio: string
          card_style: string
          color: string
          created_at: string
          guild_id: string
          id: string
          profile_views: number
          reputation: number
          selected_badges: string[]
          text_color: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          banner_url?: string | null
          bio?: string
          card_style?: string
          color?: string
          created_at?: string
          guild_id: string
          id?: string
          profile_views?: number
          reputation?: number
          selected_badges?: string[]
          text_color?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          banner_url?: string | null
          bio?: string
          card_style?: string
          color?: string
          created_at?: string
          guild_id?: string
          id?: string
          profile_views?: number
          reputation?: number
          selected_badges?: string[]
          text_color?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggestion_votes: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          suggestion_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          suggestion_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          suggestion_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          anonymous: boolean
          author_id: string
          channel_id: string
          content: string
          created_at: string
          decided_by: string | null
          decision_reason: string | null
          downvotes: number
          guild_id: string
          id: string
          message_id: string | null
          staff_response: string | null
          status: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          anonymous?: boolean
          author_id: string
          channel_id: string
          content: string
          created_at?: string
          decided_by?: string | null
          decision_reason?: string | null
          downvotes?: number
          guild_id: string
          id?: string
          message_id?: string | null
          staff_response?: string | null
          status?: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          anonymous?: boolean
          author_id?: string
          channel_id?: string
          content?: string
          created_at?: string
          decided_by?: string | null
          decision_reason?: string | null
          downvotes?: number
          guild_id?: string
          id?: string
          message_id?: string | null
          staff_response?: string | null
          status?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: []
      }
      temporary_actions: {
        Row: {
          action_type: string
          active: boolean
          created_at: string
          expires_at: string
          guild_id: string
          id: number
          punishment_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          active?: boolean
          created_at?: string
          expires_at: string
          guild_id: string
          id?: number
          punishment_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          active?: boolean
          created_at?: string
          expires_at?: string
          guild_id?: string
          id?: number
          punishment_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_actions_punishment_id_fkey"
            columns: ["punishment_id"]
            isOneToOne: false
            referencedRelation: "punishments"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_access_levels: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          key: string
          name: string
          rank: number
          role_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          key: string
          name: string
          rank?: number
          role_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          key?: string
          name?: string
          rank?: number
          role_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      ticket_categories: {
        Row: {
          active: boolean
          allowed_access_levels: string[]
          auto_close_hours: number | null
          blocked_role_ids: string[]
          claim_required: boolean
          created_at: string
          description: string | null
          discord_category_id: string | null
          emoji: string | null
          first_response_minutes: number | null
          guild_id: string
          id: string
          max_open_tickets_per_user: number | null
          name: string
          position: number
          priority: boolean
          priority_default: string
          required_role_ids: string[]
          sla_alert_role_id: string | null
          support_role_id: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          active?: boolean
          allowed_access_levels?: string[]
          auto_close_hours?: number | null
          blocked_role_ids?: string[]
          claim_required?: boolean
          created_at?: string
          description?: string | null
          discord_category_id?: string | null
          emoji?: string | null
          first_response_minutes?: number | null
          guild_id: string
          id?: string
          max_open_tickets_per_user?: number | null
          name: string
          position?: number
          priority?: boolean
          priority_default?: string
          required_role_ids?: string[]
          sla_alert_role_id?: string | null
          support_role_id?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          active?: boolean
          allowed_access_levels?: string[]
          auto_close_hours?: number | null
          blocked_role_ids?: string[]
          claim_required?: boolean
          created_at?: string
          description?: string | null
          discord_category_id?: string | null
          emoji?: string | null
          first_response_minutes?: number | null
          guild_id?: string
          id?: string
          max_open_tickets_per_user?: number | null
          name?: string
          position?: number
          priority?: boolean
          priority_default?: string
          required_role_ids?: string[]
          sla_alert_role_id?: string | null
          support_role_id?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      ticket_configs: {
        Row: {
          allow_user_close_ticket: boolean
          category_id: string | null
          close_message: string
          created_at: string
          default_support_role_id: string | null
          enabled: boolean
          guild_id: string
          log_channel_id: string | null
          max_open_tickets_per_user: number
          panel_button_emoji: string
          panel_button_label: string
          panel_channel_id: string | null
          panel_color: number
          panel_description: string
          panel_image_url: string | null
          panel_message_id: string | null
          panel_thumbnail_url: string | null
          panel_title: string
          panel_use_guild_banner: boolean
          rating_channel_id: string | null
          rating_enabled: boolean
          ticket_welcome_message: string
          transcript_enabled: boolean
          updated_at: string
          use_single_panel: boolean
          webhook_avatar_url: string | null
          webhook_channel_id: string | null
          webhook_id: string | null
          webhook_name: string | null
          webhook_token: string | null
        }
        Insert: {
          allow_user_close_ticket?: boolean
          category_id?: string | null
          close_message?: string
          created_at?: string
          default_support_role_id?: string | null
          enabled?: boolean
          guild_id: string
          log_channel_id?: string | null
          max_open_tickets_per_user?: number
          panel_button_emoji?: string
          panel_button_label?: string
          panel_channel_id?: string | null
          panel_color?: number
          panel_description?: string
          panel_image_url?: string | null
          panel_message_id?: string | null
          panel_thumbnail_url?: string | null
          panel_title?: string
          panel_use_guild_banner?: boolean
          rating_channel_id?: string | null
          rating_enabled?: boolean
          ticket_welcome_message?: string
          transcript_enabled?: boolean
          updated_at?: string
          use_single_panel?: boolean
          webhook_avatar_url?: string | null
          webhook_channel_id?: string | null
          webhook_id?: string | null
          webhook_name?: string | null
          webhook_token?: string | null
        }
        Update: {
          allow_user_close_ticket?: boolean
          category_id?: string | null
          close_message?: string
          created_at?: string
          default_support_role_id?: string | null
          enabled?: boolean
          guild_id?: string
          log_channel_id?: string | null
          max_open_tickets_per_user?: number
          panel_button_emoji?: string
          panel_button_label?: string
          panel_channel_id?: string | null
          panel_color?: number
          panel_description?: string
          panel_image_url?: string | null
          panel_message_id?: string | null
          panel_thumbnail_url?: string | null
          panel_title?: string
          panel_use_guild_banner?: boolean
          rating_channel_id?: string | null
          rating_enabled?: boolean
          ticket_welcome_message?: string
          transcript_enabled?: boolean
          updated_at?: string
          use_single_panel?: boolean
          webhook_avatar_url?: string | null
          webhook_channel_id?: string | null
          webhook_id?: string | null
          webhook_name?: string | null
          webhook_token?: string | null
        }
        Relationships: []
      }
      ticket_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          guild_id: string
          id: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          guild_id: string
          id?: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          guild_id?: string
          id?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json
          author_id: string
          author_name: string
          content: string | null
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_id: string
          author_name: string
          content?: string | null
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_id?: string
          author_name?: string
          content?: string | null
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notes: {
        Row: {
          author_id: string
          author_tag: string | null
          content: string
          created_at: string
          guild_id: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_tag?: string | null
          content: string
          created_at?: string
          guild_id: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_tag?: string | null
          content?: string
          created_at?: string
          guild_id?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_permission_roles: {
        Row: {
          access_level: string
          can_add_user: boolean
          can_claim_ticket: boolean
          can_close_ticket: boolean
          can_delete_ticket: boolean
          can_generate_transcript: boolean
          can_manage_config: boolean
          can_open_priority_ticket: boolean
          can_open_ticket: boolean
          can_remove_user: boolean
          can_reopen_ticket: boolean
          can_view_history: boolean
          can_view_panel: boolean
          can_view_ratings: boolean
          created_at: string
          guild_id: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          can_add_user?: boolean
          can_claim_ticket?: boolean
          can_close_ticket?: boolean
          can_delete_ticket?: boolean
          can_generate_transcript?: boolean
          can_manage_config?: boolean
          can_open_priority_ticket?: boolean
          can_open_ticket?: boolean
          can_remove_user?: boolean
          can_reopen_ticket?: boolean
          can_view_history?: boolean
          can_view_panel?: boolean
          can_view_ratings?: boolean
          created_at?: string
          guild_id: string
          id?: string
          role_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          can_add_user?: boolean
          can_claim_ticket?: boolean
          can_close_ticket?: boolean
          can_delete_ticket?: boolean
          can_generate_transcript?: boolean
          can_manage_config?: boolean
          can_open_priority_ticket?: boolean
          can_open_ticket?: boolean
          can_remove_user?: boolean
          can_reopen_ticket?: boolean
          can_view_history?: boolean
          can_view_panel?: boolean
          can_view_ratings?: boolean
          created_at?: string
          guild_id?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_quick_replies: {
        Row: {
          content: string
          created_at: string
          created_by: string
          guild_id: string
          id: string
          slug: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          guild_id: string
          id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          guild_id?: string
          id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_tags: {
        Row: {
          color: string
          created_at: string
          emoji: string | null
          guild_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string | null
          guild_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string | null
          guild_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          category_id: string | null
          category_name: string | null
          channel_id: string
          claimed_at: string | null
          claimed_by: string | null
          close_reason: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          first_response_at: string | null
          guild_id: string
          id: string
          last_user_message_at: string | null
          priority: boolean
          priority_level: string
          rating: number | null
          rating_comment: string | null
          reopened_at: string | null
          sla_deadline: string | null
          status: string
          tags: string[]
          transcript_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          channel_id: string
          claimed_at?: string | null
          claimed_by?: string | null
          close_reason?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          first_response_at?: string | null
          guild_id: string
          id?: string
          last_user_message_at?: string | null
          priority?: boolean
          priority_level?: string
          rating?: number | null
          rating_comment?: string | null
          reopened_at?: string | null
          sla_deadline?: string | null
          status?: string
          tags?: string[]
          transcript_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          channel_id?: string
          claimed_at?: string | null
          claimed_by?: string | null
          close_reason?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          first_response_at?: string | null
          guild_id?: string
          id?: string
          last_user_message_at?: string | null
          priority?: boolean
          priority_level?: string
          rating?: number | null
          rating_comment?: string | null
          reopened_at?: string | null
          sla_deadline?: string | null
          status?: string
          tags?: string[]
          transcript_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          guild_id: string
          id: string
          progress: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          guild_id: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          guild_id?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          guild_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          guild_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          guild_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_economy: {
        Row: {
          balance: number
          bank: number
          guild_id: string
          last_daily_at: string | null
          last_work_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bank?: number
          guild_id: string
          last_daily_at?: string | null
          last_work_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bank?: number
          guild_id?: string
          last_daily_at?: string | null
          last_work_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_levels_legacy: {
        Row: {
          guild_id: string
          last_message_at: string | null
          level: number
          messages: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          guild_id: string
          last_message_at?: string | null
          level?: number
          messages?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          guild_id?: string
          last_message_at?: string | null
          level?: number
          messages?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          guild_id: string
          id: string
          mission_id: string
          period_start: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          guild_id: string
          id?: string
          mission_id: string
          period_start: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          mission_id?: string
          period_start?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "economy_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      warnings: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          guild_id: string
          id: number
          moderator_id: string
          moderator_name: string | null
          points: number
          proof_url: string | null
          reason: string | null
          severity: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          guild_id: string
          id?: number
          moderator_id: string
          moderator_name?: string | null
          points?: number
          proof_url?: string | null
          reason?: string | null
          severity?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          guild_id?: string
          id?: number
          moderator_id?: string
          moderator_name?: string | null
          points?: number
          proof_url?: string | null
          reason?: string | null
          severity?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      moderation_stats_30d: {
        Row: {
          action: string | null
          guild_id: string | null
          moderator_id: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_case_number: { Args: { _guild_id: string }; Returns: number }
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
