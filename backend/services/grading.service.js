/**
 * Grading Service — JNEC grading scale
 * Converts percentage → letter grade + GPA point
 * Computes and assigns ranks to an array of ExamAttempt documents
 */

/**
 * @param {number} percentage - 0 to 100
 * @returns {{ letter: string, gpa: number }}
 */
exports.computeGrade = (percentage) => {
  if (percentage >= 90) return { letter: "O",  gpa: 10 };
  if (percentage >= 80) return { letter: "A+", gpa: 9  };
  if (percentage >= 70) return { letter: "A",  gpa: 8  };
  if (percentage >= 60) return { letter: "B+", gpa: 7  };
  if (percentage >= 55) return { letter: "B",  gpa: 6  };
  if (percentage >= 50) return { letter: "C",  gpa: 5  };
  return { letter: "F", gpa: 0 };
};

/**
 * Assigns .rank to each attempt in-place.
 * Sorted by totalScore DESC; ties broken by submittedAt ASC (earlier = better).
 * @param {Array} attempts - array of ExamAttempt documents (in-memory, not saved here)
 * @returns {Array} same array sorted with .rank set
 */
exports.computeRanks = (attempts) => {
  const sorted = [...attempts].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  sorted.forEach((attempt, i) => {
    attempt.rank = i + 1;
  });

  return sorted;
};
