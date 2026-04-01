import { DiffEditor } from "@monaco-editor/react";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function CodeDiffView({ original, improved }) {
  const { isDark } = useContext(ThemeContext);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <DiffEditor
        height="450px"
        language="python"
        theme={isDark ? "vs-dark" : "vs-light"}
        original={original}
        modified={improved}
        options={{
          renderSideBySide: true,
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 12, bottom: 12 }
        }}
      />
    </div>
  );
}
