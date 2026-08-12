// ============================================================================
// Prisma Database Seed Script
// ============================================================================
// Seeds initial admin user, system categories, default skills, and fallback problems.
// Run: npx prisma db seed
// ============================================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
  console.log("✓ Admin user created:", admin.email);

  // 2. Create Standard Skills
  const defaultSkills = [
    { name: "Arrays & Strings", category: "DSA", description: "Array manipulation, string parsing, sliding window, two pointers" },
    { name: "Dynamic Programming", category: "DSA", description: "Memoization, tabulation, knapsack, state transitions" },
    { name: "Trees & Graphs", category: "DSA", description: "Binary trees, BST, BFS, DFS, shortest path, topological sort" },
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

  // 3. Fallback DSA Problems
  const fallbackProblems = [
    {
      problemNumber: 1,
      title: "Two Sum",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      difficulty: "easy",
      category: "DSA",
      concept: "Hashing",
      topics: ["Arrays", "Hashing"],
      collections: ["Blind75", "Neetcode150"],
      starterCode: {
        python: "def twoSum(nums, target):\n    # Write your solution here\n    pass",
        javascript: "function twoSum(nums, target) {\n    // Write your solution here\n}",
        cpp: "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}",
        java: "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}"
      },
      hints: ["Try using a Hash Table to store indices of previously seen numbers."],
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
      expectedComplexity: { time: "O(n)", space: "O(n)" },
      testCases: [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", category: "public", orderIndex: 0 },
        { input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]", category: "public", orderIndex: 1 },
        { input: "[3, 3]\n6", expectedOutput: "[0, 1]", category: "hidden", orderIndex: 2 }
      ]
    },
    {
      problemNumber: 2,
      title: "Valid Anagram",
      description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
      difficulty: "easy",
      category: "DSA",
      concept: "Strings",
      topics: ["Strings", "Hashing"],
      collections: ["Blind75"],
      starterCode: {
        python: "def isAnagram(s, t):\n    pass",
        javascript: "function isAnagram(s, t) {\n}",
        cpp: "bool isAnagram(string s, string t) {\n    return false;\n}",
        java: "public boolean isAnagram(String s, String t) {\n    return false;\n}"
      },
      hints: ["Count frequencies of characters in both strings."],
      constraints: ["1 <= s.length, t.length <= 5 * 10^4"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        { input: "anagram\nnagaram", expectedOutput: "true", category: "public", orderIndex: 0 },
        { input: "rat\ncar", expectedOutput: "false", category: "public", orderIndex: 1 }
      ]
    }
  ];

  for (const prob of fallbackProblems) {
    const { testCases, ...probData } = prob;
    const created = await prisma.problem.upsert({
      where: { problemNumber: prob.problemNumber },
      update: probData,
      create: {
        ...probData,
        testCases: {
          create: testCases
        }
      }
    });
    console.log(`✓ Problem #${created.problemNumber}: ${created.title}`);
  }

  // 4. Fallback SQL Challenge
  await prisma.sQLChallenge.upsert({
    where: { id: "seed-sql-1" },
    update: {},
    create: {
      id: "seed-sql-1",
      title: "High Earning Employees",
      description: "Write a solution to find employees who earn more than their managers.",
      difficulty: "easy",
      topic: "Joins",
      setupSQL: `
        CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
        INSERT INTO Employee VALUES (1, 'Joe', 70000, 3);
        INSERT INTO Employee VALUES (2, 'Henry', 80000, 4);
        INSERT INTO Employee VALUES (3, 'Sam', 60000, NULL);
        INSERT INTO Employee VALUES (4, 'Max', 90000, NULL);
      `,
      solutionSQL: "SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary",
      hints: ["Join the Employee table with itself on e.managerId = m.id."],
      explanation: "Self-join the table to compare employee salary with manager salary.",
      isGenerated: false
    }
  });
  console.log("✓ SQL Challenge created");

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
