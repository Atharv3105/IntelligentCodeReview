// ============================================================================
// AI Gateway — Groq Provider
// ============================================================================

const BaseProvider = require("./base");

class GroqProvider extends BaseProvider {
  constructor(config) {
    super({ ...config, name: "groq" });
    this._client = null;
  }

  async _getClient() {
    if (!this._client) {
      let Groq;
      try {
        Groq = require("groq-sdk");
        if (Groq.default) Groq = Groq.default;
      } catch {
        const mod = await import("groq-sdk");
        Groq = mod.default || mod.Groq || mod;
      }
      this._client = new Groq({
        apiKey: this.apiKey,
        timeout: this.timeout,
      });
    }
    return this._client;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 }) {
    return this.withRetry(async () => {
      const client = await this._getClient();
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      return {
        text: response.choices[0].message.content,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    }, "generateText");
  }

  async generateStructured({ systemPrompt, userPrompt, schema, temperature = 0.3, maxTokens = 4096 }) {
    return this.withRetry(async () => {
      const client = await this._getClient();
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt + "\n\nRespond with valid JSON only." },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const text = response.choices[0].message.content;

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Failed to parse JSON response from Groq: ${text.substring(0, 200)}`);
      }

      return {
        data,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    }, "generateStructured");
  }

  async streamText({ systemPrompt, userPrompt, onChunk, temperature = 0.7, maxTokens = 2048 }) {
    const client = await this._getClient();
    const stream = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;
      if (content && onChunk) {
        onChunk(content);
      }
    }

    return {
      fullText,
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  async chat({ messages, temperature = 0.7, maxTokens = 2048 }) {
    return this.withRetry(async () => {
      const client = await this._getClient();
      const response = await client.chat.completions.create({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        text: response.choices[0].message.content,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    }, "chat");
  }
}

module.exports = GroqProvider;
