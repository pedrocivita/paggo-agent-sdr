# Decisions

One line each: what was chosen, and why it and not the alternative.

| Decision | Chosen | Why this and not the other |
| --- | --- | --- |
| Shape | One Next.js app on Vercel | Form, panel, agent and webhooks in one deploy and one link; two services would double the setup for no gain in the case. |
| Research agent | eve, one agent with 3 tools | It is the format Paggo's team uses and reads. The AI SDK alone would be one framework less, but a format the reviewers do not use daily. |
| Voice | ElevenLabs Agents, voice on the site | Turn taking, interruptions and latency come solved; building STT + LLM + TTS by hand would spend the time on plumbing instead of the agent. |
| Channel | Browser voice now, phone later | The case says the channel matters less. Web needs no number or WhatsApp approval; the same agent can take calls later. |
| Research flow | The agent follows an order written in its instructions | One path to read and debug. Hard-coded steps before the agent would be a second path doing the same work. |
| Company data | BrasilAPI (Receita mirror), logic rewritten from Action's `cnpj_lookup.py` | Free, public, already proven in production. Only works by CNPJ, so the CNPJ comes from the company site first. |
| CNPJ rules | Alphanumeric CNPJ accepted | Valid since July 2026; a digits-only check would reject every company opened after it. |
| Web search | Exa as an explicit tool | Every search lands in the trail with its query and results, which a model's built-in search hides. |
| Structured output | eve `outputSchema` with one Zod schema | The same schema types the voice variables and the panel; the result is validated before it is saved. |
| Trail | `traced()` around every tool, one row per call in `events` | It is the critical criterion: one rule for research and voice, nothing to remember per tool. |
| Database | Postgres, two tables (`leads`, `events`) | The lead keeps form, briefing and conversation as jsonb; a third table would not pay for itself. |
| Database host | Neon Free via the Vercel Marketplace, region iad1 | It fills `DATABASE_URL` in every environment by itself and sits in the same region as the functions; a separate Neon account would mean copying secrets by hand. |
| Research model | Claude Sonnet 5.5, called directly with `ANTHROPIC_API_KEY` | The AI Gateway needs paid credits for this class of model. Against Haiku 5.5 on the same lead it was faster (25 s vs 36 s) and judged better (flagged a test lead, kept to SPICED); Haiku costs a tenth (US$ 0.006 vs 0.056 per briefing), irrelevant at the case's volume. |
| Migrations | `db/schema.sql` run before each build | Idempotent `create if not exists`; no migration tool for two tables. |
| Calendar | Behind an interface, with a fake until the real one arrives | The whole flow runs today; switching is two environment variables. |
| Panel access | One password via browser basic auth | It holds lead data, but a login system would be over-engineering for the case. |
| Research timing | Runs after the response (`after()`), the page polls every 2 s | The lead sees the waiting page at once; polling needs no open connection on Vercel. |
| Agent context | `AGENTS.md` as the single source, `CLAUDE.md` imports it, `docs/STATUS.md` as running state | Every coding agent reads the same rules; a state file in the repo survives sessions and tools, a tool's private memory does not. |
