# Base de dados — estado real (12/11/2026)

Este documento substitui as estimativas do `O-QUE-FALTA.md` no que diz respeito
ao **PostgreSQL**. Tudo o que aqui está descrito foi executado contra o projecto
real e verificado por consultas ao catálogo e por chamadas HTTP ao serviço.

> ⚠️ A palavra-passe da base de dados foi partilhada por chat. **Rode-a** em
> *Project Settings → Database → Reset database password* e actualize o valor
> apenas no servidor (Vercel → Environment Variables). Nada neste repositório
> contém credenciais.

---

## 1. Projecto

| Item | Valor |
| --- | --- |
| Projecto | `vaoafpbxpzmdmqyvkpsz` |
| URL | `https://vaoafpbxpzmdmqyvkpsz.supabase.co` |
| Região | `eu-central-1` (Frankfurt) |
| PostgreSQL | 17.11 |
| Ligação do servidor | pooler `aws-1-eu-central-1.pooler.supabase.com:5432`, utilizador `postgres.<ref>` |
| Ligação directa | `db.<ref>.supabase.co` — **IPv6 apenas**, não serve para CI/sandbox IPv4 |

O pooler na porta **5432** (sessão) é o caminho para DDL e migrações. A porta
**6543** (transacção) serve o runtime da aplicação quando se usa um driver
PostgreSQL directo; a aplicação web fala por PostgREST, não pelo pooler.

---

## 2. Migrações aplicadas

`supabase/migrations/0001…0014`, todas aplicadas e registadas em
`public.schema_migrations (version, checksum, applied_at)`.

| Ficheiro | Conteúdo |
| --- | --- |
| `0001_extensions_and_helpers.sql` | schema `extensions`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, funções auxiliares |
| `0002_users_and_security.sql` | `users`, `user_profiles`, `roles`, `permissions`, `user_roles`, `sessions`, `user_devices`, `login_activity` |
| `0003_participants_and_voting.sql` | `participants`, `participant_media`, `voting_campaigns`, `voting_rules`, `votes`, `vote_limits`, `ranking_snapshots` |
| `0004_payments.sql` | `payment_providers`, `vote_packages`, `payment_orders`, `payments`, `payment_webhooks`, `transactions`, `refunds` |
| `0005_vote_functions.sql` | `fn_cast_free_vote`, `fn_cast_paid_vote`, `fn_confirm_payment`, `fn_refresh_vote_totals`, `fn_user_vote_balance` |
| `0006_notifications.sql` | notificações, destinatários, preferências, templates, fila, logs de entrega, push |
| `0007_content.sql` | `news`, `news_categories`, `gallery`, `sponsors`, `pages`, `admin_settings` |
| `0008_admin_audit_logs.sql` | `audit_logs`, `system_events`, `system_logs` + imutabilidade |
| `0009_rls_policies.sql` | RLS activa em todas as tabelas + políticas |
| `0010_supabase_grants.sql` | `GRANT`/`DEFAULT PRIVILEGES` para `anon`, `authenticated`, `service_role` |
| `0011_storage_buckets.sql` | buckets `participants`, `gallery`, `news`, `branding` + políticas |
| `0012_paid_vote_credit_integral.sql` | crédito **integral e único** por ordem; `p_quantity` deixa de poder divergir do valor da BD |
| `0013_payment_webhook_hardening.sql` | histórico de pagamentos sempre gravado, unicidade por fornecedor, `payment_webhooks` com payload e resultado |
| `0014_admin_stats.sql` | `fn_admin_stats()` — KPIs do painel agregados na base de dados |

Estado verificado no catálogo:

| Métrica | Valor |
| --- | --- |
| Tabelas em `public` | 41 (40 + `schema_migrations`) |
| Tabelas com RLS activa | 40 |
| Políticas RLS | 54 (50 de domínio + 4 de Storage) |
| Triggers | 23 |
| Funções `fn_*` | 19 |
| Views / materializadas | `ranking_current` / `participant_vote_totals` |
| Índices | 106 |
| Buckets de storage | 4 |

---

## 3. Testes executados contra a base real

### 3.1 Autenticação (GoTrue)

| Passo | Resultado |
| --- | --- |
| `POST /auth/v1/signup` | 400 `email_address_invalid` para domínios de teste (política anti-descartável do GoTrue); 429 ao insistir (limite de envio de email) |
| Criação de utilizador com trigger `fn_handle_new_auth_user` | ✅ cria `users` (papel `utilizador`) + `user_profiles` + preferências de notificação |
| `POST /auth/v1/token?grant_type=password` | 200, JWT `bearer` emitido |
| Erro `500 Database error querying schema` antes da correcção | causa: `auth.instances` vazia e tokens `''`/`NULL` incoerentes; resolvido normalizando `confirmation_token`, `recovery_token`, etc. |

> Nota operacional: o envio de email do plano gratuito está limitado a ~2–4
> mensagens/hora. Para o fluxo de confirmação de email em produção é obrigatório
> configurar SMTP próprio (ver §5).

### 3.2 Votação gratuita (RPC PostgREST, utilizador autenticado)

| Passo | Resultado |
| --- | --- |
| `POST /rest/v1/rpc/fn_cast_free_vote` (2 votos, limite 3) | `{vote_id, remaining: 1}` |
| Repetir com +2 votos | 400 `LIMIT_EXCEEDED` |
| `fn_user_vote_balance` | `{free_remaining: 1, free_limit: 3, paid_remaining: 0}` |
| `SELECT votes` (própria conta) | apenas os votos do próprio (RLS) |
| `UPDATE votes SET quantity=999` | bloqueado — `REGISTO_IMUTAVEL: UPDATE em votes não é permitido` |
| `notification_queue` | evento `vote.confirmed:<id>` criado |
| `audit_logs` | `vote.free` registado |

### 3.3 Votação paga e webhook

| Passo | Resultado |
| --- | --- |
| `fn_confirm_payment(ref, 'mpesa','confirmed', 50,'MZN','MPESA-QA-TX-1')` | `{status: confirmed}`; pedido passa a `confirmado` |
| Repetir o mesmo webhook | `{already_confirmed: true}` — **crédito único garantido** |
| Webhook com valor adulterado (1 em vez de 50) | `AMOUNT_MISMATCH expected=50.00 received=1` |
| `fn_cast_paid_vote` (5 votos) | `{vote_id}` + `votes_consumed = true` |
| Repetir crédito da mesma ordem | `ORDER_ALREADY_CONSUMED` |
| `fn_refresh_vote_totals()` → `ranking_current` | posições actualizadas |
| Auditoria | `payment.confirmed`, `vote.paid.credited` |
| Fila | `payment.confirmed:<referência>` |

**Conclusão:** o caminho crítico de dinheiro (verificação de valor, idempotência,
crédito único, auditoria, imutabilidade) está validado no servidor. Nenhum valor é
aceite a partir do browser.

### 3.4 Isolamento (RLS) por HTTP

| Consulta anónima | Resultado |
| --- | --- |
| `GET /rest/v1/participants` | 200 (catálogo público) |
| `GET /rest/v1/votes` | 200 com `[]` |
| `GET /rest/v1/payments` | 200 com `[]` |
| `GET /rest/v1/users` | 200 com `[]` |
| `GET /rest/v1/audit_logs` | 200 com `[]` |

As tabelas sensíveis não devolvem 403: devolvem **lista vazia**, porque a RLS
filtra linhas e os privilégios de tabela existem. É o comportamento correcto do
PostgREST — não há fuga de dados.

### 3.5 Scripts reproduzíveis (no repositório)

| Ficheiro | O que faz |
| --- | --- |
| `supabase/tools/migrate.py` | aplica `0001…0014` com ledger de checksums; `--dry-run` |
| `supabase/tests/smoke_auth_votes.py` | trigger de perfil, login GoTrue, RLS anónima, voto gratuito, limite, saldo, histórico, imutabilidade |
| `supabase/tests/smoke_payments.py` | webhook, idempotência, valor adulterado, crédito único, auditoria, fila |

Correm apenas com variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`DATABASE_URL`); nenhuma credencial vive no código.

Resultado da última execução (12/11/2026): todos os passos em conformidade —
crédito exactamente uma vez, recusa de valores divergentes, histórico de
pagamentos com 1 registo por ordem, auditoria e fila preenchidas.

### 3.6 Aplicação (Next.js) contra a base real

| Verificação | Resultado |
| --- | --- |
| `/concorrentes` | dados reais da BD; aviso de demonstração **desapareceu** |
| `/classificacao` | estado vazio explícito («A classificação começa com o primeiro voto válido») |
| `/painel` sem sessão | 307 → `/entrar?next=%2Fpainel&motivo=autenticacao-necessaria` |
| `/admin` sem sessão | 307 → `/entrar?next=%2Fadmin&motivo=acesso-restrito` |
| Cabeçalhos | CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` presentes |
| `/redefinir-palavra-passe` | página criada + Server Action `resetPasswordAction` |
| `/painel` com sessão (7 sub-páginas) | 200 e dados reais do utilizador (votos, pagamentos, notificações) |
| `/admin` com papel autorizado | KPIs reais via `fn_admin_stats()`, utilizadores, auditoria |
| `POST /api/webhooks/payments/mpesa` | assinatura inválida → 401; válida → 200; repetida → `duplicate:true`; valor errado → 422 |
| `GET /api/cron/notifications` | com `CRON_SECRET` → 8 jobs processados; sem segredo → 401; `notification_recipients` criados |

---

## 4. Configuração da aplicação

`.env.local` (nunca versionado) ficou com:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vaoafpbxpzmdmqyvkpsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave publicável>
SUPABASE_SERVICE_ROLE_KEY=      # ainda por preencher
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
CRON_SECRET=<gerado>
```

### Serviço privilegiado (`lib/supabase/service.ts`)

O caminho de servidor escolhe automaticamente, por ordem:

1. **chave secreta da Supabase** (`SUPABASE_SERVICE_ROLE_KEY`) → cliente oficial;
2. **PostgreSQL directo** (`DATABASE_URL`) → shim mínimo com `rpc`, `insert` e
   filtros (`eq`, `lte`, `in`, `order`, `limit`) executados com SQL parametrizado;
3. nada configurado → as rotas respondem **503**, nunca simulam.

Detalhes operacionais do shim:

* a DSN recebe `uselibpqcompat=true` automaticamente — sem isso o driver `pg`
  trata `sslmode=require` como `verify-full` e falha com a cadeia de certificados
  do pooler;
* pool de 5 ligações reutilizado entre pedidos;
* para verificação completa de TLS definir `DATABASE_CA_CERT` (o certificado do
  projecto) — recomendado antes do lançamento.

Leitura pública (concorrentes, notícias, classificação, pacotes, patrocinadores)
funciona apenas com `URL + chave publicável`, via RLS — **não precisa da chave
secreta**. A chave `service_role` só é necessária para:

- painel administrativo (escrita e leitura global);
- `audit_logs` (append-only, sem política de INSERT para utilizadores);
- contadores globais de dashboard.

Enquanto estiver vazia, o painel mostra um aviso claro em vez de simular dados.

---

## 5. O que ainda depende do painel da Supabase (não é código)

| # | Item | Onde | Impacto se faltar |
| --- | --- | --- | --- |
| S1 | **Chave secreta** (`sb_secret_…`) | Project Settings → API | Painel admin em modo leitura; sem auditoria persistida |
| S2 | **SMTP do Supabase Auth** (ou Notifica, se disponibilizar SMTP) | Authentication → Emails | Confirmação de email e recuperação de palavra-passe limitadas a poucos envios/hora. As notificações da aplicação já saem pela Notifica; o GoTrue é um canal separado |
| S3 | **Site URL + Redirect URLs** (`https://casadasestrelas.tv`, `/auth/callback`) | Authentication → URL Configuration | Ligações de email apontam para localhost |
| S4 | **Confirmação de email obrigatória** | Authentication → Providers → Email | Contas não verificadas poderiam votar |
| S5 | **Protecção de palavras-passe comprometidas** | Authentication → Policies | Sem verificação HaveIBeenPwned |
| S6 | **Backups diários / PITR** | Database → Backups | Sem recuperação point-in-time |
| S7 | **Limites de taxa Auth** | Authentication → Rate Limits | Abuso de signup/login |
| S8 | **Google OAuth** (opcional) | Providers → Google | Login social indisponível (`/api/auth/google` responde com aviso) |

---

## 6. Próximos passos técnicos (ordem recomendada)

1. Preencher `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ANON_KEY` na Vercel.
2. Configurar S2–S4 e testar o ciclo completo de registo com email real.
3. `pg_cron` a chamar `fn_refresh_vote_totals()` a cada 30–60 s (substitui o job B5).

### Ajustes encontrados nos testes (já corrigidos)

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `fn_cast_paid_vote(…, 1)` creditava **1** voto num pacote de 5 | a quantidade vinha do cliente e não era confrontada com a ordem | migração `0012` — o valor autoritativo é `payment_orders.votes`; divergência → `QUANTITY_MISMATCH` |
| Ordem ficava `confirmado` mas com **0 linhas em `payments`** | `ON CONFLICT (provider, provider_transaction_id) DO NOTHING` engolia o INSERT e `v_payment_id` ficava nulo | migração `0013` — histórico sempre gravado; colisão marcada explicitamente; índice único parcial |
| Webhooks sem rasto do payload | `payment_webhooks` nunca era preenchido pela função | migração `0013` — regista `event_id`, `payload`, `processed_at`, motivo |
| `UPDATE`/`DELETE` em `votes` recusados mesmo para administração | trigger de imutabilidade | **intencional** — correções fazem-se por `refunds`/estorno auditado, nunca por alteração de totais |
4. Ligar Redis gerido (Upstash) para rate limiting distribuído.
5. Integração de pagamento real (contrato + credenciais) — o resto do fluxo já está testado.
