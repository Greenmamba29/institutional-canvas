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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_config: {
        Row: {
          created_at: string | null
          enabled_agents: string[] | null
          id: string
          org_id: string | null
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_agents?: string[] | null
          id?: string
          org_id?: string | null
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_agents?: string[] | null
          id?: string
          org_id?: string | null
          tier?: string | null
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          idempotency_key: string | null
          job_id: string
          metrics: Json | null
          org_id: string | null
          stage: string
          status: string
          stone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          idempotency_key?: string | null
          job_id: string
          metrics?: Json | null
          org_id?: string | null
          stage: string
          status: string
          stone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          idempotency_key?: string | null
          job_id?: string
          metrics?: Json | null
          org_id?: string | null
          stage?: string
          status?: string
          stone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          agent_name: string
          created_at: string | null
          file_id: string | null
          folder_suggestion: string | null
          id: string
          log: string | null
          score: number | null
          success: boolean
          updated_tags: string[] | null
          user_id: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          file_id?: string | null
          folder_suggestion?: string | null
          id?: string
          log?: string | null
          score?: number | null
          success: boolean
          updated_tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          file_id?: string | null
          folder_suggestion?: string | null
          id?: string
          log?: string | null
          score?: number | null
          success?: boolean
          updated_tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_analysis_results: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          content: Json
          created_at: string | null
          error_message: string | null
          file_id: string
          id: string
          model_used: string | null
          processing_time_ms: number | null
          provider: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          content: Json
          created_at?: string | null
          error_message?: string | null
          file_id: string
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          provider: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          content?: Json
          created_at?: string | null
          error_message?: string | null
          file_id?: string
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          provider?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_processing_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_id: string
          id: string
          result: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_id: string
          id?: string
          result?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_id?: string
          id?: string
          result?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_queue_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_usage: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          id: string
          model: string
          processing_time_ms: number | null
          provider: string
          requests_count: number | null
          task_type: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          model: string
          processing_time_ms?: number | null
          provider: string
          requests_count?: number | null
          task_type: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          model?: string
          processing_time_ms?: number | null
          provider?: string
          requests_count?: number | null
          task_type?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certificate_url: string | null
          certification_number: string | null
          certification_type: string
          created_at: string | null
          expiry_date: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          supplier_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_number?: string | null
          certification_type: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          supplier_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_number?: string | null
          certification_type?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_documents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation: Json | null
          created_at: string | null
          id: string
          model_used: string
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation?: Json | null
          created_at?: string | null
          id?: string
          model_used: string
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation?: Json | null
          created_at?: string | null
          id?: string
          model_used?: string
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_group_files: {
        Row: {
          created_at: string | null
          file_id: string
          file_path: string | null
          file_size_bytes: number | null
          group_id: string
          hash_value: string | null
          id: string
          is_original: boolean | null
          similarity_score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_id: string
          file_path?: string | null
          file_size_bytes?: number | null
          group_id: string
          hash_value?: string | null
          id?: string
          is_original?: boolean | null
          similarity_score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_id?: string
          file_path?: string | null
          file_size_bytes?: number | null
          group_id?: string
          hash_value?: string | null
          id?: string
          is_original?: boolean | null
          similarity_score?: number
          user_id?: string
        }
        Relationships: []
      }
      duplicate_groups: {
        Row: {
          created_at: string | null
          group_hash: string
          id: string
          potential_savings_bytes: number | null
          similarity_threshold: number
          status: string | null
          total_files: number | null
          total_size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_hash: string
          id?: string
          potential_savings_bytes?: number | null
          similarity_threshold: number
          status?: string | null
          total_files?: number | null
          total_size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_hash?: string
          id?: string
          potential_savings_bytes?: number | null
          similarity_threshold?: number
          status?: string | null
          total_files?: number | null
          total_size_bytes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          content: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      file_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      file_tags: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          file_id: string
          id: string
          is_ai_generated: boolean | null
          tag_name: string
          tag_type: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          file_id: string
          id?: string
          is_ai_generated?: boolean | null
          tag_name: string
          tag_type?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          file_id?: string
          id?: string
          is_ai_generated?: boolean | null
          tag_name?: string
          tag_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          chat_id: string | null
          content_type: string
          context: string | null
          created_at: string
          filename: string
          id: string
          metadata: Json | null
          original_name: string
          size: number
          url: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          content_type: string
          context?: string | null
          created_at?: string
          filename: string
          id?: string
          metadata?: Json | null
          original_name: string
          size: number
          url: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          content_type?: string
          context?: string | null
          created_at?: string
          filename?: string
          id?: string
          metadata?: Json | null
          original_name?: string
          size?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          ai_summary: string | null
          ai_tags: Json | null
          category: string | null
          confidence_score: number | null
          custom_metadata: Json | null
          id: string
          media_type: string | null
          metadata: Json | null
          mime_type: string
          name: string
          path: string | null
          processing_status: string | null
          quarantined: boolean
          risk_score: number | null
          size: number
          size_bytes: number | null
          storage_path: string
          subcategory: string | null
          tags: string[] | null
          thumbnail_path: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
          user_tags: string[] | null
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: Json | null
          category?: string | null
          confidence_score?: number | null
          custom_metadata?: Json | null
          id?: string
          media_type?: string | null
          metadata?: Json | null
          mime_type: string
          name: string
          path?: string | null
          processing_status?: string | null
          quarantined?: boolean
          risk_score?: number | null
          size: number
          size_bytes?: number | null
          storage_path: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
          user_tags?: string[] | null
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: Json | null
          category?: string | null
          confidence_score?: number | null
          custom_metadata?: Json | null
          id?: string
          media_type?: string | null
          metadata?: Json | null
          mime_type?: string
          name?: string
          path?: string | null
          processing_status?: string | null
          quarantined?: boolean
          risk_score?: number | null
          size?: number
          size_bytes?: number | null
          storage_path?: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
          user_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_summaries: {
        Row: {
          completed_stages: number | null
          created_at: string | null
          error_details: Json | null
          failed_stages: number | null
          finished_at: string | null
          job_id: string
          metrics: Json | null
          org_id: string | null
          started_at: string | null
          status: string
          total_stages: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_stages?: number | null
          created_at?: string | null
          error_details?: Json | null
          failed_stages?: number | null
          finished_at?: string | null
          job_id: string
          metrics?: Json | null
          org_id?: string | null
          started_at?: string | null
          status: string
          total_stages?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_stages?: number | null
          created_at?: string | null
          error_details?: Json | null
          failed_stages?: number | null
          finished_at?: string | null
          job_id?: string
          metrics?: Json | null
          org_id?: string | null
          started_at?: string | null
          status?: string
          total_stages?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          file_ids: string[] | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          file_ids?: string[] | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          file_ids?: string[] | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          coordinates: unknown
          country: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          supplier_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          coordinates?: unknown
          country: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          supplier_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          coordinates?: unknown
          country?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          role: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          payment_status: string
          quote_id: string | null
          status: string
          supplier_id: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          payment_status?: string
          quote_id?: string | null
          status?: string
          supplier_id: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          payment_status?: string
          quote_id?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      pdf_documents: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          size: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          size?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          size?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_documents_conversation_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          id: number
          monthly_limit: number
          plan_type: string
          price: number
          price_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          monthly_limit: number
          plan_type: string
          price: number
          price_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          monthly_limit?: number
          plan_type?: string
          price?: number
          price_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          availability: string
          bulk_discount_percentage: number | null
          bulk_discount_threshold: number | null
          created_at: string | null
          currency: string
          has_bulk_discount: boolean | null
          id: string
          min_order_quantity: number | null
          name: string
          price_per_unit: number
          product_type: string
          purity_level: string
          supplier_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          availability: string
          bulk_discount_percentage?: number | null
          bulk_discount_threshold?: number | null
          created_at?: string | null
          currency?: string
          has_bulk_discount?: boolean | null
          id?: string
          min_order_quantity?: number | null
          name: string
          price_per_unit: number
          product_type: string
          purity_level: string
          supplier_id: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          availability?: string
          bulk_discount_percentage?: number | null
          bulk_discount_threshold?: number | null
          created_at?: string | null
          currency?: string
          has_bulk_discount?: boolean | null
          id?: string
          min_order_quantity?: number | null
          name?: string
          price_per_unit?: number
          product_type?: string
          purity_level?: string
          supplier_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          enable_sound_fx: boolean
          full_name: string | null
          id: string
          is_admin: boolean
          org_id: string | null
          preferences: Json | null
          purchase: string | null
          seats: number | null
          tier: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          enable_sound_fx?: boolean
          full_name?: string | null
          id: string
          is_admin?: boolean
          org_id?: string | null
          preferences?: Json | null
          purchase?: string | null
          seats?: number | null
          tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          enable_sound_fx?: boolean
          full_name?: string | null
          id?: string
          is_admin?: boolean
          org_id?: string | null
          preferences?: Json | null
          purchase?: string | null
          seats?: number | null
          tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string | null
          github_username: string | null
          id: number
          payload: Json | null
          provider: string | null
          purchase_id: string | null
          type: string | null
          user_email: string | null
        }
        Insert: {
          created_at?: string | null
          github_username?: string | null
          id?: number
          payload?: Json | null
          provider?: string | null
          purchase_id?: string | null
          type?: string | null
          user_email?: string | null
        }
        Update: {
          created_at?: string | null
          github_username?: string | null
          id?: number
          payload?: Json | null
          provider?: string | null
          purchase_id?: string | null
          type?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          requested_price: number | null
          status: string
          supplier_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          requested_price?: number | null
          status?: string
          supplier_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          requested_price?: number | null
          status?: string
          supplier_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author: string
          company: string | null
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          supplier_id: string
          updated_at: string | null
          user_id: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          author: string
          company?: string | null
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          supplier_id: string
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          author?: string
          company?: string | null
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          supplier_id?: string
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_folders: {
        Row: {
          auto_organize: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: Json
          template_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_organize?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules?: Json
          template_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_organize?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json
          template_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: number
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["price_id"]
          },
        ]
      }
      summaries: {
        Row: {
          action_items: string | null
          created_at: string | null
          id: string
          model: string
          recording_id: string | null
          summary: string
          title: string | null
        }
        Insert: {
          action_items?: string | null
          created_at?: string | null
          id?: string
          model: string
          recording_id?: string | null
          summary: string
          title?: string | null
        }
        Update: {
          action_items?: string | null
          created_at?: string | null
          id?: string
          model?: string
          recording_id?: string | null
          summary?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          contact_email: string | null
          created_at: string | null
          description: string | null
          id: string
          phone: string | null
          specialties: string[] | null
          supplier_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phone?: string | null
          specialties?: string[] | null
          supplier_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phone?: string | null
          specialties?: string[] | null
          supplier_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_profiles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          rating: number | null
          response_time: string | null
          review_count: number | null
          transaction_count: number | null
          updated_at: string | null
          verification_tier: string
          years_in_business: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          verification_tier: string
          years_in_business?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          verification_tier?: string
          years_in_business?: number | null
        }
        Relationships: []
      }
      telebuy_documents: {
        Row: {
          content: Json
          created_at: string | null
          document_type: string
          docusign_envelope_id: string | null
          id: string
          session_id: string
          signed_at: string | null
          signed_by: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          document_type: string
          docusign_envelope_id?: string | null
          id?: string
          session_id: string
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          document_type?: string
          docusign_envelope_id?: string | null
          id?: string
          session_id?: string
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telebuy_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telebuy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telebuy_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          meeting_id: string | null
          meeting_url: string
          notes: string | null
          recording_url: string | null
          scheduled_at: string
          started_at: string | null
          status: string
          supplier_id: string
          transcript: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          meeting_id?: string | null
          meeting_url: string
          notes?: string | null
          recording_url?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: string
          supplier_id: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          meeting_id?: string | null
          meeting_url?: string
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          supplier_id?: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telebuy_sessions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          chunks: Json | null
          created_at: string | null
          id: string
          model: string
          recording_id: string | null
          transcript: string
        }
        Insert: {
          chunks?: Json | null
          created_at?: string | null
          id?: string
          model: string
          recording_id?: string | null
          transcript: string
        }
        Update: {
          chunks?: Json | null
          created_at?: string | null
          id?: string
          model?: string
          recording_id?: string | null
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          date: string
          files_processed: number
          tier: string
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          date?: string
          files_processed?: number
          tier: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          date?: string
          files_processed?: number
          tier?: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string
          phone: string | null
          preferences: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_job_ops: {
        Row: {
          completed_stages: number | null
          cost_usd: number | null
          created_at: string | null
          errors: number | null
          finished_at: string | null
          job_id: string | null
          p95_latency_ms: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_stages?: number | null
          cost_usd?: never
          created_at?: string | null
          errors?: number | null
          finished_at?: string | null
          job_id?: string | null
          p95_latency_ms?: never
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_stages?: number | null
          cost_usd?: never
          created_at?: string | null
          errors?: number | null
          finished_at?: string | null
          job_id?: string | null
          p95_latency_ms?: never
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_process: {
        Args: { p_requested?: number; p_user: string }
        Returns: Json
      }
      check_usage_limit: {
        Args: { p_tier?: string; p_user_id: string }
        Returns: Json
      }
      ensure_folder_path: {
        Args: { p_path: string; p_user: string }
        Returns: string
      }
      get_chat_document_latest_version: {
        Args: { doc_id: string }
        Returns: string
      }
      get_dashboard_activity: {
        Args: { p_limit?: number }
        Returns: {
          activity_type: string
          created_at: string
          details: Json
          file_id: string
          file_name: string
          id: string
          user_name: string
        }[]
      }
      get_dashboard_stats: {
        Args: never
        Returns: {
          document_files: number
          media_files: number
          recent_files: number
          total_files: number
          total_size: number
        }[]
      }
      get_file_activities: {
        Args: { p_file_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          activity_type: string
          created_at: string
          details: Json
          file_id: string
          id: string
          user_id: string
          user_name: string
        }[]
      }
      get_latest_chat_document: {
        Args: { auth_user_id: string; doc_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          title: string
          user_id: string
        }[]
      }
      increment_usage_counters: {
        Args: {
          p_cost?: number
          p_files_count?: number
          p_tokens?: number
          p_user_id: string
        }
        Returns: {
          cost_usd: number | null
          created_at: string | null
          date: string
          files_processed: number
          tier: string
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_counters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_job_metrics: { Args: { p_job: string }; Returns: Json }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          embedding: Json
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_file_metadata: {
        Args: {
          p_ai_summary?: string
          p_file_id: string
          p_metadata?: Json
          p_tags?: string[]
        }
        Returns: Json
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
