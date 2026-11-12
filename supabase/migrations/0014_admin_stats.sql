-- ============================================================================
--  0014 — Estatísticas do painel numa única chamada
-- ----------------------------------------------------------------------------
--  O dashboard administrativo não pode percorrer tabelas inteiras no servidor
--  da aplicação (milhões de votos). Esta função agrega tudo na base de dados e
--  devolve um único JSON — uma ida ao servidor, custo previsível.
--
--  Contagens sempre sobre dados reais; zero quando não há dados.
-- ============================================================================

create or replace function public.fn_admin_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
    u as (
      select count(*) as total,
             count(*) filter (where created_at > now() - interval '24 hours') as novos_24h,
             count(*) filter (where status = 'activa') as activos
        from users
       where deleted_at is null
    ),
    la as (
      select count(distinct user_id) as logins_24h
        from login_activity
       where created_at > now() - interval '24 hours'
    ),
    p as (
      select count(*) filter (where deleted_at is null) as total,
             count(*) filter (where is_published and deleted_at is null) as publicados
        from participants
    ),
    v as (
      select coalesce(sum(free_votes), 0) as gratuitos,
             coalesce(sum(paid_votes), 0) as pagos,
             coalesce(sum(total_votes), 0) as total
        from participant_vote_totals
    ),
    pay as (
      select count(*) filter (where status = 'confirmado') as confirmados,
             count(*) filter (where status = 'pendente') as pendentes,
             coalesce(sum(amount) filter (where status = 'confirmado'), 0) as receita,
             coalesce(sum(amount) filter (where status = 'pendente'), 0) as pendente_valor
        from payment_orders
    ),
    ord as (
      select count(*) filter (where status = 'pendente' and expires_at < now()) as expirados
        from payment_orders
    )
  select jsonb_build_object(
    'registeredUsers',      (select total from u),
    'newUsers24h',          (select novos_24h from u),
    'activeUsers24h',       coalesce((select logins_24h from la), 0),
    'activeAccounts',       (select activos from u),
    'participants',         (select total from p),
    'publishedParticipants',(select publicados from p),
    'freeVotes',            (select gratuitos from v),
    'paidVotes',            (select pagos from v),
    'totalVotes',           (select total from v),
    'revenue',              (select receita from pay),
    'confirmedPayments',    (select confirmados from pay),
    'pendingPayments',      (select pendentes from pay),
    'pendingAmount',        (select pendente_valor from pay),
    'expiredOrders',        (select expirados from ord),
    'generatedAt',          now()
  );
$$;

revoke all on function public.fn_admin_stats() from public;
revoke all on function public.fn_admin_stats() from anon;
revoke all on function public.fn_admin_stats() from authenticated;
grant execute on function public.fn_admin_stats() to service_role;

comment on function public.fn_admin_stats() is
  'KPIs do painel. Executada na base de dados para evitar agregações em memória.';
