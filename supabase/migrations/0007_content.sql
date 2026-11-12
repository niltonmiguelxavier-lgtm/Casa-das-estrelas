-- ============================================================================
--  CASA DAS ESTRELAS — 0007 — Conteúdos: notícias, galeria, patrocinadores, páginas
-- ============================================================================

create table if not exists news_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into news_categories(slug, name, sort_order) values
  ('comunicado', 'Comunicado', 1),
  ('programa', 'Programa', 2),
  ('eliminacao', 'Eliminação', 3),
  ('anuncio', 'Anúncio', 4),
  ('imprensa', 'Imprensa', 5)
on conflict (slug) do nothing;

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  category text not null default 'Programa',
  cover_url text,
  author text,
  status content_status not null default 'rascunho',
  featured boolean not null default false,
  pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_news_published on news(status, published_at desc)
  where deleted_at is null;
create index if not exists idx_news_category on news(category);
create index if not exists idx_news_search on news using gin (title gin_trgm_ops);

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'foto' check (type in ('foto','video')),
  title text not null,
  caption text,
  url text not null,
  poster_url text,
  event text,
  participant_id uuid references participants(id) on delete set null,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_gallery_published on gallery(is_published, created_at desc);
create index if not exists idx_gallery_event on gallery(event);

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null default 'oficial' check (tier in ('principal','oficial','media')),
  logo_url text,
  website text,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- programa | regulamento | premios | termos | privacidade | cookies | faq
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status content_status not null default 'publicado',
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Actualização de timestamp em conteúdos
drop trigger if exists trg_news_touch on news;
create trigger trg_news_touch before update on news
for each row execute function fn_touch_updated_at();

drop trigger if exists trg_pages_touch on pages;
create trigger trg_pages_touch before update on pages
for each row execute function fn_touch_updated_at();

-- Trigger: notícia publicada gera evento na fila de notificações
create or replace function fn_notify_news_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'publicado' and (old.status is distinct from 'publicado') then
    insert into notification_queue(event_key, channel, payload, status)
    values ('news.published:' || new.id, 'in_app',
            jsonb_build_object('news_id', new.id, 'title', new.title, 'slug', new.slug),
            'pendente')
    on conflict (event_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_news_notify on news;
create trigger trg_news_notify after insert or update of status on news
for each row execute function fn_notify_news_published();
