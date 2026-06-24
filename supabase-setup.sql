-- Local Grindz Phase 2 Database Schema
-- Paste this into Supabase → SQL Editor → Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Vendors (for login)
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Menu items
create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  description text,
  price numeric(8,2) not null,
  category text not null default 'burger',
  available boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Location updates
create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  address text,
  hours text,
  status text not null default 'open',
  updated_at timestamptz default now()
);

-- Specials
create table if not exists specials (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  title text not null,
  description text,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_note text,
  items jsonb not null default '[]',
  total numeric(8,2),
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  approved boolean not null default true,
  created_at timestamptz default now()
);

-- Row Level Security: allow public reads on non-sensitive tables
alter table menu_items enable row level security;
alter table locations enable row level security;
alter table specials enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table vendors enable row level security;

-- Public can read menu, location, specials, approved reviews
create policy "public read menu" on menu_items for select using (available = true);
create policy "public read location" on locations for select using (true);
create policy "public read specials" on specials for select using (active = true);
create policy "public read reviews" on reviews for select using (approved = true);

-- Anyone can insert orders and reviews
create policy "public insert orders" on orders for insert with check (true);
create policy "public insert reviews" on reviews for insert with check (true);

-- Vendors can manage their own data (auth.uid() matches vendor row)
create policy "vendor manage menu" on menu_items
  for all using (vendor_id = (select id from vendors where email = auth.email()));

create policy "vendor manage location" on locations
  for all using (vendor_id = (select id from vendors where email = auth.email()));

create policy "vendor manage specials" on specials
  for all using (vendor_id = (select id from vendors where email = auth.email()));

create policy "vendor read orders" on orders
  for select using (auth.role() = 'authenticated');

-- Seed default menu items (run after inserting a vendor row)
-- Replace 'YOUR_VENDOR_ID' with the UUID from the vendors table
/*
insert into menu_items (vendor_id, name, description, price, category) values
  ('YOUR_VENDOR_ID', 'Volcano Smash', 'Double smash patty, pepper jack, jalapeño aioli, crispy onions', 14.00, 'burger'),
  ('YOUR_VENDOR_ID', 'Classic Smash', 'Single smash patty, American cheese, pickles, secret sauce', 10.00, 'burger'),
  ('YOUR_VENDOR_ID', 'Loco Moco Smash', 'Smash patty over rice, fried egg, brown gravy', 13.00, 'plate'),
  ('YOUR_VENDOR_ID', 'Shaka Fries', 'Crispy seasoned fries with house dipping sauce', 5.00, 'side'),
  ('YOUR_VENDOR_ID', 'Lilikoi Lemonade', 'Fresh passion fruit lemonade', 4.00, 'drink');

insert into locations (vendor_id, name, address, hours, status) values
  ('YOUR_VENDOR_ID', 'Beachside Park', 'Kalapana, HI 96778', '11am – 7pm', 'open');

insert into specials (vendor_id, title, description, expires_at) values
  ('YOUR_VENDOR_ID', 'Tuesday Smash Deal', 'Buy any burger, get Shaka Fries free every Tuesday!', '2026-12-31');
*/
