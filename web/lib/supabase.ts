import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing environment variables. Database features will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser
        Insert: Omit<DbUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DbUser, 'id'>>
      }
      recipients: {
        Row: DbRecipient
        Insert: Omit<DbRecipient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DbRecipient, 'id'>>
      }
      transactions: {
        Row: DbTransaction
        Insert: Omit<DbTransaction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DbTransaction, 'id'>>
      }
      notifications: {
        Row: DbNotification
        Insert: Omit<DbNotification, 'id' | 'created_at'>
        Update: Partial<Omit<DbNotification, 'id'>>
      }
    }
  }
}

export interface DbUser {
  id: string
  xellar_user_id: string
  wallet_address: string | null
  wallet_status: 'pending' | 'created' | 'failed'
  email: string
  name: string | null
  phone: string | null
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected'
  kyc_submitted_at: string | null
  kyc_verified_at: string | null
  kyc_rejection_reason: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface DbRecipient {
  id: string
  user_id: string
  name: string
  nickname: string | null
  phone: string | null
  email: string | null
  bank_code: string
  bank_name: string
  account_number: string
  account_type: 'bank' | 'ewallet'
  total_sent: number
  transaction_count: number
  last_sent_at: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface DbTransaction {
  id: string
  user_id: string
  recipient_id: string | null
  
  // Transaction details
  amount: number
  currency: string
  recipient_name: string
  recipient_bank: string
  recipient_account: string
  
  // Blockchain reference (Link to on-chain proof)
  tx_hash: string | null  // ← Blockchain transaction hash
  from_wallet_address: string
  to_wallet_address: string | null
  chain_id: number | null
  block_number: number | null
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  // Metadata (Database only)
  notes: string | null
  category: string | null
  purpose: string | null
  
  // Fees & Exchange
  fee_amount: number
  exchange_rate: number | null
  local_amount: number | null
  local_currency: string
  
  // Timestamps
  created_at: string
  updated_at: string
  completed_at: string | null
  
  // Xellar tracking
  xellar_transaction_id: string | null
}

export interface DbNotification {
  id: string
  user_id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  action_label: string | null
  action_href: string | null
  read: boolean
  read_at: string | null
  transaction_id: string | null
  created_at: string
}
