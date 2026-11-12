"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { VoteDialog, type VoteTarget } from "@/components/voting/vote-dialog";

export function VoteCta({
  participant,
  campaignId,
  authenticated,
  eliminated,
}: {
  participant: VoteTarget;
  campaignId?: string;
  authenticated: boolean;
  eliminated?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (eliminated)
    return (
      <span className="btn btn-ghost cursor-not-allowed opacity-60">
        Concorrente já não está em votação
      </span>
    );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-gold px-6 py-3">
        <Heart className="h-4 w-4" /> Votar em {participant.name.split(" ")[0]}
      </button>
      <VoteDialog
        open={open}
        onClose={() => setOpen(false)}
        participant={participant}
        campaignId={campaignId}
        authenticated={authenticated}
      />
    </>
  );
}
