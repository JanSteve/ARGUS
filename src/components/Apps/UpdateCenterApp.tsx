import React, { useState, useEffect } from "react";
import styles from "./UpdateCenterApp.module.css";

const CURRENT_VERSION = "0.2.4";
const REPO = "JanSteve/ARGUS";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface ReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export const UpdateCenterApp: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkUpdates = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (!res.ok) {
        // Fallback to all releases list
        const listRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (!listRes.ok) {
          throw new Error(`GitHub API returned status ${res.status}`);
        }
        const listData = await listRes.json();
        if (Array.isArray(listData) && listData.length > 0) {
          setLatestRelease(listData[0]);
        } else {
          throw new Error("No published releases found");
        }
      } else {
        const data = await res.json();
        setLatestRelease(data);
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch updates");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  const cleanCurrent = CURRENT_VERSION.replace(/^v/, "");
  const cleanRemote = latestRelease?.tag_name?.replace(/^v/, "") || CURRENT_VERSION;
  const hasUpdate = cleanRemote > cleanCurrent;

  const dmgAsset = latestRelease?.assets?.find((a) => a.name.endsWith(".dmg"));
  const exeAsset = latestRelease?.assets?.find(
    (a) => a.name.endsWith(".exe") || a.name.endsWith(".msi")
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8l4-4 4 4h-3v4z" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>ARGUS Update Center</h2>
            <p className={styles.subtitle}>Sovereign OS Release & System Update Manager</p>
          </div>
        </div>
        <button
          className={styles.checkBtn}
          onClick={checkUpdates}
          disabled={checking}
        >
          <svg
            className={checking ? styles.spin : ""}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          {checking ? "Checking GitHub..." : "Check for Updates"}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.statusRow}>
            <div className={styles.statusInfo}>
              <span className={styles.versionBadge}>Running v{CURRENT_VERSION}</span>
              <h3 className={styles.statusTitle}>
                {checking
                  ? "Verifying latest build against GitHub..."
                  : hasUpdate
                  ? `New Update Available: v${cleanRemote}`
                  : "ARGUS Sovereign OS is Up to Date"}
              </h3>
              <p className={styles.statusDetail}>
                {lastChecked ? `Last checked: ${lastChecked}` : "Connecting to update servers..."}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.card} style={{ borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.05)" }}>
            <p style={{ color: "#f87171", margin: 0, fontSize: "0.85rem" }}>
              Update Check Warning: {error}. You can still download the latest binaries directly from GitHub Releases.
            </p>
          </div>
        )}

        {latestRelease && (
          <div className={`${styles.card} ${styles.releaseCard}`}>
            <div className={styles.releaseHeader}>
              <div>
                <h4 className={styles.releaseTitle}>{latestRelease.name || latestRelease.tag_name}</h4>
                <span className={styles.releaseDate}>
                  Released on {new Date(latestRelease.published_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className={styles.releaseBody}>
              {latestRelease.body || "Performance enhancements, zero-signup AI engine, and stability optimizations."}
            </div>

            <div className={styles.downloadRow}>
              {dmgAsset && (
                <a
                  href={dmgAsset.browser_download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadBtn}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                  </svg>
                  Download macOS (.dmg)
                </a>
              )}

              {exeAsset && (
                <a
                  href={exeAsset.browser_download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadBtn}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                  </svg>
                  Download Windows (.exe / .msi)
                </a>
              )}

              <a
                href={latestRelease.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryBtn}
              >
                View on GitHub
              </a>
            </div>
          </div>
        )}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>System Channel</div>
            <div className={styles.infoValue}>Production Sovereign Stable</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Architecture</div>
            <div className={styles.infoValue}>ARM64 / x86_64 Dual Native</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>AI Subsystem</div>
            <div className={styles.infoValue}>Multi-Provider (Local / Keyless Cloud)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
