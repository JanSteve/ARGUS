import React, { useState, useEffect } from "react";
import styles from "./Taskbar.module.css";

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
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  onToggleStartMenu,
  onToggleWindowMin,
  onToggleControlPanel,
}) => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeStr(
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if specific apps are currently running to render active indicators
  const chatWindow = windows.find((w) => w.title.includes("Chat"));
  const settingsWindow = windows.find((w) => w.title.includes("Settings"));
  const explorerWindow = windows.find((w) => w.title.includes("Explorer"));

  const handleDockItemClick = (
    win: WindowSummary | undefined,
    defaultLauncherId: string,
    defaultLauncherName: string
  ) => {
    if (win) {
      onToggleWindowMin(win.id);
    } else {
      // If the app is not running, trigger the Start Menu toggle so they can launch it,
      // or since we have a direct reference, we can simulate launch via Start button.
      // For UX, toggling the start menu is standard, or just clicking opens the launcher.
      onToggleStartMenu();
    }
  };

  return (
    <div
      className={styles.taskbar}
      onClick={(e) => e.stopPropagation()}
      data-testid="taskbar-wrapper"
    >
      {/* Left Section: OS Logo Branding */}
      <div className={styles.leftSection}>
        <div className={styles.showDesktop} title="Show Desktop" />
        <span className={styles.logo}>ARGUS Sovereign OS</span>
      </div>

      {/* Centered Dock (Windows 11 / MacOS Hybrid style) */}
      <div className={styles.centerDock}>
        {/* Start Button */}
        <div
          className={styles.dockItem}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStartMenu();
          }}
          data-testid="start-button"
          title="Start Menu"
        >
          <span className={styles.dockIcon} style={{ color: "#3b82f6" }}>
            ⊞
          </span>
        </div>

        {/* Pinned/Active App: Chat */}
        <div
          className={styles.dockItem}
          onClick={() => handleDockItemClick(chatWindow, "chat", "Chat Assistant")}
          data-testid="taskbar-item-chat"
          title="Chat Assistant"
        >
          <span className={styles.dockIcon}>💬</span>
          {chatWindow && (
            <div
              className={`${styles.activeDot} ${
                chatWindow.isActive && !chatWindow.isMinimized
                  ? styles.activeDotPulsing
                  : chatWindow.isMinimized
                  ? styles.activeDotMinimized
                  : ""
              }`}
            />
          )}
        </div>

        {/* Pinned/Active App: Settings */}
        <div
          className={styles.dockItem}
          onClick={() => handleDockItemClick(settingsWindow, "settings", "Settings")}
          data-testid="taskbar-item-settings"
          title="System Settings"
        >
          <span className={styles.dockIcon}>⚙️</span>
          {settingsWindow && (
            <div
              className={`${styles.activeDot} ${
                settingsWindow.isActive && !settingsWindow.isMinimized
                  ? styles.activeDotPulsing
                  : settingsWindow.isMinimized
                  ? styles.activeDotMinimized
                  : ""
              }`}
            />
          )}
        </div>

        {/* Active App: File Explorer (rendered only when open) */}
        {explorerWindow && (
          <div
            className={styles.dockItem}
            onClick={() => onToggleWindowMin(explorerWindow.id)}
            data-testid={`taskbar-item-${explorerWindow.id}`}
            title="File Explorer"
          >
            <span className={styles.dockIcon}>📁</span>
            <div
              className={`${styles.activeDot} ${
                explorerWindow.isActive && !explorerWindow.isMinimized
                  ? styles.activeDotPulsing
                  : explorerWindow.isMinimized
                  ? styles.activeDotMinimized
                  : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Right Section: System Tray Widgets */}
      <div className={styles.rightSection}>
        {/* Status Indicators Tray (Volume, Wifi, Battery) */}
        <div className={styles.trayIcons} onClick={onToggleControlPanel}>
          <span className={styles.trayIcon} title="Volume">
            🔊
          </span>
          <span className={styles.trayIcon} title="Wi-Fi Connected">
            📶
          </span>
          <span className={styles.trayIcon} title="Battery 100%">
            🔋
          </span>
        </div>

        {/* Clock/Date widget */}
        <div
          className={styles.clockWidget}
          onClick={(e) => {
            e.stopPropagation();
            onToggleControlPanel();
          }}
          data-testid="taskbar-clock"
          title="Calendar & Settings"
        >
          <span className={styles.time}>{timeStr}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>
      </div>
    </div>
  );
};
