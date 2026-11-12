-- ============================================================================
--  CASA DAS ESTRELAS — 0006 — Notificações: modelos, entregas, preferências e fila
-- ============================================================================

create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,               -- ex.: vote.confirmed
  category notification_category not null,
  title_template text not null,
  body_template text not null,
  channels notification_channel[] not null default '{in_app}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  category notification_category not null,
  title text not null,
  body text not null,
  link text,
  priority text not null default 'normal' check (priority in ('normal','alta')),
  audience text not null default 'todos'
    check (audience in ('todos','pais','selecionados','votantes')),
  target_country text,
  channels notification_channel[] not null default '{in_app}',
  template_key text references notification_templates(key),
  scheduled_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_sent on notifications(sent_at desc);
create index if not exists idx_notifications_scheduled on notifications(scheduled_at)
  where sent_at is null and cancelled_at is null;

create table if not exists notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (notification_id, user_id)
);
-- índice parcial para o contador de não lidas (consulta mais frequente)
create index if not exists idx_recipients_unread
  on notification_recipients(user_id)
  where read_at is null and deleted_at is null;
create index if not exists idx_recipients_user on notification_recipients(user_id, created_at desc);

-- notification_preferences é criada na migração 0002 (necessária ao trigger
-- de criação de utilizador).

-- Destinatários explícitos para envios segmentados ("selecionados").
create table if not exists notification_targets (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (notification_id, user_id)
);

create table if not exists notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references notifications(id) on delete set null,
  recipient_id uuid references notification_recipients(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  channel notification_channel not null,
  status delivery_status not null default 'pendente',
  attempt int not null default 1,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_delivery_status on notification_delivery_logs(status, created_at desc);

-- Fila de eventos → notificações. `event_key` garante idempotência.
create table if not exists notification_queue (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  channel notification_channel not null default 'in_app',
  payload jsonb not null,
  status delivery_status not null default 'pendente',
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_queue_pending on notification_queue(status, next_attempt_at)
  where status = 'pendente';

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists idx_push_user on push_subscriptions(user_id);

-- ---------- Distribuição de uma notificação para a audiência ----------------
create or replace function fn_enqueue_notification(p_notification_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_n notifications;
  v_count int := 0;
begin
  select * into v_n from notifications where id = p_notification_id;
  if not found then raise exception 'NOTIFICATION_NOT_FOUND'; end if;
  if v_n.sent_at is not null then return 0; end if;

  insert into notification_recipients(notification_id, user_id)
  select v_n.id, u.id
  from users u
  left join user_profiles pr on pr.user_id = u.id
  where u.deleted_at is null
    and u.status = 'activa'
    and (v_n.audience <> 'pais' or pr.country = v_n.target_country)
    and (
      v_n.audience <> 'selecionados'
      or exists (select 1 from notification_targets t
                 where t.notification_id = v_n.id and t.user_id = u.id)
    )
  on conflict (notification_id, user_id) do nothing;

  get diagnostics v_count = row_count;

  update notifications set sent_at = now() where id = v_n.id;

  insert into notification_delivery_logs(notification_id, channel, status)
  select v_n.id, unnest(v_n.channels), 'pendente';

  return v_count;
end $$;

-- ---------- Enfileirar evento genérico (voto, pagamento, notícia) -----------
create or replace function fn_process_vote_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Cria notificação interna para o utilizador que votou.
  insert into notifications(category, title, body, link, audience, channels)
  values ('votacao',
          'Voto registado',
          'O seu voto foi registado e contabilizado na classificação oficial.',
          '/painel/votos', 'selecionados', '{in_app}');

  return new;
end $$;
