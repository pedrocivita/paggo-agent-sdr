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

  const ready = status !== "researching";
  return (
    <section>
      <p className={`status ${ready ? "done" : ""}`}>
        <i /> {LABEL[status]}
      </p>
      <ConversationProvider>
        <Talk id={id} ready={ready} />
      </ConversationProvider>
    </section>
  );
}

function Talk({ id, ready }: { id: string; ready: boolean }) {
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

  if (conversation.status === "connecting" || conversation.status === "connected") {
    const now = conversation.status === "connecting" ? "conectando" : conversation.isSpeaking ? "a Paggo está falando" : "ouvindo você";
    return (
      <div className="talk">
        <p className="status done">
          <i /> {now}
        </p>
        <button className="btn ghost" onClick={() => conversation.endSession()}>
          Encerrar conversa
        </button>
      </div>
    );
  }

  return (
    <div className="talk">
      <button className="btn" disabled={!ready} onClick={start}>
        {ended ? "Falar de novo" : "Falar com a Paggo"}
      </button>
      {ended && <p className="sub">Conversa encerrada. Obrigado pelo seu tempo.</p>}
      {error && <p className="note err">{error}</p>}
    </div>
  );
}
