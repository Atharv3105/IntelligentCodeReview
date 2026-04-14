const User = require("../models/User");
const Submission = require("../models/Submission");

exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("solvedProblems", "title category");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const categoryStats = {};
    user.solvedProblems.forEach(prob => {
      const cat = prob.category || "General";
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    const recentSubmissions = await Submission.find({ userId: req.user.id })
      .populate("problemId", "title difficulty")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      streak: user.streakCount || 0,
      totalSolved: user.solvedProblems.length,
      activityLog: user.activityLog || [], 
      categoryStats,
      recentSubmissions
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    // 1. Core Platform Stats
    const totalSubmissions = await Submission.countDocuments();
    const activeUsers = await User.countDocuments({ role: 'student', "solvedProblems.0": { $exists: true } });
    
    const allSubmissions = await Submission.find({})
      .select('grade createdAt problemId')
      .populate('problemId', 'difficulty');
      
    const successfulSubmissions = allSubmissions.filter(s => (s.grade || 0) >= 70);
    const avgGrade = allSubmissions.length > 0 
      ? allSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / allSubmissions.length 
      : 0;

    // 2. Teacher Monitoring: Top Streaks
    const topStreaks = await User.find({ role: 'student' }, 'name streakCount email')
      .sort({ streakCount: -1 })
      .limit(20);

    // 3. Granular Class-wide Heatmap (Total + By Difficulty)
    const heatmap = {}; // Format: { "YYYY-MM-DD": { total: 0, easy: 0, medium: 0, hard: 0 } }
    let maxActivity = { total: 0, easy: 0, medium: 0, hard: 0 };

    successfulSubmissions.forEach(sub => {
      const date = sub.createdAt.toISOString().split('T')[0];
      const diff = (sub.problemId && typeof sub.problemId === 'object' && sub.problemId.difficulty) 
                   ? sub.problemId.difficulty.toLowerCase() 
                   : 'easy';
      
      if (!heatmap[date]) {
        heatmap[date] = { total: 0, easy: 0, medium: 0, hard: 0 };
      }
      
      heatmap[date].total++;
      heatmap[date][diff]++;

      // Track max for dynamic scaling
      if (heatmap[date].total > maxActivity.total) maxActivity.total = heatmap[date].total;
      if (heatmap[date][diff] > maxActivity[diff]) maxActivity[diff] = heatmap[date][diff];
    });

    // 4. Difficulty Breakdown
    const problemStats = allSubmissions.reduce((acc, curr) => {
      const d = (curr.problemId && typeof curr.problemId === 'object' && curr.problemId.difficulty)
                ? curr.problemId.difficulty.toLowerCase()
                : 'easy';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSubmissions,
      activeUsers,
      avgGrade,
      successRate: allSubmissions.length > 0 ? (successfulSubmissions.length / allSubmissions.length) * 100 : 0,
      topStreaks,
      heatmap,
      maxActivity,
      problemStats,
      newSubmissionsToday: await Submission.countDocuments({ 
        createdAt: { $gte: new Date().setHours(0,0,0,0) } 
      }),
      newUsersToday: await User.countDocuments({ 
        createdAt: { $gte: new Date().setHours(0,0,0,0) } 
      })
    });
  } catch (err) {
    console.error("Admin monitoring stats error:", err);
    res.status(500).json({ message: "Failed to fetch admin monitoring data.", error: err.message });
  }
};

exports.getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('name email streakCount solvedProblems activityLog')
      .populate('solvedProblems', 'title category difficulty problemNumber');
    
    if (!student) return res.status(404).json({ message: "Student not found" });

    const submissions = await Submission.find({ userId: student._id })
      .populate('problemId', 'title difficulty problemNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      student,
      submissions
    });
  } catch (err) {
    console.error("Get student details error:", err);
    res.status(500).json({ message: "Failed to fetch student details" });
  }
};