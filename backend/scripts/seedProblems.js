require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

const problems = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    category: "Arrays",
    concept: "HashMap",
    starterCode: "def two_sum(nums, target):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]" }
    ],
    hints: ["Use a dictionary to store values and their indices.", "Think about the complement: target - current_num."]
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: "Easy",
    category: "Strings",
    concept: "Stack",
    starterCode: "def is_valid(s):\n    # Write your code here\n    pass",
    testCases: [
      { input: "'()[]{}'", expectedOutput: "True" },
      { input: "'(]'", expectedOutput: "False" }
    ],
    hints: ["Use a stack to keep track of opening brackets.", "A closing bracket must match the last opened one."]
  },
  {
    title: "Longest Palindromic Substring",
    description: "Given a string `s`, return the longest palindromic substring in `s`.",
    difficulty: "Medium",
    category: "Strings",
    concept: "Dynamic Programming",
    starterCode: "def longest_palindrome(s):\n    # Write your code here\n    pass",
    testCases: [
      { input: "'babad'", expectedOutput: "'bab' or 'aba'" },
      { input: "'cbbd'", expectedOutput: "'bb'" }
    ],
    hints: ["Try expanding from the center of each character.", "Consider both odd and even length palindromes."]
  },
  {
    title: "Merge Intervals",
    description: "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals.",
    difficulty: "Medium",
    category: "Arrays",
    concept: "Sorting",
    starterCode: "def merge_intervals(intervals):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" }
    ],
    hints: ["Sort the intervals by their start time first.", "Compare the end of the current interval with the start of the next."]
  },
  {
    title: "Binary Tree Inorder Traversal",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    difficulty: "Easy",
    category: "Trees",
    concept: "DFS",
    starterCode: "def inorder_traversal(root):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[1,null,2,3]", expectedOutput: "[1,3,2]" }
    ],
    hints: ["Inorder is Left -> Root -> Right.", "Can you do it both recursively and iteratively?"]
  },
  {
    title: "Search in Rotated Sorted Array",
    description: "There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index. Given the target, return its index.",
    difficulty: "Medium",
    category: "Algorithms",
    concept: "Binary Search",
    starterCode: "def search_rotated(nums, target):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[4,5,6,7,0,1,2], 0", expectedOutput: "4" }
    ],
    hints: ["Use Binary Search but determine which half is sorted first."]
  },
  {
    title: "Sliding Window Maximum",
    description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. Return the max sliding window.",
    difficulty: "Hard",
    category: "Arrays",
    concept: "Deque",
    starterCode: "def max_sliding_window(nums, k):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[1,3,-1,-3,5,3,6,7], 3", expectedOutput: "[3,3,5,5,6,7]" }
    ],
    hints: ["Use a double-ended queue (deque) to store indices.", "Keep indices of elements in decreasing order of their values."]
  },
  {
    title: "Product of Array Except Self",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    difficulty: "Medium",
    category: "Arrays",
    concept: "Prefix Products",
    starterCode: "def product_except_self(nums):\n    # Write your code here\n    pass",
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]" }
    ],
    hints: ["Use prefix and suffix product arrays.", "Can you do it in O(1) extra space (excluding the output array)?"]
  },
  {
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    category: "Dynamic Programming",
    concept: "Recursion with Memoization",
    starterCode: "def climb_stairs(n):\n    # Write your code here\n    pass",
    testCases: [
      { input: "3", expectedOutput: "3" }
    ],
    hints: ["This is similar to the Fibonacci sequence.", "Think about the last step - it could have come from n-1 or n-2."]
  },
  {
    title: "Python Decorator: Timing",
    description: "Create a Python decorator `time_it` that calculates the execution time of any function it decorates and prints it. Use the `time` module.",
    difficulty: "Medium",
    category: "Python Core",
    concept: "Decorators",
    starterCode: "import time\n\ndef time_it(func):\n    # Write your decorator here\n    pass",
    testCases: [
      { input: "decorated_func()", expectedOutput: "(Console output showing execution time)" }
    ],
    hints: ["Remember to use *args and **kwargs to pass arguments.", "Return the function's result after timing."]
  },
  {
    title: "Edit Distance",
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. Operations possible: Insert, Delete, Replace.",
    difficulty: "Hard",
    category: "Strings",
    concept: "Dynamic Programming",
    starterCode: "def min_distance(word1, word2):\n    # Write your code here\n    pass",
    testCases: [
      { input: "'horse', 'ros'", expectedOutput: "3" }
    ],
    hints: ["Create a 2D matrix DP[i][j] representing the cost matching word1[:i] and word2[:j]."]
  },
  {
    title: "Dijkstra's Shortest Path",
    description: "Implement Dijkstra's algorithm to find the shortest path from a start node to all other nodes in a weighted graph.",
    difficulty: "Hard",
    category: "Algorithms",
    concept: "Graphs",
    starterCode: "import heapq\n\ndef dijkstra(graph, start):\n    # Write your code here\n    pass",
    testCases: [
      { input: "{'A': {'B': 1, 'C': 4}, 'B': {'C': 2}}, 'A'", expectedOutput: "{'A': 0, 'B': 1, 'C': 3}" }
    ],
    hints: ["Use a priority queue (heapq) to select the node with the minimum distance.", "Maintain a dictionary of the shortest distances found so far."]
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code_review';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Optional: Clear existing problems if you want a fresh set
    // await Problem.deleteMany({});

    for (const prob of problems) {
      await Problem.findOneAndUpdate(
        { title: prob.title },
        prob,
        { upsert: true, new: true }
      );
    }

    console.log("Successfully seeded 12 Python algorithm problems!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
