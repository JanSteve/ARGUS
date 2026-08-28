/**
 * ARGUS AI Workspaces & Startup Hub
 * Autonomous Project Manager, Startup Roadmap & Problem-Solving Studio
 */

import React, { useState, useEffect } from "react";
import styles from "./WorkspacesApp.module.css";
import { speakVoice } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";
import { isProOrEnterprise, getActiveLicense } from "../../lib/licensing/licenseManager";

interface RoadmapTask {
  id: string;
  title: string;
  category: string;
  status: "todo" | "in_progress" | "completed";
  impact: string;
}

const DEFAULT_TASKS: RoadmapTask[] = [
  {
    id: "1",
    title: "Deploy Multi-Tier British Neural Voice Engine",
    category: "Voice AI",
    status: "completed",
    impact: "High ROI",
  },
  {
    id: "2",
    title: "Build Mobile Phone Remote Access Bridge for iPhone/Android",
    category: "Mobile",
    status: "completed",
    impact: "Viral Reach",
  },
  {
    id: "3",
    title: "Launch Autonomous Growth & Viral Marketing Agents",
    category: "Marketing",
    status: "in_progress",
    impact: "User Growth",
  },
  {
    id: "4",
    title: "Execute Product Hunt & Hacker News Global Launch",
    category: "Distribution",
    status: "in_progress",
    impact: "10k+ Signups",
  },
  {
    id: "5",
    title: "Reach ₹1 Crore Startup Milestone & Pre-Seed Angel Round",
    category: "Finances",
    status: "in_progress",
    impact: "₹1 Crore Goal",
  },
  {
    id: "6",
    title: "Launch SaaS Pro Subscription Tier (₹1,499/mo / $19/mo)",
    category: "SaaS",
    status: "completed",
    impact: "Revenue Model",
  },
];

export const WorkspacesApp: React.FC = () => {
  const [tasks, setTasks] = useState<RoadmapTask[]>(DEFAULT_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(isProOrEnterprise());
  }, []);

  const toggleTask = (id: string) => {
    playNotificationSound();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus =
            t.status === "todo"
              ? "in_progress"
              : t.status === "in_progress"
              ? "completed"
              : "todo";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (!isPro && tasks.length >= 8) {
      playNotificationSound();
      window.dispatchEvent(new CustomEvent("argus:voice-limit-reached"));
      speakVoice("Workspace limit reached on Community tier, sir. Upgrade to ARGUS Pro for unlimited multi-agent workspaces.");
      return;
    }

    playNotificationSound();
    const newTask: RoadmapTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: "Autonomous Task",
      status: "in_progress",
      impact: "High Value",
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    speakVoice(`Added task to sovereign workspace roadmap: ${newTask.title}`);
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>
            <span>⚡ AI Workspaces & Startup Hub</span>
          </div>
          <div className={styles.subtitle}>
            Autonomous execution board, milestone tracker, and enterprise roadmap
          </div>
        </div>

        <form onSubmit={handleAddTask} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new startup milestone or task..."
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#fff",
              fontSize: "12px",
              width: "240px",
            }}
          />
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add Task
          </button>
        </form>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>₹1 Crore</div>
          <div className={styles.statLabel}>Target Startup Goal</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{completedCount}</div>
          <div className={styles.statLabel}>Completed Milestones</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{inProgressCount}</div>
          <div className={styles.statLabel}>Active Campaigns</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{todoCount}</div>
          <div className={styles.statLabel}>Future Expansion</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className={styles.board}>
        {/* In Progress Column */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span>⚡ IN PROGRESS ({inProgressCount})</span>
          </div>
          {tasks
            .filter((t) => t.status === "in_progress")
            .map((task) => (
              <div
                key={task.id}
                className={styles.taskCard}
                onClick={() => toggleTask(task.id)}
                style={{ cursor: "pointer" }}
                title="Click to advance status"
              >
                <span className={styles.taskTag}>{task.category}</span>
                <span className={styles.taskTitle}>{task.title}</span>
                <span style={{ fontSize: "10px", color: "#38bdf8" }}>★ {task.impact}</span>
              </div>
            ))}
        </div>

        {/* Completed Column */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span>✓ COMPLETED ({completedCount})</span>
          </div>
          {tasks
            .filter((t) => t.status === "completed")
            .map((task) => (
              <div
                key={task.id}
                className={styles.taskCard}
                onClick={() => toggleTask(task.id)}
                style={{ cursor: "pointer" }}
                title="Click to cycle status"
              >
                <span className={styles.taskTag}>{task.category}</span>
                <span className={`${styles.taskTitle} ${styles.taskDone}`}>{task.title}</span>
                <span style={{ fontSize: "10px", color: "#10b981" }}>✓ Deployed to Production</span>
              </div>
            ))}
        </div>

        {/* To Do Column */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span>🎯 UPCOMING ({todoCount})</span>
          </div>
          {tasks
            .filter((t) => t.status === "todo")
            .map((task) => (
              <div
                key={task.id}
                className={styles.taskCard}
                onClick={() => toggleTask(task.id)}
                style={{ cursor: "pointer" }}
                title="Click to start task"
              >
                <span className={styles.taskTag}>{task.category}</span>
                <span className={styles.taskTitle}>{task.title}</span>
                <span style={{ fontSize: "10px", color: "#fbbf24" }}>⏱ {task.impact}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
