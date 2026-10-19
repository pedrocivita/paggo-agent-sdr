"use client";

import { useState, type ReactNode } from "react";
import type { FactValue } from "@/lib/briefing";
import type { Lead, TrailEvent } from "@/lib/leads";
import { describeRole } from "@/lib/roles";

const TABS = ["Formulário", "Pesquisa", "Conversa estruturada", "Transcrição", "Rastro"] as const;
type Tab = (typeof TABS)[number];

const CONFIDENCE_TONE = { alta: "ok", media: "warn", baixa: "quiet" } as const;

function Fact({ label, fact }: { label: string; fact: FactValue }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {fact.value} <span className={`chip ${CONFIDENCE_TONE[fact.confidence]}`}>{fact.confidence}</span>
        {fact.source && (
          <a className="src" href={fact.source} target="_blank" rel="noreferrer">
            fonte
          </a>
        )}
      </dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="sub">{children}</p>;
}

function FormTab({ lead }: { lead: Lead }) {
  const { name, email, phone, company, extra, role, consentAt } = lead.form;
  const consent = consentAt ? new Date(consentAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "·";
  const rows: [string, string][] = [
    ["Nome", name],
    ["E-mail", email],
    ["Telefone", phone],
    ["Cargo", describeRole(role)],
    ["Empresa", company],
    ["Extra", extra || "·"],
    ["Aceite dos dados", consent],
  ];
  return (
    <dl className="facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ResearchTab({ lead }: { lead: Lead }) {
  const b = lead.briefing;
  if (!b) return <Empty>{lead.status === "failed" ? `A pesquisa falhou: ${lead.error}` : "Pesquisa em andamento."}</Empty>;
  return (
    <>
      <h3>
        Fit <span className="chip accent">{b.fit.level}</span>
      </h3>
      <ul>{b.fit.reasons.map((r) => <li key={r}>{r}</li>)}</ul>

      <h4>Empresa</h4>
      <dl className="facts">
        <Fact label="Razão social" fact={b.company.legalName} />
        <Fact label="CNPJ" fact={b.company.cnpj} />
        <Fact label="Segmento" fact={b.company.segment} />
        <Fact label="Porte" fact={b.company.size} />
        <Fact label="Regime tributário" fact={b.company.taxRegime} />
        <Fact label="Grupo e SPEs" fact={b.company.groupEntities} />
        <Fact label="Local" fact={b.company.location} />
      </dl>

      <h4>Pessoa</h4>
      <dl className="facts">
        <Fact label="Cargo" fact={b.person.role} />
        <Fact label="Sócia ou sócio" fact={b.person.isPartner} />
      </dl>

      <h4>Hipóteses de SPICED</h4>
      <dl className="facts">
        <Fact label="Situação" fact={b.spicedHypotheses.situation} />
        <Fact label="Dor" fact={b.spicedHypotheses.pain} />
        <Fact label="Impacto" fact={b.spicedHypotheses.impact} />
        <Fact label="Evento crítico" fact={b.spicedHypotheses.criticalEvent} />
        <Fact label="Decisão" fact={b.spicedHypotheses.decision} />
      </dl>

      <h4>O que perguntar</h4>
      <ol>{b.openQuestions.map((q) => <li key={q}>{q}</li>)}</ol>

      <h4>Briefing para o agente de voz</h4>
      <p className="note">{b.forAgent}</p>
    </>
  );
}

const SPICED_LABELS: Record<string, string> = {
  situacao: "S · Situação",
  dor: "P · Dor",
  impacto: "I · Impacto",
  evento_critico: "C · Evento crítico",
  decisao: "D · Decisão",
};

function StructuredTab({ lead }: { lead: Lead }) {
  const c = lead.conversation;
  if (!c) return <Empty>A conversa ainda não aconteceu.</Empty>;
  return (
    <>
      <h3>
        Resultado <span className="chip ok">{c.result || "·"}</span>
      </h3>
      <h4>Dados confirmados ou corrigidos</h4>
      <p>{c.confirmedData || "·"}</p>
      <h4>SPICED</h4>
      <dl className="facts">
        {Object.entries(SPICED_LABELS).map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{c.spiced[key] || "não coberto"}</dd>
          </div>
        ))}
      </dl>
      <h4>Reunião, objeções e dúvidas</h4>
      <dl className="facts">
        <div>
          <dt>Horário marcado</dt>
          <dd>{c.meetingAt || "·"}</dd>
        </div>
        <div>
          <dt>Objeções</dt>
          <dd>{c.objections || "nenhuma"}</dd>
        </div>
        <div>
          <dt>Dúvidas para o time</dt>
          <dd>{c.doubts || "nenhuma"}</dd>
        </div>
      </dl>
    </>
  );
}

function TranscriptTab({ lead }: { lead: Lead }) {
  const c = lead.conversation;
  if (!c) return <Empty>A conversa ainda não aconteceu.</Empty>;
  return (
    <>
      <h4>Resumo</h4>
      <p>{c.summary}</p>
      <h4>Transcrição</h4>
      <dl className="facts">
        {c.transcript.map((line, i) => (
          <div key={i}>
            <dt>{line.role === "agent" ? "Paggo" : lead.form.name.split(" ")[0]}</dt>
            <dd>{line.text}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

// One link per site: several pages of the same site would repeat the same hostname.
function sites(urls: string[]): [string, string][] {
  const byHost = new Map<string, string>();
  for (const url of urls) {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!byHost.has(host)) byHost.set(host, url);
  }
  return [...byHost].slice(0, 3);
}

function TrailTab({ events }: { events: TrailEvent[] }) {
  if (events.length === 0) return <Empty>Nenhuma chamada de ferramenta registrada ainda.</Empty>;
  const runs = Map.groupBy(events, (e) => `${e.runKind}:${e.runId}`);
  return (
    <>
      {[...runs.entries()].map(([key, runEvents]) => (
        <section key={key} style={{ paddingTop: 24 }}>
          <h3>
            {runEvents[0].runKind === "research" ? "Pesquisa" : "Conversa"}{" "}
            <span className="chip quiet">{runEvents[0].runId}</span>
          </h3>
          {runEvents.map((e) => (
            <details key={e.id} className="event">
              <summary>
                <span className="chip">{e.tool}</span>
                <span className={`chip ${e.ok ? "ok" : "err"}`}>{e.ok ? "ok" : "erro"}</span>
                <span className="when">{e.ms} ms</span>
                {sites(e.sources).map(([host, url]) => (
                  <a key={host} href={url} target="_blank" rel="noreferrer">
                    {host}
                  </a>
                ))}
              </summary>
              {e.error && <p className="note err">{e.error}</p>}
              <pre>{JSON.stringify({ entrada: e.input, saida: e.output }, null, 2)}</pre>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}

export function LeadTabs({ lead, events }: { lead: Lead; events: TrailEvent[] }) {
  const [tab, setTab] = useState<Tab>("Pesquisa");
  return (
    <>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t}
            {t === "Rastro" && ` (${events.length})`}
          </button>
        ))}
      </div>
      <section role="tabpanel">
        {tab === "Formulário" && <FormTab lead={lead} />}
        {tab === "Pesquisa" && <ResearchTab lead={lead} />}
        {tab === "Conversa estruturada" && <StructuredTab lead={lead} />}
        {tab === "Transcrição" && <TranscriptTab lead={lead} />}
        {tab === "Rastro" && <TrailTab events={events} />}
      </section>
    </>
  );
}
