import React, { useState, useEffect } from "react";
import styles from "./BrowserApp.module.css";
import { useSystemState } from "../../hooks/useSystemState";

// Attempt to load tauri opener plugin for native host browser activation
let tauriOpen: ((url: string) => Promise<void>) | null = null;
try {
  // Dynamically import to prevent test-runner or node build breakage
  import("@tauri-apps/plugin-opener").then((mod) => {
    tauriOpen = mod.open;
  }).catch(() => {
    // Ignore, fallback will be used
  });
} catch {
  // Ignore
}

interface Tab {
  id: string;
  title: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const { state } = useSystemState();
  const [tabs, setTabs] = useState<Tab[]>([{ id: "1", title: "Welcome", url: "" }]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [urlInput, setUrlInput] = useState("");

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const wifiActive = state.wifiActive;

  // Listen to navigation events from Chat/Copilot agent
  useEffect(() => {
    const handleRemoteNavigate = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (detail?.url) {
        let target = detail.url;
        if (!/^https?:\/\//i.test(target)) {
          target = "https://" + target;
        }
        setTabs((prev) => {
          const active = prev.find((t) => t.id === activeTabId);
          if (active) {
            return prev.map((t) =>
              t.id === activeTabId ? { ...t, url: target, title: detail.url } : t
            );
          }
          return [...prev, { id: Date.now().toString(), title: detail.url, url: target }];
        });
        setUrlInput(target);
      }
    };
    window.addEventListener("argus:browser-navigate", handleRemoteNavigate);
    return () => window.removeEventListener("argus:browser-navigate", handleRemoteNavigate);
  }, [activeTabId]);

  const handleAddTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, title: "New Tab", url: "" }]);
    setActiveTabId(newId);
    setUrlInput("");
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1];
      setActiveTabId(newActive.id);
      setUrlInput(newActive.url);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let finalUrl = urlInput;
    if (!/^https?:\/\//i.test(finalUrl) && finalUrl !== "") {
      finalUrl = "https://" + finalUrl;
    }

    setTabs(
      tabs.map((t) =>
        t.id === activeTabId ? { ...t, url: finalUrl, title: urlInput } : t
      )
    );
    setUrlInput(finalUrl);
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTabId(tab.id);
    setUrlInput(tab.url);
  };

  // Open active URL in the host's actual browser (Chrome, Safari, etc.)
  const handleOpenExternal = async () => {
    if (!activeTab?.url) return;
    try {
      if (tauriOpen) {
        await tauriOpen(activeTab.url);
      } else {
        window.open(activeTab.url, "_blank");
      }
    } catch {
      window.open(activeTab.url, "_blank");
    }
  };

  return (
    <div className={styles.browser}>
      <div className={styles.header}>
        <div className={styles.tabBar}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`${styles.tab} ${tab.id === activeTabId ? styles.tabActive : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              <span className={styles.tabTitle}>{tab.title}</span>
              <button
                className={styles.closeTab}
                onClick={(e) => handleCloseTab(e, tab.id)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
          <button className={styles.iconButton} onClick={handleAddTab}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <div className={styles.toolbar}>
          <button className={styles.iconButton} title="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button className={styles.iconButton} title="Forward">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button className={styles.iconButton} title="Reload">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
          <button
            className={styles.iconButton}
            title="Home"
            onClick={() => {
              setUrlInput("");
              setTabs(
                tabs.map((t) =>
                  t.id === activeTabId ? { ...t, url: "", title: "Welcome" } : t
                )
              );
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          <form className={styles.addressBar} onSubmit={handleNavigate}>
            <input
              type="text"
              className={styles.addressInput}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter web address (e.g. example.com)"
            />
          </form>

          {activeTab?.url && (
            <button
              className={styles.iconButton}
              title="Open in System Browser (Bypasses Sandbox Embed Restrictions)"
              onClick={handleOpenExternal}
              style={{
                marginLeft: "4px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#a5b4fc",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Launch</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {!wifiActive ? (
          <div className={styles.welcome} style={{ justifyContent: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h2>No Internet Connection</h2>
            <p style={{ color: "var(--fg-muted)", maxWidth: "340px", margin: "8px auto 16px" }}>
              Wi-Fi is currently disabled in the Action Center. Enable Wi-Fi to load web content.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("argus:open-action-center"))}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Configure Connection
            </button>
          </div>
        ) : activeTab?.url ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <iframe
              src={activeTab.url}
              className={styles.iframe}
              title={activeTab.title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
            {/* Overlay Notice for site headers */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                background: "rgba(10, 11, 16, 0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "11px",
                color: "var(--fg-muted)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <span>Site blocking embed?</span>
              <button
                onClick={handleOpenExternal}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "4px",
                  color: "var(--fg-default)",
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: "10px",
                }}
              >
                Open in Safari/Chrome
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.welcome}>
            <h1>Welcome to ARGUS Browser</h1>
            <p>Fast, secure, and privacy-focused browsing experience.</p>

            <div className={styles.links}>
              <div
                className={styles.linkCard}
                onClick={() => {
                  setUrlInput("https://example.com");
                  setTabs(tabs.map((t) => t.id === activeTabId ? { ...t, url: "https://example.com", title: "Example Domain" } : t));
                }}
              >
                <h3>Example Domain</h3>
                <p>Simple reference website</p>
              </div>
              <div
                className={styles.linkCard}
                onClick={() => {
                  setUrlInput("https://en.wikipedia.org");
                  setTabs(tabs.map((t) => t.id === activeTabId ? { ...t, url: "https://en.wikipedia.org", title: "Wikipedia" } : t));
                }}
              >
                <h3>Wikipedia</h3>
                <p>The free encyclopedia (embed friendly)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
