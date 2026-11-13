# Relatório de auditoria, redesign e reparação

**Projecto:** Casa das Estrelas — website oficial
**Data:** 13 de Novembro de 2026
**Âmbito:** auditoria integral, correcção de segurança, reparação funcional, redesign da página inicial e do sistema visual, verificação mobile.
**Princípio aplicado:** nada foi reconstruído de raiz. Foram preservadas a base de dados, as migrações, as integrações e a arquitectura existentes.

---

## 1. Tabela de estado por área

| Área | Estado | Problemas encontrados | Correcções realizadas |
| --- | --- | --- | --- |
| **Página inicial** | CORRIGIDO | Demasiados elementos decorativos (gradientes radiais, brilhos, ruído, feixes de luz, marquee de patrocinadores, cartões dentro de cartões, ícones a cada duas linhas). Estrutura de secções diferente da definida pela produção. Contagem decrescente inventada quando não havia campanha (`Data.now() + 5 dias`). Estatísticas fixas («20», «2 países», «10 galas») vendidas como dados reais. | Reescrita como composição editorial em sete blocos: apresentação → concorrentes → votação → notícias → vídeos → patrocinadores → rodapé. Contagem decrescente só aparece com campanha real. Estatísticas calculadas a partir da base de dados. Removidos gradientes, brilhos, ruído, parallax e o marquee. |
| **Design mobile** | CORRIGIDO | O hero abria com uma fotografia de palco a ocupar o ecrã todo; a mensagem e os botões ficavam abaixo da dobra. `-mt-16` no hero encostava o conteúdo ao cabeçalho. Sem barra de navegação inferior. Alvos de toque abaixo de 44 px. | Hero reordenado no telemóvel (texto → acções → imagem). Nova barra de navegação inferior fixa (Início · Casa · Votar · Notícias · Conta) com 44 px de altura mínima. Classes `.tap`, `.safe-bottom` e `svh` para o notch. |
| **Navegação** | CORRIGIDO | Menu público com «O Programa · Concorrentes · Votar · Classificação · Notícias · Galeria», diferente do definido. Nome do utilizador caía para o email (`full_name` não era lido por estar em `user_profiles`). | Menu alinhado com o pedido: Início · Concorrentes · Notícias · Vídeos · Votação, com navegação secundária (Programa, Classificação, Prémios, Patrocinadores). Corrigida a leitura do nome do perfil. |
| **Login** | CORRIGIDO | **Falha grave:** uma conta suspensa iniciava sessão e entrava no painel do utilizador. Em modo sem base de dados devolvia `ok: true` e uma «sessão de demonstração» com papel de superadministrador. | O servidor consulta `users.status` após autenticar e encerra a sessão de contas suspensas/eliminadas, com mensagem clara. `requireUser` bloqueia qualquer área privada para contas não activas. Removida toda a sessão fictícia. |
| **Registo** | APROVADO | Validação e criação de conta correctas (trigger `fn_handle_new_auth_user` cria `users`, `user_profiles` e preferências). | Sem alterações funcionais. Removidas as respostas de «modo de demonstração»; sem base de dados o registo devolve erro honesto. |
| **Recuperação de palavra-passe** | APROVADO | Fluxo de pedido e de redefinição existentes e ligados ao Supabase Auth; resposta idêntica exista ou não conta. | Sem alterações. |
| **Painel ADM** | CORRIGIDO | Várias páginas eram maquetas: «Novo concorrente», «Importar», «Nova publicação», «Editar» e o formulário de notificações eram `<button>` sem acção nem `form`. A lista de notícias mostrava notificações fictícias. O consentimento para envio a todos os utilizadores não era verificado no servidor. O cabeçalho público e a barra móvel apareciam dentro do painel. | Criados editores funcionais: **Concorrentes** (criar, editar, remover, publicar), **Conteúdos/Notícias** (criar, editar, publicar, remover), **Galeria/Vídeos** (criar, editar, ocultar, remover) e **Notificações** (enviar com confirmação obrigatória, agendar, ver estado e nº de destinatários). Todas as operações com validação no servidor, auditoria e revalidação do site público. Painel isolado em route group próprio, com «Terminar sessão». |
| **Segurança** | CORRIGIDO | **Escalada de privilégios comprovada:** a política `users_update_self` permitia a qualquer utilizador autenticado alterar a própria coluna `role` — executei o ataque e tornei-me `superadministrador`. `user_profiles` e `notification_recipients` tinham o mesmo padrão (UPDATE em todas as colunas). Contas suspensas mantinham poderes. | Migração `0019_security_hardening.sql`: `UPDATE` por coluna (o titular só altera dados de contacto do perfil), `revoke` de escrita em `users`, políticas `WITH CHECK` explícitas, `fn_is_admin`/`fn_is_staff`/`fn_current_role` passam a exigir conta activa e não eliminada (fail-closed). Ataque repetido após a correcção: **bloqueado**. |
| **Concorrentes** | CORRIGIDO | Os botões de criação e edição não faziam nada. Não existia forma de publicar/despublicar um perfil no painel. | Editor completo com validação (número 1–20 único, país restrito, idade, URLs de fotografia), publicação explícita, remoção com protecção de integridade (se houver votos, despublica em vez de apagar) e auditoria com valores anteriores. |
| **Votação** | APROVADO | Lógica de negócio correcta: `fn_cast_free_vote` valida campanha, janela temporal, participação, limite por período com `FOR UPDATE`, insere o voto e enfileira a notificação. Falhas encontradas: ausência de campanha era mascarada com data inventada; texto «5 votos por dia» fixo mesmo com regra diferente. | Removida a data inventada. O limite passou a vir da regra da campanha. Teste real executado (ver §3). |
| **Notícias** | CORRIGIDO | Nenhuma notícia podia ser criada pelo painel (botão inerte). As páginas públicas funcionavam mas ficavam vazias. | Editor com título, categoria, estado, endereço, imagem, resumo e corpo; validação mínima para publicar; `slug` único; publicação imediata no site (verificado). |
| **Vídeos** | CORRIGIDO | A secção multimédia mostrava miniaturas estáticas e a «galeria» não tinha gestão. Com galeria vazia a página apresentava uma grelha de espaços vazios. | Editor de galeria (foto/vídeo) com miniatura, evento, legenda e visibilidade. Página pública separa Vídeos e Fotografias e apresenta estado vazio honesto. |
| **Notificações** | CORRIGIDO | O painel mostrava 5 notificações fictícias fixas no código. Não era possível enviar nada. | Envio real via `fn_enqueue_notification` (cria destinatários por utilizador activo e registos de entrega), agendamento com `scheduled_at`, cancelamento, lista com estado e contagem de destinatários, canais só disponíveis quando há fornecedor configurado. Sino, contagem, marcar como lida e página dedicada verificados. |
| **Backend** | CORRIGIDO | Todas as respostas de contingência eram `{ ok: true, demo: true }` — o utilizador via «sucesso» sem nada ter sido guardado. Adicionado filtro `.is()` ao cliente PostgreSQL directo (necessário para `deleted_at is null`). | Respostas passaram a erro explícito (503/401/422). O worker de notificações passou a devolver o motivo da recusa. |
| **Base de dados** | APROVADO | 18 migrações aplicadas, 41 tabelas, RLS em todas, 21 funções, 106 índices, 4 trabalhos `pg_cron` activos. Imutabilidade de votos/pagamentos a funcionar (bloqueou tentativas de limpeza, como deve ser). | Apenas a migração **não destrutiva** `0019` (segurança). Nenhuma tabela apagada, nenhum dado real eliminado. |
| **Desempenho** | APROVADO | `next build` limpo, 33 rotas, 103 kB de JS partilhado, primeira página a ~1,1 s em produção local. Nenhum `select *` em listagens públicas. | Mantido. Removido trabalho inútil no cliente (`noise`, parallax por scroll, marquee). |

---

## 2. Ficheiros principais modificados

**Segurança e base de dados**
- `supabase/migrations/0019_security_hardening.sql` *(novo)*
- `lib/services/session.ts` — sem sessão fictícia; `requireUser`/`requireAdmin` fail-closed; nome do perfil corrigido
- `app/actions/auth.ts` — bloqueio de contas suspensas no login
- `lib/supabase/service.ts` — filtro `.is()` no cliente PostgreSQL

**Estrutura**
- `app/layout.tsx` — layout raiz mínimo
- `app/(site)/layout.tsx` *(novo)* — cabeçalho, rodapé, barra móvel, notificações
- `app/(admin)/admin/**` — painel isolado
- `app/acesso-negado` → `app/(site)/acesso-negado/page.tsx` *(novo)*

**Design**
- `app/globals.css` — botões sólidos, cartões planos, tipografia editorial (`display-1/2/3`, `.eyebrow`, `.lead`, `.rule-gold`), utilitários mobile
- `components/layout/site-header.tsx`, `components/layout/mobile-tab-bar.tsx` *(novo)*, `components/layout/site-footer.tsx`
- `components/home/home-hero.tsx` *(novo)*, `components/voting/vote-countdown.tsx` *(novo)*
- `components/participants/participant-card.tsx`
- `components/ui/logo.tsx`, `components/auth/auth-shell.tsx`
- `app/(site)/page.tsx` — página inicial reescrita

**Funcionalidade administrativa (nova)**
- `app/actions/admin.ts`, `app/actions/participants.ts`, `app/actions/content.ts`
- `lib/services/admin-data.ts`
- `components/admin/participant-editor.tsx`, `news-editor.tsx`, `gallery-editor.tsx`, `notification-composer.tsx`
- `app/(admin)/admin/{concorrentes,conteudos,galeria,notificacoes}/page.tsx`

**Remoções**
- `lib/demo-data.ts` — eliminado (continha 20 concorrentes inventados, notícias, galeria e pacotes fictícios)
- 8 notificações fictícias em `lib/services/notifications.ts`
- Dados de exemplo em `lib/services/user-data.ts`
- Conteúdo de demonstração em `lib/services/data.ts`

---

## 3. Testes executados (com resultados)

Servidor de produção local (`next start`) ligado à base de dados real. Nenhum voto ou pagamento real foi alterado.

### 3.1 Rotas públicas — 22/22 com HTTP 200
`/` · `/concorrentes` · `/noticias` · `/galeria` · `/votar` · `/votar/pacotes` · `/classificacao` · `/programa` · `/premios` · `/patrocinadores` · `/regulamento` · `/contactos` · `/faq` · `/termos` · `/privacidade` · `/cookies` · `/entrar` · `/registo` · `/recuperar-palavra-passe` · `/acesso-negado` · `/sitemap.xml` · `/robots.txt`

### 3.2 Rotas protegidas sem sessão — 18/18 redireccionadas (307)
11 rotas `/admin/*` → `/entrar?next=…&motivo=acesso-restrito`; 7 rotas `/painel/*` → `/entrar?next=…&motivo=autenticacao-necessaria`.

### 3.3 APIs
| Pedido | Resultado |
| --- | --- |
| `GET /api/notifications` sem sessão | **401** |
| `POST /api/webhooks/payments/mpesa` com assinatura inválida | **401** |
| `GET /api/cron/notifications` sem segredo | `{"ok":false,"reason":"autorizacao_invalida"}` |
| `GET /api/cron/notifications` com segredo | `{"ok":true,"processed":1,"failed":0,"total":1}` |

### 3.4 Votação (ponta a ponta, pela interface)
1. Login com conta de teste → redireccionado para `/painel`.
2. `/votar` lista o concorrente da campanha activa.
3. Diálogo «Votar em …» aberto, limite apresentado a partir da regra (3 por período).
4. Confirmação → **«Voto registado para Concorrente E2E.»**
5. Verificação na base de dados: 1 linha em `votes`, `vote_limits` = 1 voto usado, **dois** registos `vote.free` em `audit_logs` (servidor + função SQL), 1 evento em `notification_queue`.
6. Worker executado → fila `enviado`, notificação `Votacao / «Voto registado»` criada para o destinatário, entrega registada.

### 3.5 Painel administrativo (pela interface)
| Acção | Resultado |
| --- | --- |
| Abrir `/admin` com papel `administrador` | Dashboard carrega |
| Criar concorrente (nº 17, Angola, publicado) | **Guardado**, aparece na lista e no site público |
| Editar concorrente | **«Concorrente actualizado.»** — valor novo verificado na base de dados |
| Remover concorrente | Removido (ou despublicado se tiver votos) |
| Criar notícia e publicar | **Publicada** e visível em `/noticias` (verificado no HTML público) |
| Remover notícia | Arquivada e retirada do site |
| Enviar notificação sem confirmação | **Bloqueado:** «Confirme o envio para todos os utilizadores.» |
| Enviar notificação com confirmação | Criada, distribuída a 4 utilizadores activos, visível no sino com contagem |
| Marcar como lida | Contagem do sino passou de 2 para 0 |

### 3.6 Segurança (ataques executados e repetidos)
| Tentativa (como `authenticated`) | Antes | Depois |
| --- | --- | --- |
| `update users set role='superadministrador'` | **PERMITIDO** | `permission denied for table users` |
| `update users set status='activa'` | Permitido | Bloqueado |
| `update users set email=…` | Permitido | Bloqueado |
| `insert into votes …` (bypass da função) | — | `new row violates row-level security policy` |
| Ler utilizadores / votos de outros / auditoria | — | Apenas as próprias linhas |
| Editar o próprio perfil (legítimo) | — | Continua a funcionar |
| Login com conta suspensa | **Entrava no painel** | Sessão encerrada com mensagem |

### 3.7 Responsividade
Capturas com Chromium em 390×844 (iPhone) e 1440×900 (desktop) de `/`, `/concorrentes`, `/votar`, `/noticias` e `/entrar`. Sem sobreposições, sem conteúdo cortado, sem scroll horizontal. Barra inferior funcional em mobile e ausente em desktop.

### 3.8 Qualidade de código
`npx tsc --noEmit` → limpo · `next lint` → «No ESLint warnings or errors» · `next build` → 33 rotas, sem erros.

---

## 4. Funcionalidades que continuam pendentes

| # | Item | Motivo | Depende de |
| --- | --- | --- | --- |
| 1 | **Conteúdo oficial** — concorrentes, fotografias, notícias, vídeos | Não invento concorrentes nem biografias. O site mostra estados vazios honestos até a produção carregar os dados. | Produção |
| 2 | **Campanha de votação activa** | Só pode ser criada pela produção (datas e regras reais). A página de votação informa que não há campanha aberta. | Produção |
| 3 | **Saldo de email na Notifica** | A chave é válida e a API responde, mas devolve `400 Quota de emails insuficiente`. O canal está configurado e desactivado com honestidade no formulário. | Facturação Notifica |
| 4 | **Pagamentos reais** (M-Pesa, e-Mola, mKesh, cartão) | Sem credenciais de fornecedor autorizado. O fluxo, os webhooks HMAC e a idempotência estão implementados e testados com o fornecedor simulado apenas em ambiente controlado. | Contrato com fornecedor |
| 5 | **Gestão de utilizadores no painel** | Consulta implementada; suspender/reactivar com justificação está preparado na base de dados (`suspended_reason`) mas ainda sem formulário. | Próxima iteração |
| 6 | **Votações/pacotes/campanhas no painel** | Página existente em modo de consulta. Criar e editar campanhas e pacotes ainda não tem formulário. | Próxima iteração |
| 7 | **Upload para Supabase Storage** | A galeria e as fotografias usam endereços (URL); carregamento de ficheiros pela interface ainda não está ligado. | Chave `service_role` + bucket público |
| 8 | **Redes sociais** | Os endereços em `lib/site.ts` estavam vazios/sem confirmação; em vez de mostrar ícones que não levam a lado nenhum, ficam ocultos até serem confirmados. | Produção |
| 9 | **Domínio definitivo** | `site_url` e redirects continuam em localhost/`.vercel.app`. | Produção |

---

## 5. Erros que precisam de intervenção humana

1. **Rodar credenciais** — a palavra-passe da base de dados, o token da Notifica e o token GitHub passaram por conversa. Devem ser substituídos.
2. **Carregar saldo na Notifica** para activar o canal de email.
3. **Definir o domínio final** antes do go-live (afecta cookies de sessão, redirects de autenticação e `sitemap.xml`).
4. **Contas de teste na base de dados** — restam duas (`qa.teste@gmail.com` e uma conta `e2e.*` suspensa) com votos históricos imutáveis associados. Devem ser suspensas/eliminadas pela produção antes da abertura ao público.
5. **Provas de pagamento de QA** — 7 ordens e 6 pagamentos de teste permanecem nas tabelas financeiras por desenho (são imutáveis). Recomenda-se recriar o projecto de produção em vez de as remover.

---

## 6. Estado geral

**Plataforma operacional para receber configuração real.** A navegação pública, a autenticação, a votação gratuita, as notificações e a gestão de concorrentes, notícias e vídeos estão ligadas à base de dados e foram testadas com dados reais criados e removidos pelo próprio teste.

O que falta não é código em falta por descuido: é **conteúdo oficial** e **credenciais de terceiros**. Tudo o que depende de terceiros está implementado e apresenta-se desactivado com uma explicação, em vez de fingir que funciona.

Nenhum dado existente foi apagado. A única alteração estrutural na base de dados foi a migração `0019`, que **restringe** permissões (não altera dados) e pode ser revertida removendo os `grant`/`revoke` introduzidos.
