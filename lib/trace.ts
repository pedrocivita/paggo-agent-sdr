// The trail: every tool call, from research or voice, becomes one row in
// `events` with its input, output, sources and duration. The panel reads it.

import type postgres from "postgres";
import { sql } from "./db";

export type Run = { kind: "research" | "voice"; id: string; leadId?: string | null };

export async function traced<T>(run: Run, tool: string, input: unknown, fn: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    const output = await fn();
    await logEvent(run, tool, input, { output, ok: true, ms: Date.now() - started });
    return output;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await logEvent(run, tool, input, { error, ok: false, ms: Date.now() - started });
    throw err;
  }
}

type Outcome = { output?: unknown; error?: string; ok: boolean; ms: number };

export async function logEvent(run: Run, tool: string, input: unknown, outcome: Outcome): Promise<void> {
  const db = sql();
  await db`
    insert into events (lead_id, run_kind, run_id, tool, input, output, sources, ok, error, ms)
    values (
      ${run.leadId ?? null}, ${run.kind}, ${run.id}, ${tool},
      ${db.json(toJson(input))}, ${db.json(toJson(outcome.output ?? null))},
      ${urlsIn(outcome.output)}, ${outcome.ok}, ${outcome.error ?? null}, ${outcome.ms}
    )`;
}

/** Research tools run before the lead id is known to them; link them afterwards. */
export async function linkRunToLead(runId: string, leadId: string): Promise<void> {
  await sql()`update events set lead_id = ${leadId} where run_id = ${runId} and lead_id is null`;
}

function toJson(value: unknown): postgres.JSONValue {
  return JSON.parse(JSON.stringify(value ?? null));
}

/** Every http(s) URL found anywhere in a value: the sources the tool touched. */
export function urlsIn(value: unknown, found = new Set<string>()): string[] {
  if (typeof value === "string") {
    if (/^https?:\/\//.test(value)) found.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => urlsIn(v, found));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => urlsIn(v, found));
  }
  return [...found];
}
