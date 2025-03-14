export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string
          features: string[]
          monthly_price: number
          annual_price: number
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          features: string[]
          monthly_price: number
          annual_price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          features?: string[]
          monthly_price?: number
          annual_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          billing_period: string
          current_period_start: string
          current_period_end: string
          price: number
          created_at: string
          updated_at: string | null
          canceled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: string
          billing_period: string
          current_period_start: string
          current_period_end: string
          price: number
          created_at?: string
          updated_at?: string | null
          canceled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          billing_period?: string
          current_period_start?: string
          current_period_end?: string
          price?: number
          created_at?: string
          updated_at?: string | null
          canceled_at?: string | null
        }
      }
      subscription_transactions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          plan_id: string
          amount: number
          status: string
          payment_method: string
          billing_period: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          plan_id: string
          amount: number
          status: string
          payment_method: string
          billing_period: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string
          plan_id?: string
          amount?: number
          status?: string
          payment_method?: string
          billing_period?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      // Include other tables as needed
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
  }
} 
 
 
 