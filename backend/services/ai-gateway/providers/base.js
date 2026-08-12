// ============================================================================
// AI Gateway — Base Provider Interface
// ============================================================================
// All AI providers must implement this interface.
// ============================================================================

class BaseProvider {
  constructor(config) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    this.baseBackoff = config.baseBackoff || 1000;
  }

  /**
   * Generate text completion.
   * @param {object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {number} [params.temperature=0.7]
   * @param {number} [params.maxTokens=2048]
   * @returns {Promise<{ text: string, usage: { inputTokens: number, outputTokens: number } }>}
   */
  async generateText(params) {
    throw new Error(`generateText() not implemented in ${this.name}`);
  }

  /**
   * Generate structured JSON output.
   * @param {object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {object} [params.schema] - JSON schema for structured output
   * @param {number} [params.temperature=0.3]
   * @returns {Promise<{ data: object, usage: { inputTokens: number, outputTokens: number } }>}
   */
  async generateStructured(params) {
    throw new Error(`generateStructured() not implemented in ${this.name}`);
  }

  /**
   * Stream text completion.
   * @param {object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {function} params.onChunk - Called with each text chunk
   * @returns {Promise<{ fullText: string, usage: { inputTokens: number, outputTokens: number } }>}
   */
  async streamText(params) {
    throw new Error(`streamText() not implemented in ${this.name}`);
  }

  /**
   * Chat completion with message history.
   * @param {object} params
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {number} [params.temperature=0.7]
   * @param {number} [params.maxTokens=2048]
   * @returns {Promise<{ text: string, usage: { inputTokens: number, outputTokens: number } }>}
   */
  async chat(params) {
    throw new Error(`chat() not implemented in ${this.name}`);
  }

  /**
   * Execute with retry and exponential backoff.
   */
  async withRetry(fn, context = "") {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isRetryable = this._isRetryableError(error);
        if (!isRetryable || attempt === this.maxRetries) {
          throw error;
        }
        const backoff = this.baseBackoff * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(
          `[AI:${this.name}] ${context} attempt ${attempt}/${this.maxRetries} failed, retrying in ${Math.round(backoff)}ms: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw lastError;
  }

  _isRetryableError(error) {
    if (error.status === 429) return true; // rate limited
    if (error.status >= 500) return true;  // server error
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") return true;
    return false;
  }
}

module.exports = BaseProvider;
