-- Phase 5b — Custom Tee order requests (Rasta Rooster custom apparel).
--
-- Guest checkout, no live payment yet: customer submits garment, print,
-- and fulfillment choices; admin follows up to arrange printing + payment.
-- Mirrors the vendor_applications table's guest-submit / admin-review RLS
-- pattern from phase-3-schema.sql.

create table if not exists public.custom_tee_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'approved', 'in_production', 'ready', 'completed', 'cancelled')),

  shirt_type text not null check (shirt_type in ('standard_tee', 'heavy_cotton', 'hoodie')),
  shirt_color text,
  shirt_size text,
  print_locations text[] not null default '{front}',
  design_notes text,
  reference_image_url text,

  fulfillment text not null check (fulfillment in ('pahoa_pickup', 'hawaii_ship')),
  quantity int not null default 1 check (quantity > 0),
  price_per_item numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  total numeric(10,2) not null,

  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text,
  admin_note text
);

alter table public.custom_tee_orders enable row level security;

create policy "public submit custom tee order" on public.custom_tee_orders
  for insert with check (true);

create policy "admin read custom tee orders" on public.custom_tee_orders
  for select using (
    exists (select 1 from admins where id = auth.uid())
  );

create policy "admin update custom tee orders" on public.custom_tee_orders
  for update using (
    exists (select 1 from admins where id = auth.uid())
  );
