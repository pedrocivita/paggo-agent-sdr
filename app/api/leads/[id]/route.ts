import { getLead } from "@/lib/leads";

// Polled by the waiting page: is the briefing ready?
export async function GET(_req: Request, { params }: RouteContext<"/api/leads/[id]">) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ status: lead.status, company: lead.briefing?.company.legalName.value ?? lead.form.company });
}
