-- ============================================================================
--  0017 — Fotografias do ranking (variação de posições)
-- ----------------------------------------------------------------------------
--  A classificação pública mostra a variação face à actualização anterior.
--  Sem snapshots registados, a variação é sempre 0 — o que é honesto, mas
--  inútil. Esta função cria uma fotografia oficial do ranking e é agendada.
--
--  Formato: `ranking_snapshots.data` = { "<participant_id>": <posição>, ... }
--  É exactamente o que a view `ranking_current` espera ler (->> participant_id).
--
--  Frequência: uma por hora. Variações a cada minuto seriam ruído num programa
--  semanal; uma por hora reflecte a evolução real da votação.
-- ============================================================================

create or replace function public.fn_snapshot_ranking(p_campaign_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
  v_count integer;
begin
  select jsonb_object_agg(participant_id::text, position) into v_data
    from ranking_current;

  if v_data is null then
    return 0;  -- sem concorrentes publicados: nada a fotografar
  end if;

  insert into ranking_snapshots(campaign_id, data, is_official, captured_at)
  values (
    coalesce(
      p_campaign_id,
      (select id from voting_campaigns where status = 'activa' order by starts_at desc limit 1)
    ),
    v_data, true, now()
  )
  returning 1 into v_count;

  return v_count;
end $$;

revoke all on function public.fn_snapshot_ranking(uuid) from public;
revoke all on function public.fn_snapshot_ranking(uuid) from anon;
revoke all on function public.fn_snapshot_ranking(uuid) from authenticated;
grant execute on function public.fn_snapshot_ranking(uuid) to service_role;

-- ---------- Agendamento horário ---------------------------------------------
do $snapshot_setup$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron não instalado — snapshot do ranking não agendado';
    return;
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'cde-snapshot-ranking';

  perform cron.schedule(
    'cde-snapshot-ranking',
    '5 * * * *',
    $$select public.fn_snapshot_ranking()$$
  );
end $snapshot_setup$;
