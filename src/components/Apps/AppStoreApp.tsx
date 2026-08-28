import React, { useState } from "react";
import styles from "./AppStoreApp.module.css";
import { playNotificationSound } from "../../lib/soundEffects";

interface AppItem {
  id: string;
  name: string;
  category: "AI & Agents" | "Developer Tools" | "Productivity" | "System Utilities";
  desc: string;
  icon: string;
  rating: number;
  downloads: string;
  version: string;
  installedByDefault?: boolean;
}

const APPS_CATALOG: AppItem[] = [
  {
    id: "deepseek-kernel",
    name: "DeepSeek R1 Kernel",
    category: "AI & Agents",
    desc: "Autonomous deep-reasoning AI kernel plugin with complex math, chain-of-thought analysis, and automated logic verification.",
    icon: "🧠",
    rating: 4.9,
    downloads: "42k",
    version: "v2.1.0",
    installedByDefault: true,
  },
  {
    id: "code-copilot-pro",
    name: "Code Copilot Pro",
    category: "Developer Tools",
    desc: "AI coding companion that analyzes files, generates test suites, refactors functions, and translates code across stacks.",
    icon: "⚡",
    rating: 4.8,
    downloads: "29k",
    version: "v1.4.2",
    installedByDefault: true,
  },
  {
    id: "markdown-studio",
    name: "Markdown Studio",
    category: "Productivity",
    desc: "Distraction-free markdown editor with live LaTeX math rendering, mermaid diagram generator, and PDF export.",
    icon: "📝",
    rating: 4.7,
    downloads: "18k",
    version: "v3.0.1",
  },
  {
    id: "sqlite-studio",
    name: "Database Explorer",
    category: "Developer Tools",
    desc: "Interactive visual SQLite database browser, query runner, and table schema visualizer with AI query generation.",
    icon: "🗄️",
    rating: 4.9,
    downloads: "35k",
    version: "v2.0.0",
  },
  {
    id: "task-manager-pro",
    name: "System Monitor",
    category: "System Utilities",
    desc: "Real-time task manager with live CPU core visualizer, RAM memory breakdown, network bandwidth graphs, and process kill.",
    icon: "📊",
    rating: 4.8,
    downloads: "50k",
    version: "v1.8.0",
  },
  {
    id: "whisper-voice",
    name: "Voice Transcriber",
    category: "AI & Agents",
    desc: "Offline voice dictation & speech-to-text powered by OpenAI Whisper for lightning-fast voice prompts in ARGUS.",
    icon: "🎙️",
    rating: 4.9,
    downloads: "21k",
    version: "v1.2.0",
  },
  {
    id: "screen-recorder",
    name: "Screen Recorder",
    category: "System Utilities",
    desc: "One-click 4K screen capture, GIF animation exporter, and webcam overlay tool for recording software walkthroughs.",
    icon: "📹",
    rating: 4.6,
    downloads: "14k",
    version: "v1.1.5",
  },
  {
    id: "web-crawler-ai",
    name: "Web Intelligence Extractor",
    category: "Productivity",
    desc: "Scrape, summarize, and convert web documentation and research papers into structured knowledge bases for your local LLM.",
    icon: "🌐",
    rating: 4.7,
    downloads: "19k",
    version: "v2.2.0",
  },
];

const CATEGORIES = ["All", "AI & Agents", "Developer Tools", "Productivity", "System Utilities"] as const;

export const AppStoreApp: React.FC = () => {
  const [installedApps, setInstalledApps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("argus-installed-plugins");
      if (saved) return JSON.parse(saved);
    } catch {}
    return ["deepseek-kernel", "code-copilot-pro"];
  });

  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const handleInstallToggle = (appId: string) => {
    if (installedApps.includes(appId)) {
      // Uninstall
      const next = installedApps.filter((id) => id !== appId);
      setInstalledApps(next);
      localStorage.setItem("argus-installed-plugins", JSON.stringify(next));
      return;
    }

    // Install simulation with progress
    setInstallingId(appId);
    setTimeout(() => {
      setInstalledApps((prev) => {
        const next = [...prev, appId];
        localStorage.setItem("argus-installed-plugins", JSON.stringify(next));
        return next;
      });
      setInstallingId(null);
      playNotificationSound();
    }, 1200);
  };

  const filteredApps = APPS_CATALOG.filter((app) => {
    const matchesCat = selectedCategory === "All" || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className={styles.appStore}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>ARGUS Skill & App Hub</div>
          <div className={styles.subtitle}>
            Explore and install extensions, neural agents, and system utilities for your Sovereign OS.
          </div>
        </div>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search apps & extensions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Featured Banner */}
      <div className={styles.banner}>
        <div>
          <div className={styles.bannerTag}>Featured Skill</div>
          <div className={styles.bannerTitle}>DeepSeek R1 Reasoning Kernel</div>
          <div className={styles.bannerDesc}>
            Equip your ARGUS Assistant with state-of-the-art step-by-step mathematical reasoning, code generation, and logical problem solving.
          </div>
        </div>
        <button
          className={`${styles.installBtn} ${installedApps.includes("deepseek-kernel") ? styles.installed : ""}`}
          onClick={() => handleInstallToggle("deepseek-kernel")}
        >
          {installedApps.includes("deepseek-kernel") ? "✓ Installed" : "Install Skill"}
        </button>
      </div>

      {/* Category Pills */}
      <div className={styles.categoryBar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div className={styles.grid}>
        {filteredApps.map((app) => {
          const isInstalled = installedApps.includes(app.id);
          const isCurrentlyInstalling = installingId === app.id;

          return (
            <div key={app.id} className={styles.appCard}>
              <div className={styles.cardHeader}>
                <div className={styles.appIcon}>{app.icon}</div>
                <div>
                  <div className={styles.appName}>{app.name}</div>
                  <div className={styles.appCategory}>{app.category} · {app.version}</div>
                </div>
              </div>
              <div className={styles.appDesc}>{app.desc}</div>
              <div className={styles.cardFooter}>
                <div className={styles.rating}>
                  <span>★</span> {app.rating} <span style={{ color: "var(--fg-muted)", marginLeft: "4px" }}>({app.downloads})</span>
                </div>
                <button
                  className={`${styles.installBtn} ${isInstalled ? styles.installed : isCurrentlyInstalling ? styles.installing : ""}`}
                  onClick={() => handleInstallToggle(app.id)}
                  disabled={isCurrentlyInstalling}
                >
                  {isCurrentlyInstalling ? "Installing..." : isInstalled ? "✓ Installed" : "Install"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
