import { getLead } from "@/lib/leads";

// Opens a voice conversation for one lead: the ElevenLabs key stays here, the
// browser gets a short-lived token and the briefing as dynamic variables.

const TOKEN_URL = "https://api.elevenlabs.io/v1/convai/conversation/token";
const NO_BRIEFING = "A pesquisa não encontrou dados sobre a empresa. Confirme no começo a empresa e o papel da pessoa.";

export async function POST(_req: Request, { params }: RouteContext<"/api/leads/[id]/voice">) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });
  // Only after the research ends, so the agent always has the briefing (or knows it has none).
  if (lead.status === "researching") return Response.json({ error: "still_researching" }, { status: 409 });

  const { ELEVENLABS_API_KEY: key, ELEVENLABS_AGENT_ID: agentId } = process.env;
  if (!key || !agentId) return Response.json({ error: "voice_not_configured" }, { status: 503 });

  const res = await fetch(`${TOKEN_URL}?agent_id=${encodeURIComponent(agentId)}`, {
    headers: { "xi-api-key": key },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return Response.json({ error: `elevenlabs_${res.status}` }, { status: 502 });
  const { token } = (await res.json()) as { token: string };
  const legalName = lead.briefing?.company.legalName.value;
  const found = legalName && !legalName.startsWith("não encontrado");

  return Response.json({
    token,
    userId: lead.id,
    dynamicVariables: {
      lead_id: lead.id,
      lead_name: lead.form.name.split(" ")[0],
      company_name: found ? legalName : lead.form.company,
      briefing: lead.briefing?.forAgent ?? NO_BRIEFING,
    },
  });
}
