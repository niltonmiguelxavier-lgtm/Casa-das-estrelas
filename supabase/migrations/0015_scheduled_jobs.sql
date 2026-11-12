-- ============================================================================
--  0015 — Tarefas agendadas na base de dados (pg_cron)
-- ----------------------------------------------------------------------------
--  Três trabalhos essenciais que não devem depender de um pedido HTTP:
--
--   1. `cde-refresh-vote-totals` — actualiza a vista materializada
--      `participant_vote_totals` a cada 30 s. Sem isto a classificação fica
--      desactualizada; com isto, nenhuma página precisa de agregar votos.
--
--   2. `cde-expire-orders` — marca como `expirado` os pedidos pendentes cuja
--      janela de pagamento terminou (30 min por omissão). Evita pedidos
--      eternamente "pendentes" nos relatórios.
--
--   3. `cde-purge-system-logs` — limpeza diária de `system_logs` antigos
--      (retenção de 90 dias), mantendo `audit_logs` intactos.
--
--  Idempotente: reagenda com o mesmo nome em vez de duplicar.
-- ============================================================================

-- ---------- Expiração de ordens pendentes ------------------------------------
create or replace function public.fn_expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expiradas as (
    update payment_orders
       set status = 'expirado', updated_at = now()
     where status = 'pendente'
       and expires_at is not null
       and expires_at < now()
    returning id, reference
  )
  select count(*) into v_count from expiradas;

  if v_count > 0 then
    perform fn_audit('payment.orders.expired', null, null, 'payment_orders', null,
                     jsonb_build_object('count', v_count));
  end if;

  return v_count;
end $$;

revoke all on function public.fn_expire_pending_orders() from public;
revoke all on function public.fn_expire_pending_orders() from anon;
revoke all on function public.fn_expire_pending_orders() from authenticated;
grant execute on function public.fn_expire_pending_orders() to service_role;

-- ---------- Agendamento ------------------------------------------------------
do $cron_setup$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron não instalado — agendamento ignorado (instalar a extensão primeiro)';
    return;
  end if;

  -- Remove agendamentos anteriores com o mesmo nome (idempotência).
  perform cron.unschedule(jobid) from cron.job
   where jobname in ('cde-refresh-vote-totals', 'cde-expire-orders', 'cde-purge-system-logs');

  perform cron.schedule(
    'cde-refresh-vote-totals',
    '30 seconds',
    $$select public.fn_refresh_vote_totals()$$
  );

  perform cron.schedule(
    'cde-expire-orders',
    '*/5 * * * *',
    $$select public.fn_expire_pending_orders()$$
  );

  perform cron.schedule(
    'cde-purge-system-logs',
    '15 3 * * *',
    $$select public.fn_purge_old_system_logs()$$
  );
end $cron_setup$;
