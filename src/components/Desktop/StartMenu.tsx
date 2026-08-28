import React, { useState } from "react";
import styles from "./StartMenu.module.css";

/* ─── SVG Icons for Start Menu ─── */
const Icons = {
  chat: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1.5" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="3" width="20" height="18" rx="3" />
      <polyline points="6,9 10,12 6,15" fill="none" stroke="#0a0b10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="18" y2="15" stroke="#0a0b10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  explorer: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 6C2 4.9 2.9 4 4 4h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="2" width="18" height="20" rx="3" />
      <rect x="5.5" y="4.5" width="13" height="4" rx="1" fill="#0a0b10" />
      <circle cx="7.5" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="12" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="16.5" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="7.5" cy="16" r="1.2" fill="#0a0b10" />
      <circle cx="12" cy="16" r="1.2" fill="#0a0b10" />
      <circle cx="16.5" cy="16" r="1.2" fill="#0a0b10" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <line x1="6" y1="8" x2="18" y2="8" stroke="#0a0b10" strokeWidth="1.5" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="#0a0b10" strokeWidth="1.5" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  photos: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <circle cx="8" cy="10" r="2.5" fill="#0a0b10" />
      <path d="M22 16l-5.5-6L12 15l-3-3-7 5v3a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-1z" opacity="0.7" />
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="10" cy="10" r="4" fill="#fbbf24" />
      <path d="M12 14a4 4 0 0 1 7-2 3 3 0 0 1 1 5.9H9a3.5 3.5 0 0 1 3-3.9z" opacity="0.85" />
    </svg>
  ),
  appstore: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
      <path d="M9 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="#0a0b10" strokeWidth="2" />
    </svg>
  ),
  taskmanager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l4-4 4 6 4-3 6 5" />
    </svg>
  ),
  markdown: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M6 15V9l3 3 3-3v6M18 12l2 2m0 0l2-2m-2 2V9" stroke="#0a0b10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  updater: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8l4-4 4 4h-3v4z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  growth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  workspaces: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  saas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

interface StartMenuProps {
  onLaunchApp: (appId: string, title: string) => void;
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const apps = [
    { id: "chat", name: "Chat Assistant", desc: "AI companion", icon: Icons.chat, color: "#3b82f6" },
    { id: "canvas", name: "Neural Canvas", desc: "Spatial AI mind map & node chaining", icon: Icons.workspaces, color: "#8b5cf6" },
    { id: "codestudio", name: "Code Studio", desc: "In-OS IDE & live sandbox execution", icon: Icons.markdown, color: "#06b6d4" },
    { id: "swarm", name: "Agent Swarm", desc: "Autonomous 4-agent orchestrator", icon: Icons.growth, color: "#f59e0b" },
    { id: "cyberglobe", name: "Cyber Globe", desc: "3D global edge telemetry radar", icon: Icons.browser, color: "#38bdf8" },
    { id: "focus", name: "Focus Matrix", desc: "Deep work Pomodoro & lo-fi", icon: Icons.chat, color: "#06b6d4" },
    { id: "game2048", name: "Cyber 2048", desc: "Neon tile puzzle game", icon: Icons.calculator, color: "#f59e0b" },
    { id: "growth", name: "Growth Command Center", desc: "Autonomous marketing agents", icon: Icons.growth, color: "#ec4899" },
    { id: "workspaces", name: "AI Workspaces", desc: "Startup tasks & milestones", icon: Icons.workspaces, color: "#a855f7" },
    { id: "saas", name: "SaaS Pro Store", desc: "Pro & Enterprise tiers", icon: Icons.saas, color: "#10b981" },
    { id: "phone", name: "Phone Connect", desc: "Mobile smartphone bridge", icon: Icons.phone, color: "#06b6d4" },
    { id: "browser", name: "Browser", desc: "Web browser", icon: Icons.browser, color: "#8b5cf6" },
    { id: "terminal", name: "Terminal", desc: "Command prompt", icon: Icons.terminal, color: "#10b981" },
    { id: "weather", name: "Weather", desc: "Live satellite forecast", icon: Icons.weather, color: "#38bdf8" },
    { id: "appstore", name: "App Store", desc: "AI skills & plugins", icon: Icons.appstore, color: "#ec4899" },
    { id: "markdown", name: "Markdown Studio", desc: "AI code canvas", icon: Icons.markdown, color: "#a855f7" },
    { id: "taskmanager", name: "Task Manager", desc: "Process monitor", icon: Icons.taskmanager, color: "#06b6d4" },
    { id: "updater", name: "Update Center", desc: "System updater", icon: Icons.updater, color: "#3b82f6" },
    { id: "explorer", name: "File Explorer", desc: "Workspace files", icon: Icons.explorer, color: "#f59e0b" },
    { id: "calculator", name: "Calculator", desc: "Math tool", icon: Icons.calculator, color: "#6366f1" },
    { id: "notes", name: "Notes", desc: "Rich text editor", icon: Icons.notes, color: "#f97316" },
    { id: "music", name: "Music Player", desc: "Play music", icon: Icons.music, color: "#ec4899" },
    { id: "photos", name: "Photos", desc: "Image viewer", icon: Icons.photos, color: "#06b6d4" },
    { id: "settings", name: "Settings", desc: "System control", icon: Icons.settings, color: "#64748b" },
  ];

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (appId: string, title: string) => {
    onLaunchApp(appId, title);
    onClose();
  };

  const recommendedItems = [
    { title: "ARGUS Sovereign OS Whitepaper.pdf", type: "pdf", time: "2h ago" },
    { title: "notes.txt", type: "text", time: "4h ago" },
    { title: "vacation-2025.jpg", type: "image", time: "Yesterday" },
  ];

  return (
    <div className={`${styles.menu} glass-blur glass-panel`} data-testid="start-menu">
      {/* Header Search */}
      <div className={styles.header}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search apps, files, and settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          data-testid="start-search"
        />
      </div>

      {/* Main Content Area */}
      <div className={styles.content}>
        {searchQuery ? (
          /* Search Results View */
          <div className={styles.searchResults}>
            <div className={styles.sectionTitle}>Search Results</div>
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className={styles.searchItem}
                onClick={() => handleAppClick(app.id, app.name)}
              >
                <div className={styles.appIconContainer} style={{ color: app.color }}>
                  {app.icon}
                </div>
                <div className={styles.appText}>
                  <span className={styles.appName}>{app.name}</span>
                  <span className={styles.appDesc}>{app.desc}</span>
                </div>
              </div>
            ))}
            {filteredApps.length === 0 && (
              <div className={styles.noResults}>No applications matched "{searchQuery}"</div>
            )}
          </div>
        ) : (
          /* Pinned Grid View (Windows 11 / macOS launchpad hybrid) */
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Pinned</span>
            </div>
            <div className={styles.pinnedGrid}>
              {apps.map((app) => (
                <div
                  key={app.id}
                  className={styles.gridItem}
                  onClick={() => handleAppClick(app.id, app.name)}
                  data-testid={`start-app-item-${app.id}`}
                >
                  <div className={styles.gridIcon} style={{ color: app.color }}>
                    {app.icon}
                  </div>
                  <span className={styles.gridLabel}>{app.name}</span>
                </div>
              ))}
            </div>

            {/* Recommended Section */}
            <div className={styles.recommendedSection}>
              <span className={styles.sectionTitle}>Recommended</span>
              <div className={styles.recList}>
                {recommendedItems.map((item, idx) => (
                  <div key={idx} className={styles.recItem}>
                    <div className={styles.recIcon}>
                      {item.type === "pdf" ? "📄" : item.type === "image" ? "🖼️" : "📝"}
                    </div>
                    <div className={styles.recDetails}>
                      <span className={styles.recTitle}>{item.title}</span>
                      <span className={styles.recMeta}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User profile footer */}
      <div className={styles.footer}>
        <div
          className={styles.userProfile}
          style={{ cursor: "pointer" }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("argus:open-auth-modal"));
            onClose();
          }}
          title="Manage Clerk Sovereign Account"
        >
          <div className={styles.avatar}>JS</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className={styles.userName}>Jan Steve Daniel</span>
            <span style={{ fontSize: "10px", color: "#38bdf8" }}>🔒 Clerk Verified</span>
          </div>
        </div>
        <button
          className={styles.shutdownBtn}
          onClick={onClose}
          title="Close Launcher"
          data-testid="shutdown-button"
        >
          ⏻
        </button>
      </div>
    </div>
  );
};
