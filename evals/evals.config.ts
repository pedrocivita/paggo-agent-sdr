import { defineEvalConfig } from "eve/evals";

export default defineEvalConfig({
  // Real sites, Receita and Exa: a few at a time keeps BrasilAPI from answering 429.
  maxConcurrency: 3,
  timeoutMs: 120_000,
});
