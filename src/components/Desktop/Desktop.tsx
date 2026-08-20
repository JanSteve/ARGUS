import React, { useState, useCallback, useEffect } from "react";
import styles from "./Desktop.module.css";
import { WindowFrame } from "./WindowFrame";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ContextMenu } from "./ContextMenu";
import { ControlPanel, WallpaperTheme } from "./ControlPanel";

/* ─── Lazy-loaded App Components ─── */
import { BrowserApp } from "../Apps/BrowserApp";
import { TerminalApp } from "../Apps/TerminalApp";
import { CalculatorApp } from "../Apps/CalculatorApp";
import { NotesApp } from "../Apps/NotesApp";
import { MusicPlayerApp } from "../Apps/MusicPlayerApp";
import { PhotosApp } from "../Apps/PhotosApp";

/* ─── Types ─── */
export type AppComponent =
  | "chat"
  | "settings"
  | "explorer"
  | "browser"
  | "terminal"
  | "calculator"
  | "notes"
  | "music"
  | "photos";

export interface WindowInstance {
  id: string;
  title: string;
  component: AppComponent;
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

/* ─── Default Window Sizes per App ─── */
const APP_DEFAULTS: Record<AppComponent, { width: number; height: number }> = {
  chat: { width: 640, height: 480 },
  browser: { width: 900, height: 600 },
  terminal: { width: 720, height: 480 },
  explorer: { width: 700, height: 480 },
  calculator: { width: 340, height: 520 },
  notes: { width: 720, height: 500 },
  music: { width: 780, height: 520 },
  photos: { width: 800, height: 560 },
  settings: { width: 500, height: 400 },
};

/* ─── Desktop Shortcuts Configuration ─── */
const DESKTOP_SHORTCUTS = [
  { id: "chat", name: "Chat Assistant", icon: "chat" },
  { id: "browser", name: "Browser", icon: "browser" },
  { id: "terminal", name: "Terminal", icon: "terminal" },
  { id: "explorer", name: "Files", icon: "explorer" },
  { id: "notes", name: "Notes", icon: "notes" },
  { id: "settings", name: "Settings", icon: "settings" },
];

/* ─── Desktop Shortcut SVG Icons ─── */
const ShortcutIcons: Record<string, React.ReactNode> = {
  chat: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-chat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-chat)" />
      <path d="M24 12c-7.2 0-13 4.5-13 10s5.8 10 13 10c1.2 0 2.3-.1 3.4-.4L33 35l-1.8-4.6C33.8 28.4 37 25 37 22c0-5.5-5.8-10-13-10z" fill="rgba(255,255,255,0.95)" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-browser" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-browser)" />
      <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
      <ellipse cx="24" cy="24" rx="5" ry="12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-term" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-term)" />
      <polyline points="16,18 22,24 16,30" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="30" x2="34" y2="30" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  explorer: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-files" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-files)" />
      <path d="M12 16c0-1.1.9-2 2-2h6l3 3h11c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V16z" fill="rgba(255,255,255,0.95)" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-notes" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-notes)" />
      <rect x="13" y="11" width="22" height="26" rx="2" fill="rgba(255,255,255,0.95)" />
      <line x1="17" y1="18" x2="31" y2="18" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      <line x1="17" y1="23" x2="31" y2="23" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      <line x1="17" y1="28" x2="27" y2="28" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-settings" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-settings)" />
      <circle cx="24" cy="24" r="5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
      <path d="M24 14v-2M24 36v-2M14 24h-2M36 24h-2M17.8 17.8l-1.4-1.4M31.6 31.6l-1.4-1.4M17.8 30.2l-1.4 1.4M31.6 16.4l-1.4 1.4" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* ─── Desktop Component ─── */
export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [topZIndex, setTopZIndex] = useState(10);
  const [wallpaper, setWallpaper] = useState<WallpaperTheme>("space");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapPreview | null>(null);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);

  // Focus window
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

  // Launch app
  const launchApp = useCallback(
    (appId: string, title: string) => {
      const component = appId as AppComponent;
      const existing = windows.find((w) => w.component === component);
      if (existing) {
        focusWindow(existing.id);
        return;
      }

      const defaults = APP_DEFAULTS[component] || { width: 640, height: 480 };
      const offset = windows.length * 20;

      // Center the window on screen
      const centerX = Math.max(80, (window.innerWidth - defaults.width) / 2 + offset);
      const centerY = Math.max(40, (window.innerHeight - 48 - defaults.height) / 2 + offset / 2);

      const newWin: WindowInstance = {
        id: `${appId}-${Date.now()}`,
        title,
        component,
        x: centerX,
        y: centerY,
        width: defaults.width,
        height: defaults.height,
        isMinimized: false,
        isMaximized: false,
        zIndex: topZIndex + 1,
      };

      setTopZIndex((prev) => prev + 1);
      setWindows((prev) => [...prev, newWin]);
      setStartMenuOpen(false);
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

  // Window movement with Aero Snap
  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));

    const taskbarHeight = 48;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - taskbarHeight;

    if (y < 8) {
      setSnapPreview({ x: 0, y: 0, width: screenWidth, height: screenHeight });
    } else if (x < 15) {
      setSnapPreview({ x: 0, y: 0, width: screenWidth / 2, height: screenHeight });
    } else if (x > screenWidth - 100) {
      setSnapPreview({ x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight });
    } else {
      setSnapPreview(null);
    }
  }, []);

  // Aero Snap on drag end
  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const taskbarHeight = 48;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - taskbarHeight;

      if (y < 8) {
        setWindows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isMaximized: true, x: 0, y: 0 } : w))
        );
      } else if (x < 15) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, isMaximized: false, x: 0, y: 0, width: screenWidth / 2, height: screenHeight }
              : w
          )
        );
      } else if (x > screenWidth - 100) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, isMaximized: false, x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight }
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
    setSelectedShortcut(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const cycleWallpaper = () => {
    const themes: WallpaperTheme[] = ["space", "aurora", "forest", "crimson", "ocean", "sunset"];
    const nextIdx = (themes.indexOf(wallpaper) + 1) % themes.length;
    setWallpaper(themes[nextIdx]);
  };

  // Close context menu on resize
  useEffect(() => {
    const handleResize = () => setContextMenu(null);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const wallpaperClass =
    wallpaper === "space" ? styles.wSpace :
    wallpaper === "aurora" ? styles.wAurora :
    wallpaper === "forest" ? styles.wForest :
    wallpaper === "ocean" ? styles.wOcean :
    wallpaper === "sunset" ? styles.wSunset :
    styles.wCrimson;

  const contextMenuItems = [
    { label: "Refresh Desktop", icon: "refresh", onClick: () => { /* no-op */ } },
    { label: "Cycle Wallpaper", icon: "wallpaper", onClick: cycleWallpaper },
    { label: "System Settings", icon: "settings", onClick: () => launchApp("settings", "Settings"), dividerBefore: true },
    { label: "File Explorer", icon: "explorer", onClick: () => launchApp("explorer", "File Explorer") },
    { label: "Terminal", icon: "terminal", onClick: () => launchApp("terminal", "Terminal") },
  ];

  // Render app content inside window frame
  const renderAppContent = (component: AppComponent) => {
    switch (component) {
      case "chat":
        return <ChatApp />;
      case "settings":
        return <SettingsApp />;
      case "explorer":
        return <FileExplorerApp />;
      case "browser":
        return <BrowserApp />;
      case "terminal":
        return <TerminalApp />;
      case "calculator":
        return <CalculatorApp />;
      case "notes":
        return <NotesApp />;
      case "music":
        return <MusicPlayerApp />;
      case "photos":
        return <PhotosApp />;
      default:
        return <div>Unknown App</div>;
    }
  };

  return (
    <div
      className={`${styles.desktop} ${wallpaperClass}`}
      onClick={handleDesktopClick}
      onContextMenu={handleRightClick}
      data-testid="desktop-wallpaper"
    >
      {/* Wallpaper texture */}
      <div className={styles.wallpaper} />

      {/* Desktop Icon Grid */}
      <div className={styles.iconGrid}>
        {DESKTOP_SHORTCUTS.map((shortcut) => (
          <div
            key={shortcut.id}
            className={`${styles.shortcut} ${selectedShortcut === shortcut.id ? styles.shortcutSelected : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedShortcut(shortcut.id);
            }}
            onDoubleClick={() => launchApp(shortcut.id, shortcut.name)}
            data-testid={`shortcut-${shortcut.id}`}
          >
            <div className={styles.shortcutIcon}>
              {ShortcutIcons[shortcut.icon]}
            </div>
            <span className={styles.shortcutName}>{shortcut.name}</span>
          </div>
        ))}
      </div>

      {/* Aero Snap preview */}
      {snapPreview && (
        <div
          className={styles.snapPreview}
          style={{
            left: `${snapPreview.x}px`,
            top: `${snapPreview.y}px`,
            width: `${snapPreview.width}px`,
            height: `${snapPreview.height}px`,
          }}
          data-testid="snap-preview"
        />
      )}

      {/* Windows */}
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
            {renderAppContent(win.component)}
          </WindowFrame>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Start Menu */}
      {startMenuOpen && (
        <StartMenu
          onLaunchApp={launchApp}
          onClose={() => setStartMenuOpen(false)}
        />
      )}

      {/* Control Panel */}
      {controlPanelOpen && (
        <ControlPanel
          currentWallpaper={wallpaper}
          onChangeWallpaper={setWallpaper}
          onClose={() => setControlPanelOpen(false)}
        />
      )}

      {/* Taskbar */}
      <Taskbar
        windows={windows.map((w) => ({
          id: w.id,
          title: w.title,
          isActive:
            windows.length > 0 &&
            windows.reduce((max, w2) => (w2.zIndex > max.zIndex ? w2 : max), windows[0]).id === w.id,
          isMinimized: w.isMinimized,
        }))}
        onToggleStartMenu={() => setStartMenuOpen(!startMenuOpen)}
        onToggleWindowMin={toggleWindowMinimize}
        onToggleControlPanel={() => setControlPanelOpen(!controlPanelOpen)}
        onLaunchApp={launchApp}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Built-in App Components (Chat, Settings, File Explorer)
   These are inline to Desktop.tsx — the other apps are in ../Apps/
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Chat App ─── */
const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Array<{role: string; text: string}>>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    // Simulated AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "I'm running locally via Ollama. Configure your provider in Settings to enable full AI capabilities."
      }]);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>
      {/* Status Badge */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
        border: "1px solid rgba(59,130,246,0.2)",
        padding: "10px 14px",
        borderRadius: "10px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#3b82f6"/>
        </svg>
        <div>
          <strong style={{ color: "#93c5fd" }}>OLLAMA (LOCAL)</strong>
          <span style={{ color: "var(--fg-muted)", marginLeft: "8px", fontSize: "11px" }}>llama3.2</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        borderRadius: "10px",
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.04)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "auto"
      }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--fg-muted)", textAlign: "center", marginTop: "40px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor"/>
            </svg>
            Start a conversation with your local AI
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "rgba(255,255,255,0.05)",
              padding: "8px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              maxWidth: "80%",
              fontSize: "13px",
              lineHeight: "1.5",
              border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)"
            }}>
              {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            fontSize: "13px",
            color: "var(--fg-default)",
            transition: "border-color 0.15s ease",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "13px",
            color: "white",
            cursor: "pointer",
            transition: "opacity 0.15s ease",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

/* ─── Settings App ─── */
const SettingsApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState("ai");

  const sections = [
    { id: "ai", label: "AI Providers", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
    { id: "display", label: "Display", icon: "M2 3h20v14H2zM8 21h8M12 17v4" },
    { id: "about", label: "About", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", gap: "0" }}>
      {/* Sidebar */}
      <div style={{
        width: "180px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}>
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeSection === s.id ? 600 : 400,
              background: activeSection === s.id ? "rgba(99,102,241,0.15)" : "transparent",
              color: activeSection === s.id ? "#a5b4fc" : "var(--fg-muted)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={s.icon} />
            </svg>
            {s.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px", overflow: "auto" }}>
        {activeSection === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>AI Provider Configuration</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { name: "Ollama (Local)", desc: "Run models locally — zero cloud dependency", default: true },
                { name: "Groq", desc: "Ultra-fast cloud inference" },
                { name: "Google Gemini", desc: "Multimodal AI by Google DeepMind" },
                { name: "DeepSeek", desc: "Open-source reasoning models" },
                { name: "NVIDIA NIM", desc: "GPU-accelerated inference" },
              ].map((provider) => (
                <div key={provider.name} style={{
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: provider.default ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{provider.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "2px" }}>{provider.desc}</div>
                  </div>
                  {provider.default ? (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: "6px" }}>ACTIVE</span>
                  ) : (
                    <button style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "var(--fg-muted)", cursor: "pointer" }}>Configure</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeSection === "display" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Display Settings</h3>
            <p style={{ fontSize: "13px", color: "var(--fg-muted)" }}>Use the Control Panel (click clock/tray) to change wallpapers, brightness, and volume.</p>
          </div>
        )}
        {activeSection === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>About ARGUS Sovereign OS</h3>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>ARGUS Sovereign OS</p>
              <p style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>Version 2.0.0</p>
              <p style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "8px" }}>
                The world's first AI-native desktop operating system.
                <br />Built with React, TypeScript, Tauri, and Rust.
              </p>
              <p style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "12px" }}>
                © 2026 R Jan Steve Daniel. All rights reserved.
                <br />Source-Available & Proprietary License.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── File Explorer App ─── */
const FileExplorerApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState("/home/user");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  type FSEntry = { name: string; type: "folder" | "file"; size?: string; children?: FSEntry[] };

  const filesystem: Record<string, FSEntry[]> = {
    "/home/user": [
      { name: "Desktop", type: "folder" },
      { name: "Documents", type: "folder" },
      { name: "Downloads", type: "folder" },
      { name: "Music", type: "folder" },
      { name: "Pictures", type: "folder" },
      { name: ".config", type: "folder" },
      { name: "README.md", type: "file", size: "5.8 KB" },
      { name: "notes.txt", type: "file", size: "1.2 KB" },
    ],
    "/home/user/Desktop": [
      { name: "project-plan.pdf", type: "file", size: "2.4 MB" },
      { name: "screenshot.png", type: "file", size: "845 KB" },
    ],
    "/home/user/Documents": [
      { name: "Resume.pdf", type: "file", size: "156 KB" },
      { name: "Budget.xlsx", type: "file", size: "48 KB" },
      { name: "Projects", type: "folder" },
    ],
    "/home/user/Downloads": [
      { name: "argus-installer.dmg", type: "file", size: "128 MB" },
      { name: "llama3.2-model.bin", type: "file", size: "4.2 GB" },
    ],
    "/home/user/Music": [
      { name: "Ambient", type: "folder" },
      { name: "Electronic", type: "folder" },
    ],
    "/home/user/Pictures": [
      { name: "Wallpapers", type: "folder" },
      { name: "Screenshots", type: "folder" },
      { name: "vacation-2025.jpg", type: "file", size: "3.2 MB" },
    ],
  };

  const items = filesystem[currentPath] || [];
  const pathParts = currentPath.split("/").filter(Boolean);

  const navigateUp = () => {
    const parts = currentPath.split("/");
    if (parts.length > 3) {
      parts.pop();
      setCurrentPath(parts.join("/"));
      setSelectedItem(null);
    }
  };

  const openFolder = (name: string) => {
    const newPath = `${currentPath}/${name}`;
    if (filesystem[newPath]) {
      setCurrentPath(newPath);
      setSelectedItem(null);
    }
  };

  const folderIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b">
      <path d="M2 6C2 4.9 2.9 4 4 4h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z"/>
    </svg>
  );

  const fileIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  );

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column", gap: "0" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: "8px"
      }}>
        <button onClick={navigateUp} style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          padding: "4px 8px",
          color: "var(--fg-muted)",
          cursor: "pointer",
          fontSize: "14px"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        {/* Breadcrumb */}
        <div style={{ fontSize: "12px", color: "var(--fg-muted)", display: "flex", gap: "4px", alignItems: "center" }}>
          {pathParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span style={{ margin: "0 2px", opacity: 0.4 }}>/</span>}
              <span style={{
                cursor: "pointer",
                color: i === pathParts.length - 1 ? "var(--fg-default)" : "var(--fg-muted)",
                fontWeight: i === pathParts.length - 1 ? 500 : 400
              }}>{part}</span>
            </span>
          ))}
        </div>
      </div>

      {/* File List */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {items.map((item) => (
            <div
              key={item.name}
              onClick={() => setSelectedItem(item.name)}
              onDoubleClick={() => item.type === "folder" && openFolder(item.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                background: selectedItem === item.name ? "rgba(99,102,241,0.15)" : "transparent",
                border: selectedItem === item.name ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                transition: "all 0.1s ease",
              }}
            >
              {item.type === "folder" ? folderIcon : fileIcon}
              <span style={{ flex: 1, fontSize: "13px" }}>{item.name}</span>
              {item.size && <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>{item.size}</span>}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ fontSize: "13px", color: "var(--fg-muted)", textAlign: "center", paddingTop: "40px" }}>
              This folder is empty
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "6px",
        marginTop: "8px",
        fontSize: "11px",
        color: "var(--fg-muted)"
      }}>
        {items.length} items{selectedItem ? ` · ${selectedItem} selected` : ""}
      </div>
    </div>
  );
};
