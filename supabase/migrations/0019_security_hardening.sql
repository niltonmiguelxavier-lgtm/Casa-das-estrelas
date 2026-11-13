-- ============================================================================
-- 0019 — Reforço de segurança (não destrutivo)
-- ============================================================================
-- Contexto: a política `users_update_self` permitia que qualquer utilizador
-- autenticado alterasse a própria linha em `public.users`, incluindo as colunas
-- `role` e `status`. Isso permitia escalada de privilégios para
-- `superadministrador` a partir do cliente (comprovado em teste).
--
-- Esta migração NÃO apaga dados nem tabelas. Apenas:
--   1. Restringe as colunas que o próprio utilizador pode actualizar.
--   2. Restringe as colunas que o próprio utilizador pode actualizar no perfil.
--   3. Impede que o destino de notificação seja reatribuído a outro utilizador.
--   4. Endurece funções auxiliares de autorização.
--   5. Regista a correcção na auditoria.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. public.users — o utilizador só pode alterar dados de contacto
-- ---------------------------------------------------------------------------
-- `role`, `status`, `email`, `id`, `suspended_reason` passam a ser exclusivos
-- do servidor (service role / ligação directa). Qualquer outra coluna fica
-- bloqueada para o papel `authenticated` e `anon`.
-- public.users não tem colunas de contacto: nada é editável pelo titular.
revoke update on table public.users from anon, authenticated;

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update
  to authenticated
  using (id = public.fn_current_user_id())
  with check (id = public.fn_current_user_id());

-- ---------------------------------------------------------------------------
-- 2. public.user_profiles — mesmas regras por coluna
-- ---------------------------------------------------------------------------
-- O perfil é público apenas para o próprio; a alteração limita-se a campos
-- editáveis pelo titular. `country` é editável porque faz parte do registo.
revoke insert, update on table public.user_profiles from anon, authenticated;
grant insert (user_id, full_name, phone, country, city, avatar_url,
              accepted_terms_at, accepted_privacy_at, marketing_opt_in)
  on table public.user_profiles to authenticated;
grant update (full_name, phone, country, city, avatar_url, marketing_opt_in)
  on table public.user_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. notification_recipients — o destino não pode ser transferido
-- ---------------------------------------------------------------------------
drop policy if exists recipients_update_own on public.notification_recipients;
create policy recipients_update_own on public.notification_recipients
  for update
  to authenticated
  using (user_id = public.fn_current_user_id())
  with check (user_id = public.fn_current_user_id());

revoke insert, delete on table public.notification_recipients from anon, authenticated;
grant update (read_at, deleted_at) on table public.notification_recipients to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Funções auxiliares de autorização
-- ---------------------------------------------------------------------------
-- `fn_is_admin` / `fn_is_staff` passam a considerar o estado da conta: uma
-- conta suspensa ou eliminada perde imediatamente os poderes administrativos,
-- mesmo que conserve a coluna `role`.
create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.fn_current_user_id()
      and u.role in ('administrador'::app_role, 'superadministrador'::app_role)
      and u.status = 'activa'::account_status
      and u.deleted_at is null
  );
$$;

create or replace function public.fn_is_staff()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.fn_current_user_id()
      and u.role in ('gestor_conteudos'::app_role, 'operador_financeiro'::app_role,
                     'administrador'::app_role, 'superadministrador'::app_role)
      and u.status = 'activa'::account_status
      and u.deleted_at is null
  );
$$;

-- `fn_current_role` idem: devolve NULL para contas suspensas/eliminadas, o que
-- faz cair todas as políticas que dependem do papel (fail-closed).
create or replace function public.fn_current_role()
returns app_role
language sql
stable
security definer
set search_path to 'public'
as $$
  select u.role
  from public.users u
  where u.id = public.fn_current_user_id()
    and u.status = 'activa'::account_status
    and u.deleted_at is null;
$$;

-- ---------------------------------------------------------------------------
-- 5. Escrita em conteúdos: exigir papel E estado activo (ver ponto 4)
-- ---------------------------------------------------------------------------
-- As políticas existentes usam fn_current_role(), que agora devolve NULL para
-- contas suspensas. Nenhuma política precisa de ser reescrita.

-- ---------------------------------------------------------------------------
-- 6. Registar a correcção
-- ---------------------------------------------------------------------------
insert into public.audit_logs (action, actor_email, entity, metadata, severity)
values (
  'migracao.seguranca.0019',
  'sistema',
  'sistema',
  jsonb_build_object(
    'motivo', 'escalada de privilegios via users_update_self (role/status editaveis pelo proprio utilizador)',
    'correcao', 'update por coluna + RLS restrita + funcoes de autorizacao fail-closed',
    'dados_alterados', false
  ),
  'critico'
);

commit;
