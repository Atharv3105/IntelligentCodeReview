const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Problem = require('../models/Problem');

const DATA_URL = "https://raw.githubusercontent.com/neenza/leetcode-problems/master/merged_problems.json";

// Shared lists for auto-categorization
const BLIND_75 = [
  "Two Sum", "Best Time to Buy and Sell Stock", "Contains Duplicate", "Product of Array Except Self", "Maximum Subarray",
  "Maximum Product Subarray", "Find Minimum in Rotated Sorted Array", "Search in Rotated Sorted Array", "3Sum", "Container With Most Water",
  "Sum of Two Integers", "Number of 1 Bits", "Counting Bits", "Reverse Bits", "Missing Number",
  "Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "Longest Common Subsequence", "Word Break",
  "Combination Sum", "House Robber", "House Robber II", "Decode Ways", "Unique Paths", "Jump Game",
  "Clone Graph", "Course Schedule", "Pacific Atlantic Water Flow", "Number of Islands", "Longest Consecutive Sequence",
  "Alien Dictionary", "Graph Valid Tree", "Number of Connected Components in an Undirected Graph",
  "Insert Interval", "Merge Intervals", "Non-overlapping Intervals", "Meeting Rooms", "Meeting Rooms II",
  "Reverse Linked List", "Linked List Cycle", "Merge Two Sorted Lists", "Merge k Sorted Lists", "Remove Nth Node From End of List", "Reorder List",
  "Set Matrix Zeroes", "Spiral Matrix", "Rotate Image", "Word Search",
  "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Minimum Window Substring", "Valid Anagram", "Group Anagrams",
  "Valid Parentheses", "Valid Palindrome", "Longest Palindromic Substring", "Palindromic Substrings", "Encode and Decode Strings",
  "Maximum Depth of Binary Tree", "Same Tree", "Invert Binary Tree", "Binary Tree Maximum Path Sum", "Binary Tree Level Order Traversal",
  "Serialize and Deserialize Binary Tree", "Subtree of Another Tree", "Construct Binary Tree from Preorder and Inorder Traversal",
  "Validate Binary Search Tree", "Kth Smallest Element in a BST", "Lowest Common Ancestor of a BST", "Implement Trie (Prefix Tree)",
  "Design Add and Search Words Data Structure", "Word Search II", "Find Median from Data Stream"
];

const NEETCODE_150 = [
  ...BLIND_75,
  "Concatenation of Array", "Replace Elements with Greatest Element on Right Side", "Is Subsequence", "Length of Last Word",
  "Two Sum II - Input Array Is Sorted", "3Sum", "4Sum", "Valid Sudoku", "Trapping Rain Water", "Valid Palindrome II",
  "Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation", "Generate Parentheses", "Daily Temperatures", "Car Fleet", "Largest Rectangle in Histogram",
  "Binary Search", "Search a 2D Matrix", "Koko Eating Bananas", "Search in Rotated Sorted Array", "Find Minimum in Rotated Sorted Array", "Time Based Key-Value Store", "Median of Two Sorted Arrays",
  "Reverse Linked List", "Merge Two Sorted Lists", "Reorder List", "Remove Nth Node From End of List", "Copy List with Random Pointer", "Add Two Numbers", "Linked List Cycle", "Find the Duplicate Number", "LRU Cache", "Merge k Sorted Lists", "Reverse Nodes in k-Group",
  "Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Balanced Binary Tree", "Same Tree", "Subtree of Another Tree", "Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal", "Binary Tree Right Side View", "Count Good Nodes in Binary Tree", "Validate Binary Search Tree", "Kth Smallest Element in a BST", "Construct Binary Tree from Preorder and Inorder Traversal", "Binary Tree Maximum Path Sum", "Serialize and Deserialize Binary Tree",
  "Kth Largest Element in a Stream", "Last Stone Weight", "K Closest Points to Origin", "Kth Largest Element in an Array", "Task Scheduler", "Design Twitter", "Find Median from Data Stream",
  "Subsets", "Combination Sum", "Permutations", "Subsets II", "Combination Sum II", "Word Search", "Palindrome Partitioning", "Letter Combinations of a Phone Number", "N-Queens",
  "Number of Islands", "Clone Graph", "Max Area of Island", "Pacific Atlantic Water Flow", "Surrounding Regions", "Course Schedule", "Course Schedule II", "Graph Valid Tree", "Number of Connected Components in an Undirected Graph", "Redundant Connection", "Word Ladder",
  "Climbing Stairs", "Min Cost Climbing Stairs", "House Robber", "House Robber II", "Longest Palindromic Substring", "Palindromic Substrings", "Decode Ways", "Coin Change", "Maximum Product Subarray", "Word Break", "Longest Increasing Subsequence", "Partition Equal Subset Sum",
  "Single Number", "Number of 1 Bits", "Counting Bits", "Reverse Bits", "Missing Number", "Sum of Two Integers", "Reverse Integer"
];

const STRIVER_SDE = [
  "Set Matrix Zeroes", "Pascal's Triangle", "Next Permutation", "Maximum Subarray", "Sort Colors", "Best Time to Buy and Sell Stock",
  "Rotate Image", "Merge Intervals", "Merge Sorted Array", "Find the Duplicate Number", "Repeat and Missing Number Array", "Inversion of Array",
  "Search a 2D Matrix", "Pow(x, n)", "Majority Element", "Majority Element II", "Unique Paths", "Reverse Pairs",
  "Two Sum", "4Sum", "Longest Consecutive Sequence", "Largest Subarray with 0 sum", "Count number of subarrays with given Xor", "Longest Substring Without Repeating Characters",
  "Reverse Linked List", "Middle of the Linked List", "Merge Two Sorted Lists", "Remove Nth Node From End of List", "Add Two Numbers", "Delete Node in a Linked List",
  "Intersection of Two Linked Lists", "Linked List Cycle", "Reverse Nodes in k-Group", "Palindrome Linked List", "Linked List Cycle II", "Flattening a Linked List",
  "Copy List with Random Pointer", "3Sum", "Trapping Rain Water", "Remove Duplicate from Sorted array", "Max Consecutive Ones",
  "N Meetings in one room", "Minimum number of platforms", "Job Sequencing Problem", "Fractional Knapsack", "Find minimum number of coins",
  "Subset Sums", "Subsets II", "Combination Sum", "Combination Sum II", "Palindrome Partitioning", "Rat in a Maze Problem",
  "The N-Queens Problem", "Sudoku Solver", "M-Coloring Problem", "Word Break", "Palindrome Partitioning",
  "The Number of Shortest Paths", "Maximum of all Subarrays of size k", "Rotten Oranges", "LUM", "BFS of Graph", "DFS of Graph"
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeReview';
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Database connected. Analyzing data source...");

    console.log("Downloading LeetCode dataset (3000+ problems)...");
    const response = await axios.get(DATA_URL);
    let jsonData = response.data;

    // Handle stringified data or wrapped objects
    let problemsArray = [];
    if (Array.isArray(jsonData)) {
      problemsArray = jsonData;
    } else if (jsonData && typeof jsonData === 'object') {
      problemsArray = jsonData.problems || jsonData.data || Object.values(jsonData).find(v => Array.isArray(v)) || [];
    }

    if (problemsArray.length === 0) {
      console.error("DEBUG: Received data keys:", Object.keys(jsonData || {}));
      throw new Error("Target dataset is empty or not in an expected array format.");
    }

    console.log(`Successfully parsed ${problemsArray.length} problems. Preparing bulk ingestion...`);

    const operations = problemsArray.map((p, idx) => {
      const collections = [];
      const title = p.title || p.question_title || "Untitled";
      
      if (BLIND_75.includes(title)) collections.push("Blind 75");
      if (NEETCODE_150.includes(title)) collections.push("Neetcode 150");
      if (STRIVER_SDE.includes(title)) collections.push("Striver SDE Sheet");
      
      // Extract Tags and Category
      const rawTags = p.topics || p.topicTags || p.tags || [];
      const tags = rawTags.map(t => typeof t === 'object' ? (t.name || t.title) : t).filter(Boolean);
      
      // Select primary category (prioritize common ones, or use the first tag)
      let category = "Algorithms";
      if (tags.length > 0) {
        // Normalization mapping
        const normalization = {
          "Trees": "Tree",
          "Graphs": "Graph",
          "LinkedList": "Linked List",
          "Linked Lists": "Linked List",
          "DP": "Dynamic Programming",
          "Strings": "String",
          "Arrays": "Array"
        };

        // Look for common broad categories first, else take the first tag
        const bigThree = tags.find(t => ["Dynamic Programming", "Graph", "Tree"].includes(t));
        category = normalization[bigThree] || normalization[tags[0]] || bigThree || tags[0];
      }

      const concept = category; 

      const pId = p.frontend_id || p.problem_id || p.question_id || (idx + 1);

      return {
        updateOne: {
          filter: { problemNumber: pId },
          update: {
            problemNumber: pId,
            title: title,
            description: p.description || p.content || "Description coming soon...",
            difficulty: p.difficulty || "Medium",
            category: category,
            concept: concept,
            tags: tags,
            collections: collections,
            starterCode: "def solution():\n    # Implement here\n    pass",
          },
          upsert: true
        }
      };
    });

    console.log("Writing to MongoDB (Batch size: ~3000)...");
    const result = await Problem.bulkWrite(operations);
    console.log(`Ingestion Complete! Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}`);

    console.log("Seed successful. Exiting.");
    process.exit(0);
  } catch (err) {
    console.error("Bulk Seed Error:", err.message);
    process.exit(1);
  }
}

seed();
