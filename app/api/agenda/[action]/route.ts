import { z } from "zod";
import { agenda, pickOptions, searchWindow, spokenSlot } from "@/lib/agenda";
import { getLead } from "@/lib/leads";
import { traced, type Run } from "@/lib/trace";

// Webhook tools of the voice agent: ElevenLabs calls these mid-conversation.
// Answers are short sentences the agent can say as they are.

const Body = z.object({
  lead_id: z.uuid(),
  conversation_id: z.string().min(1),
  inicio: z.iso.datetime({ offset: true }).optional(),
  email: z.email().optional(),
});

const MIN_LEAD_MS = 60 * 60 * 1000; // no meeting starting within the next hour

export async function POST(req: Request, { params }: RouteContext<"/api/agenda/[action]">) {
  const secret = process.env.VOICE_TOOL_SECRET;
  if (!secret || req.headers.get("x-tool-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { action } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });
  const body = parsed.data;
  const run: Run = { kind: "voice", id: body.conversation_id, leadId: body.lead_id };

  try {
    if (action === "consultar") return Response.json(await traced(run, "consultar_agenda", body, consult));
    if (action === "marcar" && body.inicio) {
      const { inicio, email } = body;
      return Response.json(await traced(run, "marcar_reuniao", body, () => book(body.lead_id, inicio, email)));
    }
    return Response.json({ error: "unknown_action" }, { status: 404 });
  } catch {
    return Response.json({ erro: "A agenda não respondeu agora. Diga que o time confirma o horário por e-mail." });
  }
}

async function consult() {
  const { from, to } = searchWindow(new Date());
  const earliest = Date.now() + MIN_LEAD_MS;
  const slots = pickOptions(await agenda().available(from, to), earliest);
  if (slots.length === 0) return { opcoes: [], mensagem: "Não há horário livre nos próximos cinco dias úteis." };
  return { opcoes: slots.map((s) => ({ inicio: s.inicio, falar: spokenSlot(s.inicio) })) };
}

async function book(leadId: string, inicio: string, email?: string) {
  const lead = await getLead(leadId);
  if (!lead) throw new Error("Lead não encontrado");
  const result = await agenda().book({ inicio, nome: lead.form.name, email: email ?? lead.form.email });
  if (!result.ok) {
    return { marcada: false, mensagem: "Esse horário acabou de ser ocupado. Consulte a agenda de novo e ofereça o próximo." };
  }
  return { marcada: true, inicio, mensagem: `Reunião marcada para ${spokenSlot(inicio)}.` };
}
