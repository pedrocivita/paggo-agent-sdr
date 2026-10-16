import { defineAgent } from "eve";

export default defineAgent({
  // Static AI Gateway model id: on Vercel it authenticates with the project's OIDC, no key needed.
  model: "openai/gpt-6-luna-fast",
  reasoning: "low",
  // Only our three tools: no shell, files, built-in fetch or built-in search.
  defaultTools: false,
});
