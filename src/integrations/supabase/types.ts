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
      article_submissions: {
        Row: {
          cpf: string
          created_at: string
          email: string
          file_name: string | null
          file_path: string | null
          full_name: string
          group_id: string
          id: string
          institution: string
          ip_hash: string | null
          language: string | null
          message: string
          phone: string
          role_label: string
          service: string
          summary: string
          title: string
        }
        Insert: {
          cpf?: string
          created_at?: string
          email: string
          file_name?: string | null
          file_path?: string | null
          full_name: string
          group_id?: string
          id?: string
          institution?: string
          ip_hash?: string | null
          language?: string | null
          message?: string
          phone?: string
          role_label?: string
          service?: string
          summary?: string
          title: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string
          file_name?: string | null
          file_path?: string | null
          full_name?: string
          group_id?: string
          id?: string
          institution?: string
          ip_hash?: string | null
          language?: string | null
          message?: string
          phone?: string
          role_label?: string
          service?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      brazil_scope_content: {
        Row: {
          body: string
          bullets: Json
          created_at: string
          id: string
          lang: string
          region: string
          scope_key: string
          section_id: string
          segment: string
          sources: Json
          title: string
          uf: string
          updated_at: string
        }
        Insert: {
          body?: string
          bullets?: Json
          created_at?: string
          id?: string
          lang?: string
          region?: string
          scope_key: string
          section_id: string
          segment?: string
          sources?: Json
          title?: string
          uf?: string
          updated_at?: string
        }
        Update: {
          body?: string
          bullets?: Json
          created_at?: string
          id?: string
          lang?: string
          region?: string
          scope_key?: string
          section_id?: string
          segment?: string
          sources?: Json
          title?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      brazil_topic_content: {
        Row: {
          body: string
          bullets: Json
          created_at: string
          id: string
          lang: string
          section_id: string
          sources: Json
          title: string
          topic_index: number
          topic_label: string
          updated_at: string
        }
        Insert: {
          body?: string
          bullets?: Json
          created_at?: string
          id?: string
          lang?: string
          section_id: string
          sources?: Json
          title?: string
          topic_index: number
          topic_label?: string
          updated_at?: string
        }
        Update: {
          body?: string
          bullets?: Json
          created_at?: string
          id?: string
          lang?: string
          section_id?: string
          sources?: Json
          title?: string
          topic_index?: number
          topic_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulletin_dispatches: {
        Row: {
          body_html: string
          created_at: string
          date_label: string
          failed: number
          id: string
          is_test: boolean
          last_error: string | null
          segment: string
          sent_email: number
          sent_whatsapp: number
          status: string
          subject: string
        }
        Insert: {
          body_html?: string
          created_at?: string
          date_label?: string
          failed?: number
          id?: string
          is_test?: boolean
          last_error?: string | null
          segment?: string
          sent_email?: number
          sent_whatsapp?: number
          status?: string
          subject?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          date_label?: string
          failed?: number
          id?: string
          is_test?: boolean
          last_error?: string | null
          segment?: string
          sent_email?: number
          sent_whatsapp?: number
          status?: string
          subject?: string
        }
        Relationships: []
      }
      bulletin_subscribers: {
        Row: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          last_sent_at: string | null
          segment: string
          source_path: string
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          via_email: boolean
          via_whatsapp: boolean
          whatsapp: string
        }
        Insert: {
          company?: string
          created_at?: string
          email: string
          full_name?: string
          id?: string
          language?: string
          last_sent_at?: string | null
          segment?: string
          source_path?: string
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          via_email?: boolean
          via_whatsapp?: boolean
          whatsapp?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          last_sent_at?: string | null
          segment?: string
          source_path?: string
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          via_email?: boolean
          via_whatsapp?: boolean
          whatsapp?: string
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
      consultants: {
        Row: {
          academic_logos: Json
          certifications: Json
          client_logos: Json
          clients: string
          contact_email: string
          created_at: string
          education: string
          experience: string
          full_name: string
          headline: string
          highlights: Json
          id: string
          lattes_url: string
          orcid_url: string
          photo_url: string
          position: number
          published: boolean
          segments: Json
          slug: string
          specialties: Json
          translations: Json
          updated_at: string
          website_url: string
          works: string
          years_experience: number
        }
        Insert: {
          academic_logos?: Json
          certifications?: Json
          client_logos?: Json
          clients?: string
          contact_email?: string
          created_at?: string
          education?: string
          experience?: string
          full_name: string
          headline?: string
          highlights?: Json
          id?: string
          lattes_url?: string
          orcid_url?: string
          photo_url?: string
          position?: number
          published?: boolean
          segments?: Json
          slug?: string
          specialties?: Json
          translations?: Json
          updated_at?: string
          website_url?: string
          works?: string
          years_experience?: number
        }
        Update: {
          academic_logos?: Json
          certifications?: Json
          client_logos?: Json
          clients?: string
          contact_email?: string
          created_at?: string
          education?: string
          experience?: string
          full_name?: string
          headline?: string
          highlights?: Json
          id?: string
          lattes_url?: string
          orcid_url?: string
          photo_url?: string
          position?: number
          published?: boolean
          segments?: Json
          slug?: string
          specialties?: Json
          translations?: Json
          updated_at?: string
          website_url?: string
          works?: string
          years_experience?: number
        }
        Relationships: []
      }
      content_articles: {
        Row: {
          article_date: string | null
          author_contact: string
          authors: string
          body: string
          chart_data: string
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
          table_data: string
          title: string
          translated_files: Json
          translations: Json
          updated_at: string
        }
        Insert: {
          article_date?: string | null
          author_contact?: string
          authors?: string
          body?: string
          chart_data?: string
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
          table_data?: string
          title: string
          translated_files?: Json
          translations?: Json
          updated_at?: string
        }
        Update: {
          article_date?: string | null
          author_contact?: string
          authors?: string
          body?: string
          chart_data?: string
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
          table_data?: string
          title?: string
          translated_files?: Json
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
      crm_birthday_sends: {
        Row: {
          created_at: string
          error: string
          id: string
          recipient: string
          status: string
          target_id: string
          target_type: string
          year: number
        }
        Insert: {
          created_at?: string
          error?: string
          id?: string
          recipient: string
          status?: string
          target_id: string
          target_type: string
          year: number
        }
        Update: {
          created_at?: string
          error?: string
          id?: string
          recipient?: string
          status?: string
          target_id?: string
          target_type?: string
          year?: number
        }
        Relationships: []
      }
      crm_companies: {
        Row: {
          address: string
          birthday_email: boolean
          city: string
          cnpj: string
          country: string
          created_at: string
          district: string
          email: string
          employees: number | null
          founded_on: string | null
          id: string
          name: string
          notes: string
          owner_name: string
          owner_title: string
          phone: string
          revenue_range: string
          segment: string
          size: string
          state: string
          status: string
          tags: Json
          trade_name: string
          updated_at: string
          website: string
          zip: string
        }
        Insert: {
          address?: string
          birthday_email?: boolean
          city?: string
          cnpj?: string
          country?: string
          created_at?: string
          district?: string
          email?: string
          employees?: number | null
          founded_on?: string | null
          id?: string
          name: string
          notes?: string
          owner_name?: string
          owner_title?: string
          phone?: string
          revenue_range?: string
          segment?: string
          size?: string
          state?: string
          status?: string
          tags?: Json
          trade_name?: string
          updated_at?: string
          website?: string
          zip?: string
        }
        Update: {
          address?: string
          birthday_email?: boolean
          city?: string
          cnpj?: string
          country?: string
          created_at?: string
          district?: string
          email?: string
          employees?: number | null
          founded_on?: string | null
          id?: string
          name?: string
          notes?: string
          owner_name?: string
          owner_title?: string
          phone?: string
          revenue_range?: string
          segment?: string
          size?: string
          state?: string
          status?: string
          tags?: Json
          trade_name?: string
          updated_at?: string
          website?: string
          zip?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          active: boolean
          birth_date: string | null
          birthday_email: boolean
          company_id: string | null
          created_at: string
          decision_maker: boolean
          department: string
          email: string
          email_opt_in: boolean
          full_name: string
          id: string
          language: string
          linkedin_url: string
          notes: string
          phone: string
          role_title: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          birthday_email?: boolean
          company_id?: string | null
          created_at?: string
          decision_maker?: boolean
          department?: string
          email?: string
          email_opt_in?: boolean
          full_name: string
          id?: string
          language?: string
          linkedin_url?: string
          notes?: string
          phone?: string
          role_title?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          birthday_email?: boolean
          company_id?: string | null
          created_at?: string
          decision_maker?: boolean
          department?: string
          email?: string
          email_opt_in?: boolean
          full_name?: string
          id?: string
          language?: string
          linkedin_url?: string
          notes?: string
          phone?: string
          role_title?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_dates: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          event_date: string
          id: string
          label: string
          notes: string
          notify_email: boolean
          recurring: boolean
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          event_date: string
          id?: string
          label: string
          notes?: string
          notify_email?: boolean
          recurring?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          event_date?: string
          id?: string
          label?: string
          notes?: string
          notify_email?: boolean
          recurring?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_dates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_dates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_interactions: {
        Row: {
          author_name: string
          body: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          kind: string
          occurred_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          body?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          occurred_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          occurred_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_site_events: {
        Row: {
          country: string
          created_at: string
          email: string | null
          id: string
          kind: string
          label: string
          lang: string
          path: string
          referrer: string
          visitor_id: string
        }
        Insert: {
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          label?: string
          lang?: string
          path: string
          referrer?: string
          visitor_id: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          label?: string
          lang?: string
          path?: string
          referrer?: string
          visitor_id?: string
        }
        Relationships: []
      }
      economic_indicators: {
        Row: {
          created_at: string
          forecast_period: string
          forecast_source_name: string
          forecast_source_url: string
          forecast_value: string
          id: string
          label: string
          last_checked_at: string | null
          note: string
          polarity: string
          position: number
          previous_period: string
          previous_value: string
          published: boolean
          reference_period: string
          region: string
          segment: string
          slug: string
          source_name: string
          source_url: string
          translations: Json
          trend: string
          uf: string
          unit: string
          updated_at: string
          updated_by_ai: boolean
          value: string
        }
        Insert: {
          created_at?: string
          forecast_period?: string
          forecast_source_name?: string
          forecast_source_url?: string
          forecast_value?: string
          id?: string
          label: string
          last_checked_at?: string | null
          note?: string
          polarity?: string
          position?: number
          previous_period?: string
          previous_value?: string
          published?: boolean
          reference_period?: string
          region?: string
          segment?: string
          slug: string
          source_name?: string
          source_url?: string
          translations?: Json
          trend?: string
          uf?: string
          unit?: string
          updated_at?: string
          updated_by_ai?: boolean
          value?: string
        }
        Update: {
          created_at?: string
          forecast_period?: string
          forecast_source_name?: string
          forecast_source_url?: string
          forecast_value?: string
          id?: string
          label?: string
          last_checked_at?: string | null
          note?: string
          polarity?: string
          position?: number
          previous_period?: string
          previous_value?: string
          published?: boolean
          reference_period?: string
          region?: string
          segment?: string
          slug?: string
          source_name?: string
          source_url?: string
          translations?: Json
          trend?: string
          uf?: string
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
          phone: string
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
          phone?: string
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
          phone?: string
          service_slug?: string
          service_title?: string | null
          source_path?: string | null
        }
        Relationships: []
      }
      management_tools: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          position: number
          published: boolean
          slug: string
          summary: string
          title: string
          translations: Json
          updated_at: string
          welcome_attachment: boolean
        }
        Insert: {
          category?: string
          cover_url?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          position?: number
          published?: boolean
          slug: string
          summary?: string
          title: string
          translations?: Json
          updated_at?: string
          welcome_attachment?: boolean
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          position?: number
          published?: boolean
          slug?: string
          summary?: string
          title?: string
          translations?: Json
          updated_at?: string
          welcome_attachment?: boolean
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
          published_at: string | null
          reference_date: string | null
          sent_at: string | null
          sent_count: number
          slug: string | null
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
          published_at?: string | null
          reference_date?: string | null
          sent_at?: string | null
          sent_count?: number
          slug?: string | null
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
          published_at?: string | null
          reference_date?: string | null
          sent_at?: string | null
          sent_count?: number
          slug?: string | null
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
          via_whatsapp: boolean
          whatsapp: string
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
          via_whatsapp?: boolean
          whatsapp?: string
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
          via_whatsapp?: boolean
          whatsapp?: string
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
          contract_file_name: string | null
          contract_file_path: string | null
          contract_sent_at: string | null
          contract_uploaded_at: string | null
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
          contract_file_name?: string | null
          contract_file_path?: string | null
          contract_sent_at?: string | null
          contract_uploaded_at?: string | null
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
          contract_file_name?: string | null
          contract_file_path?: string | null
          contract_sent_at?: string | null
          contract_uploaded_at?: string | null
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
      project_diagnostic_templates: {
        Row: {
          created_at: string
          id: string
          questions: Json
          service_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions?: Json
          service_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          questions?: Json
          service_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_diagnostics: {
        Row: {
          answers: Json
          budget: Json
          client_name: string
          consultant_notes: Json
          created_at: string
          id: string
          modules: Json
          scope_submission_id: string | null
          scores: Json
          service_slug: string
          service_title: string
          title: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          budget?: Json
          client_name?: string
          consultant_notes?: Json
          created_at?: string
          id?: string
          modules?: Json
          scope_submission_id?: string | null
          scores?: Json
          service_slug?: string
          service_title?: string
          title?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          budget?: Json
          client_name?: string
          consultant_notes?: Json
          created_at?: string
          id?: string
          modules?: Json
          scope_submission_id?: string | null
          scores?: Json
          service_slug?: string
          service_title?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_diagnostics_scope_submission_id_fkey"
            columns: ["scope_submission_id"]
            isOneToOne: false
            referencedRelation: "project_scope_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scope_submissions: {
        Row: {
          answers: Json
          comments: Json
          company: string
          created_at: string
          email: string
          id: string
          lang: string
          notes: string
          phone: string
          respondent_name: string
          respondent_role: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          comments?: Json
          company?: string
          created_at?: string
          email?: string
          id?: string
          lang?: string
          notes?: string
          phone?: string
          respondent_name?: string
          respondent_role?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          comments?: Json
          company?: string
          created_at?: string
          email?: string
          id?: string
          lang?: string
          notes?: string
          phone?: string
          respondent_name?: string
          respondent_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_name: string
          company_type: string
          country: string
          created_at: string
          created_by: string | null
          currency: string
          discount_pct: number
          end_date: string | null
          file_name: string
          file_path: string
          fx_rate: number
          id: string
          language: string
          payload: Json
          remote_only: boolean
          service_title: string
          slug: string
          start_date: string | null
          total_brl: number
          total_currency: number
          updated_at: string
        }
        Insert: {
          client_name?: string
          company_type?: string
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_pct?: number
          end_date?: string | null
          file_name?: string
          file_path?: string
          fx_rate?: number
          id?: string
          language?: string
          payload?: Json
          remote_only?: boolean
          service_title?: string
          slug: string
          start_date?: string | null
          total_brl?: number
          total_currency?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          company_type?: string
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_pct?: number
          end_date?: string | null
          file_name?: string
          file_path?: string
          fx_rate?: number
          id?: string
          language?: string
          payload?: Json
          remote_only?: boolean
          service_title?: string
          slug?: string
          start_date?: string | null
          total_brl?: number
          total_currency?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          activities: Json
          ai_rationale: string
          created_at: string
          id: string
          notes: string
          product_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          activities?: Json
          ai_rationale?: string
          created_at?: string
          id?: string
          notes?: string
          product_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          activities?: Json
          ai_rationale?: string
          created_at?: string
          id?: string
          notes?: string
          product_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "service_products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_products: {
        Row: {
          ai: string
          audience: string
          body: string
          bullets: Json
          code: string
          created_at: string
          duration: string
          duration_corporate: string
          family_id: string
          family_title: string
          group_id: string
          groups: Json
          id: string
          lead: string
          level: string
          limits: string
          modules: Json
          position: number
          price_corporate: string
          price_sme: string
          problem: string
          published: boolean
          results: Json
          slug: string
          title: string
          translations: Json
          updated_at: string
        }
        Insert: {
          ai?: string
          audience?: string
          body?: string
          bullets?: Json
          code?: string
          created_at?: string
          duration?: string
          duration_corporate?: string
          family_id?: string
          family_title?: string
          group_id?: string
          groups?: Json
          id?: string
          lead?: string
          level?: string
          limits?: string
          modules?: Json
          position?: number
          price_corporate?: string
          price_sme?: string
          problem?: string
          published?: boolean
          results?: Json
          slug: string
          title?: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          ai?: string
          audience?: string
          body?: string
          bullets?: Json
          code?: string
          created_at?: string
          duration?: string
          duration_corporate?: string
          family_id?: string
          family_title?: string
          group_id?: string
          groups?: Json
          id?: string
          lead?: string
          level?: string
          limits?: string
          modules?: Json
          position?: number
          price_corporate?: string
          price_sme?: string
          problem?: string
          published?: boolean
          results?: Json
          slug?: string
          title?: string
          translations?: Json
          updated_at?: string
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
      tool_downloads: {
        Row: {
          created_at: string
          id: string
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_downloads_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "management_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_user_profiles: {
        Row: {
          company: string
          created_at: string
          email: string
          first_name: string
          id: string
          job_title: string
          last_name: string
          phone: string
          receive_bulletin: boolean
          receive_insights: boolean
          receive_newsletter: boolean
          revenue_range: string
          segment: string
          state: string
          updated_at: string
          user_id: string
          welcome_sent_at: string | null
        }
        Insert: {
          company?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          phone?: string
          receive_bulletin?: boolean
          receive_insights?: boolean
          receive_newsletter?: boolean
          revenue_range?: string
          segment?: string
          state?: string
          updated_at?: string
          user_id: string
          welcome_sent_at?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          phone?: string
          receive_bulletin?: boolean
          receive_insights?: boolean
          receive_newsletter?: boolean
          revenue_range?: string
          segment?: string
          state?: string
          updated_at?: string
          user_id?: string
          welcome_sent_at?: string | null
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
      get_weekly_schedules: {
        Args: never
        Returns: {
          job_name: string
          schedule: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_public_consultants: {
        Args: never
        Returns: {
          academic_logos: Json
          certifications: Json
          client_logos: Json
          clients: string
          education: string
          experience: string
          full_name: string
          headline: string
          highlights: Json
          id: string
          lattes_url: string
          orcid_url: string
          photo_url: string
          segments: Json
          slug: string
          sort_order: number
          specialties: Json
          website_url: string
          works: string
          years_experience: number
        }[]
      }
      list_site_articles: {
        Args: never
        Returns: {
          article_date: string
          author_contact: string
          authors: string
          cover_url: string
          created_at: string
          file_name: string
          file_path: string
          group_id: string
          id: string
          kind: string
          link_url: string
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
        }[]
      }
      set_weekly_schedule: {
        Args: { _job: string; _schedule: string }
        Returns: undefined
      }
      verify_cron_secret: { Args: { _token: string }; Returns: boolean }
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
    Enums: {
      app_role: ["admin", "editor", "autor", "consultor"],
    },
  },
} as const
