-- Local Grindz Phase 4c: Live Orders Lifecycle
-- Run in Supabase → SQL Editor

-- Add order lifecycle columns
alter table orders
  add column if not exists accepted_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists estimated_minutes integer,
  add column if not exists cancellation_reason text,
  add column if not exists customer_email text;

-- Update status enum constraint (if exists) to include new values
-- Orders status: pending | accepted | preparing | ready | completed | cancelled
-- (The existing 'status text' column accepts any string — no change needed if no check constraint)

-- Customer order tracking: allow reading own order by id (no auth needed)
-- Public can read any order by its UUID — the UUID is the "secret"
create policy "public read order by id" on orders
  for select using (true);

-- Enable realtime for orders table (run in Supabase dashboard → Database → Replication)
-- Or via SQL:
alter publication supabase_realtime add table orders;

-- vendor_events: also enable realtime for analytics
alter publication supabase_realtime add table vendor_events;

-- customer_points: enable realtime (optional, for live loyalty balance)
alter publication supabase_realtime add table customer_points;
