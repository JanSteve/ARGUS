import React, { useState, useEffect, useRef } from "react";
import styles from "./ControlPanel.module.css";

export type WallpaperTheme = "space" | "aurora" | "forest" | "crimson" | "ocean" | "sunset";

interface ControlPanelProps {
  currentWallpaper: WallpaperTheme;
  onChangeWallpaper: (theme: WallpaperTheme) => void;
  onClose: () => void;
}

/* ─── SVG Icons ─── */
const WifiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M5 13a10 10 0 0 1 14 0" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" /><circle cx="12" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const BluetoothIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6.5,6.5 17.5,17.5 12,22 12,2 17.5,6.5 6.5,17.5" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const BellOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" /><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const VolumeIcon = ({ muted }: { muted: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    {muted ? (
      <>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
        <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentWallpaper,
  onChangeWallpaper,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [wifiActive, setWifiActive] = useState(true);
  const [bluetoothActive, setBluetoothActive] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [dndActive, setDndActive] = useState(false);
  const [volume, setVolume] = useState(70);
  const [brightness, setBrightness] = useState(85);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  // Mini calendar
  const now = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const today = now.getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const wallpapers: { id: WallpaperTheme; label: string }[] = [
    { id: "space", label: "Deep Space" },
    { id: "aurora", label: "Aurora" },
    { id: "forest", label: "Forest" },
    { id: "crimson", label: "Nebula" },
    { id: "ocean", label: "Ocean" },
    { id: "sunset", label: "Sunset" },
  ];

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      data-testid="control-panel"
    >
      {/* Quick Toggles */}
      <div className={styles.toggles}>
        <div
          className={`${styles.toggleBtn} ${wifiActive ? styles.activeToggle : ""}`}
          onClick={() => setWifiActive(!wifiActive)}
          data-testid="toggle-wifi"
        >
          <span className={styles.toggleIcon}><WifiIcon /></span>
          <span className={styles.toggleLabel}>Wi-Fi</span>
        </div>
        <div
          className={`${styles.toggleBtn} ${bluetoothActive ? styles.activeToggle : ""}`}
          onClick={() => setBluetoothActive(!bluetoothActive)}
          data-testid="toggle-bluetooth"
        >
          <span className={styles.toggleIcon}><BluetoothIcon /></span>
          <span className={styles.toggleLabel}>Bluetooth</span>
        </div>
        <div
          className={`${styles.toggleBtn} ${nightLight ? styles.activeToggle : ""}`}
          onClick={() => setNightLight(!nightLight)}
        >
          <span className={styles.toggleIcon}><MoonIcon /></span>
          <span className={styles.toggleLabel}>Night Light</span>
        </div>
        <div
          className={`${styles.toggleBtn} ${dndActive ? styles.activeToggle : ""}`}
          onClick={() => setDndActive(!dndActive)}
        >
          <span className={styles.toggleIcon}><BellOffIcon /></span>
          <span className={styles.toggleLabel}>Focus</span>
        </div>
      </div>

      {/* Sliders */}
      <div className={styles.sliders}>
        <div className={styles.sliderRow}>
          <span className={styles.sliderIcon}><VolumeIcon muted={volume === 0} /></span>
          <input type="range" min="0" max="100" className={styles.slider} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          <span className={styles.sliderValue}>{volume}%</span>
        </div>
        <div className={styles.sliderRow}>
          <span className={styles.sliderIcon}><SunIcon /></span>
          <input type="range" min="10" max="100" className={styles.slider} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
          <span className={styles.sliderValue}>{brightness}%</span>
        </div>
      </div>

      {/* Mini Calendar */}
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>{currentMonth} {currentYear}</div>
        <div className={styles.calendarWeekdays}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d} className={styles.weekday}>{d}</span>
          ))}
        </div>
        <div className={styles.calendarGrid}>
          {calendarDays.map((day, i) => (
            <span
              key={i}
              className={`${styles.calDay} ${day === today ? styles.calToday : ""} ${day === null ? styles.calEmpty : ""}`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Wallpapers */}
      <div className={styles.wallpaperSection}>
        <div className={styles.sectionTitle}>Wallpaper</div>
        <div className={styles.wallpaperGrid}>
          {wallpapers.map((wp) => (
            <div
              key={wp.id}
              className={`${styles.thumb} ${styles[`w${wp.id.charAt(0).toUpperCase() + wp.id.slice(1)}`]} ${
                currentWallpaper === wp.id ? styles.activeThumb : ""
              }`}
              onClick={() => onChangeWallpaper(wp.id)}
              data-testid={`wallpaper-thumb-${wp.id}`}
              title={wp.label}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "4px", verticalAlign: "middle" }}>
            <rect x="1" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="3.5" y="9.5" width="13" height="5" rx="1" fill="currentColor" />
            <rect x="21" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
          </svg>
          100%
        </span>
        <span style={{ opacity: 0.6 }}>v2.0.0</span>
      </div>
    </div>
  );
};
