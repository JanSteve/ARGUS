import React, { useState } from "react";
import styles from "./StartMenu.module.css";
import { AppComponent } from "./Desktop";

interface StartMenuProps {
  onLaunchApp: (appId: string, title?: string) => void;
  onClose: () => void;
}

interface AppMenuItem {
  id: AppComponent;
  name: string;
  icon: string;
  color: string;
  category: "ai" | "system" | "tools" | "media";
}

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const apps: AppMenuItem[] = [
    { id: "vault", name: "Sovereign Vault", icon: "🔐", color: "#0071e3", category: "system" },
    { id: "mission", name: "Mission Control", icon: "🎯", color: "#f59e0b", category: "ai" },
    { id: "controlplane", name: "AI Control Plane", icon: "🏢", color: "#10b981", category: "system" },
    { id: "runtime", name: "Autonomous Runtime", icon: "🦾", color: "#0071e3", category: "ai" },
    { id: "chat", name: "Chat Assistant", icon: "💬", color: "#6366f1", category: "ai" },
    { id: "security", name: "Security Center", icon: "🛡️", color: "#10b981", category: "system" },
    { id: "canvas", name: "Neural Canvas", icon: "🧠", color: "#c084fc", category: "ai" },
    { id: "codestudio", name: "Code Studio", icon: "⚡", color: "#38bdf8", category: "tools" },
    { id: "swarm", name: "Agent Swarm", icon: "🤖", color: "#fb923c", category: "ai" },
    { id: "cyberglobe", name: "Cyber Globe", icon: "🌐", color: "#06b6d4", category: "system" },
    { id: "growth", name: "Growth Engine", icon: "🚀", color: "#f59e0b", category: "ai" },
    { id: "workspaces", name: "AI Workspaces", icon: "🗂️", color: "#a855f7", category: "tools" },
    { id: "focus", name: "Focus Matrix", icon: "🎯", color: "#ec4899", category: "tools" },
    { id: "game2048", name: "Cyber 2048", icon: "🎮", color: "#3b82f6", category: "media" },
    { id: "saas", name: "SaaS Pro Store", icon: "💎", color: "#10b981", category: "tools" },
    { id: "browser", name: "Browser", icon: "🌐", color: "#3b82f6", category: "tools" },
    { id: "terminal", name: "Terminal", icon: "💻", color: "#10b981", category: "system" },
    { id: "notes", name: "Notes", icon: "📝", color: "#f59e0b", category: "tools" },
    { id: "music", name: "Music Player", icon: "🎵", color: "#ec4899", category: "media" },
    { id: "photos", name: "Photos", icon: "🖼️", color: "#8b5cf6", category: "media" },
    { id: "calculator", name: "Calculator", icon: "🔢", color: "#06b6d4", category: "tools" },
    { id: "weather", name: "Weather", icon: "🌤️", color: "#38bdf8", category: "tools" },
    { id: "appstore", name: "App Store", icon: "🛍️", color: "#ec4899", category: "system" },
    { id: "taskmanager", name: "Task Manager", icon: "📊", color: "#06b6d4", category: "system" },
    { id: "markdown", name: "Markdown Studio", icon: "📄", color: "#8b5cf6", category: "tools" },
    { id: "settings", name: "Settings", icon: "⚙️", color: "#64748b", category: "system" },
  ];

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAppClick = (appId: string, name: string) => {
    onLaunchApp(appId, name);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.startMenu} onClick={(e) => e.stopPropagation()}>
        {/* Search */}
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Type here to search apps, files, settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className={styles.categoryPills}>
          {["all", "ai", "tools", "system", "media"].map((cat) => (
            <button
              key={cat}
              className={`${styles.catPill} ${selectedCategory === cat ? styles.catPillActive : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Pinned Grid */}
        <div className={styles.gridContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Pinned Sovereign Applications</span>
            <span className={styles.appCount}>{filteredApps.length} Apps</span>
          </div>

          <div className={styles.appsGrid}>
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className={styles.appCard}
                onClick={() => handleAppClick(app.id, app.name)}
              >
                <div className={styles.appIcon} style={{ background: `${app.color}22`, color: app.color }}>
                  {app.icon}
                </div>
                <span className={styles.appName}>{app.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Profile */}
        <div className={styles.footer}>
          <div
            className={styles.userProfile}
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("argus:open-auth-modal"));
              onClose();
            }}
            title="ARGUS Sovereign Access Control & Identity Vault"
          >
            <div className={styles.avatar}>SD</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className={styles.userName}>R Jan Steve Daniel</span>
              <span style={{ fontSize: "10px", color: "#38bdf8" }}>🛡️ ARGUS Sovereign ID</span>
            </div>
          </div>

          <button className={styles.powerBtn} onClick={onClose} title="Power / Log Out">
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
};
