# Checklist de go-live

## 1. Infraestrutura

- [ ] Projecto Supabase criado (região próxima: `eu-west`/`af-south` conforme latência)
- [ ] `supabase db push` aplicado (migrações 0001→0009)
- [ ] `supabase/seed.sql` **não** executado em produção
- [ ] RLS activo e testado com um utilizador real (não service role)
- [ ] Backups automáticos + PITR activos; restauro testado
- [ ] Buckets de Storage criados (`participants`, `gallery`, `news`) com políticas públicas de leitura
- [ ] Upstash Redis criado e ligado (`rateLimit` migrado)
- [ ] Projecto Vercel ligado ao repositório; domínio e HTTPS configurados
- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio final
- [ ] Cron configurado: `GET /api/cron/notifications` (1 min) com `CRON_SECRET`
- [ ] Cron/`pg_cron` para `fn_refresh_vote_totals()`
- [ ] Bucket de logs/alertas ligado (Sentry ou equivalente)

## 2. Segurança

- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas em variáveis do servidor
- [ ] Nenhum segredo em código, commits ou repositório público (rever histórico)
- [ ] Segredos de webhook definidos por fornecedor
- [ ] CSP em modo report-only antes de aplicar; nonces avaliados
- [ ] Teste de rate limiting (login, voto, ordens, contacto)
- [ ] Teste de autorização: utilizador comum não acede a `/admin` nem a dados de outros
- [ ] Webhook testado com assinatura válida, inválida e replay
- [ ] `DEMO_ROLE` removido (ou `getCurrentUser` confirmado a devolver `null` sem sessão)
- [ ] 2FA nas contas administrativas (GitHub, Supabase, Vercel, fornecedores)

## 3. Conteúdo e dados oficiais

- [ ] 20 concorrentes reais introduzidos, com fotografias autorizadas e biografias aprovadas
- [ ] Campo `is_published = true` apenas nos perfis validados
- [ ] Pacotes de votos com preços e moeda aprovados
- [ ] Campanha com datas, limites e regras aprovadas
- [ ] Notícias/comunicados iniciais publicados
- [ ] Patrocinadores reais com autorização de uso de marca
- [ ] Regulamento, termos, privacidade e cookies revistos juridicamente
- [ ] Contactos institucionais correctos

## 4. Pagamentos

- [ ] Contrato com fornecedor(es) e credenciais de produção
- [ ] Homologação em ambiente sandbox do fornecedor
- [ ] `payment_providers.is_active = true` só após homologação
- [ ] Teste ponta-a-ponta: ordem → pagamento → webhook → crédito único → notificação
- [ ] Teste de reenvio do mesmo webhook (não deve duplicar votos)
- [ ] Teste de valor divergente (deve falhar com alerta)
- [ ] Procedimento de reconciliação e reembolso documentado e treinado
- [ ] Suporte preparado para pedidos com referência de ordem

## 5. Qualidade

- [ ] `npm run build` sem erros; `npx tsc --noEmit` limpo; `npm run lint` limpo
- [ ] Revisão visual em mobile (360px, 390px), tablet e desktop
- [ ] Navegação por teclado e leitor de ecrã nas páginas principais
- [ ] `prefers-reduced-motion` respeitado
- [ ] Core Web Vitals verificados no domínio final
- [ ] `robots.txt` e `sitemap.xml` correctos; `/admin` e `/painel` fora do índice
- [ ] Teste de carga (10k → 50k → 100k utilizadores simulados) e análise de gargalos
- [ ] Plano de comunicação para picos de gala (cache, filas, suporte)
