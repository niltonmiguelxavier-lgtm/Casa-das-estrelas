# Casa das Estrelas — estado da configuração (12/11/2026)

## 1. O que está feito e verificado contra o sistema real

**Base de dados (Supabase, PostgreSQL 17.11, região eu-central-1)**

- 14 migrações aplicadas (`0001…0014`) com controlo de checksums.
- 40 tabelas de domínio, RLS activa em todas, 54 políticas, 23 triggers,
  19 funções `fn_*`, 106 índices, 4 buckets de Storage.
- Storage: `participants`, `gallery`, `news`, `branding` — leitura pública,
  escrita só para papéis de conteúdo (`fn_can_manage_media()`).

**Autenticação (real, testada)**

- Registo → trigger cria `users` + `user_profiles` + preferências.
- Login por palavra-passe devolve JWT; sessão de cookie propagada para as páginas.
- `/painel` sem sessão → 307 para `/entrar?next=…`; `/admin` idem com `acesso-restrito`.
- Criada a página em falta **`/redefinir-palavra-passe`** com a Server Action
  `resetPasswordAction` (uso único, termina sessões, auditoria
  `auth.password_reset.completed`).

**Votação gratuita** — `fn_cast_free_vote` testada: limite respeitado, saldo,
histórico próprio, `LIMIT_EXCEEDED` ao exceder, votos imutáveis
(`REGISTO_IMUTAVEL` em UPDATE/DELETE).

**Pagamentos** — caminho completo validado sem qualquer gateway:

| Verificação | Resultado |
| --- | --- |
| Webhook com assinatura inválida | `401 invalid_signature` |
| Webhook válido (`x-signature` HMAC-SHA256) | `200 {ok:true}` |
| Mesmo evento repetido | `200 {ok:true, duplicate:true}` |
| Valor divergente da ordem | `422 AMOUNT_MISMATCH expected=50.00 received=1` |
| Crédito de votos | uma só vez (`ORDER_ALREADY_CONSUMED` na repetição) |
| Histórico | 1 linha em `payments` por ordem; `payment_webhooks` com payload |
| Auditoria | `payment.webhook.received`, `payment.confirmed`, `vote.paid.credited` |

**Notificações** — worker `GET /api/cron/notifications` (Bearer `CRON_SECRET`):
8 jobs processados, `notification_recipients` criados, 401 sem segredo.

**Painel** — KPIs reais agregados na base de dados (`fn_admin_stats()`), não em
memória. Utilizadores e auditoria lidas do PostgreSQL.

**Aplicação** — `next build` OK (33/33 páginas), `tsc --noEmit` limpo, ESLint sem
avisos. 24 rotas públicas verificadas com 200; 7 páginas de painel com 200 em
sessão real; 5 páginas de administração com papel autorizado.

## 2. Correcções de honestidade (dados de demonstração)

- `DEMO_MODE` passou a depender da configuração: com base de dados ligada, os
  avisos de demonstração desaparecem e a aplicação mostra apenas dados reais.
- `/classificacao` sem votos mostra um estado vazio explícito; a data de
  actualização lê a campanha em vez de ficar em «—».
- `/votar/pacotes` sem pacotes activos explica que a produção ainda não os
  definiu — nenhum preço inventado.
- Estatísticas do painel devolvem **zeros** quando não há dados (antes mostravam
  números de demonstração).
- Módulo `public/sw.js` criado para Web Push (antes o registo falhava com 404).

## 3. Decisões técnicas tomadas

| Assunto | Decisão |
| --- | --- |
| Chave secreta ausente | `lib/supabase/service.ts` usa a chave secreta quando existe; caso contrário liga-se por `DATABASE_URL` (SQL parametrizado, pool de 5). Sem nenhum dos dois, as rotas respondem 503 — nunca simulam. |
| TLS com o pooler | DSN normalizada com `uselibpqcompat=true`; sem isso o driver `pg` trata `sslmode=require` como `verify-full` e falha. Verificação completa disponível via `DATABASE_CA_CERT`. |
| Crédito de votos pagos | Integral por ordem (`payment_orders.votes` é o valor autoritativo). Crédito parcial foi descartado por deixar utilizadores com pagamento confirmado e votos pendentes. |
| Verificação de email | Os testes criam contas por SQL porque o envio do GoTrue está limitado a poucas mensagens/hora. Em produção: SMTP próprio. |

## 3.1 Feito com o conector Supabase (12/11, sessão 2)

| Item | Estado |
| --- | --- |
| **pg_cron** | Extensão instalada e 4 trabalhos activos: `cde-refresh-vote-totals` (30 s, 7 execuções OK), `cde-expire-orders` (5 min), `cde-purge-system-logs` (diário), `cde-snapshot-ranking` (horário) |
| **Chave de servidor** | `service_role` configurada em `.env.local`; PostgREST confirmado a devolver `users`, `audit_logs` e `fn_admin_stats()` |
| **Auth** | Signup activo, `mailer_autoconfirm: false` (confirmação obrigatória), rotação de refresh token, `site_url` e **lista de redirects** (localhost, domínio e `.vercel.app`) |
| **Realtime** | `notification_recipients` publicada com `replica identity full`; RLS continua a filtrar por utilizador |
| **Email** | `lib/services/email.ts` implementado (Resend, API HTTP, HMAC de contexto, sem SDK). Sem `RESEND_API_KEY` o canal regista `ignorado/fornecedor_nao_configurado` — **nunca finge entrega** |
| **Saúde** | `db`, `auth`, `rest`, `storage`, `realtime`, `pooler` todos `ACTIVE_HEALTHY` |

### Correções encontradas nesta sessão

| Problema | Correção |
| --- | --- |
| `ranking_current` devolvia a **posição anterior** em vez da **variação** (quem subia de 3.º para 1.º aparecia como "subiu 3") | Migração `0018` — `variation = posição anterior − posição actual`; view recriada com cast explícito |
| `fn_snapshot_ranking` inexistente: a variação nunca podia ser diferente de zero | Migração `0017` — função + agendamento horário; `data` no formato que a view lê |
| O worker registava `nao_configurado` em `notification_delivery_logs`, valor que não existe no enum `delivery_status` — o INSERT falhava em silêncio | Estados válidos (`ignorado`) + motivo em `error`; erros de registo passam a aparecer no log |
| Canal email tratava a notificação como in-app (duplicava a notificação) | Ramo separado: o job `email` entrega e termina, sem criar `notifications` |
| Nenhum envio de email real implementado (só um comentário `TODO`) | `deliverEmail()` com preferências por categoria, endereço lido de `auth.users`, log de cada tentativa |

## 4. O que falta e de quem depende

| # | Item | Depende de |
| --- | --- | --- |
| 1 | ~~Chave de servidor~~ | ✅ configurada (`service_role`) |
| 2 | ~~Redirect URLs / confirmação de email~~ | ✅ configuradas no Auth |
| 3 | ~~`pg_cron` / refresh da classificação~~ | ✅ 4 jobs activos |
| 4 | ~~Realtime das notificações~~ | ✅ publicado |
| 5 | **Credenciais SMTP/Resend** (`RESEND_API_KEY`, `EMAIL_FROM`) | fornecedor de email — sem isto o canal fica marcado como inactivo |
| 6 | **Domínio definitivo** — trocar `site_url` de `localhost` para o domínio real antes do go-live | produção |
| 7 | **Backups diários / PITR** | plano do projecto |
| 8 | **Redis gerido** (rate limiting distribuído entre instâncias) | Upstash ou equivalente |
| 9 | **Gateway de pagamento real** (contrato + credenciais) | fornecedor autorizado |
| 10 | **Dados oficiais**: 20 concorrentes, pacotes, notícias, textos legais | produção |
| 11 | **Rotação da palavra-passe da BD** | recomendado — foi partilhada por chat |

## 5. Comandos úteis

```bash
# aplicar migrações
export DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
python3 supabase/tools/migrate.py --dry-run   # ver o que falta
python3 supabase/tools/migrate.py

# testes contra o sistema real
python3 supabase/tests/smoke_auth_votes.py
python3 supabase/tests/smoke_payments.py

# aplicação
npm run dev -- --port 3000
npm run build && npx tsc --noEmit && npm run lint
```

## 6. Nota sobre dados de teste na base

Existem registos de QA identificados como tal (conta `qa.teste@gmail.com`,
concorrentes «Interno — teste» **não publicados**, campanha «QA Campanha»
encerrada, ordens `QA-*`). Não aparecem em nenhuma página pública. Antes do
lançamento, apagar `auth.users` de QA (o respetivo `users` cai em cascata) — ou
recriar o projecto com `migrate.py`, que parte de uma base limpa.

`votos` e `audit_logs` são imutáveis por desenho: não há `DELETE`. É a garantia
que interessa em produção e a razão pela qual os testes usam referências novas
em cada execução.
