/**
 * ARGUS Universal Command Spotlight (Cmd+K / Ctrl+K)
 * Fast fuzzy launcher for apps, system hardware controls, calculations, and AI commands
 */

import React, { useState, useEffect, useRef } from "react";
import styles from "./SpotlightBar.module.css";
import { playNotificationSound } from "../../lib/soundEffects";

interface SpotlightItem {
  id: string;
  title: string;
  category: "App" | "System" | "Voice" | "Tool";
  icon: string;
  action: () => void;
}

interface SpotlightBarProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string, title: string) => void;
}

export const SpotlightBar: React.FC<SpotlightBarProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems: SpotlightItem[] = [
    {
      id: "growth",
      title: "Growth & Marketing Command Center",
      category: "Tool",
      icon: "🚀",
      action: () => onLaunchApp("growth", "Growth Command Center"),
    },
    {
      id: "workspaces",
      title: "AI Workspaces & Startup Hub",
      category: "Tool",
      icon: "⚡",
      action: () => onLaunchApp("workspaces", "AI Workspaces"),
    },
    {
      id: "chat",
      title: "Chat Assistant (ARGUS Core)",
      category: "App",
      icon: "💬",
      action: () => onLaunchApp("chat", "Chat Assistant"),
    },
    {
      id: "phone",
      title: "Phone Connect (Mobile Bridge)",
      category: "App",
      icon: "📱",
      action: () => onLaunchApp("phone", "Phone Connect"),
    },
    {
      id: "browser",
      title: "Sovereign Browser",
      category: "App",
      icon: "🌐",
      action: () => onLaunchApp("browser", "Browser"),
    },
    {
      id: "terminal",
      title: "Terminal Emulator",
      category: "App",
      icon: "💻",
      action: () => onLaunchApp("terminal", "Terminal"),
    },
    {
      id: "weather",
      title: "Weather Radar",
      category: "App",
      icon: "🌦️",
      action: () => onLaunchApp("weather", "Weather"),
    },
    {
      id: "taskmanager",
      title: "Task Manager & Hardware Monitor",
      category: "App",
      icon: "📊",
      action: () => onLaunchApp("taskmanager", "Task Manager"),
    },
    {
      id: "notes",
      title: "Notes Studio",
      category: "App",
      icon: "📝",
      action: () => onLaunchApp("notes", "Notes"),
    },
    {
      id: "calculator",
      title: "Calculator",
      category: "App",
      icon: "🔢",
      action: () => onLaunchApp("calculator", "Calculator"),
    },
    {
      id: "settings",
      title: "System Settings",
      category: "App",
      icon: "⚙️",
      action: () => onLaunchApp("settings", "Settings"),
    },
    {
      id: "wifi_toggle",
      title: "Toggle Wi-Fi Interface",
      category: "System",
      icon: "📶",
      action: () => {
        window.dispatchEvent(
          new CustomEvent("argus:system-state-changed", {
            detail: { wifiActive: true },
          })
        );
        playNotificationSound();
      },
    },
    {
      id: "bluetooth_toggle",
      title: "Toggle Bluetooth Hardware",
      category: "System",
      icon: "🔷",
      action: () => {
        window.dispatchEvent(
          new CustomEvent("argus:system-state-changed", {
            detail: { bluetoothActive: true },
          })
        );
        playNotificationSound();
      },
    },
  ];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.spotlightBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, launch an app, or search..."
            className={styles.input}
          />
          <span className={styles.shortcutBadge}>ESC</span>
        </div>

        <div className={styles.resultsList}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
              No commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.resultItem} ${
                  index === selectedIndex ? styles.resultActive : ""
                }`}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={styles.resultLeft}>
                  <span className={styles.resultIcon}>{item.icon}</span>
                  <div>
                    <div className={styles.resultTitle}>{item.title}</div>
                    <div className={styles.resultCategory}>{item.category}</div>
                  </div>
                </div>
                <span className={styles.resultHint}>↵ Select</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
