# TokenRouter — Claude Code Router + Agent Stack (Codespaces Edition)

A cloud-based AI coding workflow that mimics Claude Code behavior while minimizing token costs by routing tasks across multiple models.

---

# 🧠 Core Idea

TokenRouter does **not replace Claude Code**.

Instead, it decouples:

> Coding workflow (UI + agents)
> from
> Model intelligence (Claude / Gemini / DeepSeek / Local)

This allows you to:

* reduce Claude usage
* use free/cheap models where possible
* keep a Claude Code–like developer experience

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

---

# ⚙️ Components

## 1. GitHub Codespaces

* Cloud-based VS Code environment
* No local machine required
* Full terminal + extensions

---

## 2. Cline (Primary Agent Interface)

* VS Code agent extension
* Handles file edits, terminal actions, reasoning loops

Configured rules:

* Only modify required files
* Prefer diffs over full rewrites
* Ask before expanding scope
* Work step-by-step

---

## 3. Aider (Terminal Agent)

* Git-aware coding assistant
* Lightweight, fast, diff-based edits

Use for:

* small scoped changes
* refactors
* safe incremental edits

---

## 4. Model Routing Layer

### 🟢 Gemini (Default)

Use for:

* planning
* architecture
* debugging strategy
* multi-step breakdowns

### 🟡 DeepSeek

Use for:

* coding tasks
* boilerplate
* refactors

### 🔵 Local Models (optional via Ollama)

Use for:

* small edits
* offline or cheap tasks

### 🔴 Claude (Fallback)

Use only for:

* complex reasoning
* deep debugging
* architecture decisions

---

# 🧩 Workflow Rules (Critical)

## Rule 1 — New task = new session

Avoid carrying unrelated context.

## Rule 2 — Never load full repo

Only inspect files relevant to the task.

## Rule 3 — Always prefer diffs

Request only modified functions or lines.

## Rule 4 — Plan before coding

Use Gemini to break tasks into steps.

## Rule 5 — Minimize logs and context

Do not paste full logs or large files.

---

# 💰 Cost Strategy

Token usage is reduced by routing tasks:

* 60–80% → free models (Gemini + local)
* 15–30% → cheap models (DeepSeek)
* 5–10% → Claude (high-value tasks only)

---

# 🚀 Setup Summary

1. Create GitHub Codespace
2. Install Cline extension
3. Configure Gemini API key
4. Install Aider:

   ```
   pip install aider-chat
   ```
5. (Optional) Add DeepSeek + Ollama
6. Apply workflow rules above

---

# 🎯 Outcome

TokenRouter creates a developer environment that:

* behaves like Claude Code
* runs entirely in the cloud (Codespaces)
* minimizes reliance on expensive models
* scales from free → premium intelligence layers

---

# ⚠️ Key Principle

You are not reducing intelligence.

You are routing intelligence efficiently.

---
