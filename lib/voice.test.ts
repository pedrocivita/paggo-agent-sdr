import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { toConversation, verifySignature, withoutAudioTags } from "./voice";

const secret = "test-secret";
const body = '{"type":"post_call_transcription"}';
const now = Date.UTC(2026, 9, 17, 12, 0, 0);
const t = Math.floor(now / 1000);
const sign = (ts: number, raw: string) => createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex");

describe("post-call webhook signature", () => {
  it("accepts a payload signed with the shared secret", () => {
    expect(verifySignature(`t=${t},v0=${sign(t, body)}`, body, secret, now)).toBe(true);
  });

  it("rejects a changed body, a wrong secret or a missing header", () => {
    expect(verifySignature(`t=${t},v0=${sign(t, body)}`, body + " ", secret, now)).toBe(false);
    expect(verifySignature(`t=${t},v0=${sign(t, body)}`, body, "other", now)).toBe(false);
    expect(verifySignature(null, body, secret, now)).toBe(false);
  });

  it("rejects a signature older than 30 minutes", () => {
    const old = t - 31 * 60;
    expect(verifySignature(`t=${old},v0=${sign(old, body)}`, body, secret, now)).toBe(false);
  });
});

describe("post-call payload", () => {
  const payload = {
    type: "post_call_transcription",
    data: {
      conversation_id: "conv_1",
      user_id: "lead-1",
      transcript: [
        { role: "agent", message: "Oi, Ana!" },
        { role: "user", message: "Oi." },
        { role: "agent", message: null },
      ],
      analysis: {
        transcript_summary: "Ana cuida da tesouraria.",
        data_collection_results: { dor: { value: "Conciliação na mão", rationale: "..." }, resultado: "reunião marcada" },
      },
    },
  };

  it("keeps spoken lines, the summary and every collected field", () => {
    const record = toConversation(payload);
    expect(record?.leadId).toBe("lead-1");
    expect(record?.conversation.transcript).toEqual([
      { role: "agent", text: "Oi, Ana!" },
      { role: "user", text: "Oi." },
    ]);
    expect(record?.conversation.spiced.dor).toBe("Conciliação na mão");
    expect(record?.conversation.spiced.impacto).toBe("");
    expect(record?.conversation.result).toBe("reunião marcada");
  });

  it("prefers our summary field and falls back to the ElevenLabs summary", () => {
    expect(toConversation(payload)?.conversation.summary).toBe("Ana cuida da tesouraria.");
    const withOurs = structuredClone(payload) as typeof payload & {
      data: { analysis: { data_collection_results: Record<string, unknown> } };
    };
    withOurs.data.analysis.data_collection_results.resumo = { value: "Ana pediu material, anotado para o time." };
    expect(toConversation(withOurs)?.conversation.summary).toBe("Ana pediu material, anotado para o time.");
  });

  it("ignores other webhook events", () => {
    expect(toConversation({ type: "post_call_audio", data: {} })).toBeNull();
  });
});

describe("transcript text", () => {
  it("drops the voice model emotion tags", () => {
    expect(withoutAudioTags("[happy] Que bom! [neutral] Ana, vi que a Cyrela cresceu.")).toBe("Que bom! Ana, vi que a Cyrela cresceu.");
    expect(withoutAudioTags("O índice é o INCC (ver item 2]) e segue.")).toBe("O índice é o INCC (ver item 2]) e segue.");
  });
});
