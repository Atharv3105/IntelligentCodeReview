// ============================================================================
// AI Gateway — NVIDIA NIM Provider
// ============================================================================
// Uses NVIDIA's OpenAI-compatible API endpoint.
// Base URL: https://integrate.api.nvidia.com/v1
// Auth: Bearer nvapi-...
// ============================================================================

const BaseProvider = require("./base");

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

class NvidiaProvider extends BaseProvider {
  constructor(config) {
    super({ ...config, name: "nvidia" });
    this._client = null;
  }

  async _getClient() {
    if (!this._client) {
      const { default: OpenAI } = await import("openai");
      this._client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: NVIDIA_BASE_URL,
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

      // NVIDIA NIM: ask for JSON explicitly in the system prompt
      const messages = [
        {
          role: "system",
          content: systemPrompt + "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanation, only the JSON object.",
        },
        { role: "user", content: userPrompt },
      ];

      const response = await client.chat.completions.create({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      let text = response.choices[0].message.content || "";

      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Try extracting a JSON block
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            data = JSON.parse(match[0]);
          } catch {
            throw new Error(`Failed to parse JSON from NVIDIA response: ${text.substring(0, 300)}`);
          }
        } else {
          throw new Error(`No JSON found in NVIDIA response: ${text.substring(0, 300)}`);
        }
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

module.exports = NvidiaProvider;
