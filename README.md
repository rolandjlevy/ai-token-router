# 🚀 TokenRouter — Claude Code Router + Agent Stack (Codespaces Edition)

![Codespaces](https://img.shields.io/badge/Works%20in-Codespaces-blue?logo=github)
![VS Code](https://img.shields.io/badge/VS%20Code-Compatible-blue?logo=visualstudiocode)
![AI Stack](https://img.shields.io/badge/AI-Agent%20Router-green)
![Cost Optimized](https://img.shields.io/badge/Cost-Optimized-orange)

> A cloud-based AI coding workflow that mimics a Claude Code experience while cutting cost by routing tasks across multiple models.

> **Status:** routing is currently **manual** — you pick the model per task using the cheat-sheet below. Automatic model selection is on the [roadmap](#-roadmap). This repo is a workflow + a cost-measurement tool, not (yet) an automated router.

---

# 🧠 What is TokenRouter?

TokenRouter keeps a Claude Code-style workflow while spreading the work across cheaper models:

- **Gemini** → planning
- **DeepSeek** → coding
- **Aider** → git operations
- **Claude** → fallback for the hard stuff

Two different levers are doing the work, and it's worth keeping them straight:

- **Routing cuts cost** — the same task sent to DeepSeek instead of Claude uses roughly the _same tokens_, but the price per token is far lower.
- **Context discipline cuts tokens** — the [workflow rules](#-workflow-rules-critical) (small sessions, diffs not rewrites, don't load the whole repo) genuinely reduce how many tokens you send, on any model.

---

# 💰 Goal

Cut frontier-model (Claude) **spend** by routing most work to cheap or free models, reserving Claude for tasks that justify it.

Target: **70–95% lower cost** vs running everything on a top-tier model — but treat that as a hypothesis to **measure**, not a guarantee. `token-tracker.js` computes your real number from your own routing mix (see [Measuring the saving](#-measuring-the-saving)).

---

# 🧠 Core Idea

TokenRouter does **not replace Claude Code**. It decouples:

> Coding workflow (UI + agents) — from — Model intelligence (Claude / Gemini / DeepSeek / Local)

So you can use cheap models where they're good enough, escalate to Claude where they aren't, and keep a familiar developer experience throughout.

---

# 🏗️ System Architecture

```
GitHub Codespaces (VS Code Cloud)
                ↓
           Cline (Agent Layer)
                ↓
   ┌────────────┼────────────┐
   ↓            ↓            ↓
Gemini      DeepSeek      Aider
(planning)   (coding)     (git diffs)
                ↓
        Claude (fallback only)
```

> The "router" above is **you + the cheat-sheet** today, not a piece of software. See the [roadmap](#-roadmap) for making it automatic.

---

# 💵 Model Pricing & Routing Cheat-Sheet

Prices are USD per **1M tokens** (input / output), standard rates, **verified 2026-06-28**. Re-check before trusting — provider prices move often.

| Model                 | Role                           | Input | Output | Notes                                                                  |
| --------------------- | ------------------------------ | ----: | -----: | ---------------------------------------------------------------------- |
| Local (Ollama)        | tiny / offline edits           | $0.00 |  $0.00 | free; you pay in quality + hardware                                    |
| DeepSeek V4 Flash     | coding, refactors, boilerplate | $0.14 |  $0.28 | cheapest hosted; `deepseek-chat`/`-reasoner` aliases retire 2026-07-24 |
| Gemini 3.1 Flash-Lite | planning, classification       | $0.25 |  $1.50 | free tier with reduced quota                                           |
| Gemini 3.5 Flash      | planning, multi-step           | $1.50 |  $9.00 | free tier with reduced quota                                           |
| Gemini 3.1 Pro        | hard planning/architecture     | $2.00 | $12.00 | **paid only** since 2026-04-01                                         |
| Claude Haiku 4.5      | cheap fallback                 | $1.00 |  $5.00 |                                                                        |
| Claude Sonnet 4.6     | balanced fallback              | $3.00 | $15.00 |                                                                        |
| Claude Opus 4.8       | hardest reasoning / deep debug | $5.00 | $25.00 | use sparingly                                                          |

The spread is the whole point: DeepSeek V4 Flash output ($0.28) is roughly **90× cheaper** than Claude Opus 4.8 output ($25.00). Routing even half your work off the top tier is a large cost cut.

> "Free" with care: only local models are truly free. Gemini Flash/Flash-Lite have a **rate-limited** free tier (Gemini Pro is paid-only since April 2026); DeepSeek gives new accounts a one-off ~5M-token grant, then bills per token.

---

# 🧩 Setup

1. Open the repo in **GitHub Codespaces**.
2. Install the **Cline** extension (or `npm i -g cline`).
3. Install **Aider**: `pip install aider-chat`.
4. Provide API keys (see [Secrets](#-secrets-do-this-properly) — don't commit a `.env`).
5. Apply the [workflow rules](#-workflow-rules-critical).
6. Run `aider` (or drive Cline) to start working through TokenRouter.

## 🔐 Secrets (do this properly)

Never commit real keys. Use this `.gitignore`:

```gitignore
# secrets — never commit
.env
.env.*
# …except the template
!.env.example
```

Then:

- Commit a **`.env.example`** with every key _name_ and blank values, as documentation.
- For local work, put real keys in **`.env`** (ignored above).
- For Codespaces, prefer **GitHub → Settings → Secrets and variables → Codespaces** so keys are injected as env vars and no secret file ever exists in the cloud — nothing to leak, rotate in one place.

Keys you'll need: `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, and (optional) `ANTHROPIC_API_KEY`.

---

# ⚙️ Components

## 1. GitHub Codespaces

Cloud VS Code — no local machine, full terminal + extensions.

## 2. Cline (primary agent interface)

VS Code agent that handles file edits, terminal actions, and reasoning loops. Configured rules: only modify required files, prefer diffs over full rewrites, ask before expanding scope, work step-by-step.

## 3. Aider (terminal agent)

Git-aware, diff-based assistant. Use for small scoped changes, refactors, and safe incremental edits.

## 4. Model routing layer (manual today)

- 🟢 **Gemini** — planning, architecture, debugging strategy, multi-step breakdowns
- 🟡 **DeepSeek** — coding, boilerplate, refactors
- 🔵 **Local (Ollama)** — small edits, offline/cheap tasks
- 🔴 **Claude** — complex reasoning, deep debugging, architecture decisions (fallback)

---

# 🧩 Workflow Rules (Critical)

These are what actually reduce **token count**, independent of which model you use.

1. **New task = new session** — avoid carrying unrelated context.
2. **Never load the full repo** — inspect only files relevant to the task.
3. **Always prefer diffs** — request only modified functions or lines.
4. **Plan before coding** — use a cheap model to break the task into steps.
5. **Minimize logs and context** — don't paste full logs or large files.

---

# 📊 Measuring the saving

Don't assert the 70–95% — measure it with `token-tracker.js`.

1. **Fix a task set.** Write 10–20 representative tasks (e.g. "add validation to X", "refactor component Y", "fix failing test Z") in `tasks.md`. It must be fixed so runs are comparable.
2. **Track every call.** Wrap each model response: `tracker.track('deepseek-v4-flash', response)`. The tracker handles Anthropic, OpenAI-compatible (DeepSeek), and Gemini usage shapes.
3. **Report.** `tracker.report()` prints per-model tokens + cost, and compares your **routed** cost against a **baseline** (the same tokens priced as if everything ran on Claude Opus). The `%` it prints is your real, defensible headline number.

```js
import { TokenTracker } from './token-tracker.js';
const tracker = new TokenTracker({ baselineModel: 'claude-opus-4-8' });

tracker.track('gemini-3.1-flash-lite', planningResponse);
tracker.track('deepseek-v4-flash', codingResponse);
tracker.track('claude-opus-4-8', hardTaskResponse);

tracker.report(); // → "82% cheaper than all-Claude Opus 4.8"
```

Logging tokens _and_ cost side by side also makes the core point visible: routing barely changes token counts, but moves cost a lot.

---

# ⚠️ Honest limitations

- **Cheaper models can be wrong more often.** The bet is that the _easy subset_ is good enough. A misrouted task (sent to DeepSeek/local when it needed Claude) can cost you more in debugging and re-runs than it saved — so have an escalation rule, not just "Claude = fallback".
- **One frontier call can dominate.** In a routed run, a single Opus task often accounts for most of the bill (the demo shows ~90%). Watch _where_ the spend lands, not just the average.
- **The baseline is a counterfactual.** Savings are measured against "what if everything ran on Opus" at the same token counts; real cheap-model verbosity/retries can erode it. That's the point of measuring on a fixed task set rather than assuming.

---

# 🗺️ Roadmap

- 🔥 v2: automatic model switching (wire Cline/LiteLLM to auto-select by task)
- 🧩 prebuilt `.clinerules` with an explicit escalation rule (escalate to Claude on test failure or when a task touches > N files)
- ⚙️ GitHub Actions integration for AI commits
- 📊 cost-tracking dashboard built on `token-tracker.js` output
- 🔀 a real router: front the stack with **LiteLLM** or **OpenRouter** (single OpenAI-compatible endpoint) so Cline/Aider point at one URL and routing lives in config

---

# 📎 References

- Cline — open-source coding agent for IDE + terminal: <https://github.com/cline/cline>
- Aider — terminal git-aware coding assistant: <https://aider.chat>
- LiteLLM — unified proxy/router for 100+ LLMs: <https://github.com/BerriAI/litellm>

---

# ⚠️ Key Principle

You're not removing intelligence from the loop — you're spending it where it's worth it. Cheap models do the bulk work; the frontier model is reserved for the tasks that actually need it.
