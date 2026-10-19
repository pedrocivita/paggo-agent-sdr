// Runs one text-only conversation between the voice agent and a simulated lead,
// then measures the transcript against the style rules of voice/prompt.md.
// Usage: node --env-file=<file> scripts/voice-simulate.mjs <persona> [--llm=<id>] [--reasoning=<effort>] [--out=<file>]
// --llm switches the agent's LLM on the account before the run (thinking off,
// or the given reasoning effort); rerun scripts/voice-sync.mjs to go back to voice/agent.json.
// Uses no voice minutes; the free plan did not bill the LLM either. The agenda tools are mocked.

import { writeFile } from "node:fs/promises";
import { PERSONAS } from "../voice/personas.mjs";

const API = "https://api.elevenlabs.io";
const AGENT_NAME = "Paggo SDR";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("missing ELEVENLABS_API_KEY");
const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, "").split("=")));
const persona = PERSONAS[process.argv[2]];
if (!persona) throw new Error(`persona must be one of: ${Object.keys(PERSONAS).join(", ")}`);

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 800)}`);
  return text ? JSON.parse(text) : {};
}

// Optional: a restricted key may not read the subscription.
async function creditsLeft() {
  try {
    const s = await call("GET", "/v1/user/subscription");
    return s.character_limit - s.character_count;
  } catch {
    return null;
  }
}

// Three business days from tomorrow, two morning and two afternoon slots each, the shape
// the real route returns (pickOptions in lib/agenda.ts), said the way it says them.
function mockSlots(now = new Date()) {
  const slots = [];
  const day = new Date(now);
  for (let days = 0; days < 3; ) {
    day.setUTCDate(day.getUTCDate() + 1);
    if ([0, 6].includes(day.getUTCDay())) continue;
    days++;
    for (const [hour, minute] of [[10, "00"], [10, "30"], [14, "00"], [14, "30"]]) {
      const inicio = `${day.toISOString().slice(0, 10)}T${hour}:${minute}:00-03:00`;
      const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" }).format(new Date(inicio));
      slots.push({ inicio, falar: `${weekday}, dia ${Number(inicio.slice(8, 10))}, às ${hour}h${minute === "00" ? "" : minute}` });
    }
  }
  return slots;
}

const words = (text) => text.split(/\s+/).filter(Boolean).length;
const median = (xs) => (xs.length ? Number(xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)].toFixed(2)) : null);
const metric = (turns, name) =>
  median(turns.map((t) => t.conversation_turn_metrics?.metrics?.[name]?.elapsed_time).filter((x) => x != null));
const FORBIDDEN = /(?<!\p{L})(ótim[oa]|perfeit[oa]|compreendo)(?!\p{L})/giu;
// "contas a pagar e a receber" names two modules, so "a receber" counts alone.
// \s+ because the transcript joins streamed chunks with double spaces.
const MODULES = /tesouraria|a\s+pagar|a\s+receber|cart(ão|ões)|orçamento|fluxo\s+de\s+caixa|controladoria|automaç/giu;
const DECISION = /quem\s+(mais\s+)?(decide|participa|aprova|escolhe)|decis[ãa]o/iu;
const toolNames = (turn) => (turn.tool_calls || []).map((c) => c.tool_name);

function measure(turns, slots) {
  const agent = turns.filter((t) => t.role === "agent" && t.message?.trim()).slice(1); // the first one is the fixed first_message
  const counts = agent.map((t) => words(t.message));
  // The decision question must come before the booking; checking the calendar first is fine.
  const firstBooking = turns.findIndex((t) => toolNames(t).includes("marcar_reuniao"));
  const before = firstBooking < 0 ? turns : turns.slice(0, firstBooking);
  const endIndex = turns.findIndex((t) => toolNames(t).includes("end_call"));
  const lastUser = turns.findLastIndex((t, i) => t.role === "user" && (endIndex < 0 || i < endIndex));
  const closing = turns.slice(lastUser + 1, endIndex + 1).filter((t) => t.role === "agent" && t.message?.trim());
  return {
    agentTurns: agent.length,
    wordsAvg: Math.round(counts.reduce((a, b) => a + b, 0) / (counts.length || 1)),
    wordsMax: Math.max(0, ...counts),
    over25: counts.filter((c) => c > 25).length,
    forbidden: agent.flatMap((t) => t.message.match(FORBIDDEN) || []),
    exclamations: agent.reduce((n, t) => n + (t.message.match(/!/g) || []).length, 0),
    moduleList: agent.some((t) => new Set((t.message.match(MODULES) || []).map((m) => m.toLowerCase())).size >= 3),
    askedDecisionBeforeBooking: firstBooking < 0 ? null : before.some((t) => t.role === "agent" && DECISION.test(t.message || "")),
    tools: turns.flatMap(toolNames),
    closedInOneTurn: endIndex >= 0 && closing.length === 1 && !closing[0].message.includes("?"),
    // Nothing sends a meeting invite, so the agent must never promise one.
    promisedInvite: agent.some((t) => /convite/iu.test(t.message)),
    // The time it booked must be one the agenda offered: once, the agent made one up.
    bookedOfferedSlot: (() => {
      const call = turns.flatMap((t) => t.tool_calls || []).find((c) => c.tool_name === "marcar_reuniao");
      return call ? slots.some((s) => s.inicio === JSON.parse(call.params_as_json || "{}").inicio) : null;
    })(),
    // Seconds from the end of the lead's turn to the LLM's first token and first full sentence (what the voice starts with).
    llmFirstTokenMedian: metric(turns, "convai_llm_service_ttfb"),
    llmFirstSentenceMedian: metric(turns, "convai_llm_service_ttf_sentence"),
  };
}

const { agents } = await call("GET", `/v1/convai/agents?search=${encodeURIComponent(AGENT_NAME)}`);
const agentId = agents.find((a) => a.name === AGENT_NAME)?.agent_id;
if (!agentId) throw new Error(`agent "${AGENT_NAME}" not found; run scripts/voice-sync.mjs first`);

if (args.llm) {
  const reasoning = args.reasoning ? { reasoning_effort: args.reasoning, thinking_budget: null } : { reasoning_effort: null, thinking_budget: 0 };
  await call("PATCH", `/v1/convai/agents/${agentId}`, { conversation_config: { agent: { prompt: { llm: args.llm, ...reasoning } } } });
}
const live = (await call("GET", `/v1/convai/agents/${agentId}`)).conversation_config.agent.prompt;

const slots = mockSlots();
const before = await creditsLeft();
const started = Date.now();
const result = await call("POST", `/v1/convai/agents/${agentId}/simulate-conversation`, {
  simulation_specification: {
    simulated_user_config: {
      first_message: "",
      language: "pt-br",
      prompt: { prompt: persona.user, llm: "gemini-2.5-flash", temperature: 0.5 },
    },
    // A simulation has no real conversation id, and the tools are mocked anyway.
    dynamic_variables: { lead_id: "00000000-0000-4000-8000-000000000000", system__conversation_id: "simulation", ...persona.lead },
    tool_mock_config: {
      consultar_agenda: { default_return_value: JSON.stringify({ opcoes: slots }) },
      marcar_reuniao: {
        default_return_value: JSON.stringify({ marcada: true, mensagem: "Reunião marcada no horário escolhido." }),
      },
    },
  },
  new_turns_limit: 40,
});
const seconds = Math.round((Date.now() - started) / 1000);
const after = await creditsLeft();

const turns = result.simulated_conversation;
for (const t of turns) {
  const tools = toolNames(t);
  console.log(`${t.role === "agent" ? "AGENTE" : "LEAD  "}: ${t.message || ""}${tools.length ? ` [${tools.join(", ")}]` : ""}`);
}
const collected = Object.fromEntries(
  Object.entries(result.analysis?.data_collection_results || {}).map(([k, v]) => [k, v.value ?? null]),
);
console.log("\nCOLETA", JSON.stringify(collected, null, 1));
console.log(
  "\nMEDIDAS",
  JSON.stringify({
    persona: process.argv[2],
    llm: live.llm,
    reasoning: live.reasoning_effort ?? `thinking_budget=${live.thinking_budget}`,
    ...measure(turns, slots),
    credits: before == null || after == null ? null : before - after,
    creditsLeft: after,
    seconds,
  }),
);
if (args.out) await writeFile(args.out, JSON.stringify(result, null, 1));
