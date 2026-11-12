-- ============================================================================
--  0011 — Object storage (Supabase Storage)
-- ----------------------------------------------------------------------------
--  Buckets públicos de LEITURA, escrita apenas por administradores/gestores.
--  Ficheiros pesados nunca entram na base de dados: a BD guarda só o URL.
--
--  Buckets:
--    participants — retratos oficiais dos concorrentes
--    gallery      — fotografias/vídeos da galeria
--    news         — imagens de notícias
--    branding     — logótipo e identidade visual
--
--  Executar após a migração 0010 (grants). Idempotente.
-- ============================================================================

-- ---------- Buckets ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('participants', 'participants', true,  8388608,  array['image/jpeg','image/png','image/webp']),
  ('gallery',      'gallery',      true, 20971520,  array['image/jpeg','image/png','image/webp','video/mp4']),
  ('news',         'news',         true, 10485760,  array['image/jpeg','image/png','image/webp']),
  ('branding',     'branding',     true,  4194304,  array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Leitura pública -------------------------------------------------
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('participants','gallery','news','branding'));

-- ---------- Escrita: só papéis com permissão de conteúdo ---------------------
--  A permissão é verificada contra a tabela pública `users.role`; nunca no cliente.
create or replace function public.fn_can_manage_media()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.users u
     where u.id = auth.uid()
       and u.deleted_at is null
       and u.role in ('superadministrador','administrador','gestor_conteudos')
  );
$$;

revoke all on function public.fn_can_manage_media() from public;
grant execute on function public.fn_can_manage_media() to authenticated, service_role;

drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('participants','gallery','news','branding')
    and public.fn_can_manage_media()
  );

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('participants','gallery','news','branding')
    and public.fn_can_manage_media()
  )
  with check (
    bucket_id in ('participants','gallery','news','branding')
    and public.fn_can_manage_media()
  );

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('participants','gallery','news','branding')
    and public.fn_can_manage_media()
  );
