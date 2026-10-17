"use client";

import { useEffect, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
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

  return (
    <ConversationProvider>
      <Talk id={id} ready={status !== "researching"} researchLabel={LABEL[status]} />
    </ConversationProvider>
  );
}

function Talk({ id, ready, researchLabel }: { id: string; ready: boolean; researchLabel: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const conversation = useConversation({
    onDisconnect: () => setEnded(true),
    onError: () => setError("A conversa caiu. Tente de novo em instantes."),
  });

  async function start() {
    setError(null);
    setEnded(false);
    try {
      // Ask for the microphone first, so a denied permission gets a clear message.
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((t) => t.stop());
    } catch {
      return setError("Para conversar, libere o microfone no navegador.");
    }
    const res = await fetch(`/api/leads/${id}/voice`, { method: "POST" });
    if (!res.ok) return setError("A conversa por voz não está disponível agora. Tente de novo em instantes.");
    const { token, userId, dynamicVariables } = await res.json();
    conversation.startSession({ conversationToken: token, connectionType: "webrtc", userId, dynamicVariables });
  }

  const live = conversation.status === "connecting" || conversation.status === "connected";
  const now = !live
    ? researchLabel
    : conversation.status === "connecting"
      ? "conectando"
      : conversation.isSpeaking
        ? "a Paggo está falando"
        : "ouvindo você";

  return (
    <>
      <section className="band">
        <div>
          <h2>{ended ? "Conversa encerrada." : "Converse com a Paggo por voz."}</h2>
          <p>{ended ? "Obrigado pelo seu tempo." : "Uns cinco minutos, aqui no site. O navegador vai pedir o microfone."}</p>
          <p className={`status ${ready || live ? "done" : ""}`}>
            <i /> {now}
          </p>
        </div>
        {live ? (
          <button className="btn ghost" onClick={() => conversation.endSession()}>
            Encerrar conversa
          </button>
        ) : (
          <button className="btn" disabled={!ready} onClick={start}>
            {ended ? "Falar de novo" : "Falar com a Paggo"}
          </button>
        )}
      </section>
      {error && <p className="note err">{error}</p>}
    </>
  );
}
