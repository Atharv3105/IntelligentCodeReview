// ============================================================================
// Leaderboard Controller — Prisma/PostgreSQL
// ============================================================================

const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 100);
  const skip = (page - 1) * limit;

  // Aggregate user statistics using Prisma raw query for performance
  const leaderboardRaw = await prisma.$queryRaw`
    SELECT 
      u.id AS "userId",
      u.name AS "username",
      u.email AS "email",
      p."xp" AS "xp",
      p."streakCount" AS "streakCount",
      p."level" AS "level",
      COUNT(DISTINCT s."problemId")::int AS "solvedCount",
      ROUND(AVG(s.grade)::numeric, 2)::float AS "avgGrade",
      COUNT(s.id)::int AS "totalSubmissions"
    FROM "User" u
    LEFT JOIN "UserProfile" p ON u.id = p."userId"
    LEFT JOIN "Submission" s ON u.id = s."userId" AND s.status = 'completed' AND s.grade IS NOT NULL
    WHERE u.role IN ('student', 'admin', 'interviewer')
    GROUP BY u.id, u.name, u.email, p.xp, p."streakCount", p.level
    ORDER BY "solvedCount" DESC, "avgGrade" DESC NULLS LAST, p.xp DESC NULLS LAST
    LIMIT ${limit} OFFSET ${skip};
  `;

  const totalCount = await prisma.user.count({ where: { role: { in: ["student", "admin", "interviewer"] } } });

  res.json({
    success: true,
    leaderboard: leaderboardRaw,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
  });
});
