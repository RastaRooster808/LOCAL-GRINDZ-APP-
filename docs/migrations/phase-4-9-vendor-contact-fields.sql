-- Phase 4.9 — public contact fields for vendors + real Ala's Kitchen data.
-- Applied to live project pqzygehnnojdttmqadrz.
-- `email` stays the auth login identity; public contact goes in new columns.

alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists contact_email text;
alter table public.vendors add column if not exists facebook_url text;

update public.vendors set
  description = 'Serving up deliciously created grinds. Specializing in the famous "Smash Burgers." Pacific Islander-owned.',
  neighborhood = 'Keaʻau',
  cuisine_type = 'Smash Burgers',
  phone = '(808) 289-0328',
  contact_email = 'chefalamaui@mail.com',
  facebook_url = 'https://www.facebook.com/profile.php?id=61578836253466'
where slug = 'alas-kitchen';

-- Primary location → real fixed address.
update public.locations set
  name = 'Ala''s Kitchen',
  address = '16-1668 Keaau-Pāhoa Rd, Keaʻau, HI 96749'
where id = '37800228-ef32-4d37-b348-0461c7332f95';
