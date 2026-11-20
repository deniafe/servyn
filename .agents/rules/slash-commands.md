# Slash Commands & Custom Skills

This project includes custom workspace skills located in `.agents/skills/`. When the user invokes or references any of the following commands, the agent must immediately activate and follow the corresponding skill:

- `/architect`: Activate and execute the instructions in `.agents/skills/architect/SKILL.md`. Run a thinking session before building, surface key decisions, align on vocabulary, and output an implementation plan.
- `/recover`: Activate and execute the instructions in `.agents/skills/recover/SKILL.md`. Diagnose whether the issue is Failure Mode 1 (targeted fix), Failure Mode 2 (hard reset), or Failure Mode 3 (rethink) before taking action.
- `/remember`: Activate and execute the instructions in `.agents/skills/remember/SKILL.md`.
  - `/remember save`: Capture and save session state, decisions, and next steps to `memory.md` (no sensitive secrets).
  - `/remember restore`: Read and restore state from `memory.md` at the start of a session.
- `/review`: Activate and execute the instructions in `.agents/skills/review/SKILL.md`. Verify the completed feature in 3 layers (Plan alignment, System integrity, Production readiness) and report findings.
- `/imprint`: Activate and execute the instructions in `.agents/skills/imprint/SKILL.md`. Extract UI visual consistency patterns from recently built or specified component files and save/update them in `context/ui-registry.md` (or run `/imprint audit` to audit the codebase for inconsistencies and establish a baseline).
