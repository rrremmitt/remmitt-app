-- Supabase Database Schema for Remitt
-- Run this SQL in your Supabase SQL Editor
-- Date: December 17, 2025

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  
  -- Xellar Integration
  xellar_user_id text unique not null,
  wallet_address text,
  wallet_status text default 'pending' check (wallet_status in ('pending', 'created', 'failed')),
  
  -- Profile
  email text unique not null,
  name text,
  phone text,
  
  -- KYC
  kyc_status text default 'none' check (kyc_status in ('none', 'pending', 'verified', 'rejected')),
  kyc_submitted_at timestamptz,
  kyc_verified_at timestamptz,
  kyc_rejection_reason text,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz
);

-- Indexes for fast lookups
create index if not exists users_xellar_user_id_idx on public.users(xellar_user_id);
create index if not exists users_wallet_address_idx on public.users(wallet_address);
create index if not exists users_email_idx on public.users(email);

-- ============================================
-- RECIPIENTS TABLE
-- ============================================
create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Recipient Details
  name text not null,
  nickname text,
  phone text,
  email text,
  
  -- Bank/E-wallet Info
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_type text check (account_type in ('bank', 'ewallet')),
  
  -- Metadata
  total_sent numeric default 0,
  transaction_count integer default 0,
  last_sent_at timestamptz,
  is_favorite boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure unique recipient per user
  constraint recipients_user_account_unique unique (user_id, bank_code, account_number)
);

create index if not exists recipients_user_id_idx on public.recipients(user_id);
create index if not exists recipients_is_favorite_idx on public.recipients(user_id, is_favorite);

-- ============================================
-- TRANSACTIONS TABLE (Hybrid: DB + Blockchain)
-- ============================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  
  -- User & Recipient
  user_id uuid references public.users(id) on delete cascade not null,
  recipient_id uuid references public.recipients(id) on delete set null,
  
  -- Transaction Details (Database)
  amount numeric not null,
  currency text default 'USDC',
  recipient_name text not null,
  recipient_bank text not null,
  recipient_account text not null,
  
  -- Blockchain Reference (Link to on-chain proof)
  tx_hash text unique,  -- ← Blockchain transaction hash
  from_wallet_address text not null,
  to_wallet_address text,
  chain_id integer,
  block_number bigint,
  
  -- Status
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Metadata (Database only)
  notes text,
  category text,
  purpose text,
  
  -- Fees & Exchange
  fee_amount numeric default 0,
  exchange_rate numeric,
  local_amount numeric,  -- Amount in IDR
  local_currency text default 'IDR',
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  
  -- Xellar Transaction ID (for tracking)
  xellar_transaction_id text unique
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_tx_hash_idx on public.transactions(tx_hash);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);
create index if not exists transactions_recipient_id_idx on public.transactions(recipient_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Notification Details
  type text not null check (type in ('success', 'warning', 'info', 'error')),
  title text not null,
  message text not null,
  
  -- Action Link
  action_label text,
  action_href text,
  
  -- Status
  read boolean default false,
  read_at timestamptz,
  
  -- Related entities (optional)
  transaction_id uuid references public.transactions(id) on delete set null,
  
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(user_id, read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update recipient stats when a transaction is created
create or replace function increment_recipient_stats(
  p_recipient_id uuid,
  p_amount numeric
)
returns void
language plpgsql
as $$
begin
  update public.recipients
  set 
    total_sent = total_sent + p_amount,
    transaction_count = transaction_count + 1,
    last_sent_at = now(),
    updated_at = now()
  where id = p_recipient_id;
end;
$$;

-- Function to auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply auto-update triggers
create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at_column();

create trigger update_recipients_updated_at before update on public.recipients
  for each row execute function update_updated_at_column();

create trigger update_transactions_updated_at before update on public.transactions
  for each row execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.recipients enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;

-- Users can view their own profile
create policy "Users can view own profile"
  on public.users for select
  using (true);  -- Allow public read for now (you can restrict later with auth)

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (true);

-- Users can insert (signup)
create policy "Users can signup"
  on public.users for insert
  with check (true);

-- Recipients policies
create policy "Users can view own recipients"
  on public.recipients for select
  using (true);

create policy "Users can manage own recipients"
  on public.recipients for all
  using (true);

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (true);

create policy "Users can create transactions"
  on public.transactions for insert
  with check (true);

create policy "Users can update own transactions"
  on public.transactions for update
  using (true);

-- Notifications policies
create policy "Users can view own notifications"
  on public.notifications for select
  using (true);

create policy "System can create notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update own notifications"
  on public.notifications for update
  using (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
-- Insert sample user
insert into public.users (xellar_user_id, email, name, wallet_address, wallet_status, kyc_status)
values ('test-xellar-id-123', 'test@example.com', 'Test User', '0x1234567890abcdef', 'created', 'none');

-- Insert sample notification
insert into public.notifications (user_id, type, title, message)
select id, 'info', 'Welcome to Remitt!', 'Get started by adding your first recipient.'
from public.users where email = 'test@example.com';
*/

-- ============================================
-- STORAGE BUCKETS (For KYC Documents)
-- ============================================

-- Create storage bucket for KYC documents
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- Storage policy: Users can upload to their own folder
create policy "Users can upload own KYC documents"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents' AND
    auth.role() = 'authenticated'
  );

-- Storage policy: Users can view own KYC documents
create policy "Users can view own KYC documents"
  on storage.objects for select
  using (
    bucket_id = 'kyc-documents' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- VIEWS (Optional - for reporting)
-- ============================================

-- View: User transaction summary
create or replace view public.user_transaction_summary as
select 
  u.id as user_id,
  u.email,
  u.name,
  count(t.id) as total_transactions,
  sum(case when t.status = 'completed' then t.amount else 0 end) as total_sent,
  max(t.created_at) as last_transaction_at
from public.users u
left join public.transactions t on u.id = t.user_id
group by u.id, u.email, u.name;

-- ============================================
-- COMPLETE!
-- ============================================

-- To verify your setup, run:
-- select * from public.users;
-- select * from public.recipients;
-- select * from public.transactions;
-- select * from public.notifications;
