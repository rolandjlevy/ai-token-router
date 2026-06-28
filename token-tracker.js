/**
 * Token Usage Tracker
 * Tracks and displays token usage for Anthropic API calls
 */

export class TokenTracker {
  constructor(modelPricing = null) {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.modelPricing = modelPricing || {
      inputTokensPer1M: 0.25,  // Default: Claude Haiku pricing
      outputTokensPer1M: 1.25,
    };
  }

  /**
   * Track token usage from an API response
   * @param {Object} response - Anthropic API response object
   */
  track(response) {
    if (response.usage) {
      this.totalInputTokens += response.usage.input_tokens;
      this.totalOutputTokens += response.usage.output_tokens;
      console.log(`\n📊 Token Usage (this call): Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);
    }
  }

  /**
   * Display total token usage summary
   */
  displayTotal() {
    const cost = this.calculateCost();
    console.log(`\n📈 Total Token Usage:`);
    console.log(`   Input tokens:  ${this.totalInputTokens}`);
    console.log(`   Output tokens: ${this.totalOutputTokens}`);
    console.log(`   Total tokens:  ${this.totalInputTokens + this.totalOutputTokens}`);
    console.log(`   Estimated cost: $${cost.toFixed(6)}`);
  }

  /**
   * Calculate the cost based on token usage
   * @returns {number} Total cost in dollars
   */
  calculateCost() {
    const inputCost = (this.totalInputTokens / 1_000_000) * this.modelPricing.inputTokensPer1M;
    const outputCost = (this.totalOutputTokens / 1_000_000) * this.modelPricing.outputTokensPer1M;
    return inputCost + outputCost;
  }

  /**
   * Get current totals
   * @returns {Object} Object with inputTokens, outputTokens, totalTokens, and cost
   */
  getTotals() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
      cost: this.calculateCost(),
    };
  }

  /**
   * Reset the tracker
   */
  reset() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }
}
