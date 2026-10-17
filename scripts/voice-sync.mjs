// Publishes the voice agent described in voice/ to an ElevenLabs account.
// Usage: node --env-file=<file> scripts/voice-sync.mjs
// The file holds ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID and VOICE_TOOL_SECRET;
// optional APP_URL (default: production) and POST_CALL_WEBHOOK_ID.
// Safe to rerun: the secret, the tools and the agent are found by name and updated.

import { readFile } from "node:fs/promises";

const API = "https://api.elevenlabs.io";
const SECRET_NAME = "paggo_voice_tool_secret";
const TOOLS = ["consultar_agenda", "marcar_reuniao"];

function env(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

const key = env("ELEVENLABS_API_KEY");
const voiceDir = new URL("../voice/", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, voiceDir), "utf8"));

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

const search = (name) => `search=${encodeURIComponent(name)}`;

async function upsertSecret(value) {
  const { secrets } = await call("GET", `/v1/convai/secrets?${search(SECRET_NAME)}`);
  const found = secrets.find((s) => s.name === SECRET_NAME);
  if (found) {
    await call("PATCH", `/v1/convai/secrets/${found.secret_id}`, { type: "update", name: SECRET_NAME, value });
    return found.secret_id;
  }
  return (await call("POST", "/v1/convai/secrets", { type: "new", name: SECRET_NAME, value })).secret_id;
}

async function upsertTool(config) {
  const { tools } = await call("GET", `/v1/convai/tools?${search(config.name)}`);
  const found = tools.find((t) => t.tool_config.name === config.name);
  const saved = found
    ? await call("PATCH", `/v1/convai/tools/${found.id}`, { tool_config: config })
    : await call("POST", "/v1/convai/tools", { tool_config: config });
  return saved.id;
}

async function upsertAgent(config) {
  const { agents } = await call("GET", `/v1/convai/agents?${search(config.name)}`);
  const found = agents.find((a) => a.name === config.name);
  if (found) {
    await call("PATCH", `/v1/convai/agents/${found.agent_id}`, config);
    return found.agent_id;
  }
  return (await call("POST", "/v1/convai/agents/create", config)).agent_id;
}

const appUrl = env("APP_URL", "https://paggo-agent-sdr.vercel.app").replace(/\/$/, "");
const secretId = await upsertSecret(env("VOICE_TOOL_SECRET"));

const toolIds = [];
for (const name of TOOLS) {
  const tool = await readJson(`tools/${name}.json`);
  tool.api_schema.url = appUrl + tool.api_schema.url;
  tool.api_schema.request_headers = { "x-tool-secret": { secret_id: secretId } };
  toolIds.push(await upsertTool(tool));
}

const agent = await readJson("agent.json");
agent.conversation_config.agent.prompt.prompt = await readFile(new URL("prompt.md", voiceDir), "utf8");
agent.conversation_config.agent.prompt.tool_ids = toolIds;
agent.conversation_config.tts.voice_id = env("ELEVENLABS_VOICE_ID");
if (process.env.POST_CALL_WEBHOOK_ID) {
  agent.platform_settings.workspace_overrides = { webhooks: { post_call_webhook_id: process.env.POST_CALL_WEBHOOK_ID } };
}

const agentId = await upsertAgent(agent);
console.log(`tools: ${toolIds.join(", ")}`);
console.log(`ELEVENLABS_AGENT_ID=${agentId}`);
