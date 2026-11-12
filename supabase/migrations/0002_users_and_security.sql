-- ============================================================================
--  CASA DAS ESTRELAS — 0002 — Utilizadores, funções, permissões e segurança
-- ============================================================================

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role app_role not null default 'utilizador',
  status account_status not null default 'pendente',
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_status on users(status) where deleted_at is null;
create index if not exists idx_users_created_at on users(created_at desc);
create index if not exists idx_users_email_trgm on users using gin (email gin_trgm_ops);

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  full_name text not null,
  phone text,
  country text not null default 'Moçambique'
    check (country in ('Moçambique', 'Angola', 'Outros países')),
  city text,
  avatar_url text,
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_country on user_profiles(country);
create index if not exists idx_profiles_name_trgm on user_profiles using gin (full_name gin_trgm_ops);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key app_role not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  granted_by uuid references users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- Sessões: o Supabase Auth gere a sessão; esta tabela mantém metadados de
-- dispositivos/actividade para auditoria e revogação administrativa.
create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_label text,
  user_agent text,
  ip inet,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_devices_user on user_devices(user_id);

create table if not exists login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  event text not null,              -- login, logout, falha, alteração de palavra-passe
  device text,
  location text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_login_activity_user on login_activity(user_id, created_at desc);

-- Preferências de notificação (criadas com a conta, por omissão) -------------
create table if not exists notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default true,
  push boolean not null default false,
  sms boolean not null default false,
  whatsapp boolean not null default false,
  vote_alerts boolean not null default true,
  news_alerts boolean not null default true,
  payment_alerts boolean not null default true,
  security_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- Trigger: criar registo público ao criar utilizador no Auth ------
create or replace function fn_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into users(id, email, role, status, email_verified_at)
  values (new.id, new.email, 'utilizador'::app_role,
          case when new.email_confirmed_at is not null
               then 'activa'::account_status else 'pendente'::account_status end,
          new.email_confirmed_at)
  on conflict (id) do nothing;

  insert into user_profiles(user_id, full_name, phone, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'country', 'Moçambique')
  )
  on conflict (user_id) do nothing;

  insert into notification_preferences(user_id) values (new.id) on conflict do nothing;

  return new;
end $$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
after insert on auth.users
for each row execute function fn_handle_new_auth_user();

-- ---------- Triggers de updated_at -----------------------------------------
drop trigger if exists trg_users_touch on users;
create trigger trg_users_touch before update on users
for each row execute function fn_touch_updated_at();

drop trigger if exists trg_profiles_touch on user_profiles;
create trigger trg_profiles_touch before update on user_profiles
for each row execute function fn_touch_updated_at();

-- ---------- Nota de segurança ----------------------------------------------
-- O papel (role) é a fonte de autorização e só pode ser alterado pelo
-- service role (superadministrador) através de operação auditada. Na aplicação
-- nenhuma rota permite ao utilizador escrever `users.role`.
