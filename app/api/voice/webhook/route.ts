import { getLead, saveConversation } from "@/lib/leads";
import { toConversation, verifySignature } from "@/lib/voice";

// ElevenLabs calls this after each conversation with the transcript, the
// summary and the collected SPICED fields.

export async function POST(req: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret || !verifySignature(req.headers.get("elevenlabs-signature"), raw, secret)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  const record = toConversation(JSON.parse(raw));
  if (!record) return Response.json({ ignored: true });
  if (!(await getLead(record.leadId))) return Response.json({ error: "unknown_lead" }, { status: 404 });

  await saveConversation(record.leadId, record.conversationId, record.conversation);
  return Response.json({ ok: true });
}
