const Submission = require("../models/Submission");

exports.getLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          grade: { $type: "number" },
          status: "Completed"
        }
      },
      {
        $group: {
          _id: "$userId",
          avgGrade: { $avg: "$grade" },
          totalSubmissions: { $sum: 1 },
          bestGrade: { $max: "$grade" },
          solvedProblems: { $addToSet: "$problemId" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: { $ifNull: ["$user.displayName", "$user.name", "Anonymous"] },
          avgGrade: { $round: ["$avgGrade", 2] },
          bestGrade: 1,
          totalSubmissions: 1,
          solvedCount: { $size: "$solvedProblems" }
        }
      },
      { $sort: { solvedCount: -1, avgGrade: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const leaderboard = await Submission.aggregate(pipeline);

    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard." });
  }
};
