# Guia do painel administrativo

O painel **não tem ligação em nenhum menu público**. O acesso é feito pelo endereço directo
`/admin` e exige uma conta com papel administrativo e estado `activa`.

## Papéis e permissões

| Papel | Pode |
| --- | --- |
| `superadministrador` | Tudo, incluindo configurações e auditoria |
| `administrador` | Concorrentes, votações, conteúdos, notificações, consulta de utilizadores e finanças |
| `gestor_conteudos` | Notícias, galeria e páginas |
| `operador_financeiro` | Consulta financeira, reconciliação e reembolsos |
| `utilizador` | Apenas a sua própria conta — **sem acesso ao painel** |

As permissões são verificadas no servidor em cada pedido e em cada operação
(`requireAdmin()` + `can()`), nunca apenas na interface. Contas suspensas perdem o acesso
imediatamente.

## Como criar o primeiro administrador

1. Criar a conta pela página `/registo` (ou pelo painel de autenticação da Supabase).
2. Confirmar o email.
3. Promover a conta, **a partir do servidor** (nunca pelo browser):

```sql
update public.users set role = 'administrador' where email = 'pessoa@dominio.mz';
```

Registar a operação:

```sql
insert into public.audit_logs(action, actor_email, entity, metadata, severity)
values ('admin.role.granted', 'sistema', 'users',
        jsonb_build_object('email','pessoa@dominio.mz','role','administrador'), 'critico');
```

## Fluxo diário

### Concorrentes
`/admin/concorrentes` → **Novo concorrente** → preencher número (1–20), nome, país, idade,
profissão, frase de apresentação, biografia aprovada e endereço da fotografia oficial
(hospedada em object storage; ficheiros pesados nunca entram na base de dados).
Marcar **Publicar no site** só depois de o perfil estar aprovado pelo concorrente.

### Notícias
`/admin/conteudos` → **Nova publicação** → título, categoria, resumo, corpo e imagem de capa.
Estado **Rascunho** guarda sem publicar; **Publicado** exige resumo (≥20 caracteres) e corpo
(≥50 caracteres). O endereço (`slug`) é gerado a partir do título e tem de ser único.
Publicar aparece imediatamente em `/noticias`.

### Vídeos e fotografias
`/admin/galeria` → **Novo item** → tipo, título, endereço do ficheiro, miniatura (vídeo) e evento.
Desmarcar «Visível na galeria pública» retira o item sem o apagar.

### Notificações
`/admin/notificacoes` → preencher título e mensagem → escolher categoria e audiência.
- Canais: **só aparecem disponíveis os que têm fornecedor configurado** (email exige
  `NOTIFICA_API_TOKEN`; push exige `VAPID_*`; SMS e WhatsApp exigem as respectivas variáveis).
- Para envio imediato a todos os utilizadores é obrigatório marcar a confirmação.
- Com data de agendamento, o envio fica pendente até o worker (`/api/cron/notifications`) o
  processar.

## Regras que o painel aplica

- Nenhuma operação administrativa altera totais de votos ou valores financeiros directamente.
- Remover um concorrente com votos registados **despublica** em vez de apagar (integridade histórica).
- Toda a operação fica em `audit_logs` com autor, data, entidade e valores anteriores.
- Uma falha de email nunca bloqueia o registo de um voto ou de um pagamento.
