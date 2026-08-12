const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const protect = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");

router.get("/", protect, asyncHandler(async (req, res) => {
  const skills = await prisma.userSkill.findMany({
    where: { userId: req.user.id },
    include: { skill: true },
    orderBy: { mastery: "desc" },
  });

  const graph = {};
  skills.forEach((s) => {
    const cat = s.skill.category;
    if (!graph[cat]) graph[cat] = { category: cat, overallMastery: 0, skills: [] };
    graph[cat].skills.push({ name: s.skill.name, mastery: Math.round(s.mastery), confidence: s.confidence, attempts: s.attempts });
  });
  Object.values(graph).forEach((cat) => {
    cat.overallMastery = Math.round(cat.skills.reduce((sum, s) => sum + s.mastery, 0) / cat.skills.length);
  });

  // Calculate readiness score
  const readinessScore = skills.length > 0 ? Math.round(skills.reduce((s, sk) => s + sk.mastery, 0) / skills.length) : 0;

  res.json({ success: true, skillGraph: Object.values(graph), readinessScore });
}));

module.exports = router;
