# O que falta para estar a funcionar

Documento de trabalho: distingue **bloqueadores** (sem isto o site não passa de
demonstração) de **trabalho de código ainda em falta** e de **dependências
externas**. Estimativas são de engenharia, não compromissos de calendário.

---

## A. Bloqueadores — sem isto não há produção

| # | Item | O que é preciso | Tempo estimado |
| --- | --- | --- | --- |
| A1 | ~~Projecto Supabase~~ | **feito** — ver `BASE-DE-DADOS.md` (falta apenas a chave secreta, S1) | ✅ |
| A2 | ~~Aplicar migrações~~ | **feito** — 0001…0011 aplicadas no PostgreSQL 17.11 do projecto | ✅ |
| A3 | Variáveis de ambiente | `.env.local` local e Environment Variables na Vercel (`.env.example` lista todas) | 15 min |
| A4 | Deploy | Repositório GitHub + projecto Vercel + domínio + HTTPS | 45 min |
| A5 | Dados oficiais dos 20 concorrentes | Nomes, fotografias autorizadas, biografias, cidades, talentos | depende da produção |
| A6 | Pacotes de votos e campanha | Preços aprovados, quantidade de votos, datas, limites | depende da produção |
| A7 | Textos legais revistos | Regulamento, termos, privacidade, cookies (versão jurídica) | depende da produção |
| A8 | Notícias/comunicados iniciais | Conteúdo oficial da estreia | depende da produção |
| A9 | ~~Storage~~ | **feito** — buckets `participants`, `gallery`, `news`, `branding` + políticas | ✅ |

**Com A1–A4 + A9 o site fica online e funcional** para registo, login, votação
gratuita e classificação, mesmo antes de os dados finais estarem prontos.

---

> Actualização de 12/11/2026: a base de dados, as migrações, o storage e o caminho
> crítico de votação/pagamento já estão configurados e testados contra o projecto
> real. Ver `BASE-DE-DADOS.md`. O que resta está listado abaixo.

## B. Código ainda em falta (para "tudo a funcionar", não só online)

| # | Item | Estado actual | O que falta |
| --- | --- | --- | --- |
| B1 | **Painel administrativo — escrita** | Páginas de leitura completas; botões "Novo concorrente", "Editar", "Publicar", "Enviar notificação" **sem acção ligada** | Server Actions de CRUD (concorrentes, notícias, galeria, patrocinadores, pacotes, campanhas) + upload para Storage + auditoria. **~2–3 dias** |
| B2 | Envio de email | ✅ integrado com **Notifica** (`POST /email/send`, remetente oficial, texto simples, sem SDK) | Falta só **saldo** na conta Notifica — a API devolve `400 Quota de emails insuficiente` |
| B3 | Gateway de pagamento | Webhook, idempotência e funções SQL testados; **nenhum fornecedor integrado** | Contrato + credenciais + chamada de criação de cobrança + sandbox. **~2–4 dias por fornecedor** |
| B4 | Redis gerido | Rate limiting em memória (funciona numa só instância) | Ligar Upstash e trocar `rateLimit`. **~2 h** |
| B5 | Refresh da classificação | `fn_refresh_vote_totals()` testada; agendamento por criar | `pg_cron` ou cron Vercel a chamar `fn_refresh_vote_totals()`. **~1 h** |
| B6 | Reconciliação de pagamentos | Funções e regras documentadas | Job diário de reconciliação + expiração de ordens pendentes. **~1 dia** |
| B7 | Push, SMS, WhatsApp | Tabelas e preferências prontas; envio não implementado | Fornecedor por canal (push exige VAPID + service worker). **~1 dia cada** |
| B8 | Cron de notificações | Rota implementada e protegida | Agendar na Vercel + testar com `CRON_SECRET`. **~30 min** |
| B9 | Download de recibos (PDF) | Botão "Recibo" presente, sem geração | Geração de PDF + endpoint autenticado. **~1 dia** |
| B10 | Exportação CSV real | Botões de relatórios sem endpoint | Endpoints de exportação com auditoria. **~1 dia** |
| B11 | Testes automatizados | Sem suíte no repositório | Testes de integração SQL + e2e Playwright dos fluxos de voto/pagamento. **~2 dias** |
| B12 | Observabilidade | Pontos de integração marcados | Sentry + alertas para `severity=critico` e pagamentos pendentes. **~4 h** |

---

## C. Dependências externas (não são código)

- Contratos com fornecedores de pagamento e credenciais de produção.
- Autorização de uso de imagem dos concorrentes e de marcas dos patrocinadores.
- Revisão jurídica do regulamento e das políticas.
- Credenciais de email transaccional (domínio verificado com SPF/DKIM).
- 2FA nas contas GitHub, Vercel, Supabase e fornecedores.

---

## D. Sequência recomendada

1. **Semana 1** — A1→A4 + A9 + B4 + B5 + B8: site online, votação gratuita real,
   classificação a actualizar, notificações in-app a funcionar.
2. **Semana 2** — B1 + A5→A8: painel administrativo operacional e conteúdo oficial.
3. **Semana 3** — B2 + B3 + B6 + B12: email, primeiro gateway homologado, reconciliação.
4. **Semana 4** — B7 + B9→B11 + carga (10k/50k/100k) antes da estreia.

---

## E. O que já funciona hoje (modo demonstração)

- Navegação completa, responsiva, com dados claramente marcados como demonstração.
- Registo/login validados no servidor (recusam persistir sem base de dados).
- Voto gratuito validado (limites, campanha, rate limit) — sem gravar.
- Compra de votos recusada com mensagem explícita (não simula sucesso).
- Centro de notificações navegável; painel administrativo explorável em leitura.
- Build de produção, TypeScript e ESLint sem erros.
