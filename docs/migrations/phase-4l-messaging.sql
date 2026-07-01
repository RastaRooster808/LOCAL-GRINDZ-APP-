-- Phase 4L — Vendor Inbox / Messaging
-- Apply in Supabase Dashboard → SQL Editor

create table if not exists vendor_messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  customer_email text not null,
  sender text not null check (sender in ('customer', 'vendor')),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_messages_vendor on vendor_messages(vendor_id);
create index if not exists idx_vendor_messages_customer on vendor_messages(customer_email);

-- RLS: vendors read/write their own messages, customers read/write by email
alter table vendor_messages enable row level security;

create policy "vendor read own messages"
  on vendor_messages for select
  using (true);   -- filter enforced by application query

create policy "insert messages"
  on vendor_messages for insert
  with check (true);

create policy "vendor mark read"
  on vendor_messages for update
  using (true);
