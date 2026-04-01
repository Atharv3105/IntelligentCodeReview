const mongoose = require("mongoose");
const Problem = require("../models/Problem");
require("dotenv").config();

const problems = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Arrays",
    tags: ["array", "hash-map"],
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    starterCode: "def solve(nums, target):\n    # Write your code here\n    pass",
    hints: [
      "Use a dictionary to store value -> index as you iterate once.",
      "For each number x, check if target - x already exists."
    ],
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]" }
    ]
  },
  {
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Strings",
    tags: ["string", "two-pointers"],
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.",
    starterCode: "def solve(s):\n    # Write your code here\n    pass",
    hints: [
      "Two pointers from both ends is enough after cleaning/alnum checks."
    ],
    testCases: [
      { input: "\"A man, a plan, a canal: Panama\"", expectedOutput: "true" },
      { input: "\"race a car\"", expectedOutput: "false" }
    ]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Sliding Window",
    tags: ["string", "hash-map", "sliding-window"],
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    starterCode: "def solve(s):\n    # Write your code here\n    pass",
    hints: [
      "Track last seen index of each character.",
      "Move left boundary when duplicates appear."
    ],
    testCases: [
      { input: "\"abcabcbb\"", expectedOutput: "3" },
      { input: "\"bbbbb\"", expectedOutput: "1" },
      { input: "\"pwwkew\"", expectedOutput: "3" }
    ]
  },
  {
    title: "Merge Intervals",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Intervals",
    tags: ["sorting", "intervals"],
    description: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    starterCode: "def solve(intervals):\n    # Write your code here\n    pass",
    hints: [
      "Sort intervals by start time first.",
      "Compare current interval with the last merged interval."
    ],
    testCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" }
    ]
  },
  {
    title: "Reverse String",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Two Pointers",
    tags: ["array", "string", "two-pointers"],
    description: "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    starterCode: "def solve(s):\n    # Write your code here\n    pass",
    hints: [
      "Swap elements from left and right while left < right."
    ],
    testCases: [
      { input: "[\"h\",\"e\",\"l\",\"l\",\"o\"]", expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" },
      { input: "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]" }
    ]
  },
  {
    title: "Contains Duplicate",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Arrays",
    tags: ["array", "hash-set"],
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    starterCode: "def solve(nums):\n    # Write your code here\n    pass",
    hints: ["A set can track seen values in O(n) time."],
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true" },
      { input: "[1,2,3,4]", expectedOutput: "false" }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Arrays",
    tags: ["array", "dynamic-programming"],
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve.",
    starterCode: "def solve(prices):\n    # Write your code here\n    pass",
    hints: ["Track minimum price so far and best profit."],
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
      { input: "[7,6,4,3,1]", expectedOutput: "0" }
    ]
  },
  {
    title: "Product of Array Except Self",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Arrays",
    tags: ["array", "prefix-suffix"],
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    starterCode: "def solve(nums):\n    # Write your code here\n    pass",
    hints: ["Build prefix and suffix products in O(n)."],
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]" },
      { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]" }
    ]
  },
  {
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Dynamic Programming",
    tags: ["array", "kadane"],
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    starterCode: "def solve(nums):\n    # Write your code here\n    pass",
    hints: ["Kadane's algorithm tracks local and global best values."],
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
      { input: "[1]", expectedOutput: "1" }
    ]
  },
  {
    title: "Binary Search",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Binary Search",
    tags: ["binary-search"],
    description: "Given a sorted array of integers nums and an integer target, return the index of target or -1 if it does not exist.",
    starterCode: "def solve(nums, target):\n    # Write your code here\n    pass",
    hints: ["Use two pointers left and right with midpoint updates."],
    testCases: [
      { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4" },
      { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1" }
    ]
  },
  {
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Heap",
    tags: ["heap", "sorting"],
    description: "Given an integer array nums and an integer k, return the kth largest element in the array.",
    starterCode: "def solve(nums, k):\n    # Write your code here\n    pass",
    hints: ["A min heap of size k keeps only top-k values."],
    testCases: [
      { input: "[3,2,1,5,6,4], 2", expectedOutput: "5" },
      { input: "[3,2,3,1,2,4,5,5,6], 4", expectedOutput: "4" }
    ]
  },
  {
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Hashing",
    tags: ["hash-map", "bucket-sort", "heap"],
    description: "Given an integer array nums and an integer k, return the k most frequent elements.",
    starterCode: "def solve(nums, k):\n    # Write your code here\n    pass",
    hints: ["Count frequencies first, then extract top k."],
    testCases: [
      { input: "[1,1,1,2,2,3], 2", expectedOutput: "[1,2]" },
      { input: "[1], 1", expectedOutput: "[1]" }
    ]
  },
  {
    title: "Climbing Stairs",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Dynamic Programming",
    tags: ["dp"],
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps.",
    starterCode: "def solve(n):\n    # Write your code here\n    pass",
    hints: ["State transition is similar to Fibonacci."],
    testCases: [
      { input: "2", expectedOutput: "2" },
      { input: "5", expectedOutput: "8" }
    ]
  },
  {
    title: "Coin Change",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Dynamic Programming",
    tags: ["dp"],
    description: "Given an integer array coins and an integer amount, return the fewest number of coins that you need to make up that amount.",
    starterCode: "def solve(coins, amount):\n    # Write your code here\n    pass",
    hints: ["Bottom-up DP works well for this unbounded knapsack pattern."],
    testCases: [
      { input: "[1,2,5], 11", expectedOutput: "3" },
      { input: "[2], 3", expectedOutput: "-1" }
    ]
  },
  {
    title: "Number of Islands",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Graphs",
    tags: ["graph", "dfs", "bfs", "matrix"],
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    starterCode: "def solve(grid):\n    # Write your code here\n    pass",
    hints: ["Traverse each unseen land cell with DFS/BFS and mark visited."],
    testCases: [
      { input: "[[\"1\",\"1\",\"0\"],[\"1\",\"0\",\"0\"],[\"0\",\"1\",\"1\"]]", expectedOutput: "2" }
    ]
  },
  {
    title: "Course Schedule",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Graphs",
    tags: ["graph", "topological-sort"],
    description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Return true if you can finish all courses.",
    starterCode: "def solve(numCourses, prerequisites):\n    # Write your code here\n    pass",
    hints: ["Detect cycles in a directed graph."],
    testCases: [
      { input: "2, [[1,0]]", expectedOutput: "true" },
      { input: "2, [[1,0],[0,1]]", expectedOutput: "false" }
    ]
  },
  {
    title: "Invert Binary Tree",
    difficulty: "Easy",
    category: "Algorithms",
    concept: "Trees",
    tags: ["tree", "dfs"],
    description: "Given the root of a binary tree, invert the tree, and return its root.",
    starterCode: "def solve(root):\n    # Write your code here\n    pass",
    hints: ["Swap left and right children recursively."],
    testCases: [
      { input: "[4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]" }
    ]
  },
  {
    title: "Lowest Common Ancestor of a BST",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Trees",
    tags: ["tree", "bst"],
    description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
    starterCode: "def solve(root, p, q):\n    # Write your code here\n    pass",
    hints: ["Use BST ordering to move left or right."],
    testCases: [
      { input: "[6,2,8,0,4,7,9,null,null,3,5], 2, 8", expectedOutput: "6" }
    ]
  },
  {
    title: "Implement Queue using Stacks",
    difficulty: "Easy",
    category: "Data Structures",
    concept: "Stacks",
    tags: ["stack", "queue"],
    description: "Implement a first in first out (FIFO) queue using only two stacks.",
    starterCode: "class MyQueue:\n    def __init__(self):\n        pass\n\n    def push(self, x):\n        pass\n\n    def pop(self):\n        pass",
    hints: ["Use an input stack and an output stack."],
    testCases: [
      { input: "[\"MyQueue\",\"push\",\"push\",\"peek\",\"pop\"], [[],[1],[2],[],[]]", expectedOutput: "[null,null,null,1,1]" }
    ]
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Data Structures",
    concept: "Stacks",
    tags: ["stack", "string"],
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    starterCode: "def solve(s):\n    # Write your code here\n    pass",
    hints: ["Push open brackets and match when closing arrives."],
    testCases: [
      { input: "\"()[]{}\"", expectedOutput: "true" },
      { input: "\"(]\"", expectedOutput: "false" }
    ]
  },
  {
    title: "Min Stack",
    difficulty: "Medium",
    category: "Data Structures",
    concept: "Stacks",
    tags: ["stack", "design"],
    description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    starterCode: "class MinStack:\n    def __init__(self):\n        pass",
    hints: ["Track current min at each push with an auxiliary stack."],
    testCases: [
      { input: "[\"MinStack\",\"push\",\"push\",\"push\",\"getMin\",\"pop\",\"top\",\"getMin\"], [[],[-2],[0],[-3],[],[],[],[]]", expectedOutput: "[null,null,null,null,-3,null,0,-2]" }
    ]
  },
  {
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "Algorithms",
    concept: "Two Pointers",
    tags: ["array", "two-pointers"],
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    starterCode: "def solve(height):\n    # Write your code here\n    pass",
    hints: ["Use two pointers and track max left/right elevations."],
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6" },
      { input: "[4,2,0,3,2,5]", expectedOutput: "9" }
    ]
  },
  {
    title: "Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    category: "Algorithms",
    concept: "Trees",
    tags: ["tree", "dfs"],
    description: "Given a non-empty binary tree, find the maximum path sum between any two nodes.",
    starterCode: "def solve(root):\n    # Write your code here\n    pass",
    hints: ["Use postorder DFS and track max path through each node."],
    testCases: [
      { input: "[1,2,3]", expectedOutput: "6" },
      { input: "[-10,9,20,null,null,15,7]", expectedOutput: "42" }
    ]
  },
  {
    title: "Word Ladder II",
    difficulty: "Hard",
    category: "Algorithms",
    concept: "Graphs",
    tags: ["graph", "bfs"],
    description: "Given beginWord, endWord, and wordList, return all shortest transformation sequences from beginWord to endWord.",
    starterCode: "def solve(beginWord, endWord, wordList):\n    # Write your code here\n    pass",
    hints: ["Use bidirectional BFS + path reconstruction."],
    testCases: [
      { input: "\"hit\", \"cog\", [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", expectedOutput: "[[\"hit\",\"hot\",\"dot\",\"dog\",\"cog\"],[\"hit\",\"hot\",\"lot\",\"log\",\"cog\"]]" }
    ]
  },
  {
    title: "Regular Expression Matching",
    difficulty: "Hard",
    category: "Algorithms",
    concept: "Dynamic Programming",
    tags: ["dp", "string"],
    description: "Implement regular expression matching with support for '.' and '*'.",    starterCode: "def solve(s, p):\n    # Write your code here\n    pass",
    hints: ["Use DP table where dp[i][j] indicates match status of s[:i], p[:j]."],
    testCases: [
      { input: "\"aa\", \"a\"", expectedOutput: "false" },
      { input: "\"aab\", \"c*a*b\"", expectedOutput: "true" }
    ]
  },
  {
    title: "LFU Cache",
    difficulty: "Hard",
    category: "Design",
    concept: "Data Structures",
    tags: ["design", "hash-map"],
    description: "Design and implement a data structure for Least Frequently Used (LFU) cache with O(1) operations.",
    starterCode: "class LFUCache:\n    def __init__(self, capacity):\n        pass",
    hints: ["Use count buckets and ordered dictionary per frequency."],
    testCases: [
      { input: "[\"LFUCache\",\"put\",\"put\",\"get\",\"put\",\"get\",\"get\"], [[2],[1,1],[2,2],[1],[3,3],[2],[3]]", expectedOutput: "[null,null,null,1,null,-1,3]" }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/codereview");
    console.log("Connected to MongoDB for seeding...");

    // Optional: Clear existing problems if you want a fresh start
    // await Problem.deleteMany({});
    // console.log("Cleared existing problems.");

    for (const p of problems) {
      const existing = await Problem.findOne({ title: p.title });
      if (!existing) {
        await Problem.create(p);
        console.log(`Added problem: ${p.title}`);
      } else {
        console.log(`Problem already exists: ${p.title}`);
      }
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
