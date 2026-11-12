# Arquitectura

## 1. Princípios

1. **Um programa, uma plataforma.** Nenhuma abstracção multi-tenant, white-label
   ou "criador de programas". Tudo serve a Casa das Estrelas.
2. **O servidor é a autoridade.** Votos, limites, preços, estados de pagamento e
   permissões são decididos no servidor. O browser só envia intenções.
3. **Dados imutáveis onde importa.** Votos, pagamentos, transacções e auditoria
   não podem ser alterados (triggers `fn_block_mutation`).
4. **Degradação honesta.** Sem Supabase, a aplicação entra em modo demonstração e
   diz isso ao utilizador; nunca finge que gravou dados.

## 2. Camadas

```
UI (Server Components + Client Components)
        │  Server Actions / Route Handlers
        ▼
lib/services/*  (domínio: data, session/permissões, notifications,
                 rate-limit, audit)
        │
        ▼
PostgreSQL (Supabase) — RLS + funções transaccionais + vistas materializadas
Fila (notification_queue) → worker cron → canais (in-app, email, push, SMS, WhatsApp)
Redis (rate limiting distribuído / cache)
```

- `lib/services/data.ts` — leitura pública (participantes, notícias, ranking,
  pacotes, campanhas, patrocínios, estatísticas).
- `lib/services/user-data.ts` — dados do próprio utilizador (votos, pagamentos,
  saldo, actividade) sempre limitados por RLS.
- `lib/services/session.ts` — sessão, matriz de permissões, guardas.
- `lib/services/notifications.ts` + `notification_queue` — centro de notificações.
- `lib/services/rate-limit.ts` — interface estável; em produção troca para
  Upstash Redis sem alterar chamadas.
- `lib/services/audit.ts` — registo append-only de operações sensíveis.

## 3. Modelo de dados (resumo)

| Grupo | Tabelas |
| --- | --- |
| Utilizadores | `users`, `user_profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_devices`, `login_activity`, `notification_preferences` |
| Concorrentes | `participants`, `participant_media` |
| Votação | `voting_campaigns`, `voting_rules`, `vote_limits`, `votes`, `vote_packages`, `ranking_snapshots`, `participant_vote_totals` (matview), `ranking_current` (view) |
| Pagamentos | `payment_orders`, `payments`, `payment_webhooks`, `transactions`, `refunds`, `payment_providers` |
| Notificações | `notifications`, `notification_recipients`, `notification_targets`, `notification_preferences`, `notification_templates`, `notification_delivery_logs`, `notification_queue`, `push_subscriptions` |
| Conteúdos | `news`, `news_categories`, `gallery`, `sponsors`, `pages` |
| Administração | `admin_settings`, `audit_logs`, `system_events`, `system_logs` |

Convenções: UUID (`gen_random_uuid()`), `created_at`/`updated_at` (trigger
`fn_touch_updated_at`), soft delete com `deleted_at` apenas onde faz sentido,
índices em colunas de filtro/ordenação e índices GIN `pg_trgm` para pesquisa.

### Integridade relevante

- `votes.payment_order_id UNIQUE` → nenhum crédito duplicado de votos pagos.
- `payment_webhooks UNIQUE (provider, event_id)` → idempotência de webhooks.
- `uq_orders_pending (user, package, participant) WHERE status='pendente'` →
  evita ordens pendentes duplicadas.
- `campaign_dates_valid` (`ends_at > starts_at`), `check` em quantidades e preços.
- `participants.number` único (1..20).

## 4. Classificação sem consultas pesadas

Somar milhões de linhas a cada carregamento é inaceitável. Estratégia:

1. `participant_vote_totals` — vista **materializada** com `SUM` por concorrente
   (gratuitos/pagos/total).
2. `ranking_current` — vista com `row_number()` sobre os agregados e variação
   face ao último snapshot oficial.
3. Actualização: `fn_refresh_vote_totals()` (CONCURRENTLY) chamada por job
   agendado (30–60 s) e após eventos relevantes. As páginas usam
   `revalidate = 30` para o ranking e `60` para conteúdos.
4. `ranking_snapshots` guarda a fotografia oficial por gala — usada para a
   variação de posição e para auditoria de resultados.

## 5. Escalabilidade

Objectivos de engenharia (metas a validar por testes de carga, não garantias):
1 M+ contas, milhões de votos, picos de tráfego em galas, ensaios a 10k/50k/100k
utilizadores simultâneos.

Implementado / preparado:

- **Paginação e limites** em todas as listagens; agregações pré-calculadas.
- **Cache**: `revalidate` por rota, `Cache-Control` para media imutável, CDN da
  Vercel; Redis para cache de leitura quente e rate limiting distribuído.
- **Processamento assíncrono**: votos e pagamentos registam o facto e enfileiram
  notificações — notificações lentas nunca bloqueiam a operação crítica.
- **Separação de caminhos críticos**: voto é uma função SQL curta com lock
  pontual; leitura de ranking usa matview.
- **Índices** orientados às consultas reais (participante, campanha, utilizador,
  estado, data).
- **Compressão e imagens**: `compress: true`, formatos AVIF/WebP, `deviceSizes`,
  carregamento lazy; media servida por storage/CDN (nunca pela base de dados).
- **Protecção contra sobrecarga**: rate limiting por IP e por conta; limites de
  votos por pedido.
- **Monitorização**: `system_logs`, `audit_logs`, alertas de pagamentos pendentes
  no dashboard; preparado para Sentry (`SENTRY_DSN`).

### Pontos de atenção em picos

- `fn_cast_free_vote` faz lock por `(user, campaign, period)` — contenção mínima
  e distribuição natural entre utilizadores.
- O refresh da matview deve ser concorrente e agendado fora dos picos.
- Realtime do Supabase deve subscrever apenas `notification_recipients` do próprio
  utilizador (filtro por `user_id`), não tabelas globais.

## 6. Acessibilidade e desempenho no cliente

- Navegação por teclado, `skip link`, `aria-expanded`, `role="switch"`,
  `aria-label` em ícones interactivos.
- `prefers-reduced-motion` desactiva animações.
- Contadores e datas são renderizados no cliente (sem divergência de hidratação).
- `Reveal` tem rede de segurança: o conteúdo nunca fica invisível.
