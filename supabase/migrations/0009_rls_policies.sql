-- ============================================================================
--  CASA DAS ESTRELAS — 0009 — Row Level Security
-- ============================================================================
--  Princípio: negar por omissão. Toda a leitura/escrita pública é explícita.
--  O service role (servidor) ignora RLS e é usado apenas em operações
--  auditadas; todas as restantes passam pela sessão do utilizador.
-- ============================================================================

alter table users enable row level security;
alter table user_profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table user_devices enable row level security;
alter table login_activity enable row level security;

alter table participants enable row level security;
alter table participant_media enable row level security;

alter table voting_campaigns enable row level security;
alter table voting_rules enable row level security;
alter table vote_limits enable row level security;
alter table votes enable row level security;
alter table vote_packages enable row level security;
alter table ranking_snapshots enable row level security;

alter table payment_orders enable row level security;
alter table payments enable row level security;
alter table payment_webhooks enable row level security;
alter table transactions enable row level security;
alter table refunds enable row level security;
alter table payment_providers enable row level security;

alter table notifications enable row level security;
alter table notification_recipients enable row level security;
alter table notification_preferences enable row level security;
alter table notification_templates enable row level security;
alter table notification_delivery_logs enable row level security;
alter table notification_queue enable row level security;
alter table push_subscriptions enable row level security;

alter table news enable row level security;
alter table news_categories enable row level security;
alter table gallery enable row level security;
alter table sponsors enable row level security;
alter table pages enable row level security;

alter table admin_settings enable row level security;
alter table audit_logs enable row level security;
alter table system_events enable row level security;
alter table system_logs enable row level security;

-- ---------------------------- Utilizadores --------------------------------
create policy users_select_self on users for select
  using (id = fn_current_user_id() or fn_is_admin());

create policy users_update_self on users for update
  using (id = fn_current_user_id())
  with check (id = fn_current_user_id());

create policy profiles_select on user_profiles for select
  using (user_id = fn_current_user_id() or fn_is_staff());

create policy profiles_insert_self on user_profiles for insert
  with check (user_id = fn_current_user_id());

create policy profiles_update_self on user_profiles for update
  using (user_id = fn_current_user_id())
  with check (user_id = fn_current_user_id());

create policy devices_own on user_devices for all
  using (user_id = fn_current_user_id())
  with check (user_id = fn_current_user_id());

create policy activity_own on login_activity for select
  using (user_id = fn_current_user_id() or fn_is_admin());

-- ---------------------------- Catálogo público -----------------------------
create policy participants_public_read on participants for select
  using (is_published and deleted_at is null);

create policy participants_staff_write on participants for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy participant_media_public_read on participant_media for select
  using (exists (
    select 1 from participants p
    where p.id = participant_media.participant_id and p.is_published and p.deleted_at is null
  ));

create policy participant_media_staff on participant_media for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy campaigns_public_read on voting_campaigns for select using (true);
create policy campaigns_staff_write on voting_campaigns for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy rules_public_read on voting_rules for select using (true);
create policy rules_staff_write on voting_rules for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy packages_public_read on vote_packages for select using (is_active);
create policy packages_staff_write on vote_packages for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy snapshots_public_read on ranking_snapshots for select using (true);

-- ---------------------------- Votos ---------------------------------------
-- Leitura: apenas o próprio utilizador (histórico) ou staff autorizado.
-- Escrita: NUNCA directa. Só através de fn_cast_free_vote / fn_cast_paid_vote
-- (security definer) ou do service role no webhook.
create policy votes_select_own on votes for select
  using (user_id = fn_current_user_id() or fn_is_admin());

create policy vote_limits_own on vote_limits for select
  using (user_id = fn_current_user_id() or fn_is_admin());

-- ---------------------------- Pagamentos ----------------------------------
create policy orders_select_own on payment_orders for select
  using (user_id = fn_current_user_id() or fn_is_staff());

create policy payments_select_own on payments for select
  using (user_id = fn_current_user_id() or fn_current_role() in ('operador_financeiro','administrador','superadministrador'));

create policy transactions_staff_read on transactions for select
  using (fn_current_role() in ('operador_financeiro','administrador','superadministrador'));

create policy refunds_staff_read on refunds for select
  using (fn_current_role() in ('operador_financeiro','administrador','superadministrador'));

create policy refunds_staff_write on refunds for insert
  with check (fn_current_role() in ('operador_financeiro','administrador','superadministrador'));

create policy providers_public_read on payment_providers for select using (true);
create policy providers_admin_write on payment_providers for all
  using (fn_is_admin()) with check (fn_is_admin());

-- payment_webhooks e notification_queue: sem políticas → apenas service role.

-- ---------------------------- Notificações --------------------------------
create policy notifications_own on notifications for select
  using (exists (
    select 1 from notification_recipients r
    where r.notification_id = notifications.id and r.user_id = fn_current_user_id()
  ));

create policy notifications_staff_write on notifications for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy recipients_own on notification_recipients for select
  using (user_id = fn_current_user_id());

create policy recipients_update_own on notification_recipients for update
  using (user_id = fn_current_user_id())
  with check (user_id = fn_current_user_id());

create policy preferences_own on notification_preferences for all
  using (user_id = fn_current_user_id())
  with check (user_id = fn_current_user_id());

create policy push_own on push_subscriptions for all
  using (user_id = fn_current_user_id())
  with check (user_id = fn_current_user_id());

create policy templates_staff on notification_templates for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy delivery_staff_read on notification_delivery_logs for select
  using (fn_is_staff());

-- ---------------------------- Conteúdos -----------------------------------
create policy news_public_read on news for select
  using (status = 'publicado' and deleted_at is null and coalesce(published_at, now()) <= now());

create policy news_staff_write on news for all
  using (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'))
  with check (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'));

create policy categories_public_read on news_categories for select using (true);
create policy categories_staff_write on news_categories for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy gallery_public_read on gallery for select using (is_published);
create policy gallery_staff_write on gallery for all
  using (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'))
  with check (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'));

create policy sponsors_public_read on sponsors for select using (is_active);
create policy sponsors_staff_write on sponsors for all
  using (fn_is_staff()) with check (fn_is_staff());

create policy pages_public_read on pages for select using (status = 'publicado');
create policy pages_staff_write on pages for all
  using (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'))
  with check (fn_current_role() in ('gestor_conteudos','administrador','superadministrador'));

-- ---------------------------- Administração -------------------------------
create policy settings_staff_read on admin_settings for select using (fn_is_staff());
create policy settings_admin_write on admin_settings for update
  using (fn_current_role() = 'superadministrador')
  with check (fn_current_role() = 'superadministrador');

-- Auditoria: leitura apenas para administradores; escrita apenas via service role
-- (função fn_audit é security definer). Sem UPDATE/DELETE por trigger.
create policy audit_admin_read on audit_logs for select using (fn_is_admin());

create policy logs_admin_read on system_logs for select using (fn_is_admin());
create policy events_admin_read on system_events for select using (fn_is_admin());
