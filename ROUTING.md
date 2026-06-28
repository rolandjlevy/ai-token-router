# Routing (LiteLLM) — making the "Model Router" real

This turns the manual cheat-sheet into an actual endpoint. One URL
(`http://localhost:4000`), one key, every model behind an alias, with
automatic escalation to Claude on technical failure.

## What is and isn't automated

| Concern | Handled by | Automatic? |
| --- | --- | --- |
| One endpoint for all models | LiteLLM proxy | ✅ |
| Alias the cheat-sheet (`plan`/`code`/`local`/`claude`) | `litellm_config.yaml` | ✅ |
| Escalate on rate-limit / 5xx / context overflow | LiteLLM `fallbacks` | ✅ |
| Spend tracking per request | LiteLLM | ✅ |
| Pick `plan` vs `code` to start | Cline Plan/Act · Aider architect/editor | manual / per-mode |
| Escalate because **tests failed** or task is too big | `.clinerules` | agent-driven |
| Decide easy-vs-hard by reading the prompt | RouteLLM/classifier (not installed) | ❌ — see below |

## 1. Run the proxy

```bash
pip install 'litellm[proxy]'
litellm --config litellm_config.yaml --port 4000
```

Needs these in the environment (`.env` locally, or Codespaces secrets):
`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, and a
`LITELLM_MASTER_KEY` you invent (clients authenticate with it).

Smoke test:

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"code","messages":[{"role":"user","content":"ping"}]}'
```

## 2. Point Cline at it

Cline → settings → **API Provider: OpenAI Compatible**:
- Base URL: `http://localhost:4000/v1`
- API Key: your `LITELLM_MASTER_KEY`
- Model ID: `code` (or `plan` / `claude`)

Cline lets you set **different models for Plan vs Act mode** — use `plan` for
Plan, `code` for Act. The escalation rules live in `.clinerules` (already in the
repo root; Cline loads it automatically).

## 3. Point Aider at it

`.aider.conf.yml` is already configured to use the proxy with the
architect(`plan`)/editor(`code`) split. Just run `aider`. For one hard task:

```bash
aider --model openai/claude --editor-model openai/claude
```

## 4. (Optional) true difficulty-based auto-routing — RouteLLM

The piece still missing is automatically deciding *easy vs hard* from the
prompt. [RouteLLM](https://github.com/lm-sys/RouteLLM) trains a classifier to
send each request to a strong or weak model based on predicted difficulty.

Weigh it honestly before adding it:

- **Cost:** the classifier itself adds latency and (if LLM-based) tokens to
  every request — you pay a small tax on the easy cases you were trying to make
  cheap.
- **The cheaper pattern already exists here:** "start cheap, escalate on
  failure" (LiteLLM fallbacks + `.clinerules`) captures most of the saving
  without predicting anything. A misroute just falls back; it doesn't need to
  be foreseen.
- **Recommendation:** ship the fallback approach, measure the real % with
  `token-tracker.js` over your fixed task set, and only add a classifier if the
  data shows a lot of spend going to tasks the cheap models could have handled.
  Predict difficulty only once you can prove the prediction pays for itself.
