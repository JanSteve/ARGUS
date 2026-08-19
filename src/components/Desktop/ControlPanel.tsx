import React, { useState, useEffect, useRef } from "react";
import styles from "./ControlPanel.module.css";

export type WallpaperTheme = "space" | "aurora" | "forest" | "crimson";

interface ControlPanelProps {
  currentWallpaper: WallpaperTheme;
  onChangeWallpaper: (theme: WallpaperTheme) => void;
  onClose: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentWallpaper,
  onChangeWallpaper,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [wifiActive, setWifiActive] = useState(true);
  const [bluetoothActive, setBluetoothActive] = useState(false);
  const [volume, setVolume] = useState(70);
  const [brightness, setBrightness] = useState(85);

  // Close panel when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} glass-blur glass-panel`}
      data-testid="control-panel"
    >
      {/* Quick Settings Toggles */}
      <div className={styles.toggles}>
        <div
          className={`${styles.toggleBtn} ${wifiActive ? styles.activeToggle : ""}`}
          onClick={() => setWifiActive(!wifiActive)}
          data-testid="toggle-wifi"
        >
          <span className={styles.toggleIcon}>{wifiActive ? "📶" : "❌"}</span>
          <span className={styles.toggleLabel}>Wi-Fi</span>
        </div>
        <div
          className={`${styles.toggleBtn} ${
            bluetoothActive ? styles.activeToggle : ""
          }`}
          onClick={() => setBluetoothActive(!bluetoothActive)}
          data-testid="toggle-bluetooth"
        >
          <span className={styles.toggleIcon}>{bluetoothActive ? "🔵" : "⚪"}</span>
          <span className={styles.toggleLabel}>Bluetooth</span>
        </div>
      </div>

      {/* Sliders */}
      <div className={styles.sliders}>
        <div className={styles.sliderRow}>
          <span className={styles.sliderIcon}>{volume === 0 ? "🔇" : "🔊"}</span>
          <input
            type="range"
            min="0"
            max="100"
            className={styles.slider}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
        <div className={styles.sliderRow}>
          <span className={styles.sliderIcon}>☀️</span>
          <input
            type="range"
            min="10"
            max="100"
            className={styles.slider}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Wallpapers Selection */}
      <div className={styles.wallpaperSection}>
        <div className={styles.sectionTitle}>Desktop Wallpaper</div>
        <div className={styles.wallpaperGrid}>
          <div
            className={`${styles.thumb} ${styles.wSpace} ${
              currentWallpaper === "space" ? styles.activeThumb : ""
            }`}
            onClick={() => onChangeWallpaper("space")}
            data-testid="wallpaper-thumb-space"
            title="Deep Space"
          />
          <div
            className={`${styles.thumb} ${styles.wAurora} ${
              currentWallpaper === "aurora" ? styles.activeThumb : ""
            }`}
            onClick={() => onChangeWallpaper("aurora")}
            data-testid="wallpaper-thumb-aurora"
            title="Aurora Borealis"
          />
          <div
            className={`${styles.thumb} ${styles.wForest} ${
              currentWallpaper === "forest" ? styles.activeThumb : ""
            }`}
            onClick={() => onChangeWallpaper("forest")}
            data-testid="wallpaper-thumb-forest"
            title="Midnight Forest"
          />
          <div
            className={`${styles.thumb} ${styles.wCrimson} ${
              currentWallpaper === "crimson" ? styles.activeThumb : ""
            }`}
            onClick={() => onChangeWallpaper("crimson")}
            data-testid="wallpaper-thumb-crimson"
            title="Crimson Nebula"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className={styles.footer}>
        <span>Battery: 100% ⚡</span>
        <span>ARGUS v0.1.0</span>
      </div>
    </div>
  );
};
