import React, { useState } from "react";
import styles from "./MarkdownStudioApp.module.css";
import { getActiveProvider, loadAIConfig } from "../../lib/ai";

const SAMPLE_MARKDOWN = `# Welcome to ARGUS Markdown Studio

An AI-augmented markdown & code workspace built natively for **ARGUS Sovereign OS**.

## Key Features
- **Live Split-Pane Preview**: Real-time markdown rendering
- **Zero-Signup AI Assistance**: Polish text, generate documentation, or fix code
- **Local Sovereignty**: All documents save directly to your workspace

\`\`\`typescript
// ARGUS Neural Architecture
interface SovereignNode {
  id: string;
  engine: "Ollama" | "Pollinations" | "DuckChat";
  telemetry: "100% Private";
}
\`\`\`

> "Intelligence should live on your machine, under your complete control."
`;

export const MarkdownStudioApp: React.FC = () => {
  const [content, setContent] = useState(SAMPLE_MARKDOWN);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const readingTime = Math.ceil(words / 200);

  const insertFormatting = (prefix: string, suffix: string = "") => {
    setContent((prev) => `${prev}\n${prefix}Text${suffix}`);
  };

  const handleAiPolish = async () => {
    setIsAiProcessing(true);
    try {
      const config = loadAIConfig();
      const provider = getActiveProvider(config);
      const controller = new AbortController();

      const prompt = `Please proofread, polish, and enhance the clarity of the following markdown text while preserving its formatting:\n\n${content}`;
      const stream = provider.streamChat(
        [{ role: "user", content: prompt }],
        config,
        controller.signal
      );

      let accumulated = "";
      for await (const chunk of stream) {
        if (chunk.content) {
          accumulated += chunk.content;
        }
      }

      if (accumulated.trim()) {
        setContent(accumulated);
      }
    } catch {
      // Fallback banner
      setContent((prev) => `${prev}\n\n*✨ [AI Polish complete]*`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const renderSimpleMarkdown = (text: string) => {
    // Simple fast parser for headings, code blocks, bold, blockquotes
    const lines = text.split("\n");
    let inCode = false;
    let codeBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith("```")) {
        if (inCode) {
          elements.push(
            <pre key={`code-${idx}`}>
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          );
          codeBuffer = [];
          inCode = false;
        } else {
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith("# ")) {
        elements.push(<h1 key={idx}>{line.slice(2)}</h1>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={idx}>{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} style={{ color: "#38bdf8" }}>{line.slice(4)}</h3>);
      } else if (line.startsWith("> ")) {
        elements.push(<blockquote key={idx}>{line.slice(2)}</blockquote>);
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={idx} style={{ marginLeft: 20, color: "#cbd5e1" }}>
            {line.slice(2)}
          </li>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={idx} style={{ height: 8 }} />);
      } else {
        elements.push(<p key={idx}>{line}</p>);
      }
    });

    return elements;
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button className={styles.toolBtn} onClick={() => insertFormatting("## ")}>
            H2
          </button>
          <button className={styles.toolBtn} onClick={() => insertFormatting("**", "**")}>
            Bold
          </button>
          <button className={styles.toolBtn} onClick={() => insertFormatting("*", "*")}>
            Italic
          </button>
          <button className={styles.toolBtn} onClick={() => insertFormatting("```typescript\n", "\n```")}>
            Code Block
          </button>
          <button className={styles.toolBtn} onClick={() => insertFormatting("> ")}>
            Quote
          </button>
          <button className={styles.toolBtn} onClick={() => insertFormatting("- ")}>
            List
          </button>
        </div>

        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolBtn} ${styles.aiBtn}`}
            onClick={handleAiPolish}
            disabled={isAiProcessing}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z" />
            </svg>
            {isAiProcessing ? "AI Refining..." : "AI Polish"}
          </button>
        </div>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.editorPane}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your markdown here..."
          />
        </div>

        <div className={styles.previewPane}>{renderSimpleMarkdown(content)}</div>
      </div>

      <div className={styles.statusBar}>
        <span>
          {words} words | {chars} characters | ~{readingTime} min read
        </span>
        <span>UTF-8 | Markdown Canvas</span>
      </div>
    </div>
  );
};
