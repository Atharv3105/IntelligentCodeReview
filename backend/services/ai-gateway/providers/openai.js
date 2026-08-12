// ============================================================================
// AI Gateway — OpenAI Provider
// ============================================================================

const BaseProvider = require("./base");

class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super({ ...config, name: "openai" });
    this._client = null;
  }

  async _getClient() {
    if (!this._client) {
      const { default: OpenAI } = await import("openai");
      this._client = new OpenAI({
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
      const messages = [
        { role: "system", content: systemPrompt + "\n\nRespond with valid JSON only." },
        { role: "user", content: userPrompt },
      ];

      const requestParams = {
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      };

      const response = await client.chat.completions.create(requestParams);
      const text = response.choices[0].message.content;

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Failed to parse JSON response from OpenAI: ${text.substring(0, 200)}`);
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
      usage: { inputTokens: 0, outputTokens: 0 }, // streaming doesn't provide usage reliably
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

module.exports = OpenAIProvider;
