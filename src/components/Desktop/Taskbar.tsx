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
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  onToggleStartMenu,
  onToggleWindowMin,
}) => {
  const [timeStr, setTimeStr] = useState("");

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
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${styles.taskbar} glass-blur`}>
      {/* Start Button App Launcher */}
      <button
        className={styles.startButton}
        onClick={onToggleStartMenu}
        data-testid="start-button"
        title="Open App Launcher"
      >
        <span className={styles.startIcon}>⊞</span>
        <span>Start</span>
      </button>

      {/* List of active windows */}
      <div className={styles.appsList}>
        {windows.map((win) => {
          const itemClass = `${styles.appItem} ${
            win.isActive && !win.isMinimized ? styles.activeApp : ""
          }`;

          return (
            <div
              key={win.id}
              className={itemClass}
              onClick={() => onToggleWindowMin(win.id)}
              data-testid={`taskbar-item-${win.id}`}
              title={win.title}
            >
              <div className={styles.indicator} />
              <span>{win.title}</span>
            </div>
          );
        })}
      </div>

      {/* System Tray (Clock) */}
      <div className={styles.tray}>
        <div className={styles.time} data-testid="taskbar-clock">
          {timeStr}
        </div>
      </div>
    </div>
  );
};
