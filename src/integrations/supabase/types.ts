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
      automod_config: {
        Row: {
          anti_caps_enabled: boolean
          anti_caps_threshold: number
          anti_invite_enabled: boolean
          anti_link_enabled: boolean
          anti_mention_enabled: boolean
          anti_mention_threshold: number
          anti_spam_enabled: boolean
          anti_spam_interval: number
          anti_spam_threshold: number
          blacklist_words: string[]
          created_at: string
          guild_id: string
          punishment: string
          updated_at: string
          updated_by: string | null
          whitelist_channels: string[]
          whitelist_roles: string[]
        }
        Insert: {
          anti_caps_enabled?: boolean
          anti_caps_threshold?: number
          anti_invite_enabled?: boolean
          anti_link_enabled?: boolean
          anti_mention_enabled?: boolean
          anti_mention_threshold?: number
          anti_spam_enabled?: boolean
          anti_spam_interval?: number
          anti_spam_threshold?: number
          blacklist_words?: string[]
          created_at?: string
          guild_id: string
          punishment?: string
          updated_at?: string
          updated_by?: string | null
          whitelist_channels?: string[]
          whitelist_roles?: string[]
        }
        Update: {
          anti_caps_enabled?: boolean
          anti_caps_threshold?: number
          anti_invite_enabled?: boolean
          anti_link_enabled?: boolean
          anti_mention_enabled?: boolean
          anti_mention_threshold?: number
          anti_spam_enabled?: boolean
          anti_spam_interval?: number
          anti_spam_threshold?: number
          blacklist_words?: string[]
          created_at?: string
          guild_id?: string
          punishment?: string
          updated_at?: string
          updated_by?: string | null
          whitelist_channels?: string[]
          whitelist_roles?: string[]
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
