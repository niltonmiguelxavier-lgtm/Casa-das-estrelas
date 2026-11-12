-- ============================================================================
--  0018 — Correcção do cálculo de variação na classificação
-- ----------------------------------------------------------------------------
--  Bug: `ranking_current` devolvia a POSIÇÃO ANTERIOR em vez da diferença.
--  Para quem subiu de 3.º para 1.º o valor era 3, e a interface mostrava
--  "subiu 3" quando na verdade subiu 2. A variação tem de ser
--  (posição anterior − posição actual):
--
--      resultado > 0  → subiu (seta para cima)
--      resultado < 0  → desceu (seta para baixo)
--      resultado = 0  → manteve
--
--  Usa sempre a fotografia oficial mais recente (`fn_snapshot_ranking`,
--  agendada de hora a hora). Sem snapshots, a variação é 0 — nunca inventada.
-- ============================================================================

-- A view existente tem de ser removida: o tipo da coluna `variation` muda de
-- integer para bigint (resultado de uma subtracção com posição anterior).
drop view if exists public.ranking_current;

create view public.ranking_current as
with ranked as (
  select
    p.id            as participant_id,
    p.name,
    p.number,
    p.country,
    p.photo_url,
    t.total_votes   as votes,
    row_number() over (order by t.total_votes desc, p.number) as position
  from participants p
  join participant_vote_totals t on t.participant_id = p.id
  where p.deleted_at is null and p.is_published
),
ultima as (
  select data
    from ranking_snapshots
   where is_official
   order by captured_at desc
   limit 1
)
select
  r.position,
  r.participant_id,
  r.name,
  r.number,
  r.country,
  r.photo_url,
  r.votes,
  -- variação = posição anterior − posição actual
  coalesce(
    (select (((u.data ->> r.participant_id::text)::integer) - r.position)::integer from ultima u),
    0
  )::integer as variation
from ranked r
order by r.position;

comment on view public.ranking_current is
  'Classificação das tabelas publicadas. `variation` = posição anterior − actual (positivo = subiu).';

grant select on public.ranking_current to anon, authenticated, service_role;
