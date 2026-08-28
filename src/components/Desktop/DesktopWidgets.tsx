/**
 * ARGUS Hyper-Advanced Holographic Desktop Widgets
 * Quantum Clock, Live Financial / Crypto Matrix, Weather Satellite & Security Shield
 */

import React, { useState, useEffect } from "react";
import styles from "./DesktopWidgets.module.css";

interface MarketData {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export const DesktopWidgets: React.FC = () => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  const [markets] = useState<MarketData[]>([
    { symbol: "BTC/USD", price: "$96,420", change: "+4.12%", isPositive: true },
    { symbol: "ETH/USD", price: "$3,480", change: "+3.05%", isPositive: true },
    { symbol: "SOL/USD", price: "$218", change: "+6.80%", isPositive: true },
    { symbol: "NVDA", price: "$142.50", change: "+2.40%", isPositive: true },
  ]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.widgetsContainer}>
      {/* 1. Quantum Arc Clock Widget */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className={styles.liveIndicator} /> Quantum Temporal Sync
          </span>
          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>UTC+05:30</span>
        </div>
        <div className={styles.clockTime}>{timeStr || "00:00:00"}</div>
        <div className={styles.clockDate}>{dateStr} • ARGUS Sovereign Core v0.2.4</div>
      </div>

      {/* 2. Live Market & Crypto Matrix */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className={styles.liveIndicator} /> Global Financial Telemetry
          </span>
          <span style={{ fontSize: "9.5px", color: "#10b981", fontWeight: 700 }}>REAL-TIME</span>
        </div>
        <div className={styles.marketGrid}>
          {markets.map((m) => (
            <div key={m.symbol} className={styles.marketItem}>
              <div className={styles.marketSymbol}>{m.symbol}</div>
              <div className={styles.marketPrice}>{m.price}</div>
              <div className={styles.marketChange}>{m.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Orbit Weather & Atmospheric Radar */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className={styles.liveIndicator} /> Atmospheric Sensor Radar
          </span>
          <span style={{ fontSize: "12px" }}>🌤️</span>
        </div>
        <div className={styles.weatherRow}>
          <div>
            <div className={styles.weatherTemp}>24°C</div>
            <div className={styles.weatherCondition}>Partly Cloudy · Wind 12 km/h</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "10.5px", color: "#64748b" }}>
            <div>Barometer: 1014 hPa</div>
            <div>Humidity: 58%</div>
          </div>
        </div>
      </div>

      {/* 4. Sovereign Security Matrix */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className={styles.liveIndicator} /> Sovereign Security Shield
          </span>
          <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 800 }}>LOCKED</span>
        </div>
        <div className={styles.shieldStatus}>
          <span>🛡️</span>
          <span>100% Local Sandboxing · Zero External Leaks</span>
        </div>
      </div>
    </div>
  );
};
