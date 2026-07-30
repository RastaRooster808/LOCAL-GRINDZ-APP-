-- Phase 4.13 — raffle tickets, gifting, and Shopify ($1) checkout.
-- Applied to live project pqzygehnnojdttmqadrz.

alter table public.raffles add column if not exists ticket_variant_id text;
alter table public.raffle_entries add column if not exists tickets int not null default 1;
alter table public.raffle_entries add column if not exists is_gift boolean not null default false;
alter table public.raffle_entries add column if not exists gifted_by text;

-- $1 tickets paid via rastarooster.com (Shopify DRAFT product variant).
update public.raffles set
  payment_method = 'shopify',
  ticket_variant_id = '52724719583519'
where slug = 'ekalesia-hoole-pope-kekaha';
