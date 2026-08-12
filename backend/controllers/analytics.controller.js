// ============================================================================
// Analytics Controller — Prisma/PostgreSQL
// ============================================================================

const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [profile, skills, recentSubmissions, recentInterviews, totalSolved, totalInterviews, recentActivities] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true }, orderBy: { mastery: "desc" } }),
    prisma.submission.findMany({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { problem: { select: { title: true, difficulty: true } } },
    }),
    prisma.interviewSession.findMany({
      where: { userId, state: "completed" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { report: { select: { overallScore: true } } },
    }),
    prisma.submission.count({
      where: { userId, status: "completed", NOT: { passedTests: null }, passedTests: { equals: prisma.submission.fields?.totalTests } },
    }),
    prisma.interviewSession.count({ where: { userId, state: "completed" } }),
    prisma.activity.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 30 }),
  ]);

  // Calculate readiness score from skills
  const readinessScore = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.mastery, 0) / skills.length)
    : 0;

  // Skill breakdown by category
  const skillsByCategory = {};
  skills.forEach((s) => {
    const cat = s.skill.category;
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push({ name: s.skill.name, mastery: s.mastery, confidence: s.confidence });
  });

  // Activity heatmap (last 365 days)
  const heatmap = {};
  recentActivities.forEach((a) => {
    const date = a.date.toISOString().split("T")[0];
    heatmap[date] = (heatmap[date] || 0) + 1;
  });

  // Recommendations based on weaknesses
  const weakSkills = skills.filter((s) => s.mastery < 50).sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const recommendations = weakSkills.map((s) => ({
    skill: s.skill.name,
    category: s.skill.category,
    mastery: s.mastery,
    suggestion: `Practice more ${s.skill.name} problems to improve from ${Math.round(s.mastery)}%.`,
  }));

  res.json({
    success: true,
    dashboard: {
      readinessScore,
      streak: profile?.streakCount || 0,
      xp: profile?.xp || 0,
      level: profile?.level || 1,
      totalSolved,
      totalInterviews,
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

  const skills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { mastery: "desc" },
  });

  // Group by category
  const graph = {};
  skills.forEach((s) => {
    const cat = s.skill.category;
    if (!graph[cat]) graph[cat] = { category: cat, overallMastery: 0, skills: [] };
    graph[cat].skills.push({
      name: s.skill.name,
      mastery: Math.round(s.mastery),
      confidence: s.confidence,
      attempts: s.attempts,
      lastPracticed: s.lastPracticed,
    });
  });

  // Calculate category averages
  Object.values(graph).forEach((cat) => {
    cat.overallMastery = Math.round(cat.skills.reduce((sum, s) => sum + s.mastery, 0) / cat.skills.length);
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