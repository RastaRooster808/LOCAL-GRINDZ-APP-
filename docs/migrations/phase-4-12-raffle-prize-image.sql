-- Phase 4.12 — raffle prize image + Camry prize.
-- Applied to live project pqzygehnnojdttmqadrz.

alter table public.raffles add column if not exists prize_image_url text;

update public.raffles set
  prize = 'A 2003 Toyota Camry (white) — provided by The Kingdom of the Hawaiian Islands, Ko Hawaiʻi Pae ʻĀina, carrying Hawaiian Kingdom plates.',
  prize_image_url = 'https://cdn.shopify.com/s/files/1/0737/8885/0463/files/IMG-4465.png?v=1785449807'
where slug = 'ekalesia-hoole-pope-kekaha';
