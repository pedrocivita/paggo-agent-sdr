import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  // Direct Anthropic call with our own ANTHROPIC_API_KEY: the AI Gateway needs paid credits
  // for this class of model.
  model: anthropic("claude-sonnet-5-5"),
  reasoning: "low",
  // Only our three tools: no shell, files, built-in fetch or built-in search.
  defaultTools: false,
});
