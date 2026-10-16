import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead, listEvents } from "@/lib/leads";
import { LeadTabs } from "./lead-tabs";

async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, events] = await Promise.all([getLead(id), listEvents(id)]);
  if (!lead) notFound();
  return (
    <>
      <div className="doc-head">
        <p className="eyebrow">
          <Link href="/painel">Leads</Link>
        </p>
        <h1>
          {lead.form.name}
          <span className="dot">.</span>
        </h1>
        <p className="lede">{lead.briefing?.company.legalName.value ?? lead.form.company}</p>
      </div>
      <LeadTabs lead={lead} events={events} />
    </>
  );
}

export default function LeadPanel({ params }: PageProps<"/painel/[id]">) {
  return (
    <main>
      <Suspense fallback={<p className="sub">Carregando…</p>}>
        <LeadDetail params={params} />
      </Suspense>
    </main>
  );
}
