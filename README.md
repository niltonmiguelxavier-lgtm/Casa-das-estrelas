# Casa das Estrelas — Website oficial

Plataforma web oficial do reality show **Casa das Estrelas** (Moçambique · Angola).
Projecto dedicado a um único programa — não é um SaaS, não é multi-tenant, não tem
white-label nem contas empresariais.

---

## 1. Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Server Actions + Route Handlers, serviços por responsabilidade |
| Base de dados | PostgreSQL (Supabase) — migrações versionadas + RLS |
| Autenticação | Supabase Auth (email/palavra-passe, OAuth Google opcional) |
| Ficheiros | Supabase Storage (object storage) + CDN |
| Cache / filas | Redis gerido (Upstash) + tabela `notification_queue` + cron |
| Alojamento | Vercel (frontend + funções) |
| Versionamento | GitHub |

> **Repositório:** <https://github.com/niltonmiguelxavier-lgtm/Casa-das-estrelas>
>
> **Estado actual: base de dados real ligada.** O projecto Supabase está
> configurado, as migrações `0001…0018` estão aplicadas e o fluxo
> registo → votação → pagamento → notificação foi testado contra o sistema real.
> Ver [`docs/CONFIGURACAO-ATUAL.md`](./docs/CONFIGURACAO-ATUAL.md) e
> [`docs/BASE-DE-DADOS.md`](./docs/BASE-DE-DADOS.md).
>
> O modo de demonstração só existe quando **não** há variáveis do Supabase
> configuradas: nesse caso a interface é navegável com dados claramente marcados
> como demonstração e nenhuma escrita é persistida.

### Pré-visualização da interface

| | |
| --- | --- |
| ![Início](docs/preview/01-inicio.png) | ![Concorrentes](docs/preview/02-concorrentes.png) |
| ![Programa](docs/preview/03-programa.png) | ![Votar](docs/preview/08-compra-votos.png) |
| ![Classificação](docs/preview/04-classificacao.png) | ![Notícias](docs/preview/10-noticias.png) |


<img src="docs/preview/07-mobile.png" alt="Vista móvel" width="240" />

---

## 2. Arranque rápido

```bash
npm install
cp .env.example .env.local     # preencher (ver secção 4)
npm run dev                    # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

Base de dados (Supabase CLI):

```bash
supabase link --project-ref <ref>
supabase db push                       # aplica supabase/migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # apenas em desenvolvimento
```

---

## 3. Estrutura do repositório

```
app/
  page.tsx                      Início (hero, concorrentes, ranking, notícias, galeria)
  programa/ regulamento/ premios/ patrocinadores/ contactos/ faq/
  termos/ privacidade/ cookies/  páginas institucionais
  concorrentes/                 grelha dos 20 concorrentes (+ [id] perfil)
  votar/                        votação gratuita (+ pacotes/ compra de votos)
  classificacao/                ranking oficial
  noticias/  galeria/           conteúdos
  registo/ entrar/ recuperar-palavra-passe/  autenticação
  painel/                       painel do utilizador (votos, pagamentos,
                                notificações, conta, segurança, preferências)
  admin/                        painel administrativo com permissões
  actions/                      Server Actions (auth, voting, payments)
  api/                          webhooks, notificações, conta, cron, contactos
components/                     UI, layout, votação, notificações, admin, dashboard
lib/
  services/                     camada de domínio (data, session, notifications,
                                rate-limit, audit)
  supabase/                     clientes browser / server / admin
  validation.ts                 esquemas Zod usados no servidor
  demo-data.ts                  conjunto de demonstração (único ponto de dados fictícios)
  site.ts                       configuração pública do programa
supabase/
  migrations/                   0001…0018 (extensões → RLS → ranking)
  seed.sql                      placeholders + pacotes (apenas desenvolvimento)
docs/                           arquitectura, segurança, webhooks, go-live
```

---

## 3.1 Estrutura de layouts

```
app/layout.tsx            raiz mínima (fontes, metadados, <html>)
app/(site)/layout.tsx     site público: cabeçalho, rodapé, barra móvel, notificações
app/(admin)/admin/…       painel administrativo isolado (sem cabeçalho público)
app/(site)/page.tsx       página inicial
```

O painel não partilha cabeçalho, rodapé nem navegação com o site público e não tem
qualquer ligação visível para o visitante.

## 4. Variáveis de ambiente

O email transaccional sai pela **Notifica** (`POST /email/send`, remetente oficial,
texto simples, `transactional` para conta/pagamento). O canal só é considerado activo
quando `NOTIFICA_API_TOKEN` existe; caso contrário as entregas ficam registadas como
`ignorado`, com o motivo — nunca há entrega simulada.

Ver [`.env.example`](./.env.example). Resumo:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — públicas, cliente.
- `SUPABASE_SERVICE_ROLE_KEY` — **apenas servidor**, ignorar RLS em operações auditadas.
- `UPSTASH_REDIS_REST_URL/TOKEN` — cache e rate limiting distribuído.
- `PAYMENT_*` — credenciais e segredos de webhook por fornecedor (M-Pesa, e-Mola, mKesh, cartão).
- `NOTIFICA_API_TOKEN`, `NOTIFICA_EMAIL_FROM` — email transaccional via Notifica.
- `VAPID_*`, `NOTIFICA_SMS_SENDER_ID`, `NOTIFICA_WHATSAPP_FROM` — restantes canais (só activos quando configurados).
- `CRON_SECRET` — protecção do worker de notificações.

Nunca versionar `.env.local`. Nenhum segredo é referenciado em código cliente.

---

## 5. Fluxos críticos

### 5.1 Voto gratuito

1. Utilizador escolhe concorrente → `VoteDialog`.
2. Sem sessão: a intenção é guardada (`localStorage: cde_vote_intent`) e é
   redireccionado para `/entrar?next=…`. Após login, `VoteIntentRestorer`
   reabre o diálogo com o mesmo concorrente.
3. Com sessão: `castFreeVoteAction` valida com Zod, aplica rate limiting,
   confirma campanha activa e janela temporal, e chama a função SQL
   `fn_cast_free_vote` (transacção atómica com `SELECT … FOR UPDATE` no limite
   do período).
4. O voto é registado em `votes` (append-only) e um evento é enfileirado em
   `notification_queue`.

### 5.2 Compra de votos

1. Pacote e preço são lidos da **base de dados** (nunca do formulário).
2. `createOrderAction` cria `payment_orders` com estado `pendente` e referência
   única. Sem fornecedor configurado, a ordem **não** é criada.

### 5.3 Confirmação de pagamento (única via de crédito)

`POST /api/webhooks/payments/[provider]`:

1. Verifica assinatura HMAC-SHA256 do **corpo bruto** (comparação em tempo constante).
2. Regista o evento em `payment_webhooks` — `UNIQUE (provider, event_id)` dá idempotência.
3. Chama `fn_confirm_payment`, que compara valor/moeda com a ordem, actualiza o
   estado e enfileira a notificação.
4. O crédito de votos (`fn_cast_paid_vote`) só ocorre para ordens `confirmado` e
   nunca duas vezes (`votes_payment_order_id UNIQUE`).

O regresso do utilizador a uma página de sucesso **nunca** credita votos.

### 5.4 Notificações

Eventos (voto, pagamento, notícia) → `notification_queue` → worker
`GET /api/cron/notifications` (protegido por `CRON_SECRET`) → cria
`notifications` + `notification_recipients` → canais activos. Backoff 1m/5m/15m/1h/6h,
idempotência por `event_key`, registo em `notification_delivery_logs`.
No cliente, `NotificationProvider` assina Supabase Realtime para actualização
instantânea do contador e da lista.

---

## 6. Funções e permissões

| Função | Âmbito |
| --- | --- |
| `superadministrador` | tudo, incluindo gestão de administradores e configurações |
| `administrador` | operação do programa (concorrentes, conteúdos, votações, notificações) |
| `gestor_conteudos` | notícias, galeria, páginas |
| `operador_financeiro` | pagamentos, reconciliação, reembolsos, relatórios |
| `utilizador` | votar, comprar, histórico, notificações |

A matriz está em `lib/services/session.ts` e é **verificada no servidor**
(middleware + `requireAdmin` + RLS). Esconder um item de menu não é autorização.
Em modo de demonstração, `DEMO_ROLE` (por omissão `superadministrador`) permite
avaliar o painel administrativo.

---

## 7. Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm start` | servidor de produção |
| `npm run lint` | ESLint (Next + TypeScript) |
| `npx tsc --noEmit` | verificação de tipos |

---

## 7.1 Segurança aplicada na base de dados

| Controlo | Onde |
| --- | --- |
| `UPDATE` por coluna — o titular não altera `role`, `status` nem dados de terceiros | migração `0019` |
| Autorização fail-closed: funções exigem conta `activa` e não eliminada | `fn_is_admin`, `fn_is_staff`, `fn_current_role` |
| Votos e pagamentos imutáveis (sem UPDATE/DELETE) | gatilhos `trg_votes_no_update`, `trg_payments_no_update`, `trg_transactions_no_mutation` |
| Crédito único por ordem (idempotência) | `fn_confirm_payment` + `payment_webhooks` |
| Auditoria append-only | `audit_logs` |
| Sem sessão fictícia: sem base de dados não há autenticação | `lib/services/session.ts` |

## 8. Documentação complementar

- [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) — decisões, modelo de dados, escalabilidade.
- [`docs/SEGURANCA.md`](./docs/SEGURANCA.md) — controlos implementados e ameaças cobertas.
- [`docs/WEBHOOKS.md`](./docs/WEBHOOKS.md) — contrato de integração dos pagamentos.
- [`docs/GO-LIVE.md`](./docs/GO-LIVE.md) — checklist antes de publicar.
- [`docs/RELATORIO-AUDITORIA.md`](./docs/RELATORIO-AUDITORIA.md) — auditoria, correcções e testes executados.
- [`docs/GUIA-ADMINISTRACAO.md`](./docs/GUIA-ADMINISTRACAO.md) — como operar o painel, papéis e permissões.
- [`docs/BASE-DE-DADOS.md`](./docs/BASE-DE-DADOS.md) — projecto Supabase, migrações aplicadas,
  testes executados e o que depende do painel.
- [`docs/CONFIGURACAO-ATUAL.md`](./docs/CONFIGURACAO-ATUAL.md) — resumo do estado, decisões tomadas e pendentes.
- [`docs/LIMITES-E-INTEGRACOES.md`](./docs/LIMITES-E-INTEGRACOES.md) — o que ainda
  depende de credenciais, contratos ou dados oficiais.

---

## 9. Estado dos dados

- **Concorrentes:** a grelha de 20 (10 Angola + 10 Moçambique) existe como
  *placeholder*. Nomes, fotografias e biografias reais são introduzidos pela
  administração. O sistema não inventa concorrentes.
- **Conteúdos de demonstração:** `lib/demo-data.ts` é o único ficheiro com dados
  fictícios, todos identificados na interface como demonstração.
- **Pagamentos:** nenhum fornecedor é apresentado como activo sem credenciais e
  homologação; não existem pagamentos simulados em produção.
