-- ============================================================================
--  CASA DAS ESTRELAS — SEED DE DESENVOLVIMENTO
-- ============================================================================
--  ATENÇÃO: este ficheiro NÃO deve ser executado em produção.
--  Os 20 registos de concorrentes são PLACEHOLDERS da grelha oficial
--  (10 Angola + 10 Moçambique), sem fotografias e sem dados biográficos.
--  A produção substitui-os pelos elementos reais através do painel
--  administrativo. Nenhum concorrente é inventado pelo sistema.
-- ============================================================================

begin;

-- ---------- Concorrentes (placeholders) -------------------------------------
insert into participants (number, name, country, status, is_published, tagline, bio)
select
  n,
  (case when n <= 10 then 'Concorrente Angola ' else 'Concorrente Moçambique ' end) || lpad((n - case when n <= 10 then 0 else 10 end)::text, 2, '0'),
  (case when n <= 10 then 'Angola' else 'Moçambique' end),
  'activo',
  false,                       -- publicar apenas após validação da produção
  'Perfil a preencher pela administração',
  'Perfil provisório criado pelo seed de desenvolvimento. A biografia oficial é introduzida pela administração antes da publicação.'
from generate_series(1, 20) as n
on conflict (number) do nothing;

-- ---------- Pacotes de votos ------------------------------------------------
insert into vote_packages (name, votes, price, currency, bonus_label, best_value, sort_order)
values
  ('Pacote Estrela',      10,  50.00, 'MZN', null,             false, 1),
  ('Pacote Constelação',  30, 130.00, 'MZN', '+3 votos oferta', false, 2),
  ('Pacote Galáxia',      80, 300.00, 'MZN', '+15 votos oferta', true, 3),
  ('Pacote Supernova',   200, 700.00, 'MZN', '+50 votos oferta', false, 4)
on conflict do nothing;

-- ---------- Campanha de exemplo --------------------------------------------
with nova as (
  insert into voting_campaigns (name, status, starts_at, ends_at, participant_ids, show_totals)
  select 'Gala de demonstração', 'agendada', now(), now() + interval '7 days',
         array_agg(id), true
  from participants
  returning id
)
insert into voting_rules (campaign_id, free_votes_per_user, frequency, rules_text)
select id, 5, 'diaria', array[
  'Cada conta autenticada dispõe de 5 votos gratuitos por dia.',
  'Os votos gratuitos renovam diariamente às 00:00 (Africa/Maputo).',
  'Votos pagos são creditados apenas após confirmação verificada do fornecedor.',
  'A votação encerra no final da gala, conforme o regulamento.'
] from nova
on conflict do nothing;

-- ---------- Notícia de exemplo (rascunho) ----------------------------------
insert into news (slug, title, excerpt, body, category, status, author)
values (
  'exemplo-rascunho',
  'Publicação de exemplo (rascunho)',
  'Registo criado pelo seed para validar o fluxo editorial.',
  'Este conteúdo existe apenas em ambiente de desenvolvimento e não é visível publicamente.',
  'Programa',
  'rascunho',
  'Seed'
)
on conflict (slug) do nothing;

commit;
