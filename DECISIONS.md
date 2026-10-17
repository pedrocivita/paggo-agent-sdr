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
| Voice config | JSON and markdown in `voice/`, published by `scripts/voice-sync.mjs` through the REST API | The official agents CLI is deprecated and its Rust successor does not create secrets or webhooks; a script of 80 lines does all of it, finds everything by name and keeps the prompt a readable file. |
| Voice defaults | `gemini-2.5-flash` with no reasoning, `eleven_v4_turbo`, auth on, one 7-second turn timeout | Fast defaults for a first real call; latency is a high criterion, so the LLM gets measured against 2 or 3 others before it is final. Auth on means no session opens without our token. |
| Agent knowledge | A short block of Paggo facts inside the prompt, from `docs/paggo.md` | The material is small; a retrieval knowledge base would add a lookup to every answer for no gain. |
| Research steps | Site, person search and (for personal e-mail) CNPJ search in parallel; then Receita plus one SPE search | Across 6 hard cases the agent never searched the lead's role or the group's SPEs, the two facts the voice opens with; in parallel they kept the briefing at 23 s on average, sequential steps would add about 5 s each. |
| Registry source | Every CNPJ goes through `lookup_cnpj`; aggregator sites only find the number | Aggregators matched the Receita in the test, but skipping the lookup lost the tax regime, which moves the fit. |
| Lead from Paggo itself | Research Paggo like any company, fit "desconhecido", voice runs a normal conversation | The judges will likely type their own @paggo.com.br e-mail while playing a client; fit "baixo" or "is this a test?" would end the call they came to judge. |
| Module hint | `forAgent` names 1 or 2 Paggo modules from a signal table (many SPEs, sells off-plan, many suppliers) | The voice may cite one module after a pain; picking it from research beats the voice guessing mid-call. Marked as a hint, never a fact about the lead. |
| Migrations | `db/schema.sql` run before each build | Idempotent `create if not exists`; no migration tool for two tables. |
| Calendar | Behind an interface, with a fake until the real one arrives | The whole flow runs today; switching is two environment variables. |
| Panel access | One password via browser basic auth | It holds lead data, but a login system would be over-engineering for the case. |
| Research timing | Runs after the response (`after()`), the page polls every 2 s | The lead sees the waiting page at once; polling needs no open connection on Vercel. |
| Agent context | `AGENTS.md` as the single source, `CLAUDE.md` imports it, `docs/STATUS.md` as running state | Every coding agent reads the same rules; a state file in the repo survives sessions and tools, a tool's private memory does not. |
