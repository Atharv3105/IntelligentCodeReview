import { DiffEditor } from "@monaco-editor/react";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Maps our internal language IDs to Monaco-compatible strings
 */
const languageMap = {
  python: "python",
  java: "java",
  cpp: "cpp",
  javascript: "javascript"
};

export default function CodeDiffView({ original, improved, language = "python" }) {
  const { isDark } = useContext(ThemeContext);

  // We use a combined key to force the entire editor to remount 
  // if the content or the language changes. This prevents the
  // "TextModel disposed" race condition.
  const uniqueKey = `${language}-${original.length}-${improved.length}`;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <DiffEditor
        key={uniqueKey}
        height="450px"
        language={languageMap[language] || "python"}
        theme={isDark ? "vs-dark" : "vs-light"}
        original={original}
        modified={improved}
        options={{
          renderSideBySide: true,
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 22,
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
    </div>
  );
}
