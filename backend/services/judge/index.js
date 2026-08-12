// ============================================================================
// Judge Service — Code Execution & Evaluation
// ============================================================================
// Integrates with Judge0 for sandboxed code execution.
// Evaluates submissions against test cases with proper comparison.
// ============================================================================

const axios = require("axios");
const { getConfig } = require("../../config/env");

// Judge0 language IDs
const LANGUAGE_IDS = {
  python: 71,      // Python 3
  javascript: 63,  // Node.js
  java: 62,        // Java
  cpp: 54,         // C++ (GCC)
  c: 50,           // C (GCC)
  typescript: 74,  // TypeScript
  go: 60,          // Go
  rust: 73,        // Rust
};

class JudgeService {
  constructor() {
    this._baseUrl = null;
    this._apiKey = null;
  }

  _getConfig() {
    if (!this._baseUrl) {
      const config = getConfig();
      this._baseUrl = config.judge.apiUrl;
      this._apiKey = config.judge.apiKey;
      this._timeout = config.judge.timeout;
      this._memoryLimit = config.judge.memoryLimit;
      this._cpuTimeLimit = config.judge.cpuTimeLimit;
    }
    return { baseUrl: this._baseUrl, apiKey: this._apiKey };
  }

  /**
   * Execute code against a single test case.
   */
  async executeCode({ code, language, stdin = "", expectedOutput = null }) {
    const { baseUrl, apiKey } = this._getConfig();
    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
      throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_IDS).join(", ")}`);
    }

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["X-Auth-Token"] = apiKey;

    try {
      // Create submission
      const response = await axios.post(
        `${baseUrl}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: languageId,
          stdin: stdin || "",
          expected_output: expectedOutput || undefined,
          cpu_time_limit: this._cpuTimeLimit,
          memory_limit: this._memoryLimit,
          wall_time_limit: this._timeout,
        },
        { headers, timeout: (this._timeout + 5) * 1000 }
      );

      const result = response.data;

      return {
        stdout: (result.stdout || "").trim(),
        stderr: result.stderr || "",
        compileOutput: result.compile_output || "",
        status: result.status?.description || "Unknown",
        statusId: result.status?.id,
        runtime: result.time ? parseFloat(result.time) * 1000 : null, // ms
        memory: result.memory || null, // KB
        exitCode: result.exit_code,
        isAccepted: result.status?.id === 3, // 3 = Accepted
        isCompileError: result.status?.id === 6,
        isRuntimeError: [7, 8, 9, 10, 11, 12].includes(result.status?.id),
        isTimeLimitExceeded: result.status?.id === 5,
        isMemoryLimitExceeded: result.status?.id === 4,
      };
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        throw Object.assign(new Error("Judge0 service is not available. Ensure it is running."), { code: "JUDGE_UNAVAILABLE" });
      }
      throw error;
    }
  }

  /**
   * Run code against multiple test cases and aggregate results.
   */
  async evaluateSubmission({ code, language, testCases }) {
    if (!testCases || testCases.length === 0) {
      throw new Error("No test cases provided for evaluation.");
    }

    const results = [];
    let passedTests = 0;
    let totalRuntime = 0;
    let maxMemory = 0;
    let compileError = null;

    for (const testCase of testCases) {
      try {
        const result = await this.executeCode({
          code,
          language,
          stdin: testCase.input || "",
          expectedOutput: testCase.expectedOutput || null,
        });

        // If compilation failed, all tests fail
        if (result.isCompileError) {
          compileError = result.compileOutput || result.stderr;
          results.push({
            input: testCase.category === "hidden" ? "[hidden]" : testCase.input,
            expectedOutput: testCase.category === "hidden" ? "[hidden]" : testCase.expectedOutput,
            actualOutput: null,
            passed: false,
            error: compileError,
            category: testCase.category || "public",
          });
          continue;
        }

        // Compare outputs
        const expected = (testCase.expectedOutput || "").trim();
        const actual = (result.stdout || "").trim();
        const passed = actual === expected;

        if (passed) passedTests++;
        if (result.runtime) totalRuntime += result.runtime;
        if (result.memory && result.memory > maxMemory) maxMemory = result.memory;

        results.push({
          input: testCase.category === "hidden" ? "[hidden]" : testCase.input,
          expectedOutput: testCase.category === "hidden" ? "[hidden]" : testCase.expectedOutput,
          actualOutput: testCase.category === "hidden" ? (passed ? "[correct]" : "[incorrect]") : actual,
          passed,
          runtime: result.runtime,
          memory: result.memory,
          status: result.status,
          error: result.stderr || null,
          category: testCase.category || "public",
        });
      } catch (err) {
        results.push({
          input: testCase.category === "hidden" ? "[hidden]" : testCase.input,
          expectedOutput: testCase.category === "hidden" ? "[hidden]" : testCase.expectedOutput,
          actualOutput: null,
          passed: false,
          error: err.message,
          category: testCase.category || "public",
        });
      }
    }

    return {
      passedTests,
      totalTests: testCases.length,
      percentage: testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0,
      runtime: Math.round(totalRuntime),
      memory: maxMemory,
      compileError,
      testResults: results,
      // Only expose public test details to candidates
      publicResults: results.filter((r) => r.category !== "hidden" && r.category !== "stress"),
    };
  }

  /**
   * Health check for Judge0 service.
   */
  async healthCheck() {
    try {
      const { baseUrl } = this._getConfig();
      const response = await axios.get(`${baseUrl}/system_info`, { timeout: 5000 });
      return { status: "healthy", info: response.data };
    } catch (err) {
      return { status: "unhealthy", error: err.message };
    }
  }
}

// Singleton
const judge = new JudgeService();
module.exports = judge;
