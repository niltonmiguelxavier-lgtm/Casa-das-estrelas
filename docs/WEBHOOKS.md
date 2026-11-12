# Contrato de webhooks de pagamento

Endpoint:

```
POST /api/webhooks/payments/{provider}
provider ∈ mpesa | emola | mkesh | card
```

## 1. Autenticação

Cabeçalho obrigatório:

```
x-signature: sha256=<hex(hmac_sha256(secret, raw_body))>
```

O prefixo `sha256=` é opcional (`x-webhook-signature` também é aceite).
O segredo é específico de cada fornecedor:

| provider | variável |
| --- | --- |
| mpesa | `PAYMENT_MPESA_WEBHOOK_SECRET` |
| emola | `PAYMENT_EMOLA_WEBHOOK_SECRET` |
| mkesh | `PAYMENT_MKESH_WEBHOOK_SECRET` |
| card | `PAYMENT_CARD_WEBHOOK_SECRET` |

Sem segredo configurado, o endpoint responde `503` e regista
`payment.webhook.rejected` (severidade `critico`). **Nunca** existe modo aberto.

A assinatura é verificada sobre o **corpo bruto**, antes de qualquer
interpretação — a comparação é feita em tempo constante (`timingSafeEqual`).

## 2. Corpo

```json
{
  "event_id": "evt_9f2c…",
  "reference": "CDE-2026-8F3K2A",
  "status": "confirmed",
  "amount": 130.00,
  "currency": "MZN",
  "provider_transaction_id": "TX-88213",
  "paid_at": "2026-11-11T18:22:41Z"
}
```

- `status`: `confirmed` | `failed` | `expired` | `refunded`.
- `amount` e `currency` são **verificados** contra a ordem na base de dados.
  Divergência → `422 AMOUNT_MISMATCH` / `CURRENCY_MISMATCH`, evento registado.
- `event_id` é a chave de idempotência. Reenvios do mesmo `event_id` respondem
  `200 { "duplicate": true }` sem efeitos colaterais.

## 3. Respostas

| Código | Significado | Acção do fornecedor |
| --- | --- | --- |
| 200 | Processado (ou duplicado) | nenhuma |
| 400 | Corpo inválido | não reenviar |
| 401 | Assinatura inválida | verificar segredo; não reenviar |
| 404 | Provider desconhecido | não reenviar |
| 409 | Erro transitório / ordem noutro estado | reenviar com backoff |
| 422 | Divergência de valor/moeda | não reenviar; alerta financeiro |
| 503 | Segredo/BD indisponíveis | reenviar |

## 4. Efeitos (função `fn_confirm_payment`)

1. Lock da ordem por `reference`.
2. Verificação de `amount` e `currency`.
3. Se já estiver `confirmado` → devolve `already_confirmed` (sem duplicar).
4. Inserção em `payments` (`UNIQUE(provider, provider_transaction_id)`).
5. Actualização de `payment_orders.status` + `paid_at`.
6. Evento `payment.confirmed:<reference>` em `notification_queue` (idempotente).
7. Registo em `audit_logs`.

O crédito de votos usa `fn_cast_paid_vote`, que exige ordem `confirmado` e marca
`votes_consumed = true`; uma segunda tentativa devolve `ORDER_ALREADY_CONSUMED`.

## 5. Reconciliação

- Consulta diária de ordens `pendente` com mais de 30 minutos → expiração.
- Comparação entre `payments` confirmados e extracto do fornecedor.
- Divergências abrem `refunds`/`transactions` do tipo `ajuste` com auditoria.
- Nunca se altera um valor existente: corrige-se com um novo registo.

## 6. Teste local

```bash
BODY='{"event_id":"evt_1","reference":"CDE-2026-TEST01","status":"confirmed","amount":130.00,"currency":"MZN","provider_transaction_id":"TX-1"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$PAYMENT_MPESA_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST http://localhost:3000/api/webhooks/payments/mpesa \
  -H "content-type: application/json" -H "x-signature: sha256=$SIG" --data "$BODY"
```
