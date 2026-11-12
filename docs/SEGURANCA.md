# Segurança

## 1. Controlos implementados

| Área | Controlo | Onde |
| --- | --- | --- |
| Transporte | HTTPS + HSTS (`max-age=63072000`, preload) | `middleware.ts` |
| Cabeçalhos | CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | `middleware.ts`, `next.config.ts` |
| Validação | Zod em todas as Server Actions e Route Handlers | `lib/validation.ts` |
| SQL Injection | Queries parametrizadas via PostgREST/Supabase; nenhuma concatenação de SQL com input | `lib/services/*` |
| XSS | React escapa por omissão; CSP restritiva; sem `dangerouslySetInnerHTML` | global |
| CSRF | Server Actions com verificação de origem do Next; APIs críticas exigem sessão + validação | `app/actions/*` |
| Rate limiting | Janela deslizante por IP e por operação (login 8/5min, registo 5/10min, voto 12/min, ordens 6/5min, contacto 5/15min) | `lib/services/rate-limit.ts` |
| Bots | Honeypot no registo e no contacto; limites de frequência; verificação de email | `register-form`, `contact-form` |
| Palavras-passe | Mín. 8 com maiúscula/minúscula/número; hashing gerido pelo Supabase Auth (bcrypt); nunca em texto simples | `lib/validation.ts` |
| Sessões | Cookies `HttpOnly` geridos por Supabase SSR; renovação no middleware; reautenticação para alterar palavra-passe | `middleware.ts`, `api/account/password` |
| Autorização | Matriz de funções + verificação no servidor + RLS | `lib/services/session.ts`, `0009_rls_policies.sql` |
| Webhooks | HMAC-SHA256 do corpo bruto, comparação em tempo constante, segredo por fornecedor, sem segredo → 503 | `api/webhooks/payments/[provider]` |
| Idempotência | `UNIQUE(provider, event_id)`, `votes.payment_order_id UNIQUE`, `event_key` na fila | migrations 0003/0004 |
| Valores | Preço e votos lidos da BD; webhook compara `amount`/`currency` com a ordem | `actions/payments.ts`, `fn_confirm_payment` |
| Auditoria | `audit_logs` append-only (trigger bloqueia UPDATE/DELETE); logins falhados, votos, pagamentos, webhooks rejeitados, acções admin | `lib/services/audit.ts` |
| Segredos | Apenas variáveis de ambiente do servidor; `service role` só em `getSupabaseAdminClient()`; `.env*` ignorados pelo git | `.gitignore`, `.env.example` |
| Dados pessoais | Minimização, RLS por utilizador, mascaramento em listagens administrativas | `lib/utils.ts` (`maskEmail`, `maskPhone`) |
| Enumeração de contas | Recuperação de palavra-passe responde igualmente exista ou não conta | `forgotPasswordAction` |
| Logs | Sem dados sensíveis; `system_logs` com retenção de 30 dias | `0008_admin_audit_logs.sql` |

## 2. Cabeçalhos (CSP)

```
default-src 'self';
img-src 'self' data: blob: https://*.supabase.co;
media-src 'self' https://*.supabase.co;
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'self'; base-uri 'self'; form-action 'self';
```

`unsafe-inline`/`unsafe-eval` em `script-src` são necessários ao runtime de
desenvolvimento do Next. **Recomendação para produção:** adoptar nonces
(`experimental.cspNonce`) e remover `unsafe-eval`; testar com `Content-Security-Policy-Report-Only`
antes de aplicar.

## 3. RLS — princípio

- RLS activo em **todas** as tabelas de aplicação.
- Sem política = sem acesso (excepto service role).
- `votes`, `payment_webhooks`, `notification_queue`, `audit_logs`: sem políticas de
  escrita → só `security definer` ou service role.
- Funções sensíveis com `REVOKE ALL … FROM public` e `GRANT EXECUTE` apenas ao
  papel `authenticated` quando aplicável.

## 4. Ameaças cobertas e respostas

| Ameaça | Mitigação |
| --- | --- |
| Votação em massa por bot | Autenticação obrigatória, email verificado, rate limit por conta e IP, limites por período, anulação auditada |
| Manipulação do total de votos no browser | Nenhuma rota aceita totais; votos são `INSERT` com `quantity` limitada e agregados calculados na BD |
| Fraude em pagamentos | Webhook assinado, comparação de valor, crédito único, reconciliação |
| Replay de webhook | `UNIQUE(provider, event_id)` + estado terminal na ordem |
| Escalada de privilégios | `users.role` não é escrevível pelo utilizador; verificação de permissões no servidor |
| Sequestro de sessão | Cookies HttpOnly/Secure, reautenticação para acções sensíveis, registo de `login_activity` |
| Enumeração de emails | Respostas uniformes na recuperação de conta |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` |

## 5. Procedimentos

- **Backups:** backups automáticos do Supabase + PITR; teste de restauro trimestral.
- **Rotação de segredos:** chaves de pagamento e `SUPABASE_SERVICE_ROLE_KEY`
  rotadas em caso de suspeita; segredos de webhook por fornecedor.
- **Acessos administrativos:** conta nominal por pessoa, 2FA no Supabase e no GitHub.
- **Incidentes:** `audit_logs` + `system_logs` + alertas de `severity='critico'`
  (ex.: `payment.webhook.rejected`) alimentam a monitorização.
- **Pedidos de titulares de dados:** exportação/eliminação através do apoio,
  com registo em auditoria.
