import React, { useState, useEffect } from "react";
import styles from "./TaskManagerApp.module.css";

interface ProcessItem {
  id: number;
  name: string;
  category: "System" | "Apps" | "AI Engine" | "Background";
  cpu: number;
  memory: number; // MB
  status: "Running" | "Idle" | "Suspended";
  iconColor: string;
}

const INITIAL_PROCESSES: ProcessItem[] = [
  { id: 101, name: "ARGUS Kernel Core", category: "System", cpu: 1.2, memory: 142, status: "Running", iconColor: "#3b82f6" },
  { id: 102, name: "Neural Inference Bridge", category: "AI Engine", cpu: 4.8, memory: 410, status: "Running", iconColor: "#8b5cf6" },
  { id: 103, name: "Desktop Window Compositor", category: "System", cpu: 2.1, memory: 185, status: "Running", iconColor: "#06b6d4" },
  { id: 104, name: "Voice & Speech Engine", category: "AI Engine", cpu: 0.4, memory: 88, status: "Idle", iconColor: "#10b981" },
  { id: 105, name: "ARGUS Browser Tab Host", category: "Apps", cpu: 3.5, memory: 320, status: "Running", iconColor: "#6366f1" },
  { id: 106, name: "Web Audio Synthesizer", category: "System", cpu: 0.2, memory: 45, status: "Idle", iconColor: "#f59e0b" },
  { id: 107, name: "Weather Radar Service", category: "Background", cpu: 0.1, memory: 38, status: "Idle", iconColor: "#38bdf8" },
  { id: 108, name: "App Store Skill Resolver", category: "Background", cpu: 0.0, memory: 52, status: "Idle", iconColor: "#ec4899" },
  { id: 109, name: "File System Indexer", category: "System", cpu: 0.6, memory: 94, status: "Running", iconColor: "#d97706" },
];

export const TaskManagerApp: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>(INITIAL_PROCESSES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "apps" | "ai">("all");
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(2.8);

  // Dynamic system jitter simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProcesses((prev) =>
        prev.map((proc) => {
          if (proc.status === "Suspended") return proc;
          const cpuJitter = Math.max(0, Number((proc.cpu + (Math.random() * 0.8 - 0.4)).toFixed(1)));
          return { ...proc, cpu: cpuJitter };
        })
      );

      setCpuUsage((prev) => Math.min(95, Math.max(5, Math.floor(prev + (Math.random() * 8 - 4)))));
      setRamUsage((prev) => Math.min(16, Math.max(1.8, Number((prev + (Math.random() * 0.2 - 0.1)).toFixed(2)))));
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const handleEndTask = () => {
    if (selectedId === null) return;
    setProcesses((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, status: "Suspended", cpu: 0 } : p))
    );
  };

  const filteredProcesses = processes.filter((p) => {
    if (activeTab === "apps") return p.category === "Apps";
    if (activeTab === "ai") return p.category === "AI Engine";
    return true;
  });

  const selectedProcess = processes.find((p) => p.id === selectedId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#3b82f6">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          <h2 className={styles.title}>System Task Manager</h2>
        </div>
      </div>

      <div className={styles.tabRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Processes ({processes.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "ai" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          Neural & AI Engines
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "apps" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("apps")}
        >
          Applications
        </button>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>CPU Utilization</span>
          <span className={styles.metricValue}>{cpuUsage}%</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${cpuUsage}%`,
                background: cpuUsage > 75 ? "#ef4444" : "#3b82f6",
              }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Memory In Use</span>
          <span className={styles.metricValue}>{ramUsage} GB / 16 GB</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${(ramUsage / 16) * 100}%`,
                background: "#8b5cf6",
              }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Sovereign Storage</span>
          <span className={styles.metricValue}>142.4 GB Free</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "32%", background: "#10b981" }} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Neural Throughput</span>
          <span className={styles.metricValue}>42.6 tps</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "68%", background: "#06b6d4" }} />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.processTable}>
          <thead>
            <tr>
              <th>Process Name</th>
              <th>Status</th>
              <th>CPU %</th>
              <th>Memory</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.map((proc) => (
              <tr
                key={proc.id}
                className={`${styles.processRow} ${selectedId === proc.id ? styles.selectedRow : ""}`}
                onClick={() => setSelectedId(proc.id)}
              >
                <td>
                  <div className={styles.processName}>
                    <div
                      className={styles.processIcon}
                      style={{ background: `${proc.iconColor}25`, color: proc.iconColor }}
                    >
                      {proc.name.charAt(0)}
                    </div>
                    {proc.name}
                  </div>
                </td>
                <td>
                  <span
                    className={`${styles.statusPill} ${
                      proc.status === "Running"
                        ? styles.statusRunning
                        : styles.statusIdle
                    }`}
                  >
                    {proc.status}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{proc.cpu}%</td>
                <td>{proc.memory} MB</td>
                <td style={{ color: "#94a3b8" }}>{proc.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerInfo}>
          {selectedProcess
            ? `Selected PID ${selectedProcess.id}: ${selectedProcess.name} (${selectedProcess.memory} MB)`
            : "Select a process to inspect or terminate"}
        </span>
        <button
          className={styles.endTaskBtn}
          disabled={selectedId === null || selectedProcess?.status === "Suspended"}
          onClick={handleEndTask}
        >
          End Process
        </button>
      </div>
    </div>
  );
};
