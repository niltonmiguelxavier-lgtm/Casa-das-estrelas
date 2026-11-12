-- ============================================================================
--  CASA DAS ESTRELAS — 0003 — Concorrentes, campanhas e votos
-- ============================================================================

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number between 1 and 20),
  name text not null,
  age int check (age between 16 and 80),
  country text not null check (country in ('Angola', 'Moçambique')),
  city text,
  tagline text,
  bio text,
  occupation text,
  talents text[] not null default '{}',
  photo_url text,
  status participant_status not null default 'activo',
  is_published boolean not null default false,
  eliminated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_participants_country on participants(country) where deleted_at is null;
create index if not exists idx_participants_published on participants(is_published, number);
create index if not exists idx_participants_name_trgm on participants using gin (name gin_trgm_ops);

create table if not exists participant_media (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  type text not null default 'foto' check (type in ('foto', 'video')),
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_participant_media on participant_media(participant_id, sort_order);

-- ---------- Campanhas -------------------------------------------------------
create table if not exists voting_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status campaign_status not null default 'agendada',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  participant_ids uuid[] not null default '{}',
  show_totals boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_dates_valid check (ends_at > starts_at)
);
create index if not exists idx_campaigns_status on voting_campaigns(status, starts_at desc);

create table if not exists voting_rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null unique references voting_campaigns(id) on delete cascade,
  free_votes_per_user int not null default 1 check (free_votes_per_user >= 0),
  frequency vote_frequency not null default 'diaria',
  rules_text text[] not null default '{}',
  max_votes_per_request int not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists vote_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  campaign_id uuid not null references voting_campaigns(id) on delete cascade,
  period_key text not null,             -- ex.: 2026-11-11 (dia) | 2026-W46 (semana) | campanha
  votes_used int not null default 0 check (votes_used >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, campaign_id, period_key)
);
create index if not exists idx_vote_limits_lookup on vote_limits(campaign_id, period_key);

-- ---------- Votos (append-only) --------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  participant_id uuid not null references participants(id) on delete restrict,
  campaign_id uuid not null references voting_campaigns(id) on delete restrict,
  vote_type vote_type not null,
  quantity int not null default 1 check (quantity between 1 and 500),
  payment_order_id uuid,               -- preenchido para votos pagos
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  -- idempotência de crédito de votos pagos: um crédito por ordem
  constraint votes_paid_unique_order unique (payment_order_id)
);

create index if not exists idx_votes_participant on votes(participant_id, created_at desc);
create index if not exists idx_votes_campaign on votes(campaign_id, created_at desc);
create index if not exists idx_votes_user on votes(user_id, created_at desc);

-- Votos e pagamentos são imutáveis: proibido UPDATE/DELETE pela aplicação.
create or replace function fn_block_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'REGISTO_IMUTAVEL: % em % não é permitido', tg_op, tg_table_name;
end $$;

drop trigger if exists trg_votes_no_update on votes;
create trigger trg_votes_no_update before update or delete on votes
for each row execute function fn_block_mutation();

-- ---------- Pacotes de votos ------------------------------------------------
create table if not exists vote_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  votes int not null check (votes > 0),
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'MZN',
  bonus_label text,
  best_value boolean not null default false,
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_packages_active on vote_packages(is_active, sort_order);

-- ---------- Snapshots de classificação --------------------------------------
create table if not exists ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references voting_campaigns(id) on delete cascade,
  captured_at timestamptz not null default now(),
  is_official boolean not null default false,
  data jsonb not null              -- array de {participant_id, position, votes}
);
create index if not exists idx_snapshots_campaign on ranking_snapshots(campaign_id, captured_at desc);

-- ---------- Agregados (vista materializada) --------------------------------
-- Evita somar milhões de linhas a cada carregamento da classificação.
create materialized view if not exists participant_vote_totals as
select
  p.id as participant_id,
  coalesce(sum(case when v.vote_type = 'gratuito' then v.quantity end), 0)::bigint as free_votes,
  coalesce(sum(case when v.vote_type = 'pago' then v.quantity end), 0)::bigint as paid_votes,
  coalesce(sum(v.quantity), 0)::bigint as total_votes,
  max(v.created_at) as last_vote_at
from participants p
left join votes v on v.participant_id = p.id
group by p.id;

create unique index if not exists idx_vote_totals_participant
  on participant_vote_totals(participant_id);

create or replace function fn_refresh_vote_totals()
returns void language plpgsql security definer as $$
begin
  refresh materialized view concurrently participant_vote_totals;
exception when others then
  refresh materialized view participant_vote_totals;
end $$;

-- ---------- Classificação corrente -----------------------------------------
create or replace view ranking_current as
with ranked as (
  select
    p.id as participant_id,
    p.name,
    p.number,
    p.country,
    p.photo_url,
    t.total_votes as votes,
    row_number() over (order by t.total_votes desc, p.number asc) as position
  from participants p
  join participant_vote_totals t on t.participant_id = p.id
  where p.deleted_at is null and p.is_published
)
select
  r.position,
  r.participant_id,
  r.name,
  r.number,
  r.country,
  r.photo_url,
  r.votes,
  -- variação calculada comparando com o snapshot anterior (job agendado)
  coalesce(
    (select (snap.data ->> r.participant_id::text)::int
       from ranking_snapshots snap
      where snap.is_official
      order by snap.captured_at desc
      limit 1), 0
  ) as variation
from ranked r
order by r.position;
