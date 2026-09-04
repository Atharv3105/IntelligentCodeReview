// ============================================================================
// Seed Problems Dataset Script — Prisma/PostgreSQL
// ============================================================================
// Seeds all problems from JSON dataset files in backend/data/ into the database.
// Run: node scripts/seedProblems.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedProblemDatasets() {
  console.log("🌱 Seeding problem datasets from data folder...");

  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    console.log("No data directory found at:", dataDir);
    return;
  }

  const jsonFiles = fs.readdirSync(dataDir).filter((file) => file.endsWith(".json"));
  console.log(`Found ${jsonFiles.length} dataset file(s) in data directory:`, jsonFiles);

  let totalProblems = 0;
  let totalTestCases = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    console.log(`\n📂 Processing: ${file}`);
    const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const records = fileContent.records || [];

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

      const upserted = await prisma.problem.upsert({
        where: { problemNumber: problem.problemNumber },
        update: problemData,
        create: {
          problemNumber: problem.problemNumber,
          ...problemData,
        },
      });

      // Refresh test cases
      await prisma.testCase.deleteMany({ where: { problemId: upserted.id } });
      if (testCases && testCases.length > 0) {
        await prisma.testCase.createMany({
          data: testCases.map((tc, idx) => ({
            problemId: upserted.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            category: (tc.category || "public").toLowerCase(),
            orderIndex: tc.orderIndex ?? idx + 1,
            timeLimit: tc.timeLimit ?? null,
            memoryLimit: tc.memoryLimit ?? null,
          })),
        });
        totalTestCases += testCases.length;
      }

      totalProblems++;
      console.log(`  ✓ Problem #${upserted.problemNumber}: ${upserted.title} [${upserted.difficulty.toUpperCase()} | ${upserted.category}] (${testCases ? testCases.length : 0} test cases)`);
    }
  }

  console.log(`\n🎉 Successfully seeded ${totalProblems} problems with ${totalTestCases} test cases!`);
}

async function main() {
  try {
    await seedProblemDatasets();
  } catch (error) {
    console.error("❌ Error seeding problems:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedProblemDatasets };
