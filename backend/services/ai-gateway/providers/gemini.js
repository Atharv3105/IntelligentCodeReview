// ============================================================================
// AI Gateway — Gemini Provider
// ============================================================================

const BaseProvider = require("./base");

class GeminiProvider extends BaseProvider {
  constructor(config) {
    super({ ...config, name: "gemini" });
    this._client = null;
  }

  async _getClient() {
    if (!this._client) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      this._genAI = new GoogleGenerativeAI(this.apiKey);
      this._client = this._genAI.getGenerativeModel({ model: this.model });
    }
    return this._client;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 }) {
    return this.withRetry(async () => {
      const model = await this._getClient();
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata || {};

      return {
        text,
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
        },
      };
    }, "generateText");
  }

  async generateStructured({ systemPrompt, userPrompt, schema, temperature = 0.3, maxTokens = 4096 }) {
    return this.withRetry(async () => {
      const model = await this._getClient();
      const prompt = `${systemPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.\n\n${userPrompt}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      });

      const response = result.response;
      let text = response.text();
      const usage = response.usageMetadata || {};

      // Clean potential markdown wrapping
      text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Failed to parse JSON response from Gemini: ${text.substring(0, 200)}`);
      }

      return {
        data,
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
        },
      };
    }, "generateStructured");
  }

  async streamText({ systemPrompt, userPrompt, onChunk, temperature = 0.7, maxTokens = 2048 }) {
    const model = await this._getClient();
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      if (text && onChunk) {
        onChunk(text);
      }
    }

    return {
      fullText,
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  async chat({ messages, temperature = 0.7, maxTokens = 2048 }) {
    return this.withRetry(async () => {
      const model = await this._getClient();
      // Convert OpenAI-style messages to Gemini format
      const combined = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: combined }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const response = result.response;
      const usage = response.usageMetadata || {};

      return {
        text: response.text(),
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
        },
      };
    }, "chat");
  }
}

module.exports = GeminiProvider;
