# Changelog

## [2026-06-28] - Overhaul & Refactoring

### Changed
- **Reframed Token Usage to Cost:** Shifted focus from raw token reduction to cost-efficiency via model routing, while keeping context discipline as a separate token-reduction lever.
- **Clarified Manual Routing:** Explicitly documented that routing is manual (user-selected) with automated escalation, rather than fully automated classification.
- **Rewrote Token Tracker:** Overhauled `token-tracker.js` into a multi-model baseline-vs-routed cost tracker using a real, dated pricing table.
- **Updated Secrets Handling:** Configured `.gitignore` to strictly ignore `.env` and `.env.*` while preserving `.env.example`.

### Added
- **`litellm_config.yaml`:** Configured a single local endpoint (`http://localhost:4000`) with aliases (`plan`, `code`, `local`, `claude`, `claude-deep`) and automatic technical fallbacks.
- **`.clinerules`:** Added quality-based escalation rules for Cline to transition to Claude when cheap models struggle.
- **`.aider.conf.yml`:** Configured Aider to split architect (`plan`) and editor (`code`) modes and automatically load project conventions.
- **`ROUTING.md`:** Documented the LiteLLM proxy setup, Cline/Aider integration, and the trade-offs of adding RouteLLM.
- **`CONVENTIONS.md`:** Created a durable project guide for contributors and AI agents.
- **`tasks.md`:** Established a fixed benchmark suite of 10 generic coding tasks to measure routing performance.
