/**
 * ARGUS Universal Auto-Update Notification Banner
 * Checks GitHub Releases API periodically and alerts users with British voice & 1-click update
 */

import React, { useState, useEffect } from "react";
import styles from "./UpdateNotifier.module.css";
import { speakVoice } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";

const CURRENT_LOCAL_VERSION = "v0.2.4";
const GITHUB_REPO = "JanSteve/ARGUS";

export const UpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_LOCAL_VERSION);
  const [downloadUrl, setDownloadUrl] = useState("https://argus-sovereign-os-website.vercel.app/downloads/ARGUS_macOS.dmg");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!res.ok) return;

        const data = await res.json();
        const tag = data.tag_name;

        if (tag && tag !== CURRENT_LOCAL_VERSION) {
          setLatestVersion(tag);
          setUpdateAvailable(true);

          // Find DMG asset if available
          if (data.assets && Array.isArray(data.assets)) {
            const dmg = data.assets.find((a: any) => a.name.endsWith(".dmg"));
            if (dmg) setDownloadUrl(dmg.browser_download_url);
          }

          playNotificationSound();
          speakVoice(
            `Sir, a new sovereign system update, ${tag}, is available on the release channel. You may download it directly from the top banner.`
          );
        }
      } catch (err) {
        // Silently catch network errors
      }
    };

    // Check on startup and every 30 minutes
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.pulseDot} />
      <div className={styles.textGroup}>
        <span>⚡ <strong>ARGUS Core Update Ready:</strong></span>
        <span className={styles.versionTag}>{latestVersion}</span>
      </div>
      <a
        href={downloadUrl}
        download="ARGUS_macOS.dmg"
        className={styles.btnDownload}
        target="_blank"
        rel="noreferrer"
      >
        ⬇ Download Update
      </a>
      <button className={styles.btnClose} onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
};
