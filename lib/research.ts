// Starts the eve research agent for a lead and stores the briefing it returns.

import { Client } from "eve/client";
import { getVercelOidcToken } from "@vercel/oidc";
import { BriefingSchema, type Briefing } from "./briefing";
import { getLead, markFailed, saveBriefing, setResearchRun, type LeadForm } from "./leads";
import { describeRole } from "./roles";
import { linkRunToLead } from "./trace";

function eveClient(): Client {
  if (process.env.VERCEL_URL) {
    // Same Vercel project: the deployment's own OIDC token is accepted by vercelOidc().
    return new Client({
      host: `https://${process.env.VERCEL_URL}`,
      auth: { vercelOidc: { token: () => getVercelOidcToken() } },
    });
  }
  return new Client({ host: process.env.EVE_HOST ?? "http://localhost:3000" });
}

/** The research request for a lead; the evals send the same one. */
export function researchMessage(form: LeadForm): string {
  return [
    "Pesquise este lead e devolva o briefing.",
    `Nome: ${form.name}`,
    `E-mail: ${form.email}`,
    `Telefone: ${form.phone}`,
    `Empresa: ${form.company}`,
    // Leads from before the role field (and the eval cases) keep the same message.
    ...(form.role ? [`Cargo informado pelo lead: ${describeRole(form.role)}`] : []),
    `Informação extra do lead: ${form.extra || "nenhuma"}`,
  ].join("\n");
}

export async function runResearch(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  if (!lead) return;
  try {
    const { session, response } = await eveClient().sessions.create<Briefing>({
      message: researchMessage(lead.form),
      outputSchema: BriefingSchema,
    });
    const runId = session.state.sessionId;
    await setResearchRun(leadId, runId);
    const result = await response.result();
    await linkRunToLead(runId, leadId);
    if (!result.data) throw new Error("O agente terminou sem devolver o briefing");
    await saveBriefing(leadId, result.data);
  } catch (err) {
    await markFailed(leadId, err instanceof Error ? err.message : String(err));
  }
}
