// ============================================================================
// Prisma Database Seed Script
// ============================================================================
// Seeds initial admin user, system categories, default skills,
// standard DSA interview problems with test cases & examples,
// and categorized SQL challenges.
// Run: node prisma/seed.js (or npx prisma db seed)
// ============================================================================

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with comprehensive interview & SQL problems...");

  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@interview-platform.local" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@interview-platform.local",
      password: adminPassword,
      role: "admin",
      isVerified: true,
      profile: {
        create: {
          targetRole: "Senior Engineer",
          readinessScore: 100,
          xp: 1000,
          level: 10,
        },
      },
    },
  });
  console.log("✓ Admin user verified:", admin.email);

  // 2. Create Standard Skills
  const defaultSkills = [
    { name: "Arrays & Strings", category: "DSA", description: "Array manipulation, string parsing, sliding window, two pointers" },
    { name: "Dynamic Programming", category: "DSA", description: "Memoization, tabulation, knapsack, state transitions" },
    { name: "Trees & Graphs", category: "DSA", description: "Binary trees, BST, BFS, DFS, shortest path, topological sort" },
    { name: "Linked Lists", category: "DSA", description: "Singly and doubly linked lists, pointer manipulation, fast and slow pointers" },
    { name: "Stack & Queue", category: "DSA", description: "LIFO/FIFO structures, monotonic stack, priority queues" },
    { name: "Binary Search", category: "DSA", description: "Logarithmic search, search spaces, rotated array variants" },
    { name: "SQL Queries & Joins", category: "SQL", description: "INNER JOIN, LEFT JOIN, aggregation, GROUP BY, Window functions" },
    { name: "Database Design & DBMS", category: "DBMS", description: "Normalization, ACID, transactions, indexing, locking" },
    { name: "Operating Systems", category: "OS", description: "Processes, threads, deadlocks, memory management, virtual memory" },
    { name: "Computer Networks", category: "CN", description: "OSI model, TCP/IP, HTTP/HTTPS, DNS, routing" },
    { name: "OOP Principles", category: "OOP", description: "Encapsulation, inheritance, polymorphism, design patterns" },
    { name: "System Design", category: "System Design", description: "Scalability, load balancing, caching, microservices, databases" },
  ];

  for (const s of defaultSkills) {
    await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: s,
    });
  }
  console.log("✓ Default skills created");

  // 3. DSA Problems Library
  const dsaProblems = [
    {
      problemNumber: 1,
      title: "Two Sum",
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\`

### Example 3:
\`\`\`
Input: nums = [3, 3], target = 6
Output: [0, 1]
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Hashing",
      topics: ["Arrays", "Hashing"],
      collections: ["Blind75", "NeetCode150", "Top Interview Questions"],
      starterCode: {
        python: "def twoSum(nums, target):\n    # Write your solution here\n    pass",
        javascript: "function twoSum(nums, target) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}",
        java: "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}"
      },
      hints: [
        "A brute force approach checks every pair, which takes O(n^2) time.",
        "Can you use a Hash Map to store previously seen numbers and their indices for O(1) lookup?",
        "For each number x, check if (target - x) is already in the map."
      ],
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
      expectedComplexity: { time: "O(n)", space: "O(n)" },
      testCases: [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", category: "public", orderIndex: 0 },
        { input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]", category: "public", orderIndex: 1 },
        { input: "[3, 3]\n6", expectedOutput: "[0, 1]", category: "public", orderIndex: 2 },
        { input: "[-1, -2, -3, -4, -5]\n-8", expectedOutput: "[2, 4]", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 2,
      title: "Valid Anagram",
      description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### Example 1:
\`\`\`
Input: s = "anagram", t = "nagaram"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "rat", t = "car"
Output: false
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Strings",
      topics: ["Strings", "Hashing"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def isAnagram(s, t):\n    # Write your solution here\n    pass",
        javascript: "function isAnagram(s, t) {\n    // Write your solution here\n}",
        cpp: "#include <string>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    return false;\n}",
        java: "public class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}"
      },
      hints: [
        "If lengths of s and t are different, they cannot be anagrams.",
        "Count the frequency of each character in s, and decrement it while scanning t.",
        "If all counts return to zero, the strings are anagrams."
      ],
      constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "anagram\nnagaram", expectedOutput: "true", category: "public", orderIndex: 0 },
        { input: "rat\ncar", expectedOutput: "false", category: "public", orderIndex: 1 },
        { input: "a\nab", expectedOutput: "false", category: "hidden", orderIndex: 2 },
        { input: "listen\nsilent", expectedOutput: "true", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 3,
      title: "Best Time to Buy and Sell Stock",
      description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

### Example 1:
\`\`\`
Input: prices = [7, 1, 5, 3, 6, 4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.
Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.
\`\`\`

### Example 2:
\`\`\`
Input: prices = [7, 6, 4, 3, 1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Sliding Window",
      topics: ["Arrays", "Dynamic Programming", "Sliding Window"],
      collections: ["Blind75", "NeetCode150", "Top Interview Questions"],
      starterCode: {
        python: "def maxProfit(prices):\n    # Write your solution here\n    pass",
        javascript: "function maxProfit(prices) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    return 0;\n}",
        java: "public class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}"
      },
      hints: [
        "Track the minimum price seen so far as you iterate through the list.",
        "At each day, the potential profit is prices[i] - min_price.",
        "Keep track of the maximum profit found."
      ],
      constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "[7, 1, 5, 3, 6, 4]", expectedOutput: "5", category: "public", orderIndex: 0 },
        { input: "[7, 6, 4, 3, 1]", expectedOutput: "0", category: "public", orderIndex: 1 },
        { input: "[2, 4, 1]", expectedOutput: "2", category: "hidden", orderIndex: 2 }
      ]
    },
    {
      problemNumber: 4,
      title: "Valid Parentheses",
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Stack",
      topics: ["Stack", "Strings"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def isValid(s):\n    # Write your solution here\n    pass",
        javascript: "function isValid(s) {\n    // Write your solution here\n}",
        cpp: "#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    return false;\n}",
        java: "public class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}"
      },
      hints: [
        "Use a stack to keep track of opening brackets.",
        "When encountering a closing bracket, check if the stack's top matches.",
        "At the end, the stack should be empty if the string is valid."
      ],
      constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
      expectedComplexity: { time: "O(n)", space: "O(n)" },
      testCases: [
        { input: "()", expectedOutput: "true", category: "public", orderIndex: 0 },
        { input: "()[]{}", expectedOutput: "true", category: "public", orderIndex: 1 },
        { input: "(]", expectedOutput: "false", category: "public", orderIndex: 2 },
        { input: "([)]", expectedOutput: "false", category: "hidden", orderIndex: 3 },
        { input: "{[]}", expectedOutput: "true", category: "hidden", orderIndex: 4 }
      ]
    },
    {
      problemNumber: 5,
      title: "Valid Palindrome",
      description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\`

### Example 3:
\`\`\`
Input: s = " "
Output: true
Explanation: s is an empty string "" after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Two Pointers",
      topics: ["Two Pointers", "Strings"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def isPalindrome(s):\n    # Write your solution here\n    pass",
        javascript: "function isPalindrome(s) {\n    // Write your solution here\n}",
        cpp: "#include <string>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    return false;\n}",
        java: "public class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}"
      },
      hints: [
        "Use two pointers: one at the start and one at the end.",
        "Skip non-alphanumeric characters.",
        "Compare lowercase characters at both pointers."
      ],
      constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "A man, a plan, a canal: Panama", expectedOutput: "true", category: "public", orderIndex: 0 },
        { input: "race a car", expectedOutput: "false", category: "public", orderIndex: 1 },
        { input: " ", expectedOutput: "true", category: "public", orderIndex: 2 },
        { input: "0P", expectedOutput: "false", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 6,
      title: "Maximum Subarray",
      description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.

### Example 1:
\`\`\`
Input: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6
Explanation: The subarray [4, -1, 2, 1] has the largest sum 6.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [1]
Output: 1
\`\`\`

### Example 3:
\`\`\`
Input: nums = [5, 4, -1, 7, 8]
Output: 23
\`\`\``,
      difficulty: "medium",
      category: "DSA",
      concept: "Dynamic Programming",
      topics: ["Arrays", "Divide and Conquer", "Dynamic Programming"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def maxSubArray(nums):\n    # Write your solution here\n    pass",
        javascript: "function maxSubArray(nums) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    return 0;\n}",
        java: "public class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}"
      },
      hints: [
        "Kadane's Algorithm: at each position i, decide whether to add nums[i] to current sum or start a new subarray at nums[i].",
        "current_sum = max(nums[i], current_sum + nums[i])",
        "max_sum = max(max_sum, current_sum)"
      ],
      constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", expectedOutput: "6", category: "public", orderIndex: 0 },
        { input: "[1]", expectedOutput: "1", category: "public", orderIndex: 1 },
        { input: "[5, 4, -1, 7, 8]", expectedOutput: "23", category: "public", orderIndex: 2 },
        { input: "[-1]", expectedOutput: "-1", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 7,
      title: "Longest Substring Without Repeating Characters",
      description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\`

### Example 3:
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.
\`\`\``,
      difficulty: "medium",
      category: "DSA",
      concept: "Sliding Window",
      topics: ["Hash Table", "Strings", "Sliding Window"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass",
        javascript: "function lengthOfLongestSubstring(s) {\n    // Write your solution here\n}",
        cpp: "#include <string>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    return 0;\n}",
        java: "public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}"
      },
      hints: [
        "Use a sliding window with left and right pointers.",
        "Store characters in a set or map with their last seen index.",
        "When duplicate is seen, advance the left pointer past its previous occurrence."
      ],
      constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
      expectedComplexity: { time: "O(n)", space: "O(min(m, n))" },
      testCases: [
        { input: "abcabcbb", expectedOutput: "3", category: "public", orderIndex: 0 },
        { input: "bbbbb", expectedOutput: "1", category: "public", orderIndex: 1 },
        { input: "pwwkew", expectedOutput: "3", category: "public", orderIndex: 2 },
        { input: "", expectedOutput: "0", category: "hidden", orderIndex: 3 },
        { input: "au", expectedOutput: "2", category: "hidden", orderIndex: 4 }
      ]
    },
    {
      problemNumber: 8,
      title: "Container With Most Water",
      description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

### Example 1:
\`\`\`
Input: height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
Output: 49
Explanation: The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49 (between index 1 and 8).
\`\`\`

### Example 2:
\`\`\`
Input: height = [1, 1]
Output: 1
\`\`\``,
      difficulty: "medium",
      category: "DSA",
      concept: "Two Pointers",
      topics: ["Arrays", "Two Pointers", "Greedy"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def maxArea(height):\n    # Write your solution here\n    pass",
        javascript: "function maxArea(height) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    return 0;\n}",
        java: "public class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}"
      },
      hints: [
        "Place two pointers at the ends: left = 0, right = n - 1.",
        "Area = (right - left) * min(height[left], height[right]).",
        "Move the pointer pointing to the shorter line inward to try finding a taller line."
      ],
      constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", expectedOutput: "49", category: "public", orderIndex: 0 },
        { input: "[1, 1]", expectedOutput: "1", category: "public", orderIndex: 1 },
        { input: "[4, 3, 2, 1, 4]", expectedOutput: "16", category: "hidden", orderIndex: 2 }
      ]
    },
    {
      problemNumber: 9,
      title: "Climbing Stairs",
      description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Example 1:
\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps
\`\`\`

### Example 2:
\`\`\`
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top.
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Dynamic Programming",
      topics: ["Math", "Dynamic Programming", "Memoization"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def climbStairs(n):\n    # Write your solution here\n    pass",
        javascript: "function climbStairs(n) {\n    // Write your solution here\n}",
        cpp: "int climbStairs(int n) {\n    return 0;\n}",
        java: "public class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}"
      },
      hints: [
        "To reach step n, you must come from step n - 1 or step n - 2.",
        "ways(n) = ways(n - 1) + ways(n - 2). This is the Fibonacci sequence!",
        "Can you solve it in O(1) space using two variables?"
      ],
      constraints: ["1 <= n <= 45"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "2", expectedOutput: "2", category: "public", orderIndex: 0 },
        { input: "3", expectedOutput: "3", category: "public", orderIndex: 1 },
        { input: "5", expectedOutput: "8", category: "public", orderIndex: 2 },
        { input: "10", expectedOutput: "89", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 10,
      title: "Binary Search",
      description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### Example 1:
\`\`\`
Input: nums = [-1, 0, 3, 5, 9, 12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\`

### Example 2:
\`\`\`
Input: nums = [-1, 0, 3, 5, 9, 12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1
\`\`\``,
      difficulty: "easy",
      category: "DSA",
      concept: "Binary Search",
      topics: ["Arrays", "Binary Search"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def search(nums, target):\n    # Write your solution here\n    pass",
        javascript: "function search(nums, target) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    return -1;\n}",
        java: "public class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}"
      },
      hints: [
        "Initialize low = 0 and high = len(nums) - 1.",
        "Calculate mid = (low + high) // 2.",
        "If nums[mid] == target, return mid; if nums[mid] < target, search right half; else search left half."
      ],
      constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All integers in nums are unique.", "nums is sorted in ascending order."],
      expectedComplexity: { time: "O(log n)", space: "O(1)" },
      testCases: [
        { input: "[-1, 0, 3, 5, 9, 12]\n9", expectedOutput: "4", category: "public", orderIndex: 0 },
        { input: "[-1, 0, 3, 5, 9, 12]\n2", expectedOutput: "-1", category: "public", orderIndex: 1 },
        { input: "[5]\n5", expectedOutput: "0", category: "hidden", orderIndex: 2 }
      ]
    },
    {
      problemNumber: 11,
      title: "Coin Change",
      description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Example 1:
\`\`\`
Input: coins = [1, 2, 5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\`

### Example 2:
\`\`\`
Input: coins = [2], amount = 3
Output: -1
\`\`\`

### Example 3:
\`\`\`
Input: coins = [1], amount = 0
Output: 0
\`\`\``,
      difficulty: "medium",
      category: "DSA",
      concept: "Dynamic Programming",
      topics: ["Arrays", "Dynamic Programming", "Breadth-First Search"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def coinChange(coins, amount):\n    # Write your solution here\n    pass",
        javascript: "function coinChange(coins, amount) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    return -1;\n}",
        java: "public class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}"
      },
      hints: [
        "Let dp[i] be the minimum coins needed to make amount i.",
        "dp[0] = 0, and initialize all other dp values to infinity.",
        "For each coin c, dp[i] = min(dp[i], dp[i - c] + 1)."
      ],
      constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
      expectedComplexity: { time: "O(amount * n)", space: "O(amount)" },
      testCases: [
        { input: "[1, 2, 5]\n11", expectedOutput: "3", category: "public", orderIndex: 0 },
        { input: "[2]\n3", expectedOutput: "-1", category: "public", orderIndex: 1 },
        { input: "[1]\n0", expectedOutput: "0", category: "public", orderIndex: 2 },
        { input: "[186, 419, 83, 408]\n6249", expectedOutput: "20", category: "hidden", orderIndex: 3 }
      ]
    },
    {
      problemNumber: 12,
      title: "Top K Frequent Elements",
      description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. You may return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [1, 1, 1, 2, 2, 3], k = 2
Output: [1, 2]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [1], k = 1
Output: [1]
\`\`\``,
      difficulty: "medium",
      category: "DSA",
      concept: "Heap / Bucket Sort",
      topics: ["Arrays", "Hash Table", "Divide and Conquer", "Heap", "Bucket Sort"],
      collections: ["Blind75", "NeetCode150"],
      starterCode: {
        python: "def topKFrequent(nums, k):\n    # Write your solution here\n    pass",
        javascript: "function topKFrequent(nums, k) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nvector<int> topKFrequent(vector<int>& nums, int k) {\n    return {};\n}",
        java: "public class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        return new int[]{};\n    }\n}"
      },
      hints: [
        "Count frequencies of each number using a Hash Map.",
        "Use a Min-Heap of size k or Bucket Sort (array of lists indexed by frequency) to find top k in O(n) time."
      ],
      constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "k is in the range [1, the number of unique elements in the array]."],
      expectedComplexity: { time: "O(n log k)", space: "O(n)" },
      testCases: [
        { input: "[1, 1, 1, 2, 2, 3]\n2", expectedOutput: "[1, 2]", category: "public", orderIndex: 0 },
        { input: "[1]\n1", expectedOutput: "[1]", category: "public", orderIndex: 1 }
      ]
    }
  ];

  for (const prob of dsaProblems) {
    const { testCases, ...probData } = prob;
    const created = await prisma.problem.upsert({
      where: { problemNumber: prob.problemNumber },
      update: probData,
      create: probData,
    });

    // Replace test cases cleanly
    await prisma.testCase.deleteMany({ where: { problemId: created.id } });
    if (testCases && testCases.length > 0) {
      await prisma.testCase.createMany({
        data: testCases.map((tc) => ({
          ...tc,
          problemId: created.id,
        })),
      });
    }

    console.log(`✓ DSA Problem #${created.problemNumber}: ${created.title} (${created.difficulty})`);
  }

  // 3.5 External Problem Datasets (e.g. Striver SDE Sheet)
  const dataDir = path.join(__dirname, "../data");
  if (fs.existsSync(dataDir)) {
    const jsonFiles = fs.readdirSync(dataDir).filter((file) => file.endsWith(".json"));
    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file);
      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const records = fileContent.records || [];
      console.log(`\n📂 Loading problem dataset: ${file} (${records.length} problems)`);

      for (const record of records) {
        const { problem, testCases } = record;
        if (!problem) continue;

        const difficulty = (problem.difficulty || "medium").toLowerCase();
        const problemData = {
          title: problem.title,
          description: problem.description,
          difficulty: difficulty,
          category: problem.category || "Algorithms",
          concept: problem.concept || "General",
          topics: problem.topics || [],
          collections: problem.collections || [],
          tags: problem.tags || [],
          starterCode: problem.starterCode || null,
          hints: problem.hints || [],
          constraints: problem.constraints || [],
          expectedComplexity: problem.expectedComplexity || null,
          isGenerated: problem.isGenerated ?? false,
          isApproved: problem.isApproved ?? true,
        };

        const created = await prisma.problem.upsert({
          where: { problemNumber: problem.problemNumber },
          update: problemData,
          create: {
            problemNumber: problem.problemNumber,
            ...problemData,
          },
        });

        await prisma.testCase.deleteMany({ where: { problemId: created.id } });
        if (testCases && testCases.length > 0) {
          await prisma.testCase.createMany({
            data: testCases.map((tc, idx) => ({
              problemId: created.id,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              category: (tc.category || "public").toLowerCase(),
              orderIndex: tc.orderIndex ?? idx + 1,
              timeLimit: tc.timeLimit ?? null,
              memoryLimit: tc.memoryLimit ?? null,
            })),
          });
        }
        console.log(`  ✓ Problem #${created.problemNumber}: ${created.title} [${created.difficulty.toUpperCase()} | ${created.category}]`);
      }
    }
  }

  // 4. Categorized SQL Challenges Library
  const sqlChallenges = [
    {
      id: "sql-joins-01",
      title: "High Earning Employees",
      description: "Write a SQL query to find all employees who earn more than their direct managers.\n\nReturn the result table with column name `Employee`, ordered by `Employee` ascending.",
      difficulty: "easy",
      topic: "Joins & Self Joins",
      setupSQL: `
        CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
        INSERT INTO Employee VALUES
          (1, 'Joe', 70000, 3),
          (2, 'Henry', 80000, 4),
          (3, 'Sam', 60000, NULL),
          (4, 'Max', 90000, NULL),
          (5, 'Janet', 95000, 4),
          (6, 'Randy', 65000, 3),
          (7, 'Sarah', 105000, 4),
          (8, 'David', 55000, 1),
          (9, 'Elena', 72000, 1),
          (10, 'Michael', 110000, 7),
          (11, 'Oliver', 62000, 3),
          (12, 'Emma', 88000, 5),
          (13, 'Lucas', 58000, 6),
          (14, 'Sophia', 98000, 4),
          (15, 'Liam', 74000, 1);
      `,
      solutionSQL: "SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary ORDER BY e.name;",
      expectedResult: [
        { employee: "Elena" },
        { employee: "Janet" },
        { employee: "Joe" },
        { employee: "Liam" },
        { employee: "Michael" },
        { employee: "Randy" },
        { employee: "Sarah" },
        { employee: "Sophia" }
      ],
      hints: [
        "Use a self-join: join Employee e with Employee m on e.managerId = m.id.",
        "Filter for rows where e.salary > m.salary.",
        "Order by e.name ascending."
      ],
      explanation: "Self-joining the Employee table on manager ID links each employee row with their manager row, allowing direct salary comparison.",
      isGenerated: false
    },
    {
      id: "sql-agg-02",
      title: "Duplicate Emails",
      description: "Write a SQL query to report all the duplicate emails in the `Person` table. Note that it's guaranteed that the email field is not NULL.\n\nReturn the result table in any order.",
      difficulty: "easy",
      topic: "Aggregation & GROUP BY",
      setupSQL: `
        CREATE TABLE Person (id INT, email VARCHAR(100));
        INSERT INTO Person VALUES (1, 'a@b.com');
        INSERT INTO Person VALUES (2, 'c@d.com');
        INSERT INTO Person VALUES (3, 'a@b.com');
      `,
      solutionSQL: "SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;",
      expectedResult: [{ email: "a@b.com" }],
      hints: [
        "Group the rows by email address using GROUP BY.",
        "Use the HAVING clause with COUNT(email) > 1 to filter for emails that appear more than once."
      ],
      explanation: "GROUP BY aggregates records sharing the same email, and HAVING filters groups after aggregation.",
      isGenerated: false
    },
    {
      id: "sql-subquery-03",
      title: "Customers Who Never Order",
      description: "Write a SQL query to report all customers who never placed any orders.\n\nReturn the result table with column name `Customers`.",
      difficulty: "easy",
      topic: "Subqueries & Anti-Joins",
      setupSQL: `
        CREATE TABLE Customers (id INT, name VARCHAR(50));
        CREATE TABLE Orders (id INT, customerId INT);
        INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');
        INSERT INTO Orders VALUES (1, 3), (2, 1);
      `,
      solutionSQL: "SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.customerId IS NULL;",
      expectedResult: [{ customers: "Henry" }, { customers: "Max" }],
      hints: [
        "Perform a LEFT JOIN between Customers and Orders on customerId.",
        "Filter for rows where Orders.customerId IS NULL."
      ],
      explanation: "A LEFT JOIN preserves all customer rows. When a customer has no matching order, the joined columns are NULL.",
      isGenerated: false
    },
    {
      id: "sql-subquery-04",
      title: "Second Highest Salary",
      description: "Write a SQL query to find the second highest distinct salary from the `Employee` table. If there is no second highest salary, the query should report `null`.\n\nReturn the result with column name `SecondHighestSalary`.",
      difficulty: "medium",
      topic: "Subqueries & Aggregations",
      setupSQL: `
        CREATE TABLE Employee (id INT, salary INT);
        INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);
      `,
      solutionSQL: "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
      expectedResult: [{ secondhighestsalary: 200 }],
      hints: [
        "Find the overall maximum salary using a subquery (SELECT MAX(salary) FROM Employee).",
        "Select the MAX salary strictly less than the overall maximum."
      ],
      explanation: "Using MAX(salary) WHERE salary < (SELECT MAX(salary)) returns NULL naturally if no second highest salary exists.",
      isGenerated: false
    },
    {
      id: "sql-window-05",
      title: "Rank Scores",
      description: "Write a SQL query to rank the scores. The ranking should be calculated according to the following rules:\n- The scores should be ranked from highest to lowest.\n- If there is a tie between two scores, both should have the same ranking.\n- After a tie, the next ranking number should be the next consecutive integer (i.e., no holes between ranks).\n\nReturn the result table ordered by `score` in descending order with columns `score` and `rank`.",
      difficulty: "medium",
      topic: "Window Functions",
      setupSQL: `
        CREATE TABLE Scores (id INT, score NUMERIC(5,2));
        INSERT INTO Scores VALUES (1, 3.50), (2, 3.65), (3, 4.00), (4, 3.85), (5, 4.00), (6, 3.65);
      `,
      solutionSQL: "SELECT score, DENSE_RANK() OVER (ORDER BY score DESC) AS rank FROM Scores ORDER BY score DESC;",
      expectedResult: [
        { score: "4.00", rank: 1 },
        { score: "4.00", rank: 1 },
        { score: "3.85", rank: 2 },
        { score: "3.65", rank: 3 },
        { score: "3.65", rank: 3 },
        { score: "3.50", rank: 4 }
      ],
      hints: [
        "Use the DENSE_RANK() window function.",
        "ORDER BY score DESC within the OVER clause."
      ],
      explanation: "DENSE_RANK() assigns consecutive rank integers without skipping numbers when ties occur.",
      isGenerated: false
    },
    {
      id: "sql-window-06",
      title: "Department Top Three Salaries",
      description: "A company's executives are interested in seeing who earns the most money in each of the company's departments. A high earner in a department is an employee who has a salary in the top three unique salaries for that department.\n\nWrite a SQL query to find the employees who are high earners in each of the departments.\n\nReturn the result table with `Department`, `Employee`, and `Salary`.",
      difficulty: "hard",
      topic: "Window Functions & Joins",
      setupSQL: `
        CREATE TABLE Department (id INT, name VARCHAR(50));
        CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
        INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');
        INSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);
      `,
      solutionSQL: `
        WITH RankedSalaries AS (
          SELECT e.name AS Employee, e.salary AS Salary, d.name AS Department,
                 DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rank
          FROM Employee e
          JOIN Department d ON e.departmentId = d.id
        )
        SELECT Department, Employee, Salary
        FROM RankedSalaries
        WHERE rank <= 3
        ORDER BY Department, Salary DESC;
      `,
      expectedResult: [
        { department: "IT", employee: "Max", salary: 90000 },
        { department: "IT", employee: "Joe", salary: 85000 },
        { department: "IT", employee: "Randy", salary: 85000 },
        { department: "IT", employee: "Will", salary: 70000 },
        { department: "Sales", employee: "Henry", salary: 80000 },
        { department: "Sales", employee: "Sam", salary: 60000 }
      ],
      hints: [
        "Use DENSE_RANK() partitioned by departmentId and ordered by salary DESC.",
        "Wrap the ranking in a CTE or Subquery and filter WHERE rank <= 3."
      ],
      explanation: "PARTITION BY departmentId resets the rank counter for each department, and DENSE_RANK() handles tied salaries accurately.",
      isGenerated: false
    },
    {
      id: "sql-window-07",
      title: "Consecutive Numbers",
      description: "Find all numbers that appear at least three times consecutively in the `Logs` table.\n\nReturn the result table with column name `ConsecutiveNums`.",
      difficulty: "medium",
      topic: "Window Functions / Self Joins",
      setupSQL: `
        CREATE TABLE Logs (id INT, num INT);
        INSERT INTO Logs VALUES (1, 1), (2, 1), (3, 1), (4, 2), (5, 1), (6, 2), (7, 2);
      `,
      solutionSQL: `
        SELECT DISTINCT num AS ConsecutiveNums
        FROM (
          SELECT num,
                 LAG(num, 1) OVER (ORDER BY id) AS prev1,
                 LAG(num, 2) OVER (ORDER BY id) AS prev2
          FROM Logs
        ) sub
        WHERE num = prev1 AND num = prev2;
      `,
      expectedResult: [{ consecutivenums: 1 }],
      hints: [
        "Use the LAG() window function to peek at the previous 1 and 2 rows by id.",
        "Compare if current num == prev1 AND current num == prev2."
      ],
      explanation: "LAG(num, 1) and LAG(num, 2) check adjacent rows chronologically to detect consecutive repetition.",
      isGenerated: false
    },
    {
      id: "sql-agg-08",
      title: "Classes More Than 5 Students",
      description: "Write a SQL query to report all the classes that have at least five students.\n\nReturn the result table in any order with column name `class`.",
      difficulty: "easy",
      topic: "Aggregation & GROUP BY",
      setupSQL: `
        CREATE TABLE Courses (student VARCHAR(50), class VARCHAR(50));
        INSERT INTO Courses VALUES ('A', 'Math'), ('B', 'English'), ('C', 'Math'), ('D', 'Biology'), ('E', 'Math'), ('F', 'Computer'), ('G', 'Math'), ('H', 'Math'), ('I', 'Math');
      `,
      solutionSQL: "SELECT class FROM Courses GROUP BY class HAVING COUNT(student) >= 5;",
      expectedResult: [{ class: "Math" }],
      hints: [
        "Group by class and count the number of students per class.",
        "Filter with HAVING COUNT(student) >= 5."
      ],
      explanation: "GROUP BY class computes counts per class, and HAVING filters out classes with fewer than 5 students.",
      isGenerated: false
    },
    {
      id: "sql-pivot-09",
      title: "Reformat Department Table",
      description: "Reformat the table such that there is a department id column and a revenue column for each month.\n\nReturn the result with columns `id`, `Jan_Revenue`, `Feb_Revenue`, `Mar_Revenue`.",
      difficulty: "easy",
      topic: "Conditional Aggregation (CASE WHEN)",
      setupSQL: `
        CREATE TABLE Department (id INT, revenue INT, month VARCHAR(10));
        INSERT INTO Department VALUES (1, 8000, 'Jan'), (2, 9000, 'Jan'), (3, 10000, 'Feb'), (1, 7000, 'Feb'), (1, 6000, 'Mar');
      `,
      solutionSQL: `
        SELECT id,
               SUM(CASE WHEN month = 'Jan' THEN revenue ELSE NULL END) AS Jan_Revenue,
               SUM(CASE WHEN month = 'Feb' THEN revenue ELSE NULL END) AS Feb_Revenue,
               SUM(CASE WHEN month = 'Mar' THEN revenue ELSE NULL END) AS Mar_Revenue
        FROM Department
        GROUP BY id
        ORDER BY id;
      `,
      expectedResult: [
        { id: 1, jan_revenue: 8000, feb_revenue: 7000, mar_revenue: 6000 },
        { id: 2, jan_revenue: 9000, feb_revenue: null, mar_revenue: null },
        { id: 3, jan_revenue: null, feb_revenue: 10000, mar_revenue: null }
      ],
      hints: [
        "Use conditional aggregation with SUM(CASE WHEN month = 'Jan' THEN revenue ELSE NULL END).",
        "Group by department id."
      ],
      explanation: "CASE WHEN evaluates rows per month, and SUM aggregates them into distinct pivot columns.",
      isGenerated: false
    },
    {
      id: "sql-agg-10",
      title: "Customer Placing Largest Number of Orders",
      description: "Write a SQL query to find the `customer_number` for the customer who has placed the largest number of orders.\n\nThe test cases are generated so that exactly one customer will have placed more orders than any other customer.",
      difficulty: "easy",
      topic: "Aggregation & Ordering",
      setupSQL: `
        CREATE TABLE Orders (order_number INT, customer_number INT, order_date DATE, amount NUMERIC(10,2));
        INSERT INTO Orders VALUES
          (1, 101, '2023-01-05', 120.50),
          (2, 102, '2023-01-08', 85.00),
          (3, 103, '2023-01-11', 450.00),
          (4, 103, '2023-01-14', 60.00),
          (5, 104, '2023-01-15', 310.20),
          (6, 102, '2023-01-19', 140.00),
          (7, 103, '2023-01-22', 95.50),
          (8, 105, '2023-01-25', 520.00),
          (9, 103, '2023-01-28', 210.00),
          (10, 101, '2023-02-01', 75.00),
          (11, 106, '2023-02-03', 180.00),
          (12, 103, '2023-02-06', 99.00),
          (13, 104, '2023-02-09', 115.00),
          (14, 105, '2023-02-12', 330.00),
          (15, 107, '2023-02-15', 88.00),
          (16, 103, '2023-02-18', 145.00),
          (17, 102, '2023-02-21', 205.00),
          (18, 108, '2023-02-24', 410.00),
          (19, 104, '2023-02-27', 62.00),
          (20, 103, '2023-03-01', 190.00);
      `,
      solutionSQL: "SELECT customer_number FROM Orders GROUP BY customer_number ORDER BY COUNT(order_number) DESC LIMIT 1;",
      expectedResult: [{ customer_number: 103 }],
      hints: [
        "Group by customer_number and order by COUNT(order_number) DESC.",
        "Use LIMIT 1 to get the top customer."
      ],
      explanation: "GROUP BY customer_number groups records per customer, and ordering by count descending with LIMIT 1 retrieves the maximum.",
      isGenerated: false
    },
    {
      id: "sql-ecommerce-11",
      title: "Top Grossing Products by Category",
      description: "Write a SQL query to calculate for each product: the `product_name`, `category`, `total_units_sold`, and `net_revenue` (after applying percentage discounts).\n\nOnly include products with net revenue greater than or equal to $1,000, ordered by `net_revenue` descending.",
      difficulty: "medium",
      topic: "Joins & Aggregation",
      setupSQL: `
        CREATE TABLE Products (id INT, product_name VARCHAR(100), category VARCHAR(50), unit_price NUMERIC(10,2));
        CREATE TABLE OrderItems (id INT, product_id INT, quantity INT, discount NUMERIC(4,2));

        INSERT INTO Products VALUES
          (1, 'MacBook Pro M3', 'Laptops', 1999.00),
          (2, 'Dell XPS 15', 'Laptops', 1499.00),
          (3, 'ThinkPad X1 Carbon', 'Laptops', 1399.00),
          (4, 'Sony WH-1000XM5', 'Audio', 399.00),
          (5, 'AirPods Pro 2', 'Audio', 249.00),
          (6, 'Bose QuietComfort', 'Audio', 329.00),
          (7, 'LG UltraFine 27', 'Monitors', 699.00),
          (8, 'Dell UltraSharp 32', 'Monitors', 899.00),
          (9, 'Keychron Q1 Pro', 'Accessories', 199.00),
          (10, 'Logitech MX Master 3S', 'Accessories', 99.00);

        INSERT INTO OrderItems VALUES
          (1, 1, 3, 0.05),
          (2, 2, 2, 0.10),
          (3, 4, 5, 0.00),
          (4, 5, 8, 0.05),
          (5, 7, 2, 0.00),
          (6, 8, 3, 0.08),
          (7, 9, 6, 0.00),
          (8, 10, 12, 0.10),
          (9, 1, 2, 0.00),
          (10, 4, 3, 0.05),
          (11, 6, 4, 0.10),
          (12, 8, 1, 0.00),
          (13, 3, 1, 0.00),
          (14, 5, 4, 0.10);
      `,
      solutionSQL: "SELECT p.product_name, p.category, SUM(o.quantity) AS total_units_sold, ROUND(SUM(o.quantity * p.unit_price * (1 - o.discount))::numeric, 2) AS net_revenue FROM Products p JOIN OrderItems o ON p.id = o.product_id GROUP BY p.product_name, p.category HAVING SUM(o.quantity * p.unit_price * (1 - o.discount)) >= 1000 ORDER BY net_revenue DESC;",
      expectedResult: [
        { product_name: "MacBook Pro M3", category: "Laptops", total_units_sold: 5, net_revenue: "9695.15" },
        { product_name: "Dell UltraSharp 32", category: "Monitors", total_units_sold: 4, net_revenue: "3380.24" },
        { product_name: "Sony WH-1000XM5", category: "Audio", total_units_sold: 8, net_revenue: "3132.15" },
        { product_name: "AirPods Pro 2", category: "Audio", total_units_sold: 12, net_revenue: "2788.80" },
        { product_name: "Dell XPS 15", category: "Laptops", total_units_sold: 2, net_revenue: "2698.20" },
        { product_name: "ThinkPad X1 Carbon", category: "Laptops", total_units_sold: 1, net_revenue: "1399.00" },
        { product_name: "LG UltraFine 27", category: "Monitors", total_units_sold: 2, net_revenue: "1398.00" },
        { product_name: "Keychron Q1 Pro", category: "Accessories", total_units_sold: 6, net_revenue: "1194.00" },
        { product_name: "Bose QuietComfort", category: "Audio", total_units_sold: 4, net_revenue: "1184.40" },
        { product_name: "Logitech MX Master 3S", category: "Accessories", total_units_sold: 12, net_revenue: "1069.20" }
      ],
      hints: [
        "JOIN Products and OrderItems on product_id.",
        "Compute revenue using SUM(quantity * unit_price * (1 - discount)).",
        "Use HAVING to filter for net_revenue >= 1000 and ORDER BY net_revenue DESC."
      ],
      explanation: "Aggregating order items across products and computing revenue net of discounts provides key e-commerce sales performance.",
      isGenerated: false
    },
    {
      id: "sql-hr-13",
      title: "Department Compensation & Salary Benchmarks",
      description: "Write a SQL query to display each department's name, employee count, average salary rounded to 2 decimals, minimum salary, and maximum salary.\n\nOnly include departments with at least 3 employees, ordered by `avg_salary` descending.",
      difficulty: "medium",
      topic: "Aggregation & GROUP BY",
      setupSQL: `
        CREATE TABLE Department (id INT, name VARCHAR(50));
        CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);

        INSERT INTO Department VALUES
          (1, 'Engineering'),
          (2, 'Product'),
          (3, 'Data Science'),
          (4, 'Marketing'),
          (5, 'Sales');

        INSERT INTO Employee VALUES
          (1, 'Alice', 135000, 1),
          (2, 'Bob', 120000, 1),
          (3, 'Charlie', 145000, 1),
          (4, 'Diana', 110000, 1),
          (5, 'Evan', 155000, 1),
          (6, 'Fiona', 115000, 2),
          (7, 'George', 125000, 2),
          (8, 'Hannah', 105000, 2),
          (9, 'Ian', 130000, 2),
          (10, 'Julia', 140000, 3),
          (11, 'Kevin', 130000, 3),
          (12, 'Laura', 150000, 3),
          (13, 'Mark', 125000, 3),
          (14, 'Nora', 85000, 4),
          (15, 'Oscar', 90000, 4),
          (16, 'Penny', 95000, 4),
          (17, 'Quinn', 80000, 4),
          (18, 'Rachel', 100000, 5),
          (19, 'Steve', 95000, 5),
          (20, 'Tina', 110000, 5),
          (21, 'Uma', 105000, 5);
      `,
      solutionSQL: "SELECT d.name AS department, COUNT(e.id) AS total_employees, ROUND(AVG(e.salary)::numeric, 2) AS avg_salary, MIN(e.salary) AS min_salary, MAX(e.salary) AS max_salary FROM Department d JOIN Employee e ON d.id = e.departmentId GROUP BY d.name HAVING COUNT(e.id) >= 3 ORDER BY avg_salary DESC;",
      expectedResult: [
        { department: "Data Science", total_employees: 4, avg_salary: "136250.00", min_salary: 125000, max_salary: 150000 },
        { department: "Engineering", total_employees: 5, avg_salary: "133000.00", min_salary: 110000, max_salary: 155000 },
        { department: "Product", total_employees: 4, avg_salary: "118750.00", min_salary: 105000, max_salary: 130000 },
        { department: "Sales", total_employees: 4, avg_salary: "102500.00", min_salary: 95000, max_salary: 110000 },
        { department: "Marketing", total_employees: 4, avg_salary: "87500.00", min_salary: 80000, max_salary: 95000 }
      ],
      hints: [
        "JOIN Department with Employee on departmentId.",
        "Use COUNT, AVG, MIN, and MAX aggregate functions.",
        "Filter with HAVING COUNT(e.id) >= 3 and ORDER BY avg_salary DESC."
      ],
      explanation: "Aggregating employee salaries across departments provides executive insights into departmental compensation structures.",
      isGenerated: false
    },
    {
      id: "sql-saas-12",
      title: "SaaS Subscription Churn & MRR Analytics",
      description: "Write a SQL query to compute for each subscription plan: `plan`, `total_subscriptions`, `active_subscribers`, `churned_subscribers`, and `active_mrr` (sum of monthly fees for active subscriptions).\n\nOrder results by `active_mrr` descending.",
      difficulty: "medium",
      topic: "Conditional Aggregation (CASE WHEN)",
      setupSQL: `
        CREATE TABLE Subscriptions (id INT, customer_name VARCHAR(50), plan VARCHAR(50), monthly_fee INT, status VARCHAR(20));

        INSERT INTO Subscriptions VALUES
          (1, 'Acme Corp', 'Enterprise', 2500, 'active'),
          (2, 'Beta LLC', 'Enterprise', 2500, 'active'),
          (3, 'Gamma Inc', 'Enterprise', 2500, 'churned'),
          (4, 'Delta Co', 'Enterprise', 2500, 'active'),
          (5, 'Echo Labs', 'Pro', 499, 'active'),
          (6, 'Foxtrot Media', 'Pro', 499, 'active'),
          (7, 'Golf Tech', 'Pro', 499, 'active'),
          (8, 'Hotel Group', 'Pro', 499, 'churned'),
          (9, 'India AI', 'Pro', 499, 'active'),
          (10, 'Juliet Dev', 'Pro', 499, 'active'),
          (11, 'Kilo Cloud', 'Team', 199, 'active'),
          (12, 'Lima Design', 'Team', 199, 'active'),
          (13, 'Mike Studio', 'Team', 199, 'active'),
          (14, 'November Bio', 'Team', 199, 'churned'),
          (15, 'Oscar Legal', 'Team', 199, 'churned'),
          (16, 'Papa Retail', 'Team', 199, 'active'),
          (17, 'Quebec Auto', 'Starter', 49, 'active'),
          (18, 'Romeo Finance', 'Starter', 49, 'active'),
          (19, 'Sierra Health', 'Starter', 49, 'churned'),
          (20, 'Tango Energy', 'Starter', 49, 'active');
      `,
      solutionSQL: "SELECT plan, COUNT(*) AS total_subscriptions, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_subscribers, COUNT(CASE WHEN status = 'churned' THEN 1 END) AS churned_subscribers, SUM(CASE WHEN status = 'active' THEN monthly_fee ELSE 0 END) AS active_mrr FROM Subscriptions GROUP BY plan ORDER BY active_mrr DESC;",
      expectedResult: [
        { plan: "Enterprise", total_subscriptions: 4, active_subscribers: 3, churned_subscribers: 1, active_mrr: 7500 },
        { plan: "Pro", total_subscriptions: 6, active_subscribers: 5, churned_subscribers: 1, active_mrr: 2495 },
        { plan: "Team", total_subscriptions: 6, active_subscribers: 4, churned_subscribers: 2, active_mrr: 796 },
        { plan: "Starter", total_subscriptions: 4, active_subscribers: 3, churned_subscribers: 1, active_mrr: 147 }
      ],
      hints: [
        "Group by plan.",
        "Use conditional COUNT(CASE WHEN status = 'active' THEN 1 END).",
        "Compute active MRR with SUM(CASE WHEN status = 'active' THEN monthly_fee ELSE 0 END)."
      ],
      explanation: "Conditional aggregation with CASE WHEN enables simultaneous calculation of active retention and churn volumes in one query.",
      isGenerated: false
    },
    {
      id: "sql-flights-14",
      title: "Airline Flight Delay & On-Time Performance",
      description: "Write a SQL query to calculate for each airline: `airline`, `total_flights`, `delayed_flights` (departure delay > 15 mins), and `avg_delay_mins` (average delay of all flights rounded to 1 decimal place).\n\nOrder by `avg_delay_mins` ascending.",
      difficulty: "easy",
      topic: "Aggregation & CASE WHEN",
      setupSQL: `
        CREATE TABLE Flights (flight_id INT, airline VARCHAR(50), origin VARCHAR(10), destination VARCHAR(10), delay_mins INT);

        INSERT INTO Flights VALUES
          (1, 'Delta Air Lines', 'JFK', 'LAX', 5),
          (2, 'Delta Air Lines', 'ATL', 'ORD', 0),
          (3, 'Delta Air Lines', 'BOS', 'SFO', 25),
          (4, 'Delta Air Lines', 'JFK', 'MIA', 10),
          (5, 'Delta Air Lines', 'SEA', 'DEN', 0),
          (6, 'United Airlines', 'ORD', 'SFO', 45),
          (7, 'United Airlines', 'EWR', 'LAX', 20),
          (8, 'United Airlines', 'DEN', 'ORD', 5),
          (9, 'United Airlines', 'IAH', 'MCO', 30),
          (10, 'United Airlines', 'SFO', 'BOS', 15),
          (11, 'American Airlines', 'DFW', 'LAX', 12),
          (12, 'American Airlines', 'MIA', 'JFK', 35),
          (13, 'American Airlines', 'ORD', 'DFW', 8),
          (14, 'American Airlines', 'CLT', 'BOS', 0),
          (15, 'American Airlines', 'PHX', 'SEA', 18),
          (16, 'Southwest Airlines', 'MDW', 'LAS', 0),
          (17, 'Southwest Airlines', 'BWI', 'MCO', 10),
          (18, 'Southwest Airlines', 'DAL', 'HOU', 5),
          (19, 'Southwest Airlines', 'DEN', 'PHX', 40),
          (20, 'Southwest Airlines', 'OAK', 'SAN', 0),
          (21, 'JetBlue Airways', 'JFK', 'BOS', 50),
          (22, 'JetBlue Airways', 'BOS', 'MCO', 20),
          (23, 'JetBlue Airways', 'FLL', 'EWR', 15),
          (24, 'JetBlue Airways', 'JFK', 'SFO', 60),
          (25, 'JetBlue Airways', 'MCO', 'DCA', 10);
      `,
      solutionSQL: "SELECT airline, COUNT(*) AS total_flights, COUNT(CASE WHEN delay_mins > 15 THEN 1 END) AS delayed_flights, ROUND(AVG(delay_mins)::numeric, 1) AS avg_delay_mins FROM Flights GROUP BY airline ORDER BY avg_delay_mins ASC;",
      expectedResult: [
        { airline: "Delta Air Lines", total_flights: 5, delayed_flights: 1, avg_delay_mins: "8.0" },
        { airline: "Southwest Airlines", total_flights: 5, delayed_flights: 1, avg_delay_mins: "11.0" },
        { airline: "American Airlines", total_flights: 5, delayed_flights: 2, avg_delay_mins: "14.6" },
        { airline: "United Airlines", total_flights: 5, delayed_flights: 3, avg_delay_mins: "23.0" },
        { airline: "JetBlue Airways", total_flights: 5, delayed_flights: 3, avg_delay_mins: "31.0" }
      ],
      hints: [
        "Group by airline.",
        "Use COUNT(CASE WHEN delay_mins > 15 THEN 1 END) for delayed flights count.",
        "Compute ROUND(AVG(delay_mins)::numeric, 1) and order ascending."
      ],
      explanation: "Summarizing flight delays per carrier is a standard benchmark metric in airline logistics and transit analytics.",
      isGenerated: false
    }
  ];

  for (const sql of sqlChallenges) {
    await prisma.sQLChallenge.upsert({
      where: { id: sql.id },
      update: {
        title: sql.title,
        description: sql.description,
        difficulty: sql.difficulty,
        topic: sql.topic,
        setupSQL: sql.setupSQL,
        solutionSQL: sql.solutionSQL,
        expectedResult: sql.expectedResult,
        hints: sql.hints,
        explanation: sql.explanation,
        isGenerated: sql.isGenerated,
      },
      create: {
        id: sql.id,
        title: sql.title,
        description: sql.description,
        difficulty: sql.difficulty,
        topic: sql.topic,
        setupSQL: sql.setupSQL,
        solutionSQL: sql.solutionSQL,
        expectedResult: sql.expectedResult,
        hints: sql.hints,
        explanation: sql.explanation,
        isGenerated: sql.isGenerated,
      },
    });
    console.log(`✓ SQL Challenge [${sql.difficulty.toUpperCase()} | ${sql.topic}]: ${sql.title}`);
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
