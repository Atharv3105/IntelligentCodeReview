// ============================================================================
// Analytics Controller — Prisma/PostgreSQL
// ============================================================================

const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [profile, userSkills, allSkills, recentSubmissions, recentInterviews, totalSolved, totalInterviews, recentActivities] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true }, orderBy: { mastery: "desc" } }),
    prisma.skill.findMany({ orderBy: { category: "asc" } }),
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { problem: { select: { id: true, title: true, difficulty: true, problemNumber: true } } },
    }),
    prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { report: { select: { overallScore: true } } },
    }),
    prisma.submission.count({
      where: { userId, status: "completed" },
    }),
    prisma.interviewSession.count({ where: { userId, state: "completed" } }),
    prisma.activity.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
  ]);

  // Index user's practiced skills by skillId and by name
  const userSkillMap = new Map();
  userSkills.forEach((us) => {
    if (us.skillId) userSkillMap.set(us.skillId, us);
    if (us.skill?.name) userSkillMap.set(us.skill.name.toLowerCase(), us);
  });

  // Calculate readiness score from practiced skills or profile
  const practicedSkills = userSkills.filter((s) => (s.attempts > 0 || s.mastery > 0));
  const readinessScore = practicedSkills.length > 0
    ? Math.round(practicedSkills.reduce((sum, s) => sum + (s.mastery || 0), 0) / practicedSkills.length)
    : Math.round(profile?.readinessScore || 0);

  // Approximate study hours from real submissions, interviews, and XP
  const studyHours = Math.round(((totalSolved * 25) + (totalInterviews * 45) + ((profile?.xp || 0) / 40)) / 6) / 10;

  // Build comprehensive skills grouped by category (DSA, SQL, DBMS, OS, CN, OOP, System Design)
  const skillsByCategory = {};

  // First seed with standard database skills
  allSkills.forEach((s) => {
    const cat = s.category || "General";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    const us = userSkillMap.get(s.id) || userSkillMap.get(s.name.toLowerCase());
    skillsByCategory[cat].push({
      id: s.id,
      name: s.name,
      category: cat,
      mastery: us ? Math.round(us.mastery) : 0,
      confidence: us ? us.confidence : 0,
      attempts: us ? us.attempts : 0,
      lastPracticed: us ? us.lastPracticed : null,
    });
  });

  // Also include any custom topic skills the user practiced (e.g. from SubjectPractice)
  userSkills.forEach((us) => {
    if (!us.skill) return;
    const cat = us.skill.category || "General";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    const exists = skillsByCategory[cat].some((item) => item.name === us.skill.name);
    if (!exists) {
      skillsByCategory[cat].push({
        id: us.skill.id,
        name: us.skill.name,
        category: cat,
        mastery: Math.round(us.mastery),
        confidence: us.confidence,
        attempts: us.attempts,
        lastPracticed: us.lastPracticed,
      });
    }
  });

  // Activity heatmap (last 365 days)
  const heatmap = {};
  recentActivities.forEach((a) => {
    if (a?.date) {
      const date = (a.date instanceof Date ? a.date : new Date(a.date)).toISOString().split("T")[0];
      heatmap[date] = (heatmap[date] || 0) + 1;
    }
  });

  // Dynamic recommendations based on real user weaknesses or starter path
  let recommendations = [];
  if (practicedSkills.length > 0) {
    const weak = [...practicedSkills]
      .filter((s) => s.mastery < 70)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);

    if (weak.length > 0) {
      recommendations = weak.map((s) => ({
        skill: s.skill?.name || "Target Concept",
        category: s.skill?.category || "DSA",
        mastery: Math.round(s.mastery),
        suggestion: `Strengthen your fundamentals in ${s.skill?.name || "this topic"} to raise your readiness score.`,
      }));
    }
  }

  // Fallback to intelligent starter recommendations if no weaknesses identified
  if (recommendations.length === 0) {
    recommendations = [
      {
        skill: "Arrays & Strings",
        category: "DSA",
        mastery: 0,
        suggestion: "Start your preparation by mastering fundamental array manipulation and two-pointer patterns.",
      },
      {
        skill: "SQL Queries & Joins",
        category: "SQL",
        mastery: 0,
        suggestion: "Practice core SQL joins, grouping, and aggregation queries to establish strong database fluency.",
      },
    ];
  }

  res.json({
    success: true,
    dashboard: {
      readinessScore,
      streak: profile?.streakCount || 0,
      xp: profile?.xp || 0,
      level: profile?.level || 1,
      totalSolved,
      totalInterviews,
      studyHours,
      skills: skillsByCategory,
      recentSubmissions,
      recentInterviews,
      heatmap,
      recommendations,
    },
  });
});

exports.getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalSubmissions, totalInterviews, aiUsageToday, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.submission.count(),
    prisma.interviewSession.count(),
    prisma.aIUsage.aggregate({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      _sum: { totalTokens: true, estimatedCost: true },
      _count: true,
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);

  const avgGrade = await prisma.submission.aggregate({
    where: { status: "completed", NOT: { grade: null } },
    _avg: { grade: true },
  });

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalSubmissions,
      totalInterviews,
      avgGrade: Math.round((avgGrade._avg.grade || 0) * 100) / 100,
      aiUsageToday: {
        requests: aiUsageToday._count,
        tokens: aiUsageToday._sum.totalTokens || 0,
        estimatedCost: Math.round((aiUsageToday._sum.estimatedCost || 0) * 10000) / 10000,
      },
      recentUsers,
    },
  });
});

exports.getSkillGraph = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [userSkills, allSkills] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { mastery: "desc" },
    }),
    prisma.skill.findMany({ orderBy: { category: "asc" } }),
  ]);

  const userSkillMap = new Map();
  userSkills.forEach((us) => {
    if (us.skillId) userSkillMap.set(us.skillId, us);
    if (us.skill?.name) userSkillMap.set(us.skill.name.toLowerCase(), us);
  });

  // Group by category
  const graph = {};

  // Standard skills
  allSkills.forEach((s) => {
    const cat = s.category || "General";
    if (!graph[cat]) graph[cat] = { category: cat, overallMastery: 0, skills: [] };
    const us = userSkillMap.get(s.id) || userSkillMap.get(s.name.toLowerCase());
    graph[cat].skills.push({
      id: s.id,
      name: s.name,
      mastery: us ? Math.round(us.mastery) : 0,
      confidence: us ? us.confidence : 0,
      attempts: us ? us.attempts : 0,
      lastPracticed: us ? us.lastPracticed : null,
    });
  });

  // Custom user skills
  userSkills.forEach((us) => {
    if (!us.skill) return;
    const cat = us.skill.category || "General";
    if (!graph[cat]) graph[cat] = { category: cat, overallMastery: 0, skills: [] };
    const exists = graph[cat].skills.some((item) => item.name === us.skill.name);
    if (!exists) {
      graph[cat].skills.push({
        id: us.skill.id,
        name: us.skill.name,
        mastery: Math.round(us.mastery),
        confidence: us.confidence,
        attempts: us.attempts,
        lastPracticed: us.lastPracticed,
      });
    }
  });

  // Calculate category averages
  Object.values(graph).forEach((cat) => {
    const total = cat.skills.reduce((sum, s) => sum + s.mastery, 0);
    cat.overallMastery = cat.skills.length > 0 ? Math.round(total / cat.skills.length) : 0;
  });

  res.json({ success: true, skillGraph: Object.values(graph) });
});

exports.getStudentDetails = asyncHandler(async (req, res) => {
  const student = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true,
      profile: true,
      skills: { include: { skill: true }, orderBy: { mastery: "desc" } },
    },
  });

  if (!student) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student not found." } });
  }

  const submissions = await prisma.submission.findMany({
    where: { userId: student.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { problem: { select: { title: true, difficulty: true } } },
  });

  res.json({ success: true, student, submissions });
});