-- ============================================================================
--  CASA DAS ESTRELAS — 0005 — Funções transaccionais de voto e saldo
-- ============================================================================

-- ---------------------------------------------------------------------------
--  VOTO GRATUITO
--  Atomicidade: SELECT ... FOR UPDATE no limite do período garante que dois
--  pedidos simultâneos do mesmo utilizador não excedem o limite.
-- ---------------------------------------------------------------------------
create or replace function fn_cast_free_vote(
  p_user_id uuid,
  p_campaign_id uuid,
  p_participant_id uuid,
  p_quantity int default 1
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_rule voting_rules;
  v_campaign voting_campaigns;
  v_period text;
  v_used int;
  v_remaining int;
  v_vote_id uuid;
begin
  if p_quantity < 1 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into v_campaign from voting_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'CAMPAIGN_NOT_FOUND'; end if;

  if v_campaign.status <> 'activa'
     or now() < v_campaign.starts_at
     or now() > v_campaign.ends_at then
    raise exception 'CAMPAIGN_CLOSED';
  end if;

  if array_length(v_campaign.participant_ids, 1) is not null
     and not (p_participant_id = any (v_campaign.participant_ids)) then
    raise exception 'PARTICIPANT_NOT_IN_CAMPAIGN';
  end if;

  select * into v_rule from voting_rules where campaign_id = p_campaign_id;
  if not found then
    v_rule.free_votes_per_user := 1;
    v_rule.frequency := 'diaria';
  end if;

  if p_quantity > coalesce(v_rule.max_votes_per_request, 5) then
    raise exception 'QUANTITY_ABOVE_MAX';
  end if;

  v_period := case v_rule.frequency
    when 'diaria'  then to_char(now() at time zone 'Africa/Maputo', 'YYYY-MM-DD')
    when 'semanal' then to_char(now() at time zone 'Africa/Maputo', 'IYYY-"W"IW')
    else 'campanha'
  end;

  insert into vote_limits(user_id, campaign_id, period_key, votes_used)
  values (p_user_id, p_campaign_id, v_period, 0)
  on conflict (user_id, campaign_id, period_key) do nothing;

  select votes_used into v_used
  from vote_limits
  where user_id = p_user_id and campaign_id = p_campaign_id and period_key = v_period
  for update;

  if v_used + p_quantity > v_rule.free_votes_per_user then
    raise exception 'LIMIT_EXCEEDED';
  end if;

  update vote_limits
  set votes_used = votes_used + p_quantity, updated_at = now()
  where user_id = p_user_id and campaign_id = p_campaign_id and period_key = v_period;

  insert into votes(user_id, participant_id, campaign_id, vote_type, quantity)
  values (p_user_id, p_participant_id, p_campaign_id, 'gratuito', p_quantity)
  returning id into v_vote_id;

  -- Evento para a fila de notificações (nunca bloqueia o voto).
  insert into notification_queue(event_key, channel, payload, status)
  values ('vote.confirmed:' || v_vote_id, 'in_app',
          jsonb_build_object('user_id', p_user_id, 'vote_id', v_vote_id,
                             'participant_id', p_participant_id, 'quantity', p_quantity),
          'pendente')
  on conflict (event_key) do nothing;

  v_remaining := v_rule.free_votes_per_user - (v_used + p_quantity);

  perform fn_audit('vote.free', p_user_id, null, 'participants',
                   p_participant_id::text,
                   jsonb_build_object('campaign', p_campaign_id, 'quantity', p_quantity));

  return jsonb_build_object('vote_id', v_vote_id, 'remaining', v_remaining);
end $$;

-- ---------------------------------------------------------------------------
--  SALDO DE VOTOS DO UTILIZADOR
-- ---------------------------------------------------------------------------
create or replace function fn_user_vote_balance(p_user_id uuid)
returns table (free_remaining int, free_limit int, paid_remaining bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_campaign voting_campaigns;
  v_rule voting_rules;
  v_period text;
  v_used int;
begin
  select * into v_campaign from voting_campaigns
  where status = 'activa' and now() between starts_at and ends_at
  order by starts_at desc limit 1;

  if not found then
    return query select 0, 0, 0::bigint;
    return;
  end if;

  select * into v_rule from voting_rules where campaign_id = v_campaign.id;
  v_period := case coalesce(v_rule.frequency, 'diaria')
    when 'diaria'  then to_char(now() at time zone 'Africa/Maputo', 'YYYY-MM-DD')
    when 'semanal' then to_char(now() at time zone 'Africa/Maputo', 'IYYY-"W"IW')
    else 'campanha'
  end;

  select coalesce(votes_used, 0) into v_used from vote_limits
  where user_id = p_user_id and campaign_id = v_campaign.id and period_key = v_period;

  return query
    select
      greatest(coalesce(v_rule.free_votes_per_user, 0) - coalesce(v_used, 0), 0),
      coalesce(v_rule.free_votes_per_user, 0),
      coalesce((
        select sum(o.votes) from payment_orders o
        where o.user_id = p_user_id and o.status = 'confirmado'
          and o.votes_consumed = false
      ), 0)::bigint;
end $$;

-- ---------------------------------------------------------------------------
--  CONSUMO DE VOTOS PAGOS (chamado apenas pelo servidor)
-- ---------------------------------------------------------------------------
create or replace function fn_cast_paid_vote(
  p_user_id uuid,
  p_campaign_id uuid,
  p_participant_id uuid,
  p_order_id uuid,
  p_quantity int default 1
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order payment_orders;
  v_vote_id uuid;
begin
  select * into v_order from payment_orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.user_id <> p_user_id then raise exception 'ORDER_NOT_OWNED'; end if;
  if v_order.status <> 'confirmado' then raise exception 'ORDER_NOT_CONFIRMED'; end if;
  if v_order.votes_consumed then raise exception 'ORDER_ALREADY_CONSUMED'; end if;
  if p_quantity > v_order.votes then raise exception 'QUANTITY_ABOVE_ORDER'; end if;

  insert into votes(user_id, participant_id, campaign_id, vote_type, quantity, payment_order_id)
  values (p_user_id, p_participant_id, p_campaign_id, 'pago', p_quantity, p_order_id)
  returning id into v_vote_id;

  update payment_orders set votes_consumed = true, updated_at = now() where id = p_order_id;

  perform fn_audit('vote.paid.credited', p_user_id, null, 'payment_orders',
                   p_order_id::text, jsonb_build_object('quantity', p_quantity));

  return jsonb_build_object('vote_id', v_vote_id);
end $$;

-- ---------------------------------------------------------------------------
--  CONFIRMAÇÃO DE PAGAMENTO (usada exclusivamente pelo webhook)
--  Idempotente: chamadas repetidas não duplicam votos.
-- ---------------------------------------------------------------------------
create or replace function fn_confirm_payment(
  p_reference text,
  p_provider text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_provider_transaction_id text default null,
  p_paid_at timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order payment_orders;
  v_payment_id uuid;
begin
  select * into v_order from payment_orders where reference = p_reference for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  -- Nunca confiar no valor: comparar com o valor autoritativo da BD.
  if p_amount is distinct from v_order.amount then
    raise exception 'AMOUNT_MISMATCH expected=% received=%', v_order.amount, p_amount;
  end if;
  if upper(p_currency) <> upper(v_order.currency) then
    raise exception 'CURRENCY_MISMATCH';
  end if;

  if v_order.status = 'confirmado' then
    return jsonb_build_object('already_confirmed', true, 'reference', v_order.reference);
  end if;

  insert into payments(order_id, user_id, provider, provider_transaction_id,
                       amount, currency, status, paid_at, payload)
  values (v_order.id, v_order.user_id, p_provider, p_provider_transaction_id,
          p_amount, upper(p_currency),
          (case p_status when 'confirmed' then 'confirmado'
                         when 'refunded' then 'reembolsado'
                         when 'expired' then 'expirado'
                         else 'recusado' end)::order_status,
          p_paid_at, jsonb_build_object('provider', p_provider, 'reference', p_reference))
  on conflict (provider, provider_transaction_id) do nothing
  returning id into v_payment_id;

  if p_status = 'confirmed' then
    update payment_orders
    set status = 'confirmado', paid_at = p_paid_at, updated_at = now()
    where id = v_order.id;

    insert into notification_queue(event_key, channel, payload, status)
    values ('payment.confirmed:' || v_order.reference, 'in_app',
            jsonb_build_object('user_id', v_order.user_id, 'order_id', v_order.id,
                               'votes', v_order.votes),
            'pendente')
    on conflict (event_key) do nothing;

    perform fn_audit('payment.confirmed', null, null, 'payment_orders',
                     v_order.reference,
                     jsonb_build_object('provider', p_provider, 'amount', p_amount));
  elsif p_status = 'expired' then
    update payment_orders set status = 'expirado', updated_at = now() where id = v_order.id;
  elsif p_status = 'failed' then
    update payment_orders set status = 'recusado', updated_at = now() where id = v_order.id;
  end if;

  return jsonb_build_object('reference', v_order.reference, 'status', p_status);
end $$;

-- Apenas o service role (servidor) pode executar estas funções.
revoke all on function fn_cast_free_vote(uuid, uuid, uuid, int) from public;
revoke all on function fn_cast_paid_vote(uuid, uuid, uuid, uuid, int) from public;
revoke all on function fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) from public;
grant execute on function fn_cast_free_vote(uuid, uuid, uuid, int) to authenticated;
grant execute on function fn_user_vote_balance(uuid) to authenticated;
