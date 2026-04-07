/**
 * ExamProblemNav — left sidebar listing all problems with status indicators
 * Props:
 *   problems     {Array}    — list of problem submissions from the attempt
 *   currentIndex {number}   — index of currently viewed problem
 *   onSelect     {Function} — called with index when user clicks a problem
 */
export default function ExamProblemNav({ problems, currentIndex, onSelect }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Questions
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {problems.map((ps, i) => {
          const isAttempted = !!ps.submissionId;
          const isCurrent   = i === currentIndex;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                isCurrent
                  ? "bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30"
                  : isAttempted
                  ? "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30"
                  : "bg-gray-800/40 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200"
              }`}
            >
              {/* Status icon */}
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{
                background: isCurrent ? "rgba(52,211,153,0.2)" : isAttempted ? "rgba(16,185,129,0.15)" : "rgba(75,85,99,0.3)"
              }}>
                {isAttempted ? "✓" : i + 1}
              </span>

              {/* Problem title */}
              <span className="truncate">
                {ps.problem?.title || `Problem ${i + 1}`}
              </span>

              {/* Marks badge */}
              <span className="ml-auto flex-shrink-0 text-xs text-gray-500">
                {ps.marks || ps.maxMarks || 10}pts
              </span>
            </button>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="mt-auto border-t border-gray-700/40 pt-3 text-[10px] text-gray-600 space-y-1">
        <div className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Submitted</div>
        <div className="flex items-center gap-1.5"><span className="text-gray-400">○</span> Not attempted</div>
      </div>
    </div>
  );
}
