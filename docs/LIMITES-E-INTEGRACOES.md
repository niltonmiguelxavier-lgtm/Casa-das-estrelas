# Limites actuais e integrações pendentes

Este documento é deliberadamente explícito: distingue o que está **construído**
do que depende de terceiros. Nada é apresentado na interface como activo antes
de estar realmente configurado.

## 1. Dados oficiais (fornecidos pela produção)

| Item | Estado | Nota |
| --- | --- | --- |
| Nomes, fotografias e biografias dos 20 concorrentes | **pendente de dados** | Existe apenas a grelha de placeholders. A administração introduz os dados reais; o sistema não inventa perfis. |
| Datas de estreia, horários, canais de emissão, júri | **pendente de dados** | Publicados via comunicados na área de notícias. |
| Valores dos prémios | **pendente de dados** | Página `Prémios` descreve categorias sem inventar valores. |
| Patrocinadores | **pendente de dados** | Estrutura pronta (`sponsors`); nomes reais a introduzir. |
| Regulamento assinado (PDF) | **pendente de documento** | Versão HTML publicada e identificada como versão de referência. |

## 2. Serviços que exigem credenciais/contrato

| Integração | Variáveis | Estado |
| --- | --- | --- |
| Supabase (PostgreSQL, Auth, Storage) | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | **código pronto**, projecto a criar/ligar |
| Redis gerido (cache/rate limit) | `UPSTASH_REDIS_REST_*` | interface pronta (in-memory por omissão) |
| M-Pesa | `PAYMENT_MPESA_*` | **não integrado** — falta contrato + credenciais + documentação do fornecedor |
| e-Mola | `PAYMENT_EMOLA_*` | **não integrado** |
| mKesh | `PAYMENT_MKESH_*` | **não integrado** (e pode não existir oferta de e-commerce) |
| Visa / Mastercard | `PAYMENT_CARD_PROVIDER_KEY` | **não integrado** — requer PSP autorizado |
| Email transaccional | `NOTIFICA_API_TOKEN` | ✅ implementado (`POST /email/send`); requer saldo na conta Notifica |
| Push web | `VAPID_*` | tabela `push_subscriptions` pronta; envio não activado |
| SMS | `SMS_PROVIDER_KEY` | **não integrado** |
| WhatsApp Business | `WHATSAPP_PROVIDER_KEY` | **não integrado** (apenas com API oficial aprovada) |
| Google OAuth | configuração no Supabase Auth | botão presente; devolve aviso até estar configurado |
| Observabilidade | `SENTRY_DSN` | pontos de integração marcados |

Em nenhum destes casos existe simulação de sucesso: sem credenciais, a operação
é recusada com mensagem explícita ao utilizador.

## 3. Decisões técnicas a notar

- **Rate limiting em memória** por omissão. Em produção multi-instância, trocar
  por Upstash (a chamada `rateLimit` mantém-se).
- **Fila em PostgreSQL** (`notification_queue`) com worker via cron. Suficiente e
  auditável; pode migrar para um sistema de filas gerido se o volume o exigir.
- **Vista materializada** para classificação; requer job de refresh
  (`fn_refresh_vote_totals`) agendado (pg_cron ou cron externo).
- **Realtime** apenas no canal do próprio utilizador (`notification_recipients`
  filtrado por `user_id`).
- **Modo demonstração**: sem Supabase, `DEMO_ROLE` permite explorar o painel
  administrativo. Em produção, remover a variável e garantir que `getCurrentUser`
  devolve `null` para visitantes.
