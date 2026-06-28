/**
 * Token Usage Tracker
 * Tracks and displays token usage for Anthropic API calls
 */

export class TokenTracker {
  constructor() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
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
    console.log(`\n📈 Total Token Usage:`);
    console.log(`   Input tokens:  ${this.totalInputTokens}`);
    console.log(`   Output tokens: ${this.totalOutputTokens}`);
    console.log(`   Total tokens:  ${this.totalInputTokens + this.totalOutputTokens}`);
  }

  /**
   * Get current totals
   * @returns {Object} Object with inputTokens, outputTokens, and totalTokens
   */
  getTotals() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
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
