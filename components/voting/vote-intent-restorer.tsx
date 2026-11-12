"use client";

import { useEffect, useState } from "react";
import { VoteDialog } from "@/components/voting/vote-dialog";

interface Intent {
  participantId: string;
  campaignId?: string;
  timestamp: number;
  returnTo: string;
}

/**
 * Recupera a intenção de voto guardada antes da autenticação.
 * Montado no layout autenticado; a intenção expira após 30 minutos.
 */
export function VoteIntentRestorer({ authenticated }: { authenticated: boolean }) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [target, setTarget] = useState<{
    id: string;
    name: string;
    number: number;
    country: string;
    photo: string | null;
  } | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("cde_vote_intent");
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Intent;
      const fresh = Date.now() - parsed.timestamp < 30 * 60_000;
      if (!fresh) {
        localStorage.removeItem("cde_vote_intent");
        return;
      }
      setIntent(parsed);
    } catch {
      localStorage.removeItem("cde_vote_intent");
    }
  }, [authenticated]);

  useEffect(() => {
    if (!intent) return;
    let cancelled = false;
    fetch(`/api/participants/${encodeURIComponent(intent.participantId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.participant) return;
        setTarget(data.participant);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [intent]);

  const close = () => {
    try {
      localStorage.removeItem("cde_vote_intent");
    } catch {
      /* noop */
    }
    setIntent(null);
    setTarget(null);
  };

  if (!intent || !target) return null;

  return (
    <VoteDialog
      open
      onClose={close}
      participant={target}
      campaignId={intent.campaignId}
      authenticated
    />
  );
}
