// ============================================================================
// AI Gateway — NVIDIA NIM Provider
// ============================================================================
// Uses NVIDIA's OpenAI-compatible API endpoint.
// Base URL: https://integrate.api.nvidia.com/v1
// Auth: Bearer nvapi-...
// ============================================================================

const BaseProvider = require("./base");

/**
 * Attempt to repair a truncated JSON string by closing unclosed brackets/quotes.
 * This handles the common case where a model's response gets cut off mid-JSON.
 */
function repairTruncatedJSON(str) {
  let s = str.trimEnd();

  // Remove trailing comma before attempting to close
  s = s.replace(/,\s*$/, "");

  // Count unclosed structures
  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // If we're still inside a string, close it
  if (inString) s += '"';

  // Close any remaining open structures in reverse order
  while (stack.length > 0) {
    s += stack.pop();
  }

  return s;
}

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

  async generateStructured({ systemPrompt, userPrompt, schema, temperature = 0.3, maxTokens = 8192 }) {
    return this.withRetry(async () => {
      const client = await this._getClient();

      const messages = [
        {
          role: "system",
          content: systemPrompt + "\n\nIMPORTANT: You MUST respond with a single valid JSON object only. No markdown code fences, no explanation before or after, just the raw JSON object starting with { and ending with }.",
        },
        { role: "user", content: userPrompt },
      ];

      const response = await client.chat.completions.create({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      let text = (response.choices[0].message.content || "").trim();

      // Strip markdown fences (```json ... ``` or ``` ... ```)
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

      // Find the start of a JSON object
      const startIdx = text.indexOf("{");
      if (startIdx > 0) text = text.slice(startIdx);

      let data;

      // Attempt 1: direct parse
      try {
        data = JSON.parse(text);
      } catch {
        // Attempt 2: try to repair truncated JSON by closing open brackets
        try {
          data = JSON.parse(repairTruncatedJSON(text));
        } catch {
          // Attempt 3: extract the outermost { ... } block
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              data = JSON.parse(match[0]);
            } catch {
              try {
                data = JSON.parse(repairTruncatedJSON(match[0]));
              } catch {
                throw new Error(`Failed to parse JSON from NVIDIA response: ${text.substring(0, 400)}`);
              }
            }
          } else {
            throw new Error(`No JSON found in NVIDIA response: ${text.substring(0, 400)}`);
          }
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
