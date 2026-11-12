#!/usr/bin/env python3
"""
Smoke test — caminho do dinheiro (pagamentos e crédito de votos)
==============================================================

Verifica, no PostgreSQL real e sem qualquer fornecedor de pagamento integrado,
as garantias que têm de existir antes de ligar um gateway:

  1. `fn_confirm_payment` confirma uma ordem e devolve o estado;
  2. um webhook repetido devolve `already_confirmed` (crédito único);
  3. um valor diferente do autoritativo é recusado (`AMOUNT_MISMATCH`);
  4. `fn_cast_paid_vote` credita os votos uma só vez (`ORDER_ALREADY_CONSUMED`);
  5. a ordem fica `confirmado`, `votes_consumed = true`, `paid_at` preenchido;
  6. o ranking é recalculado por `fn_refresh_vote_totals()`;
  7. tudo fica em `audit_logs` e `notification_queue`.

Requer DATABASE_URL (ver smoke_auth_votes.py).
"""

from __future__ import annotations

import os
import sys

import psycopg

DSN = os.environ["DATABASE_URL"]
EMAIL = os.environ.get("SMOKE_EMAIL", "qa.teste@gmail.com")
import time

# Referência única por execução: os votos são imutáveis (não há DELETE), pelo que
# cada execução tem de usar uma ordem nova.
REFERENCE = os.environ.get("SMOKE_REF", f"QA-{int(time.time())}")
AMOUNT = 50
CURRENCY = "MZN"


def step(sql: str, params=()):
    with psycopg.connect(DSN) as conn:
        cur = conn.cursor()
        try:
            cur.execute(sql, params)
            result = cur.fetchone()
            conn.commit()
            return result
        except Exception as exc:  # noqa: BLE001
            conn.rollback()
            return "ERRO: " + str(exc).strip().splitlines()[0][:100]


def main() -> int:
    with psycopg.connect(DSN) as conn:
        cur = conn.cursor()
        cur.execute("select id from auth.users where email=%s", (EMAIL,))
        row = cur.fetchone()
        if not row:
            sys.exit(f"Conta de QA inexistente ({EMAIL}). Corra primeiro smoke_auth_votes.py.")
        uid = row[0]

        cur.execute("select id from participants order by number limit 1")
        pid = cur.fetchone()[0]
        cur.execute("select id from voting_campaigns order by created_at desc limit 1")
        cid = cur.fetchone()[0]

        cur.execute("select id, name, votes from vote_packages order by price limit 1")
        pkg = cur.fetchone()
        if not pkg:
            cur.execute(
                """insert into vote_packages(name,votes,price,currency,is_active)
                   values ('Pacote de teste',5,%s,%s,false) returning id,name,votes""",
                (AMOUNT, CURRENCY),
            )
            pkg = cur.fetchone()

        cur.execute(
            """insert into payment_orders(reference,user_id,participant_id,package_id,provider,
                                          amount,currency,votes,status)
               values (%s,%s,%s,%s,'mpesa',%s,%s,5,'pendente')
               on conflict (reference) do update
                 set status='pendente', votes_consumed=false, paid_at=null
               returning id""",
            (REFERENCE, uid, pid, pkg[0], AMOUNT, CURRENCY),
        )
        oid = cur.fetchone()[0]
        conn.commit()

    tx = f"MPESA-{REFERENCE}"  # id de transacção único por execução
    print("1) webhook confirma →",
          step("select fn_confirm_payment(%s,'mpesa','confirmed',%s,%s,%s)",
               (REFERENCE, AMOUNT, CURRENCY, tx)))
    print("2) webhook repetido →",
          step("select fn_confirm_payment(%s,'mpesa','confirmed',%s,%s,%s)",
               (REFERENCE, AMOUNT, CURRENCY, tx)))
    print("3) valor adulterado →",
          step("select fn_confirm_payment(%s,'mpesa','confirmed',1,%s,%s)",
               (REFERENCE, CURRENCY, tx + "-X")))
    print("4) crédito de votos →", step("select fn_cast_paid_vote(%s,%s,%s,%s,5)", (uid, cid, pid, oid)))
    print("5) crédito repetido →", step("select fn_cast_paid_vote(%s,%s,%s,%s,5)", (uid, cid, pid, oid)))
    print("5b) quantidade diferente da ordem →",
          step("select fn_cast_paid_vote(%s,%s,%s,%s,1)", (uid, cid, pid, oid)))
    print("6) estado da ordem →",
          step("select status, votes_consumed, paid_at is not null from payment_orders where id=%s", (oid,)))
    print("7) pagamentos da ordem →", step("select count(*) from payments where order_id=%s", (oid,)))
    step("select fn_refresh_vote_totals()")
    # Os participantes de QA não são publicados, por isso a view pública
    # `ranking_current` fica vazia de propósito; verificamos os totais agregados.
    print("8) totais agregados →",
          step("select participant_id, total_votes, free_votes, paid_votes "
               "from participant_vote_totals order by total_votes desc limit 3"))
    print("9) auditoria →",
          step("select string_agg(action, ', ') from (select action from audit_logs "
               "order by created_at desc limit 8) t"))
    print("10) fila →", step("select string_agg(event_key, ' | ') from notification_queue"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
