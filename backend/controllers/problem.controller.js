const Problem = require("../models/Problem");

exports.getProblems = async (req, res) => {
  try {
    const {
      search = "",
      difficulty,
      category,
      concept,
      collections, // Array expected for multi-select
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (search) {
      // Support search by title or problem number
      if (!isNaN(search)) {
        query.problemNumber = parseInt(search);
      } else {
        query.title = { $regex: search, $options: "i" };
      }
    }
    
    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }
    if (category && category !== "All") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }
    if (concept && concept !== "All") {
      query.concept = { $regex: `^${concept}$`, $options: "i" };
    }

    // Collection Filter (Intersection)
    if (collections) {
      const collectionArray = Array.isArray(collections) ? collections : [collections];
      if (collectionArray.length > 0 && !collectionArray.includes("All")) {
        query.collections = { $all: collectionArray };
      }
    }

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, Math.min(parseInt(limit), 500));
    const skip = (parsedPage - 1) * parsedLimit;

    // Use problemNumber as default sort
    const problems = await Problem.find(query)
      .sort({ problemNumber: 1 }) 
      .skip(skip)
      .limit(parsedLimit);

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
    console.error("Fetch Problems Error:", error);
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
