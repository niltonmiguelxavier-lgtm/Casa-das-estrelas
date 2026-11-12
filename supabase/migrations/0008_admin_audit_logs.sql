-- ============================================================================
--  CASA DAS ESTRELAS — 0008 — Administração, auditoria e logs de sistema
-- ============================================================================

create table if not exists admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

insert into admin_settings(key, value, description) values
  ('program', '{"name":"Casa das Estrelas","edition":"1.ª Edição","currency":"MZN","timezone":"Africa/Maputo","show_vote_totals":true}', 'Identidade e parâmetros do programa'),
  ('voting', '{"default_free_votes":5,"default_frequency":"diaria"}', 'Valores por omissão das campanhas'),
  ('notifications', '{"email_enabled":true,"push_enabled":false,"sms_enabled":false,"whatsapp_enabled":false}', 'Canais efectivamente activos')
on conflict (key) do nothing;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references users(id) on delete set null,
  actor_email text,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  severity text not null default 'info' check (severity in ('info','aviso','critico')),
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_actor on audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_action on audit_logs(action, created_at desc);
create index if not exists idx_audit_severity on audit_logs(severity) where severity <> 'info';

-- Auditoria é append-only: sem UPDATE nem DELETE.
drop trigger if exists trg_audit_no_mutation on audit_logs;
create trigger trg_audit_no_mutation before update or delete on audit_logs
for each row execute function fn_block_mutation();

create table if not exists system_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_type on system_events(type, created_at desc);

create table if not exists system_logs (
  id bigserial primary key,
  level text not null default 'info' check (level in ('debug','info','aviso','erro','critico')),
  scope text,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_logs_level on system_logs(level, created_at desc);

-- Limpeza automática de logs técnicos (retenção de 30 dias)
create or replace function fn_purge_old_system_logs()
returns void language sql security definer as $$
  delete from system_logs where created_at < now() - interval '30 days';
$$;
