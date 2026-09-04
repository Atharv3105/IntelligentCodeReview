// ============================================================================
// Code Starter & Boilerplate Templates Utility
// ============================================================================

export const DEFAULT_TEMPLATES = {
  python: (fn = "solution") => `def ${fn}():\n    # Write your solution here\n    pass\n`,
  javascript: (fn = "solution") => `function ${fn}() {\n    // Write your solution here\n}\n`,
  cpp: (fn = "solve") => `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    void ${fn}() {\n        // Write your solution here\n    }\n};\n`,
  java: (fn = "solve") => `import java.util.*;\n\npublic class Solution {\n    public void ${fn}() {\n        // Write your solution here\n    }\n}\n`,
};

export function getCleanFunctionName(title) {
  if (!title) return "solution";
  const words = title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "solution";
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

export function getStarterCode(problemOrQuestion, language = "python") {
  const lang = (language || "python").toLowerCase();

  const starterCode = problemOrQuestion?.starterCode;
  if (starterCode) {
    if (typeof starterCode === "string" && starterCode.trim()) {
      return starterCode;
    }
    if (typeof starterCode === "object") {
      if (starterCode[lang] && typeof starterCode[lang] === "string" && starterCode[lang].trim()) {
        return starterCode[lang];
      }
      if (lang === "javascript" && starterCode["js"]) return starterCode["js"];
      if (lang === "python" && starterCode["py"]) return starterCode["py"];
      if (lang === "cpp" && (starterCode["c++"] || starterCode["c_cpp"])) {
        return starterCode["c++"] || starterCode["c_cpp"];
      }
    }
  }

  const title = problemOrQuestion?.title || problemOrQuestion?.questionText || "";
  const fnName = getCleanFunctionName(title);

  const generator = DEFAULT_TEMPLATES[lang] || DEFAULT_TEMPLATES.python;
  return generator(fnName);
}
