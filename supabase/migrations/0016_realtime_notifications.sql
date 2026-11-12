-- ============================================================================
--  0016 — Realtime para notificações
-- ----------------------------------------------------------------------------
--  O painel do utilizador actualiza o sino e a lista de notificações sem
--  recarregar a página. Para isso a tabela `notification_recipients` tem de
--  estar na publicação `supabase_realtime`.
--
--  Segurança: o RLS continua a aplicar-se ao Realtime. Cada cliente só recebe
--  as linhas que as suas políticas permitem ler (`notification_recipients`
--  filtra por `user_id = auth.uid()`), pelo que não há fuga entre utilizadores.
--
--  `replica identity full` é necessário para que o evento inclua todos os
--  campos (o cliente precisa de `read_at` para marcar como lida).
-- ============================================================================

do $realtime_setup$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publicação supabase_realtime inexistente — ignorado';
    return;
  end if;

  -- Adiciona a tabela apenas se ainda não fizer parte da publicação.
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'notification_recipients'
  ) then
    alter publication supabase_realtime add table public.notification_recipients;
  end if;
end $realtime_setup$;

alter table public.notification_recipients replica identity full;

comment on table public.notification_recipients is
  'Notificações por destinatário. Publicada em Realtime; o RLS limita cada cliente às suas linhas.';
