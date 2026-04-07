/**
 * Roster Controller
 * Handles teacher class roster management:
 *   - Create roster (manual or CSV import)
 *   - List, get, update, delete rosters
 *   - Link PRNs to registered User accounts
 */

const ClassRoster = require("../models/ClassRoster");
const User = require("../models/User");
const logger = require("../utils/logger");

/** POST /api/roster — Create a class roster (batch import) */
exports.createRoster = async (req, res) => {
  try {
    const { batchName, year, division, branch, academicYear, students } = req.body;

    if (!batchName || !students || !Array.isArray(students)) {
      return res.status(400).json({ message: "batchName and students array are required" });
    }

    const roster = await ClassRoster.create({
      batchName,
      year,
      division,
      branch,
      academicYear,
      createdBy: req.user.id,
      students: students.map((s) => ({
        prn:    s.prn,
        name:   s.name,
        email:  s.email || null,
        userId: null
      }))
    });

    // Immediately try to link students who have already registered
    await linkRosterToUsers(roster);
    await roster.save();

    res.status(201).json(roster);
  } catch (err) {
    logger.error("createRoster error:", err);
    res.status(500).json({ message: "Failed to create roster" });
  }
};

/** GET /api/roster — List all rosters created by this teacher */
exports.listRosters = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { createdBy: req.user.id };
    const rosters = await ClassRoster.find(filter).sort({ createdAt: -1 });
    res.json(rosters);
  } catch (err) {
    logger.error("listRosters error:", err);
    res.status(500).json({ message: "Failed to fetch rosters" });
  }
};

/** GET /api/roster/:id — Get single roster */
exports.getRoster = async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.id)
      .populate("students.userId", "name email role isVerified");
    if (!roster) return res.status(404).json({ message: "Roster not found" });
    res.json(roster);
  } catch (err) {
    logger.error("getRoster error:", err);
    res.status(500).json({ message: "Failed to fetch roster" });
  }
};

/** PUT /api/roster/:id — Update roster details or add/remove students */
exports.updateRoster = async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.id);
    if (!roster) return res.status(404).json({ message: "Roster not found" });

    Object.assign(roster, req.body);
    await roster.save();
    res.json(roster);
  } catch (err) {
    logger.error("updateRoster error:", err);
    res.status(500).json({ message: "Failed to update roster" });
  }
};

/** DELETE /api/roster/:id — Delete roster */
exports.deleteRoster = async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.id);
    if (!roster) return res.status(404).json({ message: "Roster not found" });
    await roster.deleteOne();
    res.json({ message: "Roster deleted" });
  } catch (err) {
    logger.error("deleteRoster error:", err);
    res.status(500).json({ message: "Failed to delete roster" });
  }
};

/** POST /api/roster/:id/link — Match roster PRNs/emails to registered User accounts */
exports.linkRoster = async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.id);
    if (!roster) return res.status(404).json({ message: "Roster not found" });

    const linked = await linkRosterToUsers(roster);
    await roster.save();

    res.json({
      message: `${linked} student(s) linked to accounts`,
      roster
    });
  } catch (err) {
    logger.error("linkRoster error:", err);
    res.status(500).json({ message: "Failed to link roster" });
  }
};

// ── Internal helper: find matching User accounts by PRN or email ──────────
async function linkRosterToUsers(roster) {
  let linked = 0;
  for (const student of roster.students) {
    if (student.userId) continue; // already linked

    const user = await User.findOne({
      $or: [
        student.prn   ? { prn: student.prn }     : null,
        student.email ? { email: student.email }  : null
      ].filter(Boolean)
    });

    if (user) {
      student.userId = user._id;
      linked++;
    }
  }
  return linked;
}
