import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { listLeads, type LeadStatus } from "@/lib/leads";

const STATUS: Record<LeadStatus, { label: string; tone: string }> = {
  researching: { label: "pesquisando", tone: "info" },
  ready: { label: "briefing pronto", tone: "accent" },
  failed: { label: "pesquisa falhou", tone: "err" },
  talked: { label: "conversou", tone: "ok" },
};

async function LeadsTable() {
  await connection(); // always read fresh rows, never at build time
  const leads = await listLeads();
  if (leads.length === 0) return <p className="sub">Nenhum lead ainda.</p>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Empresa</th>
            <th>Fit</th>
            <th>Status</th>
            <th>Resultado</th>
            <th>Quando</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link href={`/painel/${lead.id}`}>{lead.form.name}</Link>
              </td>
              <td>{lead.briefing?.company.legalName.value ?? lead.form.company}</td>
              <td>{lead.briefing?.fit.level ?? "·"}</td>
              <td>
                <span className={`chip ${STATUS[lead.status].tone}`}>{STATUS[lead.status].label}</span>
              </td>
              <td>{lead.conversation?.result ?? "·"}</td>
              <td>{new Date(lead.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Panel() {
  return (
    <main>
      <section>
        <h2>Leads</h2>
        <p className="sub">Cada linha é um visitante: formulário, pesquisa, conversa e rastro.</p>
        <Suspense fallback={<p className="sub">Carregando…</p>}>
          <LeadsTable />
        </Suspense>
      </section>
    </main>
  );
}
