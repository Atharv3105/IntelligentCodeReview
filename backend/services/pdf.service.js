/**
 * PDF Service — Generates MGM JNEC branded CA exam result reports
 * Uses pdfkit to produce a structured PDF buffer
 */

const PDFDocument = require("pdfkit");

/**
 * Generates a CA exam result PDF
 * @param {Object} exam        - Exam document (populated)
 * @param {Array}  attempts    - ExamAttempt docs (populated with studentId)
 * @param {Object} teacher     - User document of the teacher
 * @returns {Promise<Buffer>}  - PDF as a buffer
 */
exports.generateExamReport = (exam, attempts, teacher) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ── HEADER ─────────────────────────────────────────────────────────────
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("MGM Jawaharlal Nehru Engineering College", { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Chh. Sambhajinagar — Department of Information Technology", { align: "center" });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#333333")
      .stroke();
    doc.moveDown(0.5);

    // ── EXAM INFO ───────────────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text(`Examination: ${exam.title}`, { align: "center" });
    doc.moveDown(0.3);

    const examDate = exam.scheduledStart
      ? new Date(exam.scheduledStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-IN");

    const audience = [
      exam.targetYear,
      exam.targetBranch,
      exam.targetDivision?.length ? `Div: ${exam.targetDivision.join(",")}` : null
    ].filter(Boolean).join(" ");

    doc.fontSize(10).font("Helvetica");
    doc.text(`Date: ${examDate}   |   Duration: ${exam.durationMinutes} min   |   Max Marks: ${exam.totalMarks}`, { align: "center" });
    if (audience) doc.text(`Class: ${audience}`, { align: "center" });
    doc.text(`Conducted by: ${teacher?.name || "Faculty"}`, { align: "center" });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#999999").stroke();
    doc.moveDown(0.8);

    // ── TABLE HEADER ────────────────────────────────────────────────────────
    const colX = { sr: 55, prn: 80, name: 175, div: 295, score: 345, grade: 400, flagged: 455 };
    const rowH = 20;

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
    doc.text("Sr.", colX.sr, doc.y, { width: 22 });
    doc.text("PRN", colX.prn, doc.y - rowH / 2, { width: 90 });
    doc.text("Student Name", colX.name, doc.y - rowH / 2, { width: 115 });
    doc.text("Div", colX.div, doc.y - rowH / 2, { width: 45 });
    doc.text("Score", colX.score, doc.y - rowH / 2, { width: 50 });
    doc.text("Grade", colX.grade, doc.y - rowH / 2, { width: 50 });
    doc.text("Flag", colX.flagged, doc.y - rowH / 2, { width: 40 });
    doc.moveDown(0.2);

    // separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#555555").stroke();
    doc.moveDown(0.3);

    // ── TABLE ROWS ─────────────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica").fillColor("#000000");

    const sortedAttempts = [...attempts].sort((a, b) => (a.rank || 99) - (b.rank || 99));

    sortedAttempts.forEach((attempt, idx) => {
      const student = attempt.studentId;
      const y = doc.y;

      // Highlight flagged rows with light amber background
      if (attempt.flagged) {
        doc.rect(50, y - 2, 495, rowH).fillColor("#fff3cd").fill();
        doc.fillColor("#000000");
      }

      doc.text(String(idx + 1), colX.sr, y, { width: 22 });
      doc.text(student?.prn || "—", colX.prn, y, { width: 90 });
      doc.text(student?.name || "Unknown", colX.name, y, { width: 115 });
      doc.text(student?.division || "—", colX.div, y, { width: 45 });
      doc.text(`${attempt.totalScore}/${exam.totalMarks}`, colX.score, y, { width: 50 });
      doc.text(attempt.grade || "—", colX.grade, y, { width: 50 });
      doc.text(attempt.flagged ? "⚠ Yes" : "—", colX.flagged, y, { width: 40 });

      doc.moveDown(0.5);

      // Page break guard
      if (doc.y > 720) {
        doc.addPage();
        doc.moveDown(1);
      }
    });

    // ── CLASS STATISTICS ─────────────────────────────────────────────────
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#999999").stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica-Bold").text("Class Statistics:");
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica");

    const scores = sortedAttempts.map((a) => a.totalScore);
    const avg = scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1) : 0;
    const highest = scores.length ? Math.max(...scores) : 0;
    const lowest = scores.length ? Math.min(...scores) : 0;
    const passCount = sortedAttempts.filter((a) => a.grade !== "F").length;
    const passRate = scores.length ? ((passCount / scores.length) * 100).toFixed(0) : 0;

    const gradeCounts = {};
    sortedAttempts.forEach((a) => { gradeCounts[a.grade] = (gradeCounts[a.grade] || 0) + 1; });
    const gradeStr = ["O", "A+", "A", "B+", "B", "C", "F"]
      .map((g) => `${g}: ${gradeCounts[g] || 0}`)
      .join("  |  ");

    doc.text(`Average Score: ${avg} / ${exam.totalMarks}   |   Pass Rate: ${passRate}%`);
    doc.text(`Highest: ${highest}   |   Lowest: ${lowest}   |   Total Students: ${scores.length}`);
    doc.text(`Grade Distribution — ${gradeStr}`);

    // ── FOOTER ───────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#333333")
      .stroke();
    doc.moveDown(0.3);

    const now = new Date().toLocaleString("en-IN");
    doc
      .fontSize(8)
      .fillColor("#666666")
      .font("Helvetica")
      .text(`Generated: ${now}   |   PyMastery Platform — MGM JNEC`, { align: "center" });

    doc.end();
  });
};
