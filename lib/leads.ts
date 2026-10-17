// Reads and writes the `leads` table. One row per visitor: the form as typed,
// the briefing and the conversation, side by side.

import { sql } from "./db";
import type { Briefing } from "./briefing";

export type LeadForm = { name: string; email: string; phone: string; company: string; extra: string };
export type LeadStatus = "researching" | "ready" | "failed" | "talked";

export type Conversation = {
  transcript: { role: "agent" | "user"; text: string }[];
  summary: string;
  spiced: Record<string, string>;
  result: string;
  confirmedData: string;
  meetingAt: string;
  objections: string;
  doubts: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  form: LeadForm;
  status: LeadStatus;
  researchRunId: string | null;
  briefing: Briefing | null;
  voiceRunId: string | null;
  conversation: Conversation | null;
  error: string | null;
};

export type TrailEvent = {
  id: number;
  runKind: "research" | "voice";
  runId: string;
  tool: string;
  input: unknown;
  output: unknown;
  sources: string[];
  ok: boolean;
  error: string | null;
  ms: number;
  createdAt: string;
};

export async function createLead(form: LeadForm): Promise<string> {
  const db = sql();
  const [row] = await db`insert into leads (form) values (${db.json(form)}) returning id`;
  return row.id;
}

export async function getLead(id: string): Promise<Lead | null> {
  const [row] = await sql()`
    select id, created_at as "createdAt", form, status, research_run_id as "researchRunId",
           briefing, voice_run_id as "voiceRunId", conversation, error
    from leads where id = ${id}`;
  return (row as Lead) ?? null;
}

export async function listLeads(): Promise<Lead[]> {
  const rows = await sql()`
    select id, created_at as "createdAt", form, status, research_run_id as "researchRunId",
           briefing, voice_run_id as "voiceRunId", conversation, error
    from leads order by created_at desc limit 100`;
  return rows as unknown as Lead[];
}

export async function listEvents(leadId: string): Promise<TrailEvent[]> {
  const rows = await sql()`
    select id, run_kind as "runKind", run_id as "runId", tool, input, output, sources, ok, error, ms,
           created_at as "createdAt"
    from events where lead_id = ${leadId} order by created_at`;
  return rows as unknown as TrailEvent[];
}

export async function setResearchRun(id: string, runId: string): Promise<void> {
  await sql()`update leads set research_run_id = ${runId} where id = ${id}`;
}

export async function saveBriefing(id: string, briefing: Briefing): Promise<void> {
  const db = sql();
  await db`update leads set briefing = ${db.json(briefing)}, status = 'ready' where id = ${id}`;
}

export async function markFailed(id: string, error: string): Promise<void> {
  await sql()`update leads set status = 'failed', error = ${error} where id = ${id}`;
}

export async function saveConversation(id: string, runId: string, conversation: Conversation): Promise<void> {
  const db = sql();
  await db`
    update leads set voice_run_id = ${runId}, conversation = ${db.json(conversation)}, status = 'talked'
    where id = ${id}`;
}
