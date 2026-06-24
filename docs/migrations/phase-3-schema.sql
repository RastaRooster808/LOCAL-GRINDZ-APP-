-- Local Grindz Phase 3 Migration
-- Run this in Supabase → SQL Editor

-- ── 1. Extend vendors table ─────────────────────────────────────────────────
alter table vendors
  add column if not exists slug text unique,
  add column if not exists cuisine_type text,
  add column if not exists description text,
  add column if not exists photo_url text,
  add column if not exists neighborhood text,
  add column if not exists is_active boolean not null default true;

-- Set slug for Ala's Kitchen (your existing vendor)
update vendors
set slug = 'alas-kitchen',
    cuisine_type = 'burger',
    description = 'Award-winning smash burgers in the heart of Puna.',
    neighborhood = 'Puna'
where email = 'bankspham5@gmail.com';

-- ── 2. Add vendor_id to orders ──────────────────────────────────────────────
alter table orders
  add column if not exists vendor_id uuid references vendors(id);

-- Backfill existing orders with Ala's Kitchen vendor_id
update orders
set vendor_id = (select id from vendors where email = 'bankspham5@gmail.com')
where vendor_id is null;

-- Update orders RLS: vendors read only their own orders
drop policy if exists "vendor read orders" on orders;
create policy "vendor read own orders" on orders
  for select using (
    vendor_id = (select id from vendors where email = auth.email())
  );

-- ── 3. Add vendor_id to reviews ─────────────────────────────────────────────
alter table reviews
  add column if not exists vendor_id uuid references vendors(id);

-- Backfill existing reviews
update reviews
set vendor_id = (select id from vendors where email = 'bankspham5@gmail.com')
where vendor_id is null;

-- Reviews RLS: public reads reviews for a vendor; vendors read all their reviews
drop policy if exists "public read reviews" on reviews;
create policy "public read reviews" on reviews
  for select using (approved = true);

create policy "vendor read own reviews" on reviews
  for select using (
    vendor_id = (select id from vendors where email = auth.email())
  );

-- ── 4. Vendor applications ──────────────────────────────────────────────────
create table if not exists vendor_applications (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  cuisine_type text,
  neighborhood text,
  contact_email text not null,
  contact_phone text,
  instagram text,
  description text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table vendor_applications enable row level security;

create policy "public submit application" on vendor_applications
  for insert with check (true);

create policy "admin read applications" on vendor_applications
  for select using (
    exists (select 1 from admins where id = auth.uid())
  );

create policy "admin update applications" on vendor_applications
  for update using (
    exists (select 1 from admins where id = auth.uid())
  );

-- ── 5. Admins table ─────────────────────────────────────────────────────────
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

alter table admins enable row level security;

create policy "admin read own row" on admins
  for select using (id = auth.uid());

-- ── 6. Add yourself as admin ─────────────────────────────────────────────────
-- Run this AFTER the above. Replace the UUID with your user ID from:
--   SELECT id FROM auth.users WHERE email = 'bankspham5@gmail.com';
--
-- INSERT INTO admins (id, email)
-- VALUES ('YOUR-USER-UUID-HERE', 'bankspham5@gmail.com');

-- ── 7. Vendor features (paid listings) ──────────────────────────────────────
create table if not exists vendor_features (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  tier text not null default 'boost',
  feature_expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table vendor_features enable row level security;

create policy "public read features" on vendor_features
  for select using (feature_expires_at > now());

create policy "admin manage features" on vendor_features
  for all using (
    exists (select 1 from admins where id = auth.uid())
  );

-- ── 8. Customer favourites ───────────────────────────────────────────────────
create table if not exists customer_favorites (
  customer_id uuid references auth.users(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (customer_id, vendor_id)
);

alter table customer_favorites enable row level security;

create policy "customer manage own favorites" on customer_favorites
  for all using (customer_id = auth.uid());

-- ── 9. Public vendor read policy (safe columns only) ────────────────────────
drop policy if exists "public read vendors" on vendors;
create policy "public read vendors" on vendors
  for select using (is_active = true);
