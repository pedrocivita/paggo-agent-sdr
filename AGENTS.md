<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md - Paggo voice SDR agent

The file every coding agent reads first; `CLAUDE.md` only imports it. Only what holds today: history
is in git, the plan and the running state in `docs/`. `next dev` rewrites the block above between its
markers; project rules stay below it.

## What it is

- Take-home case for Paggo, due Tue 2026-10-20. A lead fills a form, an eve agent researches the
  person and the company and writes a briefing, an ElevenLabs voice agent talks to the lead,
  qualifies with SPICED and books a meeting on Paggo's fake calendar, and an internal panel shows
  form, research, conversation and the trail of every tool call.
- The brief and the judging criteria: `docs/case.md`. Every piece serves a Crítico or Alto
  criterion, or it stays out.
- Running state and next steps: `docs/STATUS.md`. Decisions with their "why": `DECISIONS.md`.
  Index of all docs: `docs/README.md`.

## Stack

| Piece | Choice | Where |
| --- | --- | --- |
| Web app | Next.js 16.4 App Router (Turbopack, `cacheComponents`, `proxy.ts`) on Vercel | `app/` |
| Research agent | eve 0.80.1, exact pin, mounted by `withEve` at `/eve/v1/*`; Claude Sonnet 5.5 direct | `agent/` |
| Voice | ElevenLabs Agents, React SDK in the browser, `gemini-2.5-flash` | `voice/`, spec in `docs/voice-agent.md` |
| Data | Postgres through `postgres` (porsager), two tables | `db/schema.sql`, `lib/db.ts` |
| Company data | BrasilAPI (Receita mirror) | `lib/cnpj.ts` |
| Web search | Exa | `lib/search.ts` |

## Commands

Node 24 is required: the eve CLI refuses older versions.

```bash
npm install
npm run dev          # http://localhost:3000, eve mounted at /eve/v1
npm test             # vitest
npm run typecheck
npm run lint
npm run build        # runs db/schema.sql first when DATABASE_URL is set
npm run eval         # eve eval: the 6 hard research cases with real tools (about US$ 0.40)
node --env-file=<key file> scripts/voice-sync.mjs   # publish voice/ to an ElevenLabs account
node --env-file=<key file> scripts/voice-simulate.mjs <persona>   # text-only call with a simulated lead
npx next typegen     # regenerates PageProps/RouteContext types after adding a route
```

Gates before every push: test, typecheck, lint and build, all green.

## Environment

- Local secrets in `.env.local` (gitignored), from `.env.example`; `vercel env pull` fills it once
  the Vercel project exists. Production secrets live only in Vercel env vars. Never commit, print
  or paste a secret; log its length only.
- Without `AGENDA_URL` and `AGENDA_TOKEN` the fake calendar in `lib/agenda.ts` answers. Without
  `EXA_API_KEY` the `web_search` tool fails and the agent goes on with site and Receita. Without
  `ANTHROPIC_API_KEY` the research fails and the lead is marked "failed".
- `.env.local` from `vercel env pull` points at the same Neon database as production: local test
  leads show up in the production panel.
- Pedro works on Windows 11: Git Bash in Claude Code, PowerShell elsewhere. Scripts `.ps1` and
  `.sh` are pure ASCII.

## How it works

1. `app/actions.ts` `submitLead` saves the lead and runs `runResearch` inside `after()`; the page
   `/l/[id]` polls `/api/leads/[id]` every 2 s.
2. `lib/research.ts` opens an eve session with `outputSchema: BriefingSchema`; the agent follows
   `agent/instructions.md` and calls `fetch_site`, `lookup_cnpj` and `web_search`.
3. Every tool body runs inside `traced(run, tool, input, fn)` (`lib/trace.ts`): one row in `events`
   per call with input, output, URLs found, ms and ok or error. Research rows get the lead id
   afterwards (`linkRunToLead`).
4. Voice: the browser gets a conversation token from our server and starts the session
   with the briefing as dynamic variables; the agent's webhook tools call `/api/agenda/*` (traced,
   `run.kind = "voice"`); the post-call webhook stores transcript, summary and collected data.
5. `/painel` (basic auth in `proxy.ts`) lists leads; `/painel/[id]` has 5 tabs: Formulário,
   Pesquisa, Conversa estruturada, Transcrição, Rastro.

Diagrams, contracts and the file map: `docs/architecture.md`.

## Rules

- Simplest end-to-end flow first, then refine. Before adding a library, layer or abstraction, name
  the case criterion it serves; if none, it does not go in.
- Every relevant decision gets one row in `DECISIONS.md`: what was chosen and why this and not the
  alternative, short enough to defend in a conversation.
- Every research and choice also goes to `docs/reasoning.md` as it happens: what was looked at, the
  options, what was chosen, why not the others, and the proof (measurement, source or live test).
- Every tool call of any agent goes through `traced()`. An untraced tool does not ship: the trail
  is a critical criterion.
- The briefing never invents: a fact not found is "não encontrado" with `source: null`. Never store
  or speak CPF, age or personal data of partners.
- Missing credentials: a fake behind the same interface, switched by env vars (see `lib/agenda.ts`).
- UI uses Paggo's tokens and classes in `app/paggo.css`; new CSS goes to `app/app.css`. No UI
  library. See `docs/design.md`.
- Few files, obvious names, small functions, no dead code. Comments say why, not what.
- Logic reused from Pedro's other projects is rewritten, never copied, and never uses their keys or
  systems.

## Gotchas (proved 2026-10-16)

- eve is pre-1.0: keep the exact version and read `node_modules/eve/docs` before touching agent
  APIs. `ClientSession` has no `id`; use `session.state.sessionId`.
- `eve build` needs `just-bash` (dev dependency) for the local sandbox fallback.
  `defaultTools: false` turns off bash, file and web tools: only our 3 tools exist.
- The channel auth `[vercelOidc(), localDev()]` works in production: `lib/research.ts` reaches the
  agent at `VERCEL_URL` with the project's OIDC token, even though that URL answers 302 to a
  browser because of Deployment Protection (proved 2026-10-16).
- The AI Gateway refuses gateway model ids on this team (`customer_verification_required`, paid
  credits needed); the agent calls Anthropic directly with `anthropic()` (2026-10-16).
- With `cacheComponents`, a page that reads the database must `await connection()`, or the build
  tries to prerender it and fails without `DATABASE_URL`.
- BrasilAPI answers 403 without a `user-agent` header. MEI legal names end with the owner's CPF:
  `withoutCpf()` strips it.
- A company site can show an unrelated CNPJ (paggo.com.br lists a MEI from another city next to its
  own); the instructions make the agent flag a CNPJ whose name does not match the form.
- ESLint must ignore `.eve/` and `.output/` (eve build output); both are gitignored.
- A voice prompt rule goes in the section where the action happens (Agenda, first question):
  `gemini-2.5-flash` skipped the decision question and hung up mid-call while the rules lived only
  under Objetivo (2026-10-17).

## Working with Pedro

- Prose to Pedro in pt-BR, informal, short sentences, correct accents. Code, commits, branches and
  file names in en-US. Never the em dash (U+2014), never a hyphen in place of a comma, no emoji.
- He steers; the agent builds and explains the code in simple words. Before a multi-file change,
  say in one line what you will build, then one status line per step.
- Commits go straight to `main` (his choice for this case), one logical change each, message in
  en-US saying why. Run `git status` before committing. Never amend or force-push without asking.
- Ask before creating or changing accounts or projects (Vercel, Neon, ElevenLabs), publishing or
  sending anything. Keys go straight into Vercel env vars, never into chat or git.
- Prove it live before calling it done; green checks are not enough. UI is approved on a
  screenshot, not on a description.
- The judges will read this repo: no personal notes, no real lead data, no secrets.

## Session

At the start:
1. `git pull --ff-only`
2. Read `docs/STATUS.md`. A version, pin or "not done" there is a record, not the state: check the
   code before building on it.
3. Pick the next step by the criteria table in `docs/case.md`: Crítico before Alto before Médio.

Before pushing:
4. Rewrite `docs/STATUS.md` (replace, do not append): what changed, what is proven and how, what is
   not, next steps, traps. End with `Agent: <tool/model>`.
5. New decision? One row in `DECISIONS.md`.
6. A mistake a rule would have prevented? One line under Gotchas, with the date.
