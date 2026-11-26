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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      led_desired: {
        Row: {
          device_id: string
          request_id: string | null
          revision: number
          schema_version: number
          state: Json
          updated_at: string
        }
        Insert: {
          device_id: string
          request_id?: string | null
          revision?: number
          schema_version?: number
          state: Json
          updated_at?: string
        }
        Update: {
          device_id?: string
          request_id?: string | null
          revision?: number
          schema_version?: number
          state?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "led_desired_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "led_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      led_devices: {
        Row: {
          created_at: string
          direction: number
          group_count: number
          group_count_provisional: boolean
          id: string
          name: string
          token_hash: string | null
          token_prefix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction?: number
          group_count?: number
          group_count_provisional?: boolean
          id: string
          name: string
          token_hash?: string | null
          token_prefix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction?: number
          group_count?: number
          group_count_provisional?: boolean
          id?: string
          name?: string
          token_hash?: string | null
          token_prefix?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      led_presets: {
        Row: {
          created_at: string
          custom: boolean
          id: string
          label: string
          sort_order: number
          state: Json
          swatch: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom?: boolean
          id: string
          label: string
          sort_order?: number
          state: Json
          swatch?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom?: boolean
          id?: string
          label?: string
          sort_order?: number
          state?: Json
          swatch?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      led_reported: {
        Row: {
          applied_revision: number
          applied_state: Json | null
          boot_id: string | null
          capabilities: Json | null
          controller_version: string | null
          device_id: string
          heartbeat_at: string | null
          last_error: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_revision?: number
          applied_state?: Json | null
          boot_id?: string | null
          capabilities?: Json | null
          controller_version?: string | null
          device_id: string
          heartbeat_at?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_revision?: number
          applied_state?: Json | null
          boot_id?: string | null
          capabilities?: Json | null
          controller_version?: string | null
          device_id?: string
          heartbeat_at?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "led_reported_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "led_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      spotify_tokens: {
        Row: {
          access_token: string | null
          expires_at: string | null
          id: number
          owner_id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          id?: number
          owner_id: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          id?: number
          owner_id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_led_desired: {
        Args: {
          p_base_revision: number
          p_device_id: string
          p_force?: boolean
          p_request_id: string
          p_state: Json
        }
        Returns: {
          outcome: string
          revision: number
          state: Json
          updated_at: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
