export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      key_results: {
        Row: {
          created_at: string | null
          description: string
          id: string
          objective_id: string
          progress: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          objective_id: string
          progress?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          objective_id?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_custodians: {
        Row: { objective_id: string; user_profile_id: string }
        Insert: { objective_id: string; user_profile_id: string }
        Update: { objective_id?: string; user_profile_id?: string }
        Relationships: [
          {
            foreignKeyName: "objective_custodians_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_custodians_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_owners: {
        Row: { objective_id: string; user_profile_id: string }
        Insert: { objective_id: string; user_profile_id: string }
        Update: { objective_id?: string; user_profile_id?: string }
        Relationships: [
          {
            foreignKeyName: "objective_owners_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_owners_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: { created_at: string | null; id: string; opc_id: string; title: string }
        Insert: { created_at?: string | null; id?: string; opc_id: string; title: string }
        Update: { created_at?: string | null; id?: string; opc_id?: string; title?: string }
        Relationships: [
          {
            foreignKeyName: "objectives_opc_id_fkey"
            columns: ["opc_id"]
            isOneToOne: false
            referencedRelation: "operation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_cycles: {
        Row: {
          created_at: string | null
          cycle_number: number
          end_date: string
          id: string
          is_active: boolean
          start_date: string
        }
        Insert: {
          created_at?: string | null
          cycle_number: number
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
        }
        Update: {
          created_at?: string | null
          cycle_number?: number
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          announcement_expiry: string | null
          announcement_text: string | null
          company_name: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          announcement_expiry?: string | null
          announcement_text?: string | null
          company_name?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          announcement_expiry?: string | null
          announcement_text?: string | null
          company_name?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          busy_until: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          status: string | null
          status_changed_at: string | null
          status_note: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          busy_until?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          busy_until?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_safe_user_profiles: {
        Row: {
          avatar_url: string | null
          busy_until: string | null
          full_name: string | null
          id: string | null
          role: string | null
          status: string | null
          status_changed_at: string | null
          status_note: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          busy_until?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          busy_until?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      expire_busy_statuses: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user_profiles: { Args: never; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Convenience types ────────────────────────────────────────────────────────
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type SiteSettings = Database['public']['Tables']['site_settings']['Row']
export type OperationCycle = Database['public']['Tables']['operation_cycles']['Row']
export type Objective = Database['public']['Tables']['objectives']['Row']
export type KeyResult = Database['public']['Tables']['key_results']['Row']
export type ObjectiveOwner = Database['public']['Tables']['objective_owners']['Row']
export type ObjectiveCustodian = Database['public']['Tables']['objective_custodians']['Row']
export type AiSafeUserProfile = Database['public']['Views']['ai_safe_user_profiles']['Row']

// Semantic aliases (narrowed from string | null for component use)
export type Role = 'admin' | 'employee' | 'coordinator'
export type Status = 'available' | 'busy' | 'important'
