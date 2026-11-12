#!/usr/bin/env python3
"""
Smoke test — autenticação, RLS e votação gratuita
==================================================

Corre contra o projecto Supabase real. Requer:

  SUPABASE_URL=https://<ref>.supabase.co
  SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require

O teste cria uma conta de QA se não existir (inserção directa em auth.users,
porque o envio de email do GoTrue tem limites muito baixos) e verifica, por HTTP:

  1. trigger de criação de perfil;
  2. login por palavra-passe (JWT);
  3. isolamento RLS para anónimos;
  4. voto gratuito e recusa acima do limite;
  5. saldo, histórico próprio e imutabilidade dos votos.

Os registos criados são de teste e ficam identificados como tal («Interno —
teste»), não publicados. Em produção, apagar depois (ver nota no fim).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

import psycopg

BASE = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
DSN = os.environ["DATABASE_URL"]

EMAIL = os.environ.get("SMOKE_EMAIL", "qa.teste@gmail.com")
PASSWORD = os.environ.get("SMOKE_PASSWORD", "TesteForte123")


def api(method: str, path: str, body=None, token: str | None = None):
    data = json.dumps(body, default=str).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("apikey", KEY)
    req.add_header("content-type", "application/json")
    req.add_header("accept", "application/json")
    if token:
        req.add_header("authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()[:200]


def main() -> int:
    with psycopg.connect(DSN) as conn:
        cur = conn.cursor()

        # ---- conta de QA ---------------------------------------------------
        cur.execute("select id from auth.users where lower(email)=lower(%s)", (EMAIL,))
        row = cur.fetchone()
        if row:
            uid = row[0]
        else:
            cur.execute(
                """
                insert into auth.users(instance_id,id,aud,role,email,encrypted_password,
                                       email_confirmed_at,raw_app_meta_data,raw_user_meta_data,
                                       created_at,updated_at,confirmation_token,recovery_token,
                                       email_change_token_new,email_change)
                values ('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated',
                        'authenticated',%s,crypt(%s,gen_salt('bf')),now(),
                        '{"provider":"email","providers":["email"]}',
                        %s,now(),now(),'','','','')
                returning id
                """,
                (
                    EMAIL,
                    PASSWORD,
                    json.dumps(
                        {
                            "full_name": "Conta de Teste QA",
                            "country": "Moçambique",
                            "phone": "+258840000000",
                        }
                    ),
                ),
            )
            uid = cur.fetchone()[0]
            cur.execute(
                """
                insert into auth.identities(id,user_id,provider_id,provider,identity_data,
                                            last_sign_in_at,created_at,updated_at)
                values (gen_random_uuid(),%s,%s,'email',%s,now(),now(),now())
                """,
                (uid, EMAIL, json.dumps({"sub": str(uid), "email": EMAIL, "email_verified": True})),
            )
            conn.commit()

        cur.execute(
            """select u.role, u.status, p.full_name, p.country,
                      (select count(*) from notification_preferences np where np.user_id=u.id)
                 from public.users u join public.user_profiles p on p.user_id = u.id
                where u.id=%s""",
            (uid,),
        )
        print("1) trigger de criação de perfil →", cur.fetchone())

    status, tok = api("POST", "/auth/v1/token?grant_type=password", {"email": EMAIL, "password": PASSWORD})
    token = tok["access_token"] if status == 200 and isinstance(tok, dict) else None
    print("2) login GoTrue →", status, "JWT obtido" if token else tok)

    print("3) anónimo lê participantes →", api("GET", "/rest/v1/participants?select=id,name"))
    print("4) anónimo lê votes →", api("GET", "/rest/v1/votes?select=id"))
    print("5) autenticado lê o próprio perfil →",
          api("GET", "/rest/v1/user_profiles?select=full_name,country", token=token))

    with psycopg.connect(DSN) as conn:
        cur = conn.cursor()
        cur.execute(
            """insert into participants(number,name,country,is_published,tagline,talents)
               values (19,'Interno — teste Angola','Angola',false,'teste','{teste}'),
                      (20,'Interno — teste Moçambique','Moçambique',false,'teste','{teste}')
               on conflict (number) do update set is_published=false
               returning id"""
        )
        pids = [r[0] for r in cur.fetchall()]
        cur.execute(
            """insert into voting_campaigns(name,status,starts_at,ends_at,participant_ids)
               values ('QA Campanha','activa',now()-interval '1 hour',now()+interval '2 days',%s)
               returning id""",
            (pids,),
        )
        cid = cur.fetchone()[0]
        cur.execute(
            """insert into voting_rules(campaign_id,free_votes_per_user,frequency,rules_text)
               values (%s,3,'diaria','{teste}')""",
            (cid,),
        )
        conn.commit()
        print("6) dados de QA criados (não publicados)")

    print("7) voto gratuito via RPC →",
          api("POST", "/rest/v1/rpc/fn_cast_free_vote",
              {"p_user_id": uid, "p_campaign_id": cid, "p_participant_id": pids[1], "p_quantity": 2},
              token=token))
    print("8) acima do limite →",
          api("POST", "/rest/v1/rpc/fn_cast_free_vote",
              {"p_user_id": uid, "p_campaign_id": cid, "p_participant_id": pids[1], "p_quantity": 2},
              token=token))
    print("9) saldo →", api("POST", "/rest/v1/rpc/fn_user_vote_balance", {"p_user_id": uid}, token=token))
    print("10) histórico próprio →", api("GET", "/rest/v1/votes?select=quantity,vote_type", token=token))

    with psycopg.connect(DSN) as conn:
        cur = conn.cursor()
        try:
            cur.execute("update votes set quantity = 999")
            print("11) FALHA: votos são alteráveis")
        except Exception as exc:  # noqa: BLE001
            print("11) imutabilidade →", str(exc).strip().splitlines()[0][:70])

    print("\nLimpeza (opcional, produção):")
    print("  update voting_campaigns set status='encerrada' where name='QA Campanha';")
    print("  update participants set deleted_at=now() where number in (19,20);")
    print("  delete from auth.users where email='%s';" % EMAIL)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
