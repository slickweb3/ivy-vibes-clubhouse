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
      admin_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          body: string | null
          created_at: string
          display_order: number
          heading: string | null
          id: string
          is_visible: boolean
          key: string
          section: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          display_order?: number
          heading?: string | null
          id?: string
          is_visible?: boolean
          key: string
          section?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          display_order?: number
          heading?: string | null
          id?: string
          is_visible?: boolean
          key?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_entries: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          media_item_id: string | null
          rotation: number
          updated_at: string
        }
        Insert: {
          caption: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          media_item_id?: string | null
          rotation?: number
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          media_item_id?: string | null
          rotation?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ivy_tv_items: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          display_order: number
          external_url: string | null
          id: string
          is_featured: boolean
          is_visible: boolean
          media_item_id: string | null
          poster_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          external_url?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          media_item_id?: string | null
          poster_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          external_url?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          media_item_id?: string | null
          poster_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ivy_tv_items_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          body: string
          created_at: string
          display_order: number
          id: string
          is_draft: boolean
          is_published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          display_order?: number
          id?: string
          is_draft?: boolean
          is_published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          display_order?: number
          id?: string
          is_draft?: boolean
          is_published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          alt_text: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          credit: string | null
          display_order: number
          duration_seconds: number | null
          external_url: string | null
          height: number | null
          id: string
          is_visible: boolean
          kind: Database["public"]["Enums"]["media_kind"]
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          usable_in_memes: boolean
          width: number | null
        }
        Insert: {
          alt_text?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          credit?: string | null
          display_order?: number
          duration_seconds?: number | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_visible?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          storage_path?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          usable_in_memes?: boolean
          width?: number | null
        }
        Update: {
          alt_text?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          credit?: string | null
          display_order?: number
          duration_seconds?: number | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_visible?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          usable_in_memes?: boolean
          width?: number | null
        }
        Relationships: []
      }
      meme_captions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      meme_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          label: string
          media_item_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          label: string
          media_item_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          label?: string
          media_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meme_images_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_config: {
        Row: {
          blockchain: string | null
          contact_email: string | null
          contract_address: string | null
          created_at: string
          discord_url: string | null
          explorer_url: string | null
          id: string
          instagram_enabled: boolean
          instagram_url: string | null
          is_published: boolean
          launch_date: string | null
          posts_per_platform: number
          project_name: string
          sync_interval_hours: number
          telegram_url: string | null
          ticker: string
          tiktok_enabled: boolean
          tiktok_url: string | null
          token_supply: string | null
          tokenomics_url: string | null
          updated_at: string
          x_url: string | null
        }
        Insert: {
          blockchain?: string | null
          contact_email?: string | null
          contract_address?: string | null
          created_at?: string
          discord_url?: string | null
          explorer_url?: string | null
          id?: string
          instagram_enabled?: boolean
          instagram_url?: string | null
          is_published?: boolean
          launch_date?: string | null
          posts_per_platform?: number
          project_name?: string
          sync_interval_hours?: number
          telegram_url?: string | null
          ticker?: string
          tiktok_enabled?: boolean
          tiktok_url?: string | null
          token_supply?: string | null
          tokenomics_url?: string | null
          updated_at?: string
          x_url?: string | null
        }
        Update: {
          blockchain?: string | null
          contact_email?: string | null
          contract_address?: string | null
          created_at?: string
          discord_url?: string | null
          explorer_url?: string | null
          id?: string
          instagram_enabled?: boolean
          instagram_url?: string | null
          is_published?: boolean
          launch_date?: string | null
          posts_per_platform?: number
          project_name?: string
          sync_interval_hours?: number
          telegram_url?: string | null
          ticker?: string
          tiktok_enabled?: boolean
          tiktok_url?: string | null
          token_supply?: string | null
          tokenomics_url?: string | null
          updated_at?: string
          x_url?: string | null
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          account_name: string | null
          created_at: string
          id: string
          is_connected: boolean
          last_sync_at: string | null
          last_sync_status: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          token_expires_at: string | null
          token_ref: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          token_expires_at?: string | null
          token_ref?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          token_expires_at?: string | null
          token_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          account_name: string | null
          allow_autoplay: boolean
          alt_text: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          caption: string | null
          created_at: string
          custom_caption: string | null
          duration: number | null
          embed_url: string | null
          fallback_thumbnail_url: string | null
          height: number | null
          id: string
          is_featured: boolean
          is_pinned: boolean
          is_visible: boolean
          last_synced_at: string | null
          media_type: Database["public"]["Enums"]["media_kind"]
          media_url: string | null
          permalink: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id: string
          published_at: string | null
          sync_source: Database["public"]["Enums"]["sync_source"]
          thumbnail_url: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          account_name?: string | null
          allow_autoplay?: boolean
          alt_text?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          caption?: string | null
          created_at?: string
          custom_caption?: string | null
          duration?: number | null
          embed_url?: string | null
          fallback_thumbnail_url?: string | null
          height?: number | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          is_visible?: boolean
          last_synced_at?: string | null
          media_type?: Database["public"]["Enums"]["media_kind"]
          media_url?: string | null
          permalink?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id: string
          published_at?: string | null
          sync_source?: Database["public"]["Enums"]["sync_source"]
          thumbnail_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          account_name?: string | null
          allow_autoplay?: boolean
          alt_text?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          caption?: string | null
          created_at?: string
          custom_caption?: string | null
          duration?: number | null
          embed_url?: string | null
          fallback_thumbnail_url?: string | null
          height?: number | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          is_visible?: boolean
          last_synced_at?: string | null
          media_type?: Database["public"]["Enums"]["media_kind"]
          media_url?: string | null
          permalink?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_post_id?: string
          published_at?: string | null
          sync_source?: Database["public"]["Enums"]["sync_source"]
          thumbnail_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          items_fetched: number
          items_marked_unavailable: number
          items_upserted: number
          message: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          items_fetched?: number
          items_marked_unavailable?: number
          items_upserted?: number
          message?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          items_fetched?: number
          items_marked_unavailable?: number
          items_upserted?: number
          message?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      timeline_chapters: {
        Row: {
          body: string | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      approval_status: "pending" | "approved" | "rejected"
      media_kind: "image" | "video" | "carousel" | "reel"
      social_platform: "instagram" | "tiktok"
      sync_source: "manual" | "api"
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
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      approval_status: ["pending", "approved", "rejected"],
      media_kind: ["image", "video", "carousel", "reel"],
      social_platform: ["instagram", "tiktok"],
      sync_source: ["manual", "api"],
    },
  },
} as const
