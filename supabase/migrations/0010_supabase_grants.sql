-- ============================================================================
--  CASA DAS ESTRELAS — 0010 — Grants para os papéis do Supabase
-- ============================================================================
--  As migrações criaram as tabelas como `postgres`. No Supabase, o PostgREST
--  liga-se como `anon` / `authenticated` / `service_role`, que não têm
--  privilégios por omissão. O RLS continua a ser a fronteira de segurança:
--  estes GRANT apenas permitem chegar à tabela; as políticas decidem as linhas.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- ---------- service_role: acesso total (uso exclusivo no servidor) ----------
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- ---------- authenticated: leitura pública + escrita sobre as próprias linhas
grant select on all tables in schema public to authenticated;

grant insert, update on public.users to authenticated;
grant insert, update on public.user_profiles to authenticated;
grant insert, update, delete on public.user_devices to authenticated;
grant insert on public.login_activity to authenticated;

grant insert, update, delete on public.notification_recipients to authenticated;
grant insert, update on public.notification_preferences to authenticated;
grant insert, update, delete on public.push_subscriptions to authenticated;

grant insert, delete on public.refunds to authenticated;
grant insert, update on public.notification_templates to authenticated;
grant insert, update on public.admin_settings to authenticated;

-- Conteúdos: escrita condicionada por RLS a gestores de conteúdos/admin
grant insert, update, delete on public.news to authenticated;
grant insert, update, delete on public.news_categories to authenticated;
grant insert, update, delete on public.gallery to authenticated;
grant insert, update, delete on public.sponsors to authenticated;
grant insert, update, delete on public.pages to authenticated;

-- Concorrentes e campanhas: escrita condicionada por RLS a staff
grant insert, update, delete on public.participants to authenticated;
grant insert, update, delete on public.participant_media to authenticated;
grant insert, update, delete on public.voting_campaigns to authenticated;
grant insert, update, delete on public.voting_rules to authenticated;
grant insert, update, delete on public.vote_packages to authenticated;

-- Notificações geridas pela administração
grant insert, update on public.notifications to authenticated;
grant insert, delete on public.notification_targets to authenticated;

-- ---------- anon: apenas catálogo público (sempre filtrado por RLS) --------
grant select on public.participants to anon;
grant select on public.participant_media to anon;
grant select on public.voting_campaigns to anon;
grant select on public.voting_rules to anon;
grant select on public.vote_packages to anon;
grant select on public.ranking_snapshots to anon;
grant select on public.news to anon;
grant select on public.news_categories to anon;
grant select on public.gallery to anon;
grant select on public.sponsors to anon;
grant select on public.pages to anon;
grant select on public.payment_providers to anon;

-- ---------- Vistas: herdam o RLS das tabelas subjacentes -------------------
grant select on public.ranking_current to anon, authenticated, service_role;
grant select on public.participant_vote_totals to anon, authenticated, service_role;

-- ---------- Funções expostas via RPC ---------------------------------------
grant execute on function public.fn_cast_free_vote(uuid, uuid, uuid, int) to authenticated, service_role;
grant execute on function public.fn_user_vote_balance(uuid) to authenticated, service_role;
grant execute on function public.fn_refresh_vote_totals() to service_role;

-- Funções de privilégio elevado: apenas o servidor
revoke all on function public.fn_cast_paid_vote(uuid, uuid, uuid, uuid, int) from public, anon, authenticated;
revoke all on function public.fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.fn_enqueue_notification(uuid) from public, anon, authenticated;

-- ---------- Privilégios por omissão para objectos futuros ------------------
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select on tables to authenticated;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
