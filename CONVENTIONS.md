# TokenRouter Conventions

## What is TokenRouter?
TokenRouter is a cost-control workflow and tooling setup for AI-assisted coding. It is **not** an automated router (e.g., RouteLLM classifier). Instead, routing is **manual**: you choose the model per task, while the LiteLLM proxy and `.clinerules` handle automatic **escalation**.

## Two Levers of Cost Control
1. **Model Routing (Cuts Cost):** Sends the same tokens to cheaper models, reducing the average $/token.
2. **Context Discipline (Cuts Token Count):** Keeps token counts low by starting new sessions per task, using diffs instead of full rewrites, and never loading the entire repository.

## Architecture & Model Aliases
Cline (VS Code) and Aider (terminal) act as front-ends pointing to a single LiteLLM proxy running at `http://localhost:4000`. The proxy exposes these aliases:
- `plan` (Gemini 3.5 Flash) — for planning and architecture.
- `code` (DeepSeek V4 Flash) — for routine coding and edits.
- `local` (Ollama Qwen 2.5 Coder) — for trivial or offline edits.
- `claude` (Claude Sonnet 4.6) — for complex reasoning.
- `claude-deep` (Claude Opus 4.8) — for the hardest tasks.

## Two-Layer Escalation Model
- **Technical Escalation (LiteLLM Proxy):** Automatically escalates to Claude on rate-limits, 5xx errors, or context-window overflows via `fallbacks` in `litellm_config.yaml`.
- **Quality Escalation (Agent/User):** Escalates to Claude based on `.clinerules` when:
  - Tests or builds fail after a cheap-model diff and a single retry on `code` fails.
  - The task touches more than 3 files or requires cross-cutting architectural changes.
  - Two consecutive attempts fail on the same sub-task.
  - Code is security- or data-sensitive (auth, crypto, migrations, payments).
  - Requirements are ambiguous or underspecified.
  - Subtle correctness risks exist (concurrency, race conditions, timezones).

## Measuring Savings
The target of 70–95% savings is a metric to **measure**, not a guarantee. We use `token-tracker.js` to compare the actual routed cost against a counterfactual baseline where every call ran on Claude Opus.
- **Limitation:** Cheaper models are weaker. A misrouted task can cost more in rework than it saves.
- **Concentration:** A single Claude call can dominate a routed run's cost; monitor where spend lands.

## Secrets & Environment
- Never commit real keys. `.gitignore` ignores `.env` and `.env.*`.
- Required keys: `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, and `LITELLM_MASTER_KEY`.
- In GitHub Codespaces, prefer repo Codespaces secrets over a `.env` file.
