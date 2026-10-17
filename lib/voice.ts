// The ElevenLabs post-call webhook: checks it really came from ElevenLabs and
// turns its payload into the lead's conversation record.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Conversation } from "./leads";

const TOLERANCE_S = 30 * 60;

/** Header `ElevenLabs-Signature: t=<unix>,v0=<hex>`, where v0 = HMAC-SHA256(secret, `${t}.${rawBody}`). */
export function verifySignature(header: string | null, rawBody: string, secret: string, nowMs = Date.now()): boolean {
  if (!header) return false;
  const fields = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(fields.t);
  if (!fields.v0 || !Number.isFinite(t) || Math.abs(nowMs / 1000 - t) > TOLERANCE_S) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const given = Buffer.from(fields.v0, "hex");
  return given.length === expected.length / 2 && timingSafeEqual(given, Buffer.from(expected, "hex"));
}

type PostCall = {
  type?: string;
  data?: {
    conversation_id?: string;
    user_id?: string;
    metadata?: { user_id?: string };
    transcript?: { role?: string; message?: string | null }[];
    analysis?: { transcript_summary?: string; data_collection_results?: Record<string, unknown> };
    conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
  };
};

export type PostCallRecord = { leadId: string; conversationId: string; conversation: Conversation };

/** The lead's conversation from a post_call_transcription payload, or null for any other event. */
export function toConversation(payload: PostCall): PostCallRecord | null {
  const d = payload.data;
  if (payload.type !== "post_call_transcription" || !d?.conversation_id) return null;
  const leadId = d.user_id ?? d.metadata?.user_id ?? String(d.conversation_initiation_client_data?.dynamic_variables?.lead_id ?? "");
  if (!leadId) return null;

  const results = d.analysis?.data_collection_results ?? {};
  // Each result may come as { value, rationale } or as the bare value.
  const field = (key: string): string => {
    const r = results[key];
    const v = r && typeof r === "object" && "value" in r ? (r as { value: unknown }).value : r;
    return v == null ? "" : String(v);
  };

  return {
    leadId,
    conversationId: d.conversation_id,
    conversation: {
      transcript: (d.transcript ?? [])
        .filter((t) => (t.role === "agent" || t.role === "user") && t.message)
        .map((t) => ({ role: t.role as "agent" | "user", text: withoutAudioTags(String(t.message)) })),
      summary: d.analysis?.transcript_summary ?? "",
      spiced: Object.fromEntries(
        ["situacao", "dor", "impacto", "evento_critico", "decisao"].map((k) => [k, field(k)]),
      ),
      result: field("resultado"),
      confirmedData: field("dados_corrigidos"),
      meetingAt: field("horario_marcado"),
      objections: field("objecoes"),
      doubts: field("duvidas"),
    },
  };
}

/** The v4 voice model takes emotion tags such as [happy]; they are for the voice, not for the transcript. */
export function withoutAudioTags(text: string): string {
  return text.replace(/\[[a-z ]{2,24}\]\s*/gi, "").trim();
}
