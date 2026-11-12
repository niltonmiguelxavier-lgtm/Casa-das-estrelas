-- ============================================================================
--  0012 — Crédito integral e idempotente de votos pagos
-- ----------------------------------------------------------------------------
--  Regra de negócio (confirmada com o fluxo da aplicação):
--
--    Uma ordem de pagamento corresponde a UM concorrente e a UM pacote.
--    Quando o pagamento é confirmado, o crédito é feito de uma só vez, com a
--    totalidade dos votos da ordem. Não existem créditos parciais — evita
--    estados intermédios em que o utilizador pagou mas ainda não recebeu tudo.
--
--  Garantias:
--    * `votes_paid_unique_order` (UNIQUE parcial em payment_order_id) impede
--      mais do que um voto por ordem, mesmo com pedidos simultâneos;
--    * `payment_orders.votes_consumed` + `for update` fecham a janela de corrida;
--    * a quantidade creditada é sempre `payment_orders.votes` (nunca um valor
--      vindo do cliente);
--    * toda a operação é atómica e auditada.
--
--  Idempotência: repetir a chamada devolve ORDER_ALREADY_CONSUMED.
-- ============================================================================

-- `votes_paid_unique_order` (UNIQUE em payment_order_id) já vem da 0003; o
-- requisito fica documentado no comentário e é validado pelo smoke test.

comment on index public.votes_paid_unique_order is
  'Um único registo de voto pago por ordem de pagamento — garante crédito exactamente uma vez.';

create or replace function public.fn_cast_paid_vote(
  p_user_id        uuid,
  p_campaign_id    uuid,
  p_participant_id uuid,
  p_order_id       uuid,
  p_quantity       integer default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   payment_orders;
  v_vote_id uuid;
begin
  -- for update: serializa créditos concorrentes da mesma ordem
  select * into v_order from payment_orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.user_id <> p_user_id then raise exception 'ORDER_NOT_OWNED'; end if;
  if v_order.status <> 'confirmado' then raise exception 'ORDER_NOT_CONFIRMED'; end if;
  if v_order.votes_consumed then raise exception 'ORDER_ALREADY_CONSUMED'; end if;

  -- p_quantity é aceite por compatibilidade, mas o valor autoritativo é o da BD.
  if p_quantity is not null and p_quantity <> v_order.votes then
    raise exception 'QUANTITY_MISMATCH expected=% received=%', v_order.votes, p_quantity;
  end if;

  insert into votes(user_id, participant_id, campaign_id, vote_type, quantity, payment_order_id)
  values (p_user_id, p_participant_id, p_campaign_id, 'pago', v_order.votes, p_order_id)
  returning id into v_vote_id;

  update payment_orders
     set votes_consumed = true,
         updated_at = now()
   where id = p_order_id;

  perform fn_audit('vote.paid.credited', p_user_id, null, 'payment_orders', p_order_id::text,
                   jsonb_build_object('quantity', v_order.votes, 'participant_id', p_participant_id));

  return jsonb_build_object('vote_id', v_vote_id, 'credited', v_order.votes);
end $$;

revoke all on function public.fn_cast_paid_vote(uuid, uuid, uuid, uuid, integer) from public;
revoke all on function public.fn_cast_paid_vote(uuid, uuid, uuid, uuid, integer) from anon;
revoke all on function public.fn_cast_paid_vote(uuid, uuid, uuid, uuid, integer) from authenticated;
grant execute on function public.fn_cast_paid_vote(uuid, uuid, uuid, uuid, integer) to service_role;
