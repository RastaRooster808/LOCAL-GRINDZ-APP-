-- Phase 4.10 — vendor Instagram field + KaRas Freshly Baked handle.
-- Applied to live project pqzygehnnojdttmqadrz.

alter table public.vendors add column if not exists instagram_url text;

update public.vendors set instagram_url = 'https://www.instagram.com/karasfreshlybaked'
where slug = 'karas-freshly-baked';
