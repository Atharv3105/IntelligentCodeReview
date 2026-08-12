// ============================================================================
// Career Controller — Resume, GitHub, Career Coach
// ============================================================================

const prisma = require("../config/prisma");
const aiGateway = require("../services/ai-gateway");
const { asyncHandler } = require("../middleware/error.middleware");
const { generateSecureFilename, getStoragePath, validateFile } = require("../utils/storage");
const fs = require("fs");
const path = require("path");

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded." } });
  }

  const errors = validateFile(req.file, "resumes");
  if (errors.length > 0) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.join("; ") } });
  }

  const secureFilename = generateSecureFilename(req.file.originalname);
  const storagePath = getStoragePath(process.env.STORAGE_PATH || "./storage", "resumes");
  const destPath = path.join(storagePath, secureFilename);

  // Move file to storage
  fs.renameSync(req.file.path, destPath);

  const resume = await prisma.resume.create({
    data: {
      userId: req.user.id,
      filename: secureFilename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: `resumes/${secureFilename}`,
    },
  });

  res.json({ success: true, resume: { id: resume.id, originalName: resume.originalName, size: resume.size } });
});

exports.analyzeResume = asyncHandler(async (req, res) => {
  const { resumeId, targetRole } = req.body;

  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: req.user.id } });
  if (!resume) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resume not found." } });
  }

  // Read resume content (simplified — in production, use a proper PDF/DOCX parser)
  const filePath = path.join(path.resolve(process.env.STORAGE_PATH || "./storage"), resume.storagePath);
  let resumeText = "";

  if (resume.mimeType === "text/plain") {
    resumeText = fs.readFileSync(filePath, "utf-8");
  } else {
    // For PDF/DOCX, use the filename and parsed data if available
    resumeText = resume.parsedData ? JSON.stringify(resume.parsedData) : `[Resume file: ${resume.originalName}]`;
  }

  const analysis = await aiGateway.analyzeResume({
    resumeText,
    targetRole: targetRole || "Software Engineer",
    userId: req.user.id,
  });

  // Update resume with analysis
  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      parsedData: analysis.data,
      atsScore: analysis.data.atsScore || null,
      analysis: analysis.data,
    },
  });

  res.json({ success: true, analysis: analysis.data });
});

exports.getResumes = asyncHandler(async (req, res) => {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, size: true, atsScore: true, isActive: true, createdAt: true },
  });

  res.json({ success: true, resumes });
});

exports.analyzeGitHub = asyncHandler(async (req, res) => {
  const { githubUsername } = req.body;

  if (!githubUsername) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "GitHub username is required." } });
  }

  // Fetch public repos from GitHub API
  const axios = require("axios");
  const headers = {};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  let repos = [];
  let profile = {};
  try {
    const [profileRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${githubUsername}`, { headers, timeout: 10000 }),
      axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { headers, timeout: 10000 }),
    ]);
    profile = profileRes.data;
    repos = reposRes.data;
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: "GITHUB_ERROR", message: `Failed to fetch GitHub profile: ${err.message}` } });
  }

  // Analyze with AI
  const repoSummaries = repos.slice(0, 20).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics,
    updatedAt: r.updated_at,
  }));

  const analysis = await aiGateway.generateStructured({
    systemPrompt: "You are analyzing a developer's GitHub profile for career assessment. Identify strengths, technologies used, and areas for improvement. Only analyze public information.",
    userPrompt: `Analyze this GitHub profile:
Username: ${githubUsername}
Public repos: ${profile.public_repos}
Followers: ${profile.followers}
Bio: ${profile.bio || "N/A"}

Top repositories:
${JSON.stringify(repoSummaries, null, 2)}

Return JSON:
{
  "summary": "brief profile summary",
  "topLanguages": ["language1", "language2"],
  "projectQuality": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "interviewTopics": ["topics to ask about based on their projects"]
}`,
    userId: req.user.id,
    requestType: "github_analysis",
  });

  // Save profile
  await prisma.gitHubProfile.upsert({
    where: { userId: req.user.id },
    update: {
      githubUsername,
      profileUrl: profile.html_url,
      avatarUrl: profile.avatar_url,
      repositories: repoSummaries,
      languages: analysis.data.topLanguages,
      analysis: analysis.data,
      lastAnalyzed: new Date(),
    },
    create: {
      userId: req.user.id,
      githubUsername,
      profileUrl: profile.html_url,
      avatarUrl: profile.avatar_url,
      repositories: repoSummaries,
      languages: analysis.data.topLanguages,
      analysis: analysis.data,
      lastAnalyzed: new Date(),
    },
  });

  res.json({ success: true, analysis: analysis.data, repos: repoSummaries });
});

exports.getCandidateMemory = asyncHandler(async (req, res) => {
  let memory = await prisma.candidateMemory.findUnique({ where: { userId: req.user.id } });
  if (!memory) {
    memory = await prisma.candidateMemory.create({ data: { userId: req.user.id } });
  }
  res.json({ success: true, memory });
});

exports.updateCandidateMemory = asyncHandler(async (req, res) => {
  const { targetRole, preferredLanguage, strengths, weaknesses, topicsToImprove, careerGoal, availableStudyTime, interviewDate } = req.body;

  const memory = await prisma.candidateMemory.upsert({
    where: { userId: req.user.id },
    update: { targetRole, preferredLanguage, strengths, weaknesses, topicsToImprove, careerGoal, availableStudyTime, interviewDate },
    create: { userId: req.user.id, targetRole, preferredLanguage, strengths, weaknesses, topicsToImprove, careerGoal, availableStudyTime, interviewDate },
  });

  res.json({ success: true, memory });
});

exports.deleteCandidateMemory = asyncHandler(async (req, res) => {
  await prisma.candidateMemory.deleteMany({ where: { userId: req.user.id } });
  res.json({ success: true, message: "Candidate memory deleted." });
});

exports.careerCoach = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Question is required." } });
  }

  // Get user context
  const [profile, skills, memory] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: req.user.id } }),
    prisma.userSkill.findMany({ where: { userId: req.user.id }, include: { skill: true } }),
    prisma.candidateMemory.findUnique({ where: { userId: req.user.id } }),
  ]);

  const result = await aiGateway.generateText({
    systemPrompt: `You are an AI career coach for software engineers. Be specific, actionable, and encouraging.
Use the candidate's profile data to personalize your advice.
Do not claim to guarantee job outcomes.

Candidate Profile:
- Target Role: ${profile?.targetRole || memory?.targetRole || "Not specified"}
- Experience: ${profile?.experienceLevel || "Not specified"}
- Strengths: ${memory?.strengths?.join(", ") || "Not identified yet"}
- Weaknesses: ${memory?.weaknesses?.join(", ") || "Not identified yet"}
- Skills: ${skills.map((s) => `${s.skill.name}: ${Math.round(s.mastery)}%`).join(", ") || "No skill data"}`,
    userPrompt: question,
    userId: req.user.id,
    requestType: "career_coach",
  });

  res.json({ success: true, response: result.text });
});
