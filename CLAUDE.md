@AGENTS.md

# Claude Code only

Everything about the project is in `AGENTS.md`, imported above, so every coding agent reads the
same rules. This part holds only what is specific to Claude Code.

- Start of a session: follow the Session section of `AGENTS.md`; `docs/STATUS.md` says what to do
  next.
- Dev server: `.claude/launch.json` (`next-dev` on :3000). Start it with the preview tools, not
  through Bash, and look at the page in the Browser pane before calling UI work done.
- Voice is tested only with a real microphone in a real browser; a green build proves nothing about
  the conversation.
- Before an eve or ElevenLabs API change, read `node_modules/eve/docs` or the verified facts in
  `docs/voice-agent.md`; search the web only for what is still open there.
- Subagents: `Explore` for wide searches. For high-stakes checks (briefing correctness, the
  deliverable docs), a fresh subagent reviews the work without the conversation's context.
- Plans and decisions live in `docs/` and `DECISIONS.md`, never only in a tool's private folder.
  Auto memory keeps only gotchas of Claude Code tools.
