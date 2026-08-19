import React, { useState } from "react";
import styles from "./StartMenu.module.css";

interface StartMenuProps {
  onLaunchApp: (appId: string, title: string) => void;
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const apps = [
    {
      id: "chat",
      name: "Chat Assistant",
      desc: "Talk to local or remote AI models",
      icon: "💬",
      iconClass: "",
    },
    {
      id: "settings",
      name: "Settings",
      desc: "Configure keys and Ollama models",
      icon: "⚙️",
      iconClass: styles.settingsIcon,
    },
    {
      id: "explorer",
      name: "File Explorer",
      desc: "Manage workspaces and logs",
      icon: "📁",
      iconClass: styles.explorerIcon,
    },
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

  return (
    <div className={`${styles.menu} glass-blur glass-panel`} data-testid="start-menu">
      {/* Header Search */}
      <div className={styles.header}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          data-testid="start-search"
        />
      </div>

      {/* Applications List */}
      <div className={styles.content}>
        <div className={styles.sectionTitle}>Applications</div>
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className={styles.appItem}
            onClick={() => handleAppClick(app.id, app.name)}
            data-testid={`start-app-item-${app.id}`}
          >
            <div className={`${styles.icon} ${app.iconClass}`}>{app.icon}</div>
            <div className={styles.appText}>
              <span className={styles.appName}>{app.name}</span>
              <span className={styles.appDesc}>{app.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User profile footer */}
      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>JS</div>
          <span className={styles.userName}>Jan Steve Daniel</span>
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
