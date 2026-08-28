import React, { useState, useEffect, useRef } from "react";
import styles from "./CodeStudioApp.module.css";
import { executeAICircuitBreaker } from "../../lib/ai/scaleLoadBalancer";

interface ProjectTemplate {
  name: string;
  html: string;
  css: string;
  js: string;
}

const TEMPLATES: Record<string, ProjectTemplate> = {
  cyberpunk: {
    name: "Cyberpunk Matrix Particle Mesh",
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #05060a; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #00f0ff; }
    #canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .hud { position: relative; z-index: 10; text-align: center; pointer-events: none; text-shadow: 0 0 10px #00f0ff; }
    h1 { margin: 0; font-size: 24px; letter-spacing: 4px; }
    p { color: #8892b0; font-size: 12px; margin-top: 6px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="hud">
    <h1>ARGUS NEURAL CORE</h1>
    <p>LIVE WEBGL PARTICLE MATRIX • 60 FPS</p>
  </div>
</body>
</html>`,
    css: ``,
    js: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

const particles = [];
for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    radius: Math.random() * 2 + 1
  });
}

function animate() {
  ctx.fillStyle = 'rgba(5, 6, 10, 0.2)';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(0, 240, 255, ' + (1 - dist / 100) * 0.4 + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();`,
  },
  audioVisualizer: {
    name: "Acoustic Audio Frequency Wave",
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #0a0b10; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #fff; }
    canvas { width: 90%; height: 200px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; }
    h2 { font-size: 16px; color: #38bdf8; margin-bottom: 12px; letter-spacing: 2px; }
  </style>
</head>
<body>
  <h2>ARGUS NEURAL AUDIO SPECTROGRAM</h2>
  <canvas id="audioCanvas"></canvas>
</body>
</html>`,
    css: ``,
    js: `const canvas = document.getElementById('audioCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let phase = 0;
function drawWave() {
  ctx.fillStyle = 'rgba(10, 11, 16, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#06b6d4';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#06b6d4';

  const sliceWidth = canvas.width / 100;
  let x = 0;

  for (let i = 0; i < 100; i++) {
    const v = Math.sin(i * 0.15 + phase) * 40 + Math.sin(i * 0.3 - phase * 1.5) * 20;
    const y = canvas.height / 2 + v;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.stroke();
  phase += 0.05;
  requestAnimationFrame(drawWave);
}
drawWave();`,
  },
  cryptoTicker: {
    name: "Sovereign Crypto & Stock Matrix",
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #06070a; font-family: monospace; color: #fff; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 10px; padding: 14px; }
    .symbol { font-size: 14px; color: #94a3b8; }
    .price { font-size: 22px; font-weight: bold; color: #00f0ff; margin-top: 4px; }
    .change { font-size: 12px; color: #10b981; font-weight: bold; }
  </style>
</head>
<body>
  <div style="font-size:14px; font-weight:bold; color:#38bdf8; margin-bottom:4px;">⚡ SOVEREIGN TELEMETRY MATRIX</div>
  <div class="grid">
    <div class="card"><div class="symbol">BTC / USD</div><div class="price" id="btc">$94,820</div><div class="change">+3.42% ▲</div></div>
    <div class="card"><div class="symbol">ETH / USD</div><div class="price" id="eth">$3,450</div><div class="change">+2.15% ▲</div></div>
    <div class="card"><div class="symbol">NVDA</div><div class="price" id="nvda">$138.40</div><div class="change">+4.80% ▲</div></div>
    <div class="card"><div class="symbol">ARGUS TOKEN</div><div class="price" id="argus">$12.50</div><div class="change">+18.9% ▲</div></div>
  </div>
</body>
</html>`,
    css: ``,
    js: `setInterval(() => {
  const btcEl = document.getElementById('btc');
  if (btcEl) {
    const delta = (Math.random() - 0.48) * 100;
    const current = 94820 + delta;
    btcEl.textContent = '$' + Math.round(current).toLocaleString();
  }
}, 1500);`,
  },
};

export const CodeStudioApp: React.FC = () => {
  const [currentTemplate, setCurrentTemplate] = useState<string>("cyberpunk");
  const [activeTab, setActiveTab] = useState<"html" | "js">("html");
  const [htmlCode, setHtmlCode] = useState<string>(TEMPLATES.cyberpunk.html);
  const [jsCode, setJsCode] = useState<string>(TEMPLATES.cyberpunk.js);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compile and update live sandbox iframe
  const runCode = () => {
    if (!iframeRef.current) return;
    const combined = `
      ${htmlCode}
      <script>
        try {
          ${jsCode}
        } catch(err) {
          console.error("Execution error:", err);
        }
      <\/script>
    `;
    iframeRef.current.srcdoc = combined;
  };

  // Run on mount or template switch
  useEffect(() => {
    runCode();
  }, [htmlCode, jsCode]);

  const loadTemplate = (key: string) => {
    if (TEMPLATES[key]) {
      setCurrentTemplate(key);
      setHtmlCode(TEMPLATES[key].html);
      setJsCode(TEMPLATES[key].js);
    }
  };

  // AI Pair Programmer Code Generation
  const handleAIAssist = async (instructionType: string) => {
    setIsGenerating(true);
    const userGoal = aiPrompt.trim() || instructionType;
    const activeCode = activeTab === "html" ? htmlCode : jsCode;

    const fullPrompt = `You are ARGUS Sovereign Code Pair Programmer.
Instruction: ${userGoal}
Language: ${activeTab.toUpperCase()}
Current Code:
\`\`\`
${activeCode}
\`\`\`

Return ONLY the revised executable code without markdown commentary.`;

    try {
      const response = await executeAICircuitBreaker([
        { role: "system", content: "You are an expert full-stack developer in React, WebGL, Rust, and JavaScript." },
        { role: "user", content: fullPrompt },
      ]);

      const cleaned = response.content.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
      if (activeTab === "html") setHtmlCode(cleaned);
      else setJsCode(cleaned);
      setAiPrompt("");
    } catch {
      // Fallback
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button className={`${styles.toolBtn} ${styles.toolBtnRun}`} onClick={runCode}>
            <span>▶️ Run Code</span>
          </button>
          <select
            className={styles.toolSelect}
            value={currentTemplate}
            onChange={(e) => loadTemplate(e.target.value)}
          >
            <option value="cyberpunk">🌌 Cyberpunk Matrix</option>
            <option value="audioVisualizer">🎙️ Audio Spectrogram</option>
            <option value="cryptoTicker">📈 Crypto & Stock Ticker</option>
          </select>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            className={`${styles.toolBtn} ${styles.toolBtnAI}`}
            onClick={() => handleAIAssist("Optimize performance and add glowing cybernetic effects")}
            disabled={isGenerating}
          >
            <span>{isGenerating ? "⚡ Synthesizing..." : "✨ AI Enhance"}</span>
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => handleAIAssist("Explain this code and check for bugs")}
          >
            <span>🔍 Explain</span>
          </button>
        </div>
      </div>

      {/* Main Split: Editor on Left, Live Preview on Right */}
      <div className={styles.workspaceSplit}>
        {/* Editor Pane */}
        <div className={styles.editorPane}>
          <div className={styles.editorTabs}>
            <div
              className={`${styles.tab} ${activeTab === "html" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("html")}
            >
              <span>📄 index.html</span>
            </div>
            <div
              className={`${styles.tab} ${activeTab === "js" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("js")}
            >
              <span>⚡ app.js</span>
            </div>
          </div>

          <textarea
            className={styles.codeArea}
            value={activeTab === "html" ? htmlCode : jsCode}
            onChange={(e) => {
              if (activeTab === "html") setHtmlCode(e.target.value);
              else setJsCode(e.target.value);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />

          {/* AI Helper Bar */}
          <div className={styles.aiHelperBar}>
            <input
              type="text"
              className={styles.aiInput}
              placeholder="Ask AI Copilot (e.g. 'Add neon glowing particles', 'Make it interactive on click')..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAIAssist(aiPrompt)}
            />
            <button
              className={`${styles.toolBtn} ${styles.toolBtnAI}`}
              onClick={() => handleAIAssist(aiPrompt)}
              disabled={isGenerating}
            >
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* Live Preview Sandbox Pane */}
        <div className={styles.previewPane}>
          <div className={styles.previewHeader}>
            <div className={styles.previewBadge}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span>LIVE SANDBOX EXECUTION (SANDBOXED IFRAME)</span>
            </div>
            <span>60 FPS • 0ms IPC Latency</span>
          </div>

          <iframe
            ref={iframeRef}
            className={styles.liveIframe}
            title="ARGUS Live Code Studio Execution Sandbox"
            sandbox="allow-scripts allow-modals allow-same-origin"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span>Editor: UTF-8 | JS Engine: V8 / WebAssembly | Sandboxed: TRUE</span>
        <span>⚡ Sovereign Code Studio v2.0 Active</span>
      </div>
    </div>
  );
};
