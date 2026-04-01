const Submission = require("../models/Submission");

exports.getAnalytics = async (req, res) => {

  const totalSubmissions = await Submission.countDocuments();

  const avgGrade = await Submission.aggregate([
    { $group: { _id: null, avg: { $avg: "$grade" } } }
  ]);

  res.json({
    totalSubmissions,
    avgGrade: avgGrade[0]?.avg || 0
  });
};