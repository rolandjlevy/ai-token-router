/**
 * Token + Cost Tracker
 * -------------------------------------------------------------------------
 * Measures the REAL saving from model routing instead of asserting it.
 *
 * The headline metric ("reduce spend by X%") only means something if it's
 * measured. This tracker records token usage per model across a run, prices
 * each model from a table, and compares the actual routed cost against a
 * counterfactual baseline (what the same work would have cost if every call
 * had gone to one expensive model, e.g. Claude Opus). That delta is your
 * real, defensible savings number.
 *
 * Key distinction this makes visible:
 *   - routing cuts COST  (same tokens, lower $/token)
 *   - context discipline cuts TOKENS (fewer tokens sent)
 * Because it logs tokens AND cost per model, you can see that routing barely
 * moves token counts while it moves cost a lot.
 *
 * Pricing note: USD per 1M tokens, standard/global rates, verified
 * 2026-06-28 from each provider's pricing page. Prices change often —
 * re-check before trusting the absolute numbers (the % comparison is robust
 * to staleness as long as the whole table is updated together).
 */

export const MODEL_PRICING = {
  // Anthropic
  'claude-opus-4-8': { label: 'Claude Opus 4.8', input: 5.0, output: 25.0 },
  'claude-sonnet-4-6': { label: 'Claude Sonnet 4.6', input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { label: 'Claude Haiku 4.5', input: 1.0, output: 5.0 },
  // Google Gemini
  'gemini-3.5-flash': { label: 'Gemini 3.5 Flash', input: 1.5, output: 9.0 },
  'gemini-3.1-flash-lite': {
    label: 'Gemini 3.1 Flash-Lite',
    input: 0.25,
    output: 1.5,
  },
  'gemini-3.1-pro': { label: 'Gemini 3.1 Pro', input: 2.0, output: 12.0 },
  // DeepSeek (deepseek-chat / deepseek-reasoner alias V4 Flash; aliases retire 2026-07-24)
  'deepseek-v4-flash': {
    label: 'DeepSeek V4 Flash',
    input: 0.14,
    output: 0.28,
  },
  'deepseek-v4-pro': { label: 'DeepSeek V4 Pro', input: 1.74, output: 3.48 },
  // Local
  local: { label: 'Local (Ollama)', input: 0.0, output: 0.0 },
};

const round = (n, dp = 6) => Number(n.toFixed(dp));

export class TokenTracker {
  /**
   * @param {Object} [opts]
   * @param {Object} [opts.pricing]        - model pricing table (defaults to MODEL_PRICING)
   * @param {string} [opts.baselineModel]  - model the counterfactual prices everything at
   * @param {boolean} [opts.logEachCall]   - print a line per tracked call (default true)
   */
  constructor({
    pricing = MODEL_PRICING,
    baselineModel = 'claude-opus-4-8',
    logEachCall = true,
  } = {}) {
    this.pricing = pricing;
    this.baselineModel = baselineModel;
    this.logEachCall = logEachCall;
    /** @type {Record<string, {input:number, output:number, calls:number}>} */
    this.usage = {};
  }

  /**
   * Normalise the various provider usage shapes into { input, output }.
   * Supports Anthropic, OpenAI-compatible (DeepSeek, OpenRouter), and Gemini native.
   */
  static normaliseUsage(response = {}) {
    if (response.input != null && response.output != null) {
      return { input: response.input, output: response.output };
    }
    const u = response.usage || response.usageMetadata || {};
    const input = u.input_tokens ?? u.prompt_tokens ?? u.promptTokenCount ?? 0;
    const output =
      u.output_tokens ?? u.completion_tokens ?? u.candidatesTokenCount ?? 0;
    return { input, output };
  }

  /**
   * Record one API call.
   * @param {string} model    - a key in the pricing table
   * @param {Object} response - the API response (or a plain { input, output } object)
   */
  track(model, response) {
    if (!this.pricing[model]) {
      throw new Error(`Unknown model "${model}". Add it to the pricing table.`);
    }
    const { input, output } = TokenTracker.normaliseUsage(response);
    const bucket = (this.usage[model] ??= { input: 0, output: 0, calls: 0 });
    bucket.input += input;
    bucket.output += output;
    bucket.calls += 1;

    if (this.logEachCall) {
      const callCost = this.#cost(model, input, output);
      console.log(
        `📊 ${this.pricing[model].label.padEnd(22)} in:${String(input).padStart(7)} out:${String(
          output,
        ).padStart(7)}  $${callCost.toFixed(6)}`,
      );
    }
    return { input, output };
  }

  #cost(model, input, output) {
    const p = this.pricing[model];
    return (input / 1_000_000) * p.input + (output / 1_000_000) * p.output;
  }

  /** Actual cost of everything tracked, at each model's own price. */
  actualCost() {
    return round(
      Object.entries(this.usage).reduce(
        (sum, [model, u]) => sum + this.#cost(model, u.input, u.output),
        0,
      ),
    );
  }

  /**
   * Counterfactual: what the SAME tokens would have cost if every call had
   * gone to the baseline model. This is the honest "vs all-Opus" comparison.
   */
  baselineCost(baselineModel = this.baselineModel) {
    return round(
      Object.values(this.usage).reduce(
        (sum, u) => sum + this.#cost(baselineModel, u.input, u.output),
        0,
      ),
    );
  }

  totals() {
    const input = Object.values(this.usage).reduce((s, u) => s + u.input, 0);
    const output = Object.values(this.usage).reduce((s, u) => s + u.output, 0);
    return { input, output, total: input + output };
  }

  /** The headline number: { baseline, actual, saved, pct }. */
  savings(baselineModel = this.baselineModel) {
    const baseline = this.baselineCost(baselineModel);
    const actual = this.actualCost();
    const saved = round(baseline - actual);
    const pct = baseline === 0 ? 0 : round((saved / baseline) * 100, 1);
    return { baseline, actual, saved, pct };
  }

  /** Pretty per-model + summary report. This is what you screenshot for the README. */
  report() {
    const { input, output, total } = this.totals();
    console.log('\n──────────────── Token + Cost Report ────────────────');
    for (const [model, u] of Object.entries(this.usage)) {
      const cost = this.#cost(model, u.input, u.output);
      console.log(
        `${this.pricing[model].label.padEnd(22)} ${String(u.calls).padStart(3)} calls  ` +
          `in:${String(u.input).padStart(8)} out:${String(u.output).padStart(8)}  $${cost.toFixed(6)}`,
      );
    }
    console.log('─────────────────────────────────────────────────────');
    console.log(`Tokens:  input ${input}  output ${output}  total ${total}`);

    const s = this.savings();
    console.log(
      `Cost:    routed $${s.actual.toFixed(6)}  vs baseline (${this.pricing[this.baselineModel].label}) $${s.baseline.toFixed(
        6,
      )}`,
    );
    console.log(
      `Saving:  $${s.saved.toFixed(6)}  (${s.pct}% cheaper than all-${this.pricing[this.baselineModel].label})`,
    );
    console.log('─────────────────────────────────────────────────────\n');
    return s;
  }

  reset() {
    this.usage = {};
  }
}

export default TokenTracker;

/* ----------------------------------------------------------------------- *
 * Demo: `node token-tracker.js` runs a fake baseline-vs-routed comparison.
 * Replace these synthetic calls with real responses from your task suite.
 * ----------------------------------------------------------------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const t = new TokenTracker({ baselineModel: 'claude-opus-4-8' });

  // Simulated run over a fixed task set, routed per the cheat-sheet.
  t.track('gemini-3.1-flash-lite', { input: 12000, output: 3000 }); // planning
  t.track('deepseek-v4-flash', { input: 40000, output: 12000 }); // coding
  t.track('deepseek-v4-flash', { input: 25000, output: 8000 }); // refactor
  t.track('local', { input: 8000, output: 1500 }); // tiny edit
  t.track('claude-opus-4-8', { input: 15000, output: 5000 }); // one hard task (fallback)

  t.report();
}
