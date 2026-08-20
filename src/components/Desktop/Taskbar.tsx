import React, { useState, useEffect } from "react";
import styles from "./Taskbar.module.css";

/* ─── SVG Icon Library ─── */
const Icons = {
  start: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor" />
      <circle cx="8" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="18" rx="3" fill="currentColor" />
      <polyline points="6,9 10,12 6,15" fill="none" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="18" y2="15" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  explorer: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6C2 4.9 2.9 4 4 4h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z" fill="currentColor" />
      <rect x="2" y="9" width="20" height="11" rx="1" fill="currentColor" opacity="0.85" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="18" height="20" rx="3" fill="currentColor" />
      <rect x="5.5" y="4.5" width="13" height="4" rx="1" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="currentColor" />
      <line x1="6" y1="8" x2="18" y2="8" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="16" x2="14" y2="16" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  photos: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="currentColor" />
      <circle cx="8" cy="10" r="2.5" fill="var(--bg-desktop, #0a0b10)" />
      <path d="M22 16l-5.5-6L12 15l-3-3-7 5v3a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-1z" fill="currentColor" opacity="0.7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.42 9a16 16 0 0 1 21.16 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 13a10 10 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
    </svg>
  ),
  battery: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="3.5" y="9.5" width="13" height="5" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="21" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* ─── Types ─── */
interface WindowSummary {
  id: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
}

interface TaskbarProps {
  windows: WindowSummary[];
  onToggleStartMenu: () => void;
  onToggleWindowMin: (id: string) => void;
  onToggleControlPanel: () => void;
  onLaunchApp?: (appId: string, title: string) => void;
}

/* ─── Pinned Dock Configuration ─── */
const PINNED_APPS = [
  { id: "chat", title: "Chat Assistant", icon: Icons.chat, color: "#3b82f6" },
  { id: "browser", title: "Browser", icon: Icons.browser, color: "#8b5cf6" },
  { id: "terminal", title: "Terminal", icon: Icons.terminal, color: "#10b981" },
  { id: "explorer", title: "File Explorer", icon: Icons.explorer, color: "#f59e0b" },
  { id: "calculator", title: "Calculator", icon: Icons.calculator, color: "#6366f1" },
  { id: "notes", title: "Notes", icon: Icons.notes, color: "#f97316" },
  { id: "music", title: "Music Player", icon: Icons.music, color: "#ec4899" },
  { id: "photos", title: "Photos", icon: Icons.photos, color: "#06b6d4" },
  { id: "settings", title: "Settings", icon: Icons.settings, color: "#64748b" },
];

/* ─── Taskbar Component ─── */
export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  onToggleStartMenu,
  onToggleWindowMin,
  onToggleControlPanel,
  onLaunchApp,
}) => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Resolve a pinned app to its running window (if any)
  const getRunningWindow = (appId: string): WindowSummary | undefined => {
    return windows.find((w) => w.id.startsWith(appId + "-") || w.title.toLowerCase().includes(appId));
  };

  // Handle dock item click: focus/toggle if running, else launch
  const handleDockClick = (appId: string, title: string) => {
    const running = getRunningWindow(appId);
    if (running) {
      onToggleWindowMin(running.id);
    } else if (onLaunchApp) {
      onLaunchApp(appId, title);
    }
  };

  // Get active indicator class for a dock item
  const getIndicatorClass = (appId: string): string => {
    const win = getRunningWindow(appId);
    if (!win) return "";
    if (win.isMinimized) return `${styles.activeDot} ${styles.activeDotMinimized}`;
    if (win.isActive) return `${styles.activeDot} ${styles.activeDotActive}`;
    return styles.activeDot;
  };

  return (
    <div
      className={styles.taskbar}
      onClick={(e) => e.stopPropagation()}
      data-testid="taskbar-wrapper"
    >
      {/* ─── Left: Logo ─── */}
      <div className={styles.leftSection}>
        <div className={styles.showDesktop} title="Show Desktop" />
        <span className={styles.logo}>ARGUS</span>
      </div>

      {/* ─── Center: Dock ─── */}
      <div className={styles.centerDock}>
        {/* Start Button */}
        <div
          className={styles.dockItem}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStartMenu();
          }}
          data-testid="start-button"
        >
          <span className={styles.dockIcon} style={{ color: "#818cf8" }}>
            {Icons.start}
          </span>
          <span className={styles.tooltip}>Start</span>
        </div>

        {/* Search Button */}
        <div
          className={styles.dockItem}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStartMenu();
          }}
          data-testid="search-button"
        >
          <span className={styles.dockIcon}>
            {Icons.search}
          </span>
          <span className={styles.tooltip}>Search</span>
        </div>

        {/* Separator */}
        <div className={styles.dockSeparator} />

        {/* Pinned Apps */}
        {PINNED_APPS.map((app) => {
          const indicatorClass = getIndicatorClass(app.id);
          return (
            <div
              key={app.id}
              className={styles.dockItem}
              onClick={() => handleDockClick(app.id, app.title)}
              data-testid={`taskbar-item-${app.id}`}
            >
              <span className={styles.dockIcon} style={{ color: app.color }}>
                {app.icon}
              </span>
              {indicatorClass && <div className={indicatorClass} />}
              <span className={styles.tooltip}>{app.title}</span>
            </div>
          );
        })}
      </div>

      {/* ─── Right: System Tray ─── */}
      <div className={styles.rightSection}>
        {/* Status Icons Group */}
        <div className={styles.trayGroup} onClick={onToggleControlPanel}>
          <span className={styles.trayIcon}>{Icons.wifi}</span>
          <span className={styles.trayIcon}>{Icons.volume}</span>
          <span className={styles.trayIcon}>{Icons.battery}</span>
        </div>

        {/* Clock */}
        <div
          className={styles.clockWidget}
          onClick={(e) => {
            e.stopPropagation();
            onToggleControlPanel();
          }}
          data-testid="taskbar-clock"
        >
          <span className={styles.time}>{timeStr}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>

        {/* Notification Center */}
        <div
          className={styles.notifButton}
          onClick={(e) => {
            e.stopPropagation();
            onToggleControlPanel();
          }}
          title="Notifications"
        >
          {Icons.bell}
          <div className={styles.notifDot} />
        </div>
      </div>
    </div>
  );
};
