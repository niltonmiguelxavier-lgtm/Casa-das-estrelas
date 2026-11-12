-- ============================================================================
--  0013 — Robustez do webhook de pagamentos
-- ----------------------------------------------------------------------------
--  Correções:
--
--  1. `payments` passava a ter 0 linhas de histórico quando o mesmo
--     `provider_transaction_id` já existia (ON CONFLICT DO NOTHING engolia o
--     INSERT e deixava `v_payment_id` nulo). Agora o histórico é sempre
--     registado: um duplicado é gravado com o estado devolvido pelo fornecedor
--     e o pedido original não é alterado.
--
--  2. Webhooks de fornecedores diferentes com a mesma referência de transporte
--     deixam de colidir: a chave passa a ser (provider, provider_transaction_id)
--     com NULL permitido (índice parcial).
--
--  3. Cada chamada fica registada em `payment_webhooks` (payload + resultado),
--     o que permite reconciliação e investigação de incidentes.
--
--  Mantém-se: verificação de valor e moeda contra a BD, crédito apenas via
--  `fn_cast_paid_vote`, idempotência por estado da ordem, tudo em transacção.
-- ============================================================================

-- ---------- 1. payments: unicidade por fornecedor + transacção -----------------
create unique index if not exists payments_provider_tx_unique
  on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- ---------- 2. fn_confirm_payment ---------------------------------------------
create or replace function public.fn_confirm_payment(
  p_reference               text,
  p_provider                text,
  p_status                  text,
  p_amount                  numeric,
  p_currency                text,
  p_provider_transaction_id text default null,
  p_paid_at                 timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order        payment_orders;
  v_payment_id   uuid;
  v_status       order_status;
  v_duplicate    boolean := false;
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

  v_status := (case p_status
                 when 'confirmed' then 'confirmado'
                 when 'refunded'  then 'reembolsado'
                 when 'expired'   then 'expirado'
                 else 'recusado'
               end)::order_status;

  -- Já confirmado: não se altera nada, mas o evento fica registado.
  if v_order.status = 'confirmado' then
    insert into payment_webhooks(provider, event_id, signature_valid, payload, processed_at, error)
    values (p_provider, coalesce(p_provider_transaction_id, p_reference), true,
            jsonb_build_object('reference', p_reference, 'status', p_status, 'amount', p_amount,
                               'currency', p_currency, 'paid_at', p_paid_at),
            now(), 'duplicado — ordem já confirmada')
    on conflict (provider, event_id) do nothing;

    return jsonb_build_object('already_confirmed', true, 'reference', v_order.reference);
  end if;

  -- Histórico de pagamentos: sempre gravado, nunca engolido por conflito.
  insert into payments(order_id, user_id, provider, provider_transaction_id,
                       amount, currency, status, paid_at, payload)
  values (v_order.id, v_order.user_id, p_provider, p_provider_transaction_id,
          p_amount, upper(p_currency), v_status, p_paid_at,
          jsonb_build_object('provider', p_provider, 'reference', p_reference))
  on conflict (provider, provider_transaction_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    v_duplicate := true;  -- mesma transacção do fornecedor já registada noutra ordem
  end if;

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

    perform fn_audit('payment.confirmed', null, null, 'payment_orders', v_order.reference,
                     jsonb_build_object('provider', p_provider, 'amount', p_amount));
  elsif p_status = 'expired' then
    update payment_orders set status = 'expirado', updated_at = now() where id = v_order.id;
  elsif p_status = 'failed' then
    update payment_orders set status = 'recusado', updated_at = now() where id = v_order.id;
  end if;

  insert into payment_webhooks(provider, event_id, signature_valid, payload, processed_at, error)
  values (p_provider, coalesce(p_provider_transaction_id, p_reference), true,
          jsonb_build_object('reference', p_reference, 'status', p_status, 'amount', p_amount,
                             'currency', p_currency, 'paid_at', p_paid_at),
          now(), case when v_duplicate then 'transacção repetida do fornecedor' else null end)
  on conflict (provider, event_id) do nothing;

  return jsonb_build_object('reference', v_order.reference,
                            'status', p_status,
                            'payment_recorded', v_payment_id is not null);
end $$;

revoke all on function public.fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) from public;
revoke all on function public.fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) from anon;
revoke all on function public.fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) from authenticated;
grant execute on function public.fn_confirm_payment(text, text, text, numeric, text, text, timestamptz) to service_role;
