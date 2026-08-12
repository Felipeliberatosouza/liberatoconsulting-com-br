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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      article_submissions: {
        Row: {
          created_at: string
          email: string
          file_name: string | null
          file_path: string | null
          full_name: string
          id: string
          ip_hash: string | null
          language: string | null
          message: string
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          email: string
          file_name?: string | null
          file_path?: string | null
          full_name: string
          id?: string
          ip_hash?: string | null
          language?: string | null
          message?: string
          summary?: string
          title: string
        }
        Update: {
          created_at?: string
          email?: string
          file_name?: string | null
          file_path?: string | null
          full_name?: string
          id?: string
          ip_hash?: string | null
          language?: string | null
          message?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          action: string
          created_at: string
          id: string
          kind: string
          payload: Json
          requester_id: string
          requester_name: string
          review_note: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          summary: string
          target_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          requester_id: string
          requester_name?: string
          review_note?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          summary?: string
          target_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          requester_id?: string
          requester_name?: string
          review_note?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          summary?: string
          target_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_profile: {
        Row: {
          address_city: string
          address_complement: string
          address_country: string
          address_district: string
          address_number: string
          address_state: string
          address_street: string
          address_zip: string
          cnpj: string
          created_at: string
          email: string
          extra: Json
          founded_on: string | null
          id: string
          legal_name: string
          logo_url: string | null
          municipal_registration: string
          partners: Json
          phone: string
          state_registration: string
          trade_name: string
          updated_at: string
          website: string
        }
        Insert: {
          address_city?: string
          address_complement?: string
          address_country?: string
          address_district?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          cnpj?: string
          created_at?: string
          email?: string
          extra?: Json
          founded_on?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          municipal_registration?: string
          partners?: Json
          phone?: string
          state_registration?: string
          trade_name?: string
          updated_at?: string
          website?: string
        }
        Update: {
          address_city?: string
          address_complement?: string
          address_country?: string
          address_district?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          cnpj?: string
          created_at?: string
          email?: string
          extra?: Json
          founded_on?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          municipal_registration?: string
          partners?: Json
          phone?: string
          state_registration?: string
          trade_name?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      content_articles: {
        Row: {
          author_contact: string
          authors: string
          body: string
          cover_url: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          group_id: string
          id: string
          kind: string
          link_url: string | null
          position: number
          published: boolean
          rating_count: number
          rating_sum: number
          read_count: number
          service: string
          slug: string
          summary: string
          title: string
          translations: Json
          updated_at: string
        }
        Insert: {
          author_contact?: string
          authors?: string
          body?: string
          cover_url?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          group_id?: string
          id?: string
          kind?: string
          link_url?: string | null
          position?: number
          published?: boolean
          rating_count?: number
          rating_sum?: number
          read_count?: number
          service?: string
          slug: string
          summary?: string
          title: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          author_contact?: string
          authors?: string
          body?: string
          cover_url?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          group_id?: string
          id?: string
          kind?: string
          link_url?: string | null
          position?: number
          published?: boolean
          rating_count?: number
          rating_sum?: number
          read_count?: number
          service?: string
          slug?: string
          summary?: string
          title?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          audience: string
          id: string
          ip_hash: string | null
          signed_at: string
          signed_body: string
          signer_cpf: string
          signer_name: string
          template_id: string | null
          user_id: string
          version: number
        }
        Insert: {
          audience: string
          id?: string
          ip_hash?: string | null
          signed_at?: string
          signed_body?: string
          signer_cpf?: string
          signer_name?: string
          template_id?: string | null
          user_id: string
          version?: number
        }
        Update: {
          audience?: string
          id?: string
          ip_hash?: string | null
          signed_at?: string
          signed_body?: string
          signer_cpf?: string
          signer_name?: string
          template_id?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          active: boolean
          audience: string
          body: string
          created_at: string
          id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          audience: string
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          audience?: string
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      economic_indicators: {
        Row: {
          created_at: string
          id: string
          label: string
          last_checked_at: string | null
          note: string
          position: number
          published: boolean
          reference_period: string
          slug: string
          source_name: string
          source_url: string
          translations: Json
          trend: string
          unit: string
          updated_at: string
          updated_by_ai: boolean
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          last_checked_at?: string | null
          note?: string
          position?: number
          published?: boolean
          reference_period?: string
          slug: string
          source_name?: string
          source_url?: string
          translations?: Json
          trend?: string
          unit?: string
          updated_at?: string
          updated_by_ai?: boolean
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_checked_at?: string | null
          note?: string
          position?: number
          published?: boolean
          reference_period?: string
          slug?: string
          source_name?: string
          source_url?: string
          translations?: Json
          trend?: string
          unit?: string
          updated_at?: string
          updated_by_ai?: boolean
          value?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          label: string
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          slug: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string
          email: string
          email_opt_in: boolean
          emailed: boolean
          full_name: string
          id: string
          interest_area: string
          ip_hash: string | null
          language: string | null
          linkedin_url: string | null
          phone: string
          resume_filename: string | null
          resume_path: string | null
          source_path: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_opt_in?: boolean
          emailed?: boolean
          full_name: string
          id?: string
          interest_area: string
          ip_hash?: string | null
          language?: string | null
          linkedin_url?: string | null
          phone: string
          resume_filename?: string | null
          resume_path?: string | null
          source_path?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_opt_in?: boolean
          emailed?: boolean
          full_name?: string
          id?: string
          interest_area?: string
          ip_hash?: string | null
          language?: string | null
          linkedin_url?: string | null
          phone?: string
          resume_filename?: string | null
          resume_path?: string | null
          source_path?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string
          country: string
          created_at: string
          email: string | null
          email_opt_in: boolean
          id: string
          ip_hash: string | null
          language: string | null
          message: string | null
          name: string
          service_slug: string
          service_title: string | null
          source_path: string | null
        }
        Insert: {
          company: string
          country: string
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          id?: string
          ip_hash?: string | null
          language?: string | null
          message?: string | null
          name: string
          service_slug: string
          service_title?: string | null
          source_path?: string | null
        }
        Update: {
          company?: string
          country?: string
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          id?: string
          ip_hash?: string | null
          language?: string | null
          message?: string | null
          name?: string
          service_slug?: string
          service_title?: string | null
          source_path?: string | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          author_contact: string
          authors: string
          body: string
          created_at: string
          failed_count: number
          file_name: string | null
          file_path: string | null
          full_text: string
          id: string
          image_url: string | null
          last_error: string | null
          preheader: string
          reference_date: string | null
          sent_at: string | null
          sent_count: number
          sources: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          author_contact?: string
          authors?: string
          body?: string
          created_at?: string
          failed_count?: number
          file_name?: string | null
          file_path?: string | null
          full_text?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          preheader?: string
          reference_date?: string | null
          sent_at?: string | null
          sent_count?: number
          sources?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          author_contact?: string
          authors?: string
          body?: string
          created_at?: string
          failed_count?: number
          file_name?: string | null
          file_path?: string | null
          full_text?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          preheader?: string
          reference_date?: string | null
          sent_at?: string | null
          sent_count?: number
          sources?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string | null
          name: string
          source_path: string | null
          status: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string | null
          name?: string
          source_path?: string | null
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          name?: string
          source_path?: string | null
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          address_city: string
          address_complement: string
          address_country: string
          address_district: string
          address_number: string
          address_state: string
          address_street: string
          address_zip: string
          bank_account: string
          bank_branch: string
          bank_name: string
          birth_date: string | null
          cpf: string
          created_at: string
          email: string
          email_opt_in: boolean
          full_name: string
          id: string
          marital_status: string
          nationality: string
          notes: string
          phone: string
          pix_key: string
          rg: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          address_city?: string
          address_complement?: string
          address_country?: string
          address_district?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          bank_account?: string
          bank_branch?: string
          bank_name?: string
          birth_date?: string | null
          cpf?: string
          created_at?: string
          email?: string
          email_opt_in?: boolean
          full_name?: string
          id?: string
          marital_status?: string
          nationality?: string
          notes?: string
          phone?: string
          pix_key?: string
          rg?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          address_city?: string
          address_complement?: string
          address_country?: string
          address_district?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          bank_account?: string
          bank_branch?: string
          bank_name?: string
          birth_date?: string | null
          cpf?: string
          created_at?: string
          email?: string
          email_opt_in?: boolean
          full_name?: string
          id?: string
          marital_status?: string
          nationality?: string
          notes?: string
          phone?: string
          pix_key?: string
          rg?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "editor" | "autor" | "consultor"
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
      app_role: ["admin", "editor", "autor", "consultor"],
    },
  },
} as const
