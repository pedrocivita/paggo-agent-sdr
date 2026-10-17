import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { toConversation, verifySignature } from "./voice";

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

  it("ignores other webhook events", () => {
    expect(toConversation({ type: "post_call_audio", data: {} })).toBeNull();
  });
});
