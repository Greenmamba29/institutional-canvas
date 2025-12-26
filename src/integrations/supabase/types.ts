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
    PostgrestVersion: "14.1"
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
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          org_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          org_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          org_id: string
          product_id: string | null
          reserve_price: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          org_id: string
          product_id?: string | null
          reserve_price?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          org_id?: string
          product_id?: string | null
          reserve_price?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auctions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          outcome: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          outcome: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          outcome?: string
          user_id?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          is_withdrawn: boolean
          lead_time_days: number | null
          notes: string | null
          org_id: string
          price: number
          quantity: number | null
          rfq_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          is_withdrawn?: boolean
          lead_time_days?: number | null
          notes?: string | null
          org_id: string
          price: number
          quantity?: number | null
          rfq_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          is_withdrawn?: boolean
          lead_time_days?: number | null
          notes?: string | null
          org_id?: string
          price?: number
          quantity?: number | null
          rfq_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "bids_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_public"
            referencedColumns: ["org_id"]
          },
        ]
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
        Relationships: []
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
          org_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          buyer_user_id: string
          created_at: string
          id: string
          offer_decision: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at: string | null
          offer_note: string | null
          org_id: string
          rfq_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          supplier_id: string
          title: string
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          id?: string
          offer_decision?: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at?: string | null
          offer_note?: string | null
          org_id: string
          rfq_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          supplier_id: string
          title: string
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          id?: string
          offer_decision?: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at?: string | null
          offer_note?: string | null
          org_id?: string
          rfq_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          supplier_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "deals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_public"
            referencedColumns: ["org_id"]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          parent_id?: string | null
          path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
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
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          id: string
          org_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          org_id?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          org_id?: string | null
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
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          org_id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          org_id: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          org_id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          org_type: string
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_type: string
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_type?: string
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
      price_indicators: {
        Row: {
          currency: string
          id: string
          metadata: Json
          observed_at: string
          price: number
          region: string
          source: string | null
          symbol: string
          unit: string
        }
        Insert: {
          currency?: string
          id?: string
          metadata?: Json
          observed_at?: string
          price: number
          region: string
          source?: string | null
          symbol: string
          unit: string
        }
        Update: {
          currency?: string
          id?: string
          metadata?: Json
          observed_at?: string
          price?: number
          region?: string
          source?: string | null
          symbol?: string
          unit?: string
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          price_per_unit?: number
          product_type?: string
          purity_level?: string
          supplier_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
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
      purchase_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_payload: Json | null
          event_type: string
          id: string
          purchase_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_payload?: Json | null
          event_type: string
          id?: string
          purchase_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_payload?: Json | null
          event_type?: string
          id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_events_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          buyer_org_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payload: Json | null
          purchase_id: string | null
          status: string | null
          supplier_org_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          buyer_org_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          purchase_id?: string | null
          status?: string | null
          supplier_org_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          buyer_org_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          purchase_id?: string | null
          status?: string | null
          supplier_org_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_org_id_fkey"
            columns: ["supplier_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_org_id_fkey"
            columns: ["supplier_org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "quotes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
        Relationships: []
      }
      rfqs: {
        Row: {
          created_at: string
          created_by: string
          delivery_location: string | null
          description: string | null
          id: string
          incoterms: string | null
          organization_id: string
          product_id: string | null
          status: Database["public"]["Enums"]["rfq_status"]
          target_quantity: number | null
          target_unit: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_location?: string | null
          description?: string | null
          id?: string
          incoterms?: string | null
          organization_id: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          target_quantity?: number | null
          target_unit?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_location?: string | null
          description?: string | null
          id?: string
          incoterms?: string | null
          organization_id?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          target_quantity?: number | null
          target_unit?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
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
        Relationships: []
      }
      suppliers: {
        Row: {
          capabilities: Json | null
          claim_status: string | null
          claim_token_hash: string | null
          display_name: string | null
          invited_email: string | null
          org_id: string
          organization_id: string | null
          public_profile: Json | null
          verification_tier: string | null
        }
        Insert: {
          capabilities?: Json | null
          claim_status?: string | null
          claim_token_hash?: string | null
          display_name?: string | null
          invited_email?: string | null
          org_id: string
          organization_id?: string | null
          public_profile?: Json | null
          verification_tier?: string | null
        }
        Update: {
          capabilities?: Json | null
          claim_status?: string | null
          claim_token_hash?: string | null
          display_name?: string | null
          invited_email?: string | null
          org_id?: string
          organization_id?: string | null
          public_profile?: Json | null
          verification_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "telebuy_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telebuy_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "supplier_directory"
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
      supplier_directory: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          org_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          org_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          org_type?: string | null
        }
        Relationships: []
      }
      suppliers_public: {
        Row: {
          capabilities: Json | null
          display_name: string | null
          org_id: string | null
          public_profile: Json | null
          verification_tier: string | null
        }
        Insert: {
          capabilities?: Json | null
          display_name?: string | null
          org_id?: string | null
          public_profile?: Json | null
          verification_tier?: string | null
        }
        Update: {
          capabilities?: Json | null
          display_name?: string | null
          org_id?: string | null
          public_profile?: Json | null
          verification_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "supplier_directory"
            referencedColumns: ["id"]
          },
        ]
      }
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
      create_deal: {
        Args: { p_rfq_id: string; p_supplier_id: string; p_title: string }
        Returns: {
          buyer_user_id: string
          created_at: string
          id: string
          offer_decision: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at: string | null
          offer_note: string | null
          org_id: string
          rfq_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          supplier_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization: {
        Args: {
          p_email?: string
          p_name: string
          p_org_type: string
          p_phone?: string
        }
        Returns: {
          created_at: string
          email: string | null
          id: string
          name: string
          org_type: string
          phone: string | null
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_purchase:
        | {
            Args: {
              p_buyer_org_id: string
              p_currency?: string
              p_deal_id?: string
              p_notes?: string
              p_payload?: Json
              p_supplier_org_id: string
              p_total_amount?: number
            }
            Returns: {
              buyer_org_id: string | null
              created_at: string
              created_by: string
              currency: string | null
              deal_id: string | null
              id: string
              notes: string | null
              payload: Json | null
              purchase_id: string | null
              status: string | null
              supplier_org_id: string | null
              total_amount: number | null
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "purchases"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_buyer_org_id: string
              p_payload?: Json
              p_supplier_org_id: string
            }
            Returns: {
              buyer_org_id: string | null
              created_at: string
              created_by: string
              currency: string | null
              deal_id: string | null
              id: string
              notes: string | null
              payload: Json | null
              purchase_id: string | null
              status: string | null
              supplier_org_id: string | null
              total_amount: number | null
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "purchases"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      create_rfq: {
        Args: {
          p_delivery_location: string
          p_description: string
          p_incoterms: string
          p_product_id: string
          p_target_quantity: number
          p_target_unit: string
          p_title: string
        }
        Returns: {
          created_at: string
          created_by: string
          delivery_location: string | null
          description: string | null
          id: string
          incoterms: string | null
          organization_id: string
          product_id: string | null
          status: Database["public"]["Enums"]["rfq_status"]
          target_quantity: number | null
          target_unit: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rfqs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_sub: { Args: never; Returns: string }
      ensure_folder_path: {
        Args: { p_path: string; p_user: string }
        Returns: string
      }
      get_audit_logs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          outcome: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_log"
          isOneToOne: false
          isSetofReturn: true
        }
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
      get_listing: {
        Args: { p_product_id: string }
        Returns: {
          availability: string
          bulk_discount_percentage: number | null
          bulk_discount_threshold: number | null
          created_at: string | null
          currency: string
          has_bulk_discount: boolean | null
          id: string
          min_order_quantity: number | null
          name: string
          org_id: string | null
          price_per_unit: number
          product_type: string
          purity_level: string
          supplier_id: string
          unit: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_organizations: {
        Args: never
        Returns: {
          created_at: string
          email: string | null
          id: string
          name: string
          org_type: string
          phone: string | null
          status: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_notifications: {
        Args: never
        Returns: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          org_id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_price_indicators: {
        Args: { p_limit?: number; p_region: string; p_symbol: string }
        Returns: Json
      }
      get_purchase: {
        Args: { p_purchase_id: string }
        Returns: {
          buyer_org_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payload: Json | null
          purchase_id: string | null
          status: string | null
          supplier_org_id: string | null
          total_amount: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_purchase_by_id: {
        Args: { p_po: string }
        Returns: {
          buyer_org_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payload: Json | null
          purchase_id: string | null
          status: string | null
          supplier_org_id: string | null
          total_amount: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      has_org_role: {
        Args: { p_org_id: string; p_role: string }
        Returns: boolean
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
      invite_org_member: {
        Args: { p_org_id: string; p_role?: string; p_user_email: string }
        Returns: Json
      }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      jwt_claim: { Args: { claim: string }; Returns: string }
      jwt_org_id: { Args: never; Returns: string }
      jwt_user_id: { Args: never; Returns: string }
      list_auctions: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          org_id: string
          product_id: string | null
          reserve_price: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "auctions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_listings: {
        Args: never
        Returns: {
          availability: string
          bulk_discount_percentage: number | null
          bulk_discount_threshold: number | null
          created_at: string | null
          currency: string
          has_bulk_discount: boolean | null
          id: string
          min_order_quantity: number | null
          name: string
          org_id: string | null
          price_per_unit: number
          product_type: string
          purity_level: string
          supplier_id: string
          unit: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_purchases: {
        Args: never
        Returns: {
          buyer_org_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payload: Json | null
          purchase_id: string | null
          status: string | null
          supplier_org_id: string | null
          total_amount: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_rfqs: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          delivery_location: string | null
          description: string | null
          id: string
          incoterms: string | null
          organization_id: string
          product_id: string | null
          status: Database["public"]["Enums"]["rfq_status"]
          target_quantity: number | null
          target_unit: string | null
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "rfqs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_outcome: string
        }
        Returns: string
      }
      log_job_metrics: { Args: { p_job: string }; Returns: Json }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
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
      place_auction_bid: {
        Args: { p_amount: number; p_auction_id: string; p_currency: string }
        Returns: {
          amount: number
          auction_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          org_id: string
        }
        SetofOptions: {
          from: "*"
          to: "auction_bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_offer: {
        Args: {
          p_deal_id: string
          p_decision: Database["public"]["Enums"]["offer_decision"]
          p_note: string
        }
        Returns: {
          buyer_user_id: string
          created_at: string
          id: string
          offer_decision: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at: string | null
          offer_note: string | null
          org_id: string
          rfq_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          supplier_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_bid: {
        Args: {
          p_currency: string
          p_lead_time_days: number
          p_notes: string
          p_price: number
          p_quantity: number
          p_rfq_id: string
          p_supplier_id: string
        }
        Returns: {
          created_at: string
          created_by: string
          currency: string
          id: string
          is_withdrawn: boolean
          lead_time_days: number | null
          notes: string | null
          org_id: string
          price: number
          quantity: number | null
          rfq_id: string
          supplier_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_deal_status: {
        Args: {
          p_deal_id: string
          p_status: Database["public"]["Enums"]["deal_status"]
        }
        Returns: {
          buyer_user_id: string
          created_at: string
          id: string
          offer_decision: Database["public"]["Enums"]["offer_decision"] | null
          offer_decision_at: string | null
          offer_note: string | null
          org_id: string
          rfq_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          supplier_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_file_metadata: {
        Args: {
          p_ai_summary?: string
          p_file_id: string
          p_metadata?: Json
          p_tags?: string[]
        }
        Returns: Json
      }
      update_purchase_status: {
        Args: { p_purchase_id: string; p_status: string }
        Returns: {
          buyer_org_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payload: Json | null
          purchase_id: string | null
          status: string | null
          supplier_org_id: string | null
          total_amount: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      withdraw_bid: { Args: { p_bid_id: string }; Returns: boolean }
    }
    Enums: {
      auction_status: "scheduled" | "live" | "ended" | "cancelled"
      deal_status:
        | "pending"
        | "active"
        | "rejected"
        | "expired"
        | "completed"
        | "cancelled"
      notification_type:
        | "rfq_submitted"
        | "rfq_awarded"
        | "deal_created"
        | "deal_offer_response"
        | "auction_bid_placed"
        | "auction_won"
        | "system"
      offer_decision: "accepted" | "rejected"
      rfq_status: "draft" | "submitted" | "closed" | "cancelled"
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
      auction_status: ["scheduled", "live", "ended", "cancelled"],
      deal_status: [
        "pending",
        "active",
        "rejected",
        "expired",
        "completed",
        "cancelled",
      ],
      notification_type: [
        "rfq_submitted",
        "rfq_awarded",
        "deal_created",
        "deal_offer_response",
        "auction_bid_placed",
        "auction_won",
        "system",
      ],
      offer_decision: ["accepted", "rejected"],
      rfq_status: ["draft", "submitted", "closed", "cancelled"],
    },
  },
} as const
