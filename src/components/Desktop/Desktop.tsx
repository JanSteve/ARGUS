import React, { useState, useCallback, useEffect } from "react";
import styles from "./Desktop.module.css";
import { WindowFrame } from "./WindowFrame";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ContextMenu } from "./ContextMenu";
import { ControlPanel, WallpaperTheme } from "./ControlPanel";

export interface WindowInstance {
  id: string;
  title: string;
  component: "chat" | "settings" | "explorer";
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface SnapPreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [topZIndex, setTopZIndex] = useState(10);

  // Wallpaper and Context Menu states
  const [wallpaper, setWallpaper] = useState<WallpaperTheme>("space");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapPreview | null>(null);

  // Focus window: bring to front by incrementing and assigning top Z-index
  const focusWindow = useCallback((id: string) => {
    setTopZIndex((prev) => {
      const nextZ = prev + 1;
      setWindows((prevWindows) =>
        prevWindows.map((win) =>
          win.id === id ? { ...win, zIndex: nextZ, isMinimized: false } : win
        )
      );
      return nextZ;
    });
  }, []);

  // Launch app: opens a new window, or focuses it if already running
  const launchApp = useCallback(
    (appId: string, title: string) => {
      const existing = windows.find((w) => w.component === appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }

      const offset = windows.length * 24;
      const newWin: WindowInstance = {
        id: `${appId}-${Date.now()}`,
        title,
        component: appId as "chat" | "settings" | "explorer",
        x: 120 + offset,
        y: 80 + offset,
        width: appId === "chat" ? 640 : 480,
        height: appId === "chat" ? 480 : 360,
        isMinimized: false,
        isMaximized: false,
        zIndex: topZIndex + 1,
      };

      setTopZIndex((prev) => prev + 1);
      setWindows((prev) => [...prev, newWin]);
    },
    [windows, topZIndex, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  // Track window movements and trigger Aero Snap preview triggers
  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));

    const taskbarHeight = 48;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - taskbarHeight;

    // Detect edges for Aero Snap visual indicators
    if (y < 8) {
      // Top Edge: Maximize preview
      setSnapPreview({ x: 0, y: 0, width: screenWidth, height: screenHeight });
    } else if (x < 15) {
      // Left Edge: Left half preview
      setSnapPreview({ x: 0, y: 0, width: screenWidth / 2, height: screenHeight });
    } else if (x > screenWidth - 100) {
      // Right Edge: Right half preview
      setSnapPreview({ x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight });
    } else {
      setSnapPreview(null);
    }
  }, []);

  // Handle snap drop calculation when user releases window header
  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const taskbarHeight = 48;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - taskbarHeight;

      if (y < 8) {
        // Snap Maximize
        setWindows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isMaximized: true, x: 0, y: 0 } : w))
        );
      } else if (x < 15) {
        // Snap Left Half
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  isMaximized: false,
                  x: 0,
                  y: 0,
                  width: screenWidth / 2,
                  height: screenHeight,
                }
              : w
          )
        );
      } else if (x > screenWidth - 100) {
        // Snap Right Half
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  isMaximized: false,
                  x: screenWidth / 2,
                  y: 0,
                  width: screenWidth / 2,
                  height: screenHeight,
                }
              : w
          )
        );
      }

      setSnapPreview(null);
    },
    []
  );

  const resizeWindow = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, x, y, width, height } : w))
      );
    },
    []
  );

  const toggleWindowMinimize = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            if (w.isMinimized) {
              focusWindow(id);
              return { ...w, isMinimized: false };
            } else {
              return { ...w, isMinimized: true };
            }
          }
          return w;
        })
      );
    },
    [focusWindow]
  );

  const handleDesktopClick = () => {
    setStartMenuOpen(false);
    setControlPanelOpen(false);
    setContextMenu(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const cycleWallpaper = () => {
    const themes: WallpaperTheme[] = ["space", "aurora", "forest", "crimson"];
    const nextIdx = (themes.indexOf(wallpaper) + 1) % themes.length;
    setWallpaper(themes[nextIdx]);
  };

  // Close context menu on window resize
  useEffect(() => {
    const handleResize = () => setContextMenu(null);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const wallpaperClass = 
    wallpaper === "space" ? styles.wSpace :
    wallpaper === "aurora" ? styles.wAurora :
    wallpaper === "forest" ? styles.wForest : styles.wCrimson;

  // Context Menu option list
  const contextMenuItems = [
    {
      label: "Refresh Desktop",
      icon: "🔄",
      onClick: () => {
        // Aesthetic trigger
      },
    },
    {
      label: "Cycle Wallpaper",
      icon: "🖼️",
      onClick: cycleWallpaper,
    },
    {
      label: "System Settings",
      icon: "⚙️",
      onClick: () => launchApp("settings", "Settings"),
      dividerBefore: true,
    },
    {
      label: "File Explorer",
      icon: "📁",
      onClick: () => launchApp("explorer", "File Explorer"),
    },
  ];

  return (
    <div
      className={`${styles.desktop} ${wallpaperClass}`}
      onClick={handleDesktopClick}
      onContextMenu={handleRightClick}
      data-testid="desktop-wallpaper"
    >
      {/* Wallpapers texture grid overlay */}
      <div className={styles.wallpaper} />

      {/* Grid of shortcuts */}
      <div className={styles.iconGrid}>
        <div
          className={styles.shortcut}
          onDoubleClick={() => launchApp("chat", "Chat Assistant")}
          data-testid="shortcut-chat"
        >
          <span className={styles.shortcutIcon}>💬</span>
          <span className={styles.shortcutName}>Chat Assistant</span>
        </div>
        <div
          className={styles.shortcut}
          onDoubleClick={() => launchApp("settings", "Settings")}
          data-testid="shortcut-settings"
        >
          <span className={styles.shortcutIcon}>⚙️</span>
          <span className={styles.shortcutName}>Settings</span>
        </div>
      </div>

      {/* Aero Snap dashed preview overlay */}
      {snapPreview && (
        <div
          style={{
            position: "absolute",
            left: `${snapPreview.x}px`,
            top: `${snapPreview.y}px`,
            width: `${snapPreview.width}px`,
            height: `${snapPreview.height}px`,
            border: "2px dashed var(--accent-color)",
            background: "rgba(59, 130, 246, 0.08)",
            zIndex: 99998,
            pointerEvents: "none",
            borderRadius: "4px",
            transition: "all 0.1s ease",
          }}
          data-testid="snap-preview"
        />
      )}

      {/* Floating Window Container */}
      <div className={styles.workspace}>
        {windows.map((win) => (
          <WindowFrame
            key={win.id}
            id={win.id}
            title={win.title}
            x={win.x}
            y={win.y}
            width={win.width}
            height={win.height}
            isActive={
              windows.length > 0 &&
              windows.reduce((max, w) => (w.zIndex > max.zIndex ? w : max), windows[0]).id === win.id
            }
            isMinimized={win.isMinimized}
            isMaximized={win.isMaximized}
            zIndex={win.zIndex}
            onFocus={() => focusWindow(win.id)}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => toggleMaximizeWindow(win.id)}
            onMove={(x, y) => moveWindow(win.id, x, y)}
            onDragEnd={(x, y) => handleDragEnd(win.id, x, y)}
            onResize={(x, y, w, h) => resizeWindow(win.id, x, y, w, h)}
          >
            {win.component === "chat" && <ChatAppMock />}
            {win.component === "settings" && <SettingsAppMock />}
            {win.component === "explorer" && <FileExplorerAppMock />}
          </WindowFrame>
        ))}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Start Menu Drawer */}
      {startMenuOpen && (
        <StartMenu
          onLaunchApp={launchApp}
          onClose={() => setStartMenuOpen(false)}
        />
      )}

      {/* Control Panel Widget (Action Center) */}
      {controlPanelOpen && (
        <ControlPanel
          currentWallpaper={wallpaper}
          onChangeWallpaper={setWallpaper}
          onClose={() => setControlPanelOpen(false)}
        />
      )}

      {/* Bottom Taskbar */}
      <Taskbar
        windows={windows.map((w) => ({
          id: w.id,
          title: w.title,
          isActive:
            windows.length > 0 &&
            windows.reduce((max, w) => (w.zIndex > max.zIndex ? w : max), windows[0]).id === w.id,
          isMinimized: w.isMinimized,
        }))}
        onToggleStartMenu={() => setStartMenuOpen(!startMenuOpen)}
        onToggleWindowMin={toggleWindowMinimize}
        onToggleControlPanel={() => setControlPanelOpen(!controlPanelOpen)}
      />
    </div>
  );
};

/* Mockup Chat Application inside Window */
const ChatAppMock: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>
    <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", padding: "10px", borderRadius: "8px", fontSize: "12px" }}>
      🛡️ <strong>OLLAMA (LOCAL) • llama3.2</strong>
      <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "4px" }}>
        Privacy Mode: Your prompt is processed locally on your machine.
      </div>
    </div>
    <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ fontSize: "12px", color: "var(--fg-muted)", textAlign: "center", marginBottom: "auto", paddingTop: "40px" }}>
        No messages yet. Send a message to start conversing with the local AI.
      </div>
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        disabled
        placeholder="Configure your provider credentials to type..."
        style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "13px" }}
      />
      <button style={{ padding: "8px 16px", background: "var(--accent-color)", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", opacity: 0.6 }}>
        Send
      </button>
    </div>
  </div>
);

/* Mockup Settings Application inside Window */
const SettingsAppMock: React.FC = () => (
  <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "16px" }}>
    <div>
      <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>AI Provider settings</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>Active Provider</span>
          <select style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", padding: "6px", borderRadius: "6px" }} defaultValue="ollama">
            <option value="ollama">Ollama (Local)</option>
            <option value="groq">Groq (Cloud)</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>Model</span>
          <input type="text" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", padding: "6px", borderRadius: "6px" }} defaultValue="llama3.2" />
        </label>
      </div>
    </div>
    <div>
      <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>Branding & Licensing</h3>
      <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <p><strong>ARGUS OS</strong> v0.1.0</p>
        <p style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "4px" }}>
          © 2026 Jan Steve Daniel. All rights reserved.
          Protected under Source-Available & Proprietary License.
        </p>
      </div>
    </div>
  </div>
);

/* Mockup File Explorer inside Window */
const FileExplorerAppMock: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px" }}>
    <div style={{ fontSize: "12px", color: "var(--fg-muted)" }}>Workspace Root: <code>~/argus-workspace</code></div>
    <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", padding: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📁</span> <span>conversations/</span>
        </div>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📁</span> <span>workspaces/</span>
        </div>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📄</span> <span>config.json</span>
        </div>
      </div>
    </div>
  </div>
);
