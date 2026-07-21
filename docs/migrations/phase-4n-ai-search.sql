-- Phase 4N — AI / Semantic Search (pgvector)
-- Apply in Supabase Dashboard → SQL Editor

-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding columns (1536 dims = text-embedding-3-small)
alter table vendors add column if not exists embedding vector(1536);
alter table menu_items add column if not exists embedding vector(1536);

-- HNSW indexes for fast cosine similarity search
create index if not exists vendors_embedding_idx
  on vendors using hnsw (embedding vector_cosine_ops);

create index if not exists menu_items_embedding_idx
  on menu_items using hnsw (embedding vector_cosine_ops);

-- FTS index on vendors (fallback when embeddings are not ready)
create index if not exists vendors_fts_idx
  on vendors using gin(to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(cuisine_type,'') || ' ' || coalesce(description,'')
  ));

-- RPC: vector similarity search on vendors
create or replace function match_vendors(
  query_embedding vector(1536),
  match_count     int     default 8,
  min_score       float   default 0.35
)
returns table (
  id           uuid,
  name         text,
  slug         text,
  cuisine_type text,
  description  text,
  photo_url    text,
  logo_url     text,
  score        float
)
language sql stable security definer as $$
  select
    v.id, v.name, v.slug, v.cuisine_type, v.description, v.photo_url, v.logo_url,
    (1 - (v.embedding <=> query_embedding))::float as score
  from vendors v
  where v.is_active = true
    and v.embedding is not null
    and 1 - (v.embedding <=> query_embedding) > min_score
  order by v.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC: vector similarity search on menu_items (returns vendor context)
create or replace function match_menu_items(
  query_embedding vector(1536),
  match_count     int   default 8,
  min_score       float default 0.35
)
returns table (
  id          uuid,
  name        text,
  description text,
  price       numeric,
  category    text,
  vendor_id   uuid,
  vendor_name text,
  vendor_slug text,
  score       float
)
language sql stable security definer as $$
  select
    m.id, m.name, m.description, m.price, m.category,
    v.id as vendor_id, v.name as vendor_name, v.slug as vendor_slug,
    (1 - (m.embedding <=> query_embedding))::float as score
  from menu_items m
  join vendors v on v.id = m.vendor_id
  where m.available = true
    and v.is_active = true
    and m.embedding is not null
    and 1 - (m.embedding <=> query_embedding) > min_score
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC: full-text search on vendors (fallback when no embeddings)
create or replace function search_vendors_fts(
  query       text,
  match_count int default 8
)
returns table (
  id           uuid,
  name         text,
  slug         text,
  cuisine_type text,
  description  text,
  photo_url    text,
  logo_url     text,
  score        float
)
language sql stable security definer as $$
  select
    v.id, v.name, v.slug, v.cuisine_type, v.description, v.photo_url, v.logo_url,
    ts_rank(
      to_tsvector('english', coalesce(v.name,'') || ' ' || coalesce(v.cuisine_type,'') || ' ' || coalesce(v.description,'')),
      websearch_to_tsquery('english', query)
    )::float as score
  from vendors v
  where v.is_active = true
    and to_tsvector('english', coalesce(v.name,'') || ' ' || coalesce(v.cuisine_type,'') || ' ' || coalesce(v.description,''))
        @@ websearch_to_tsquery('english', query)
  order by score desc
  limit match_count;
$$;

-- RPC: full-text search on menu_items (fallback)
create or replace function search_menu_items_fts(
  query       text,
  match_count int default 8
)
returns table (
  id          uuid,
  name        text,
  description text,
  price       numeric,
  category    text,
  vendor_id   uuid,
  vendor_name text,
  vendor_slug text,
  score       float
)
language sql stable security definer as $$
  select
    m.id, m.name, m.description, m.price, m.category,
    v.id as vendor_id, v.name as vendor_name, v.slug as vendor_slug,
    ts_rank(
      to_tsvector('english', coalesce(m.name,'') || ' ' || coalesce(m.description,'')),
      websearch_to_tsquery('english', query)
    )::float as score
  from menu_items m
  join vendors v on v.id = m.vendor_id
  where m.available = true
    and v.is_active = true
    and to_tsvector('english', coalesce(m.name,'') || ' ' || coalesce(m.description,''))
        @@ websearch_to_tsquery('english', query)
  order by score desc
  limit match_count;
$$;
