-- ============================================================================
--  CASA DAS ESTRELAS — 0001 — Extensões, enums e funções utilitárias
-- ============================================================================

-- No Supabase as extensões vivem no schema `extensions` (já no search_path).
create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- ---------- Enums -----------------------------------------------------------
do $$ begin
  create type app_role as enum (
    'utilizador', 'gestor_conteudos', 'operador_financeiro', 'administrador', 'superadministrador'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('pendente', 'activa', 'suspensa', 'eliminada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_status as enum ('activo', 'nomeado', 'eliminado', 'vencedor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote_type as enum ('gratuito', 'pago');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('agendada', 'activa', 'encerrada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote_frequency as enum ('unica', 'diaria', 'semanal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pendente', 'confirmado', 'recusado', 'expirado', 'reembolsado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_category as enum ('conta', 'votacao', 'pagamento', 'programa', 'sistema');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('in_app', 'email', 'push', 'sms', 'whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_status as enum ('pendente', 'enviado', 'falhou', 'entregue', 'ignorado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('rascunho', 'agendado', 'publicado', 'arquivado');
exception when duplicate_object then null; end $$;

-- ---------- Helper: actualização automática de updated_at -------------------
create or replace function fn_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Helper: utilizador actual (RLS) ---------------------------------
-- Lê o claim `sub` do JWT. Não aceita parâmetros do cliente.
create or replace function fn_current_user_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

-- ---------- Helper: papel do utilizador actual ------------------------------
-- Estas funções são plpgsql (corpo validado na primeira execução), o que
-- permite que a migração corra antes da criação da tabela `users`.
create or replace function fn_current_role()
returns app_role language plpgsql stable security definer set search_path = public as $$
declare v_role app_role;
begin
  select role into v_role from users where id = fn_current_user_id();
  return v_role;
end $$;

create or replace function fn_is_staff()
returns boolean language plpgsql stable as $$
begin
  return coalesce(fn_current_role() in
    ('gestor_conteudos', 'operador_financeiro', 'administrador', 'superadministrador'), false);
end $$;

create or replace function fn_is_admin()
returns boolean language plpgsql stable as $$
begin
  return coalesce(fn_current_role() in ('administrador', 'superadministrador'), false);
end $$;

-- ---------- Helper: registo de auditoria (append-only) ----------------------
create or replace function fn_audit(
  p_action text,
  p_actor uuid,
  p_actor_email text,
  p_entity text,
  p_entity_id text,
  p_metadata jsonb default '{}'::jsonb,
  p_severity text default 'info'
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs(action, actor_id, actor_email, entity, entity_id, metadata, severity)
  values (p_action, p_actor, p_actor_email, p_entity, p_entity_id,
          coalesce(p_metadata, '{}'::jsonb), p_severity);
end $$;
