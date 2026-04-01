const Problem = require("../models/Problem");

exports.getProblems = async (req, res) => {
  try {
    const {
      search = "",
      difficulty,
      category,
      concept,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }
    if (category && category !== "All") {
      query.category = category;
    }
    if (concept && concept !== "All") {
      query.concept = concept;
    }

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, Math.min(parseInt(limit), 100)); // cap at 100
    const skip = (parsedPage - 1) * parsedLimit;

    const problems = await Problem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    // Also get total for pagination metadata
    const total = await Problem.countDocuments(query);

    res.json({
      problems,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch problems." });
  }
};

exports.getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch problem specifics." });
  }
};
