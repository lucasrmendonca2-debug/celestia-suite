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
          channel_create: boolean
          channel_delete: boolean
          channel_update: boolean
          created_at: string
          guild_id: string
          log_channel_id: string | null
          member_ban: boolean
          member_join: boolean
          member_kick: boolean
          member_leave: boolean
          member_nickname_update: boolean
          member_role_update: boolean
          member_unban: boolean
          message_bulk_delete: boolean
          message_delete: boolean
          message_edit: boolean
          role_create: boolean
          role_delete: boolean
          role_update: boolean
          updated_at: string
          updated_by: string | null
          voice_state_update: boolean
        }
        Insert: {
          channel_create?: boolean
          channel_delete?: boolean
          channel_update?: boolean
          created_at?: string
          guild_id: string
          log_channel_id?: string | null
          member_ban?: boolean
          member_join?: boolean
          member_kick?: boolean
          member_leave?: boolean
          member_nickname_update?: boolean
          member_role_update?: boolean
          member_unban?: boolean
          message_bulk_delete?: boolean
          message_delete?: boolean
          message_edit?: boolean
          role_create?: boolean
          role_delete?: boolean
          role_update?: boolean
          updated_at?: string
          updated_by?: string | null
          voice_state_update?: boolean
        }
        Update: {
          channel_create?: boolean
          channel_delete?: boolean
          channel_update?: boolean
          created_at?: string
          guild_id?: string
          log_channel_id?: string | null
          member_ban?: boolean
          member_join?: boolean
          member_kick?: boolean
          member_leave?: boolean
          member_nickname_update?: boolean
          member_role_update?: boolean
          member_unban?: boolean
          message_bulk_delete?: boolean
          message_delete?: boolean
          message_edit?: boolean
          role_create?: boolean
          role_delete?: boolean
          role_update?: boolean
          updated_at?: string
          updated_by?: string | null
          voice_state_update?: boolean
        }
        Relationships: []
      }
      level_rewards: {
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
      leveling_config: {
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
      mod_cases: {
        Row: {
          action: string
          active: boolean
          case_number: number
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          guild_id: string
          id: string
          moderator_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          active?: boolean
          case_number: number
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id: string
          id?: string
          moderator_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          active?: boolean
          case_number?: number
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moderation_configs: {
        Row: {
          allow_temporary_ban: boolean
          allow_temporary_mute: boolean
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
          max_warnings: number
          mute_role_id: string | null
          protected_role_ids: string[]
          protected_user_ids: string[]
          punishment_dm_template: string
          updated_at: string
        }
        Insert: {
          allow_temporary_ban?: boolean
          allow_temporary_mute?: boolean
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
          max_warnings?: number
          mute_role_id?: string | null
          protected_role_ids?: string[]
          protected_user_ids?: string[]
          punishment_dm_template?: string
          updated_at?: string
        }
        Update: {
          allow_temporary_ban?: boolean
          allow_temporary_mute?: boolean
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
          max_warnings?: number
          mute_role_id?: string | null
          protected_role_ids?: string[]
          protected_user_ids?: string[]
          punishment_dm_template?: string
          updated_at?: string
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
          blocked_role_ids: string[]
          created_at: string
          description: string | null
          discord_category_id: string | null
          emoji: string | null
          guild_id: string
          id: string
          max_open_tickets_per_user: number | null
          name: string
          position: number
          priority: boolean
          required_role_ids: string[]
          support_role_id: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          active?: boolean
          allowed_access_levels?: string[]
          blocked_role_ids?: string[]
          created_at?: string
          description?: string | null
          discord_category_id?: string | null
          emoji?: string | null
          guild_id: string
          id?: string
          max_open_tickets_per_user?: number | null
          name: string
          position?: number
          priority?: boolean
          required_role_ids?: string[]
          support_role_id?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          active?: boolean
          allowed_access_levels?: string[]
          blocked_role_ids?: string[]
          created_at?: string
          description?: string | null
          discord_category_id?: string | null
          emoji?: string | null
          guild_id?: string
          id?: string
          max_open_tickets_per_user?: number | null
          name?: string
          position?: number
          priority?: boolean
          required_role_ids?: string[]
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
      tickets: {
        Row: {
          category_id: string | null
          category_name: string | null
          channel_id: string
          claimed_by: string | null
          close_reason: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          guild_id: string
          id: string
          priority: boolean
          rating: number | null
          status: string
          transcript_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          channel_id: string
          claimed_by?: string | null
          close_reason?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          guild_id: string
          id?: string
          priority?: boolean
          rating?: number | null
          status?: string
          transcript_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          channel_id?: string
          claimed_by?: string | null
          close_reason?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          priority?: boolean
          rating?: number | null
          status?: string
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
      user_levels: {
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
      warnings: {
        Row: {
          active: boolean
          created_at: string
          guild_id: string
          id: number
          moderator_id: string
          moderator_name: string | null
          reason: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          guild_id: string
          id?: number
          moderator_id: string
          moderator_name?: string | null
          reason?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          guild_id?: string
          id?: number
          moderator_id?: string
          moderator_name?: string | null
          reason?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
