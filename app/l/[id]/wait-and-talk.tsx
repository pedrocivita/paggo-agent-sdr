"use client";

import { useEffect, useState } from "react";
import type { LeadStatus } from "@/lib/leads";

const POLL_MS = 2000;

const LABEL: Record<LeadStatus, string> = {
  researching: "pesquisando sua empresa",
  ready: "pronto para conversar",
  failed: "pesquisa incompleta, mas dá para conversar",
  talked: "conversa registrada",
};

export function WaitAndTalk({ id, initialStatus }: { id: string; initialStatus: LeadStatus }) {
  const [status, setStatus] = useState<LeadStatus>(initialStatus);

  useEffect(() => {
    if (status !== "researching") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      if (res.ok) setStatus((await res.json()).status);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [id, status]);

  const ready = status !== "researching";
  return (
    <section>
      <p className={`status ${ready ? "done" : ""}`}>
        <i /> {LABEL[status]}
      </p>
      {/* The voice button arrives in milestone 3. */}
      <button className="btn" disabled={!ready} style={{ marginTop: 24, opacity: ready ? 1 : 0.4 }}>
        Falar com a Paggo
      </button>
    </section>
  );
}
