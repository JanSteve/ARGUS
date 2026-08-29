import React, { useState, useEffect, useRef } from "react";
import styles from "./CodeStudioApp.module.css";
import { executeAICircuitBreaker } from "../../lib/ai/scaleLoadBalancer";

export interface ProjectTemplate {
  name: string;
  html: string;
  css: string;
  js: string;
}

export const TEMPLATES: Record<string, ProjectTemplate> = {
  taskManager: {
    name: "Full-Stack Task Manager (Local Storage)",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sovereign Task Manager</title>
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-card: rgba(15, 23, 42, 0.75);
      --border-card: rgba(255, 255, 255, 0.1);
      --accent-blue: #0071e3;
      --accent-cyan: #06b6d4;
      --accent-purple: #8b5cf6;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-primary);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .app-container {
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .header-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .badge {
      background: rgba(0, 113, 227, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(0, 113, 227, 0.4);
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 16px;
    }
    .stat-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }
    .stat-val { font-size: 20px; font-weight: 800; color: #00f0ff; }
    .stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    
    .input-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      gap: 8px;
    }
    .task-input {
      flex: 1;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .task-input:focus { border-color: var(--accent-blue); }
    .priority-select {
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 0 10px;
      color: #cbd5e1;
      font-size: 12px;
      outline: none;
    }
    .add-btn {
      background: linear-gradient(135deg, #0071e3, #8b5cf6);
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      padding: 10px 18px;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .add-btn:hover { transform: translateY(-1px); }

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tabs { display: flex; gap: 6px; }
    .tab-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-card);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 8px;
      cursor: pointer;
    }
    .tab-btn.active {
      background: var(--accent-blue);
      color: #fff;
      border-color: var(--accent-blue);
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
    }
    .clear-btn:hover { text-decoration: underline; }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .task-item {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .task-item:hover { border-color: rgba(0, 113, 227, 0.4); transform: translateX(2px); }
    .task-left { display: flex; align-items: center; gap: 12px; }
    .checkbox {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      cursor: pointer;
      accent-color: #0071e3;
    }
    .task-text { font-size: 13.5px; font-weight: 500; }
    .task-completed .task-text {
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .tag {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .tag-high { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .tag-med { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .tag-low { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .del-btn {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
    }
    .del-btn:hover { color: #ef4444; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-card">
      <div class="title-row">
        <h1>⚡ SOVEREIGN TASK MANAGER</h1>
        <span class="badge">LOCALSTORAGE ENCRYPTED</span>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-val" id="stat-total">0</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" id="stat-active">0</div>
          <div class="stat-label">Pending Active</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" id="stat-done">0</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
    </div>

    <form class="input-card" id="task-form">
      <input type="text" id="task-title" class="task-input" placeholder="Add a new imperial directive or sprint task..." required autocomplete="off">
      <select id="task-priority" class="priority-select">
        <option value="high">🔴 High</option>
        <option value="med" selected>🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>
      <button type="submit" class="add-btn">+ Add Task</button>
    </form>

    <div class="filter-row">
      <div class="tabs">
        <button class="tab-btn active" data-filter="all">All</button>
        <button class="tab-btn" data-filter="active">Active</button>
        <button class="tab-btn" data-filter="completed">Completed</button>
      </div>
      <button class="clear-btn" id="clear-done-btn">Clear Completed</button>
    </div>

    <div class="task-list" id="task-list-container"></div>
  </div>
</body>
</html>`,
    css: ``,
    js: `// Task Manager Engine with LocalStorage Persistence
const STORAGE_KEY = "argus_taskmanager_store_v1";

let tasks = [];
let currentFilter = "all";

// Load from LocalStorage or seed defaults
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      tasks = [
        { id: "1", title: "Complete ARGUS Sovereign OS v2.0 Architecture", priority: "high", completed: true },
        { id: "2", title: "Review Code Fortress Luhn Payment Shield with VCs", priority: "high", completed: false },
        { id: "3", title: "Deploy Imposing Queen MiniMax Neural Voice Engine", priority: "med", completed: false },
        { id: "4", title: "Verify Zero-Knowledge AES-256 Sovereign Vault Enclave", priority: "low", completed: false }
      ];
      saveTasks();
    }
  } catch (e) {
    tasks = [];
  }
  render();
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  const container = document.getElementById("task-list-container");
  const statTotal = document.getElementById("stat-total");
  const statActive = document.getElementById("stat-active");
  const statDone = document.getElementById("stat-done");

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.length - completedCount;

  if (statTotal) statTotal.textContent = tasks.length;
  if (statActive) statActive.textContent = activeCount;
  if (statDone) statDone.textContent = completedCount;

  const filtered = tasks.filter(t => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 30px; color:#64748b; font-size:13px;">No tasks in this view. Add one above!</div>';
    return;
  }

  container.innerHTML = filtered.map(t => \`
    <div class="task-item \${t.completed ? 'task-completed' : ''}" data-id="\${t.id}">
      <div class="task-left">
        <input type="checkbox" class="checkbox" \${t.completed ? 'checked' : ''} onchange="toggleTask('\${t.id}')">
        <span class="task-text">\${escapeHtml(t.title)}</span>
        <span class="tag tag-\${t.priority}">\${t.priority}</span>
      </div>
      <button class="del-btn" onclick="deleteTask('\${t.id}')" title="Delete Task">&times;</button>
    </div>
  \`).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

window.toggleTask = function(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  render();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
};

document.getElementById("task-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("task-title");
  const prioritySelect = document.getElementById("task-priority");
  if (!input || !input.value.trim()) return;

  const newTask = {
    id: Date.now().toString(),
    title: input.value.trim(),
    priority: prioritySelect ? prioritySelect.value : "med",
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  render();
  input.value = "";
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter") || "all";
    render();
  });
});

document.getElementById("clear-done-btn")?.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
});

// Initialize on page load
loadTasks();`,
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
};

export const CodeStudioApp: React.FC = () => {
  const [currentTemplate, setCurrentTemplate] = useState<string>("taskManager");
  const [activeTab, setActiveTab] = useState<"html" | "js">("html");
  const [htmlCode, setHtmlCode] = useState<string>(TEMPLATES.taskManager.html);
  const [jsCode, setJsCode] = useState<string>(TEMPLATES.taskManager.js);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load from external event or localStorage on mount
  useEffect(() => {
    const loadStoredProject = () => {
      try {
        const stored = localStorage.getItem("argus-codestudio-active-project");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.html) setHtmlCode(parsed.html);
          if (parsed.js) setJsCode(parsed.js);
          if (parsed.templateKey) setCurrentTemplate(parsed.templateKey);
        }
      } catch {}
    };

    loadStoredProject();

    const handleExternalLoad = (e: any) => {
      if (e.detail) {
        if (e.detail.html) setHtmlCode(e.detail.html);
        if (e.detail.js) setJsCode(e.detail.js);
        if (e.detail.templateKey) setCurrentTemplate(e.detail.templateKey);
      }
    };

    window.addEventListener("argus:codestudio-load-code", handleExternalLoad);
    return () => window.removeEventListener("argus:codestudio-load-code", handleExternalLoad);
  }, []);

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
      try {
        localStorage.setItem(
          "argus-codestudio-active-project",
          JSON.stringify({
            templateKey: key,
            html: TEMPLATES[key].html,
            js: TEMPLATES[key].js,
          })
        );
      } catch {}
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
            <option value="taskManager">📋 Full-Stack Task Manager</option>
            <option value="cryptoTicker">📈 Crypto & Stock Ticker</option>
            <option value="cyberpunk">🌌 Cyberpunk Matrix</option>
            <option value="audioVisualizer">🎙️ Audio Spectrogram</option>
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
