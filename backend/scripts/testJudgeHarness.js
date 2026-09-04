// ============================================================================
// Test Suite: Judge Service Harness & Execution Contracts
// ============================================================================

const judge = require("../services/judge");

async function runTests() {
  console.log("============================================================================");
  console.log("           JUDGE HARNESS & EXECUTION CONTRACT TEST SUITE");
  console.log("============================================================================\n");

  let passedCount = 0;
  let totalCount = 0;

  async function assertCase(title, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✓ PASSED: ${title}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${title}`);
      console.error(`    Error: ${err.message}\n`);
    }
  }

  // 1. Python function returning a list
  await assertCase("1. Python function returning a list", async () => {
    const code = `
def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "[2,7,11,15] | 9", expectedOutput: "[0,1]", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "twoSum" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 2. Python function returning nested lists
  await assertCase("2. Python function returning nested lists (Merge Intervals / Sorted Arrays)", async () => {
    const code = `
def merge(arr1, arr2):
    n, m = len(arr1), len(arr2)
    gap = (n + m + 1) // 2
    while gap > 0:
        i = 0
        j = gap
        while j < n + m:
            if i < n and j < n:
                if arr1[i] > arr1[j]:
                    arr1[i], arr1[j] = arr1[j], arr1[i]
            elif i < n and j >= n:
                if arr1[i] > arr2[j - n]:
                    arr1[i], arr2[j - n] = arr2[j - n], arr1[i]
            else:
                if arr2[i - n] > arr2[j - n]:
                    arr2[i - n], arr2[j - n] = arr2[j - n], arr2[i - n]
            i += 1
            j += 1
        if gap == 1:
            break
        gap = (gap + 1) // 2
    return [arr1, arr2]
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "[1,4,8,10] | [2,3,9]", expectedOutput: "[[1,2,3,4],[8,9,10]]", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "merge" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 3. Python function returning None after mutating an input in-place
  await assertCase("3. Python function returning None after mutating an input (mutate_arg_0)", async () => {
    const code = `
def setZeroes(matrix):
    rows, cols = len(matrix), len(matrix[0])
    row_zero = any(matrix[0][j] == 0 for j in range(cols))
    col_zero = any(matrix[i][0] == 0 for i in range(rows))
    for i in range(1, rows):
        for j in range(1, cols):
            if matrix[i][j] == 0:
                matrix[i][0] = 0
                matrix[0][j] = 0
    for i in range(1, rows):
        for j in range(1, cols):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    if row_zero:
        for j in range(cols):
            matrix[0][j] = 0
    if col_zero:
        for i in range(rows):
            matrix[i][0] = 0
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "[[1,0,1],[0,0,0],[1,0,1]]", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "setZeroes", outputStrategy: "mutate_arg_0" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 4. Python function containing internal print() statements
  await assertCase("4. Python function containing internal print() statements", async () => {
    const code = `
def countPrimes(n):
    print("Debug log: calculating primes up to", n)
    if n <= 2:
        return 0
    is_prime = [True] * n
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            print(f"Sieving for prime {i}")
            for j in range(i*i, n, i):
                is_prime[j] = False
    ans = sum(is_prime)
    print("Final result is:", ans)
    return ans
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "10", expectedOutput: "4", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "countPrimes" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 5. Python standalone stdin/stdout script
  await assertCase("5. Python standalone stdin/stdout program", async () => {
    const code = `
import sys
line = sys.stdin.read().strip()
nums = [int(x) for x in line.split()]
print(sum(nums))
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "10 20 30", expectedOutput: "60", category: "public" }],
      executionConfig: { executionMode: "script" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 6. Missing functionName / auto fallback
  await assertCase("6. Missing functionName in config (automatic inference)", async () => {
    const code = `
def reverseString(s):
    return s[::-1]
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: '"hello"', expectedOutput: '"olleh"', category: "public" }],
      executionConfig: null, // Legacy / unconfigured
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  // 7. FunctionName that does not exist in submitted code
  await assertCase("7. Target functionName that does not exist (diagnostic error)", async () => {
    const code = `
def wrongName(a, b):
    return a + b
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "1 | 2", expectedOutput: "3", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "expectedSolutionFunction" },
    });
    const firstResult = res.testResults[0];
    if (res.passedTests !== 0 || !firstResult.error.includes("FunctionError")) {
      throw new Error(`Expected FunctionError diagnostic, got: ${JSON.stringify(firstResult)}`);
    }
  });

  // 8. Multiple helper functions
  await assertCase("8. Multiple helper functions (invokes target function, not helper)", async () => {
    const code = `
def helperOne(x):
    return x * 2

def helperTwo(y):
    return y + 10

def solve(arr):
    # Calls helpers internally
    return [helperTwo(helperOne(x)) for x in arr]

def helperThree(z):
    return 0
`;
    const res = await judge.evaluateSubmission({
      code,
      language: "python",
      testCases: [{ input: "[1, 2, 3]", expectedOutput: "[12, 14, 16]", category: "public" }],
      executionConfig: { executionMode: "function", functionName: "solve" },
    });
    if (res.passedTests !== 1) throw new Error(`Expected 1 passed test, got ${res.passedTests}: ${JSON.stringify(res.testResults)}`);
  });

  console.log("\n----------------------------------------------------------------------------");
  console.log(`Results: ${passedCount} / ${totalCount} tests passed.`);
  console.log("----------------------------------------------------------------------------\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
