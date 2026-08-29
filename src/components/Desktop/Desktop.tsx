import React, { useState, useCallback, useEffect } from "react";
import styles from "./Desktop.module.css";
import { WindowFrame } from "./WindowFrame";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ContextMenu } from "./ContextMenu";
import { ControlPanel, WallpaperTheme } from "./ControlPanel";
import { ArgusVoiceHUD } from "./ArgusVoiceHUD";
import { AppErrorBoundary } from "./AppErrorBoundary";

/* ─── App Components ─── */
import { BrowserApp } from "../Apps/BrowserApp";
import { TerminalApp } from "../Apps/TerminalApp";
import { CalculatorApp } from "../Apps/CalculatorApp";
import { NotesApp } from "../Apps/NotesApp";
import { MusicPlayerApp } from "../Apps/MusicPlayerApp";
import { PhotosApp } from "../Apps/PhotosApp";
import { ChatApp } from "../Apps/ChatApp";
import { SettingsApp } from "../Apps/SettingsApp";
import { WeatherApp } from "../Apps/WeatherApp";
import { AppStoreApp } from "../Apps/AppStoreApp";
import { TaskManagerApp } from "../Apps/TaskManagerApp";
import { MarkdownStudioApp } from "../Apps/MarkdownStudioApp";
import { UpdateCenterApp } from "../Apps/UpdateCenterApp";
import { PhoneAccessApp } from "../Apps/PhoneAccessApp";
import { GrowthAgentApp } from "../Apps/GrowthAgentApp";
import { WorkspacesApp } from "../Apps/WorkspacesApp";
import { SaaSStoreApp } from "../Apps/SaaSStoreApp";
import { Game2048App } from "../Apps/Game2048App";
import { FocusMatrixApp } from "../Apps/FocusMatrixApp";
import { NeuralCanvasApp } from "../Apps/NeuralCanvasApp";
import { CodeStudioApp } from "../Apps/CodeStudioApp";
import { AgentSwarmApp } from "../Apps/AgentSwarmApp";
import { CyberGlobeApp } from "../Apps/CyberGlobeApp";
import { SecurityHubApp } from "../Apps/SecurityHubApp";
import { AutonomousRuntimeApp } from "../Apps/AutonomousRuntimeApp";
import { EnterpriseControlPlaneApp } from "../Apps/EnterpriseControlPlaneApp";
import { MissionControlApp } from "../Apps/MissionControlApp";
import { SovereignVaultApp } from "../Apps/SovereignVaultApp";
import { SpotlightBar } from "./SpotlightBar";
import { ArcMatrixHUD } from "./ArcMatrixHUD";
import { ProUpgradeModal } from "./ProUpgradeModal";
import { AuthModal } from "./AuthModal";
import { PermissionModal } from "./PermissionModal";
import { DesktopWidgets } from "./DesktopWidgets";
import { UpdateNotifier } from "./UpdateNotifier";
import { initializeStartupCloudInfrastructure } from "../../lib/cloud";
import {
  playWindowOpenSound,
  playWindowCloseSound,
  playSnapSound,
} from "../../lib/soundEffects";

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
  | "photos"
  | "weather"
  | "appstore"
  | "taskmanager"
  | "markdown"
  | "updater"
  | "phone"
  | "growth"
  | "workspaces"
  | "saas"
  | "game2048"
  | "focus"
  | "canvas"
  | "codestudio"
  | "swarm"
  | "cyberglobe"
  | "security"
  | "runtime"
  | "controlplane"
  | "mission"
  | "vault";

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
  weather: { width: 820, height: 540 },
  appstore: { width: 880, height: 580 },
  taskmanager: { width: 760, height: 500 },
  markdown: { width: 860, height: 560 },
  updater: { width: 700, height: 480 },
  phone: { width: 720, height: 500 },
  growth: { width: 880, height: 580 },
  workspaces: { width: 880, height: 560 },
  saas: { width: 900, height: 580 },
  game2048: { width: 440, height: 560 },
  focus: { width: 480, height: 520 },
  canvas: { width: 920, height: 600 },
  codestudio: { width: 960, height: 620 },
  swarm: { width: 900, height: 600 },
  cyberglobe: { width: 880, height: 560 },
  security: { width: 900, height: 600 },
  runtime: { width: 920, height: 600 },
  controlplane: { width: 940, height: 620 },
  mission: { width: 960, height: 620 },
  vault: { width: 840, height: 560 },
};

/* ─── Desktop Shortcuts Configuration ─── */
const DESKTOP_SHORTCUTS = [
  { id: "vault", name: "Sovereign Vault", icon: "vault" },
  { id: "mission", name: "Mission Control", icon: "mission" },
  { id: "controlplane", name: "AI Control Plane", icon: "controlplane" },
  { id: "runtime", name: "Autonomous Runtime", icon: "runtime" },
  { id: "security", name: "Security Center", icon: "security" },
  { id: "canvas", name: "Neural Canvas", icon: "canvas" },
  { id: "codestudio", name: "Code Studio", icon: "codestudio" },
  { id: "swarm", name: "Agent Swarm", icon: "swarm" },
  { id: "cyberglobe", name: "Cyber Globe", icon: "cyberglobe" },
  { id: "growth", name: "Growth Engine", icon: "growth" },
  { id: "workspaces", name: "AI Workspaces", icon: "workspaces" },
  { id: "focus", name: "Focus Matrix", icon: "focus" },
  { id: "game2048", name: "Cyber 2048", icon: "game2048" },
  { id: "saas", name: "SaaS Pro Store", icon: "saas" },
  { id: "browser", name: "Browser", icon: "browser" },
  { id: "terminal", name: "Terminal", icon: "terminal" },
  { id: "appstore", name: "App Store", icon: "appstore" },
  { id: "markdown", name: "Markdown Studio", icon: "markdown" },
  { id: "taskmanager", name: "Task Manager", icon: "taskmanager" },
  { id: "phone", name: "Phone Connect", icon: "phone" },
  { id: "weather", name: "Weather", icon: "weather" },
  { id: "explorer", name: "Files", icon: "explorer" },
  { id: "notes", name: "Notes", icon: "notes" },
  { id: "settings", name: "Settings", icon: "settings" },
];

/* ─── Desktop Shortcut SVG Icons ─── */
const ShortcutIcons: Record<string, React.ReactNode> = {
  mission: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-msn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-msn)" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="5" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="24" cy="24" r="2" fill="#fff" />
    </svg>
  ),
  controlplane: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-cp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-cp)" />
      <path d="M14 24h20M24 14v20M17 17l14 14M31 17L17 31" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  runtime: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-runtime" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-runtime)" />
      <path d="M24 10l12 7v14l-12 7-12-7V17l12-7z" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="4" fill="#38bdf8" />
    </svg>
  ),
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
  weather: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-weather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-weather)" />
      <circle cx="21" cy="21" r="7" fill="#fbbf24" />
      <path d="M22 28a7 7 0 0 1 12-4 5 5 0 0 1 2 9.9H20a6 6 0 0 1 2-5.9z" fill="rgba(255,255,255,0.9)" />
    </svg>
  ),
  appstore: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-appstore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-appstore)" />
      <path d="M16 16h16v18a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V16z" fill="rgba(255,255,255,0.9)" />
      <path d="M20 16V13a4 4 0 0 1 8 0v3" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
    </svg>
  ),
  markdown: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-markdown" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-markdown)" />
      <rect x="11" y="14" width="26" height="20" rx="3" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      <path d="M16 28V20l4 5 4-5v8M31 23l3 3m0 0l3-3m-3 3V20" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  taskmanager: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-taskman" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-taskman)" />
      <path d="M14 26l5-8 5 12 5-6h5" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  updater: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-updater" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-updater)" />
      <path d="M24 14v14m-5-5l5 5 5-5M15 32h18" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
  phone: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-phone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-phone)" />
      <rect x="16" y="10" width="16" height="28" rx="3" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2" />
      <circle cx="24" cy="33" r="1.5" fill="rgba(255,255,255,0.95)" />
      <line x1="21" y1="14" x2="27" y2="14" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  growth: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-growth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-growth)" />
      <path d="M12 34l8-8 6 6 12-14" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30 18 38 18 38 26" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  workspaces: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-workspaces" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-workspaces)" />
      <rect x="12" y="12" width="10" height="10" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="26" y="12" width="10" height="10" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="12" y="26" width="10" height="10" rx="2" fill="rgba(255,255,255,0.9)" />
      <rect x="26" y="26" width="10" height="10" rx="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  ),
  saas: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-saas" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-saas)" />
      <path d="M24 12v24M16 18h16M16 30h16" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
    </svg>
  ),
  game2048: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-2048" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-2048)" />
      <text x="24" y="30" fill="#ffffff" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">2048</text>
    </svg>
  ),
  focus: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-focus" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-focus)" />
      <circle cx="24" cy="24" r="12" fill="none" stroke="#ffffff" strokeWidth="2.5" />
      <polyline points="24,16 24,24 29,27" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  canvas: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-canvas" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-canvas)" />
      <circle cx="18" cy="18" r="5" fill="#fff" />
      <circle cx="30" cy="30" r="5" fill="#fff" />
      <circle cx="32" cy="16" r="3.5" fill="rgba(255,255,255,0.7)" />
      <line x1="18" y1="18" x2="30" y2="30" stroke="#fff" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="18" y1="18" x2="32" y2="16" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  codestudio: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-codestudio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-codestudio)" />
      <path d="M18 16l-7 8 7 8M30 16l7 8-7 8M26 13l-4 22" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  swarm: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-swarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-swarm)" />
      <circle cx="24" cy="18" r="4" fill="#fff" />
      <circle cx="16" cy="30" r="4" fill="#fff" />
      <circle cx="32" cy="30" r="4" fill="#fff" />
      <line x1="24" y1="18" x2="16" y2="30" stroke="#fff" strokeWidth="2" />
      <line x1="24" y1="18" x2="32" y2="30" stroke="#fff" strokeWidth="2" />
      <line x1="16" y1="30" x2="32" y2="30" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  cyberglobe: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-globe)" />
      <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="6" ry="13" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <line x1="11" y1="24" x2="37" y2="24" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <line x1="14" y1="17" x2="34" y2="17" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="14" y1="31" x2="34" y2="31" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-sec-hub" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-sec-hub)" />
      <path d="M24 11l12 5v9c0 8-6 13-12 15-6-2-12-7-12-15v-9l12-5z" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 24l3 3 6-6" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  vault: (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-vault" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ic-vault)" />
      <rect x="14" y="20" width="20" height="16" rx="4" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M18 20v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="27" r="2" fill="#fff" />
      <path d="M24 29v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* ─── Desktop Component ─── */
export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [topZIndex, setTopZIndex] = useState(10);
  const [wallpaper, setWallpaper] = useState<WallpaperTheme>("space");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapPreview | null>(null);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);

  // Initialize Startup Cloud Infrastructure on Desktop Load
  useEffect(() => {
    initializeStartupCloudInfrastructure();
  }, []);

  // Wire Auth Modal Event Listener
  useEffect(() => {
    const handleOpenAuth = () => setAuthModalOpen(true);
    window.addEventListener("argus:open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("argus:open-auth-modal", handleOpenAuth);
  }, []);

  // Global Cmd+K / Ctrl+K Spotlight Shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Wire Voice Limit / Pro Upgrade Event Listener
  useEffect(() => {
    const handleVoiceLimit = () => setProModalOpen(true);
    window.addEventListener("argus:voice-limit-reached", handleVoiceLimit);
    return () => window.removeEventListener("argus:voice-limit-reached", handleVoiceLimit);
  }, []);

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
      try {
        playWindowOpenSound();
      } catch {}
    },
    [windows, topZIndex, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    try {
      playWindowCloseSound();
    } catch {}
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
        try {
          playSnapSound();
        } catch {}
      } else if (x < 15) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, isMaximized: false, x: 0, y: 0, width: screenWidth / 2, height: screenHeight }
              : w
          )
        );
        try {
          playSnapSound();
        } catch {}
      } else if (x > screenWidth - 100) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, isMaximized: false, x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight }
              : w
          )
        );
        try {
          playSnapSound();
        } catch {}
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

  // Global Keyboard Shortcuts (Windows style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes menus
      if (e.key === "Escape") {
        setStartMenuOpen(false);
        setControlPanelOpen(false);
        setContextMenu(null);
      }
      // Alt + D toggles Show Desktop (minimizes all open windows)
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    { label: "Task Manager", icon: "taskmanager", onClick: () => launchApp("taskmanager", "Task Manager") },
    { label: "Check for Updates", icon: "updater", onClick: () => launchApp("updater", "Update Center") },
    { label: "File Explorer", icon: "explorer", onClick: () => launchApp("explorer", "File Explorer") },
    { label: "Terminal", icon: "terminal", onClick: () => launchApp("terminal", "Terminal") },
  ];

  // Wire slash command event bus → launchApp
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ app: string }>).detail;
      if (detail?.app) {
        const titleMap: Record<string, string> = {
          notes: "Notes",
          browser: "Browser",
          music: "Music Player",
          terminal: "Terminal",
          calculator: "Calculator",
          photos: "Photos",
          explorer: "File Explorer",
          settings: "Settings",
          weather: "Weather",
          appstore: "App Store",
          taskmanager: "Task Manager",
          markdown: "Markdown Studio",
          updater: "Update Center",
          phone: "Phone Connect",
          growth: "Growth Command Center",
          workspaces: "AI Workspaces",
          saas: "SaaS Pro Store",
          game2048: "Cyber 2048",
          focus: "Focus Matrix",
          canvas: "Neural Canvas",
          codestudio: "Code Studio",
          swarm: "Agent Swarm",
          cyberglobe: "Cyber Globe",
        };
        launchApp(detail.app, titleMap[detail.app] ?? detail.app);
      }
    };
    window.addEventListener("argus:launch", handler);
    return () => window.removeEventListener("argus:launch", handler);
  }, [launchApp]);

  // Wire event bus → open Control Panel (Action Center)
  useEffect(() => {
    const handler = () => setControlPanelOpen(true);
    window.addEventListener("argus:open-action-center", handler);
    return () => window.removeEventListener("argus:open-action-center", handler);
  }, []);

  // Render app content inside window frame safely wrapped in Error Boundary
  const renderAppContent = (component: AppComponent) => {
    const renderInner = () => {
      switch (component) {
        case "chat":
          return <ChatApp />;
        case "canvas":
          return <NeuralCanvasApp />;
        case "codestudio":
          return <CodeStudioApp />;
        case "swarm":
          return <AgentSwarmApp />;
        case "cyberglobe":
          return <CyberGlobeApp />;
        case "focus":
          return <FocusMatrixApp />;
        case "game2048":
          return <Game2048App />;
        case "growth":
          return <GrowthAgentApp />;
        case "workspaces":
          return <WorkspacesApp />;
        case "saas":
          return <SaaSStoreApp />;
        case "phone":
          return <PhoneAccessApp />;
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
        case "weather":
          return <WeatherApp />;
        case "appstore":
          return <AppStoreApp />;
        case "taskmanager":
          return <TaskManagerApp />;
        case "markdown":
          return <MarkdownStudioApp />;
        case "updater":
          return <UpdateCenterApp />;
        case "security":
          return <SecurityHubApp />;
        case "runtime":
          return <AutonomousRuntimeApp />;
        case "controlplane":
          return <EnterpriseControlPlaneApp />;
        case "mission":
          return <MissionControlApp />;
        case "vault":
          return <SovereignVaultApp />;
        default:
          return <div>Unknown App</div>;
      }
    };

    return (
      <AppErrorBoundary appName={component.toUpperCase()}>
        {renderInner()}
      </AppErrorBoundary>
    );
  };

  const isWindowActive = (winId: string) => {
    if (windows.length === 0) return false;
    const activeWin = windows.reduce((max, w) => (w.zIndex > max.zIndex ? w : max), windows[0]);
    return activeWin.id === winId;
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
              launchApp(shortcut.id, shortcut.name);
            }}
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
            isActive={isWindowActive(win.id)}
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

      {/* ctx */}
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

      {/* Universal Command Spotlight (Cmd+K / Ctrl+K) */}
      <SpotlightBar
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onLaunchApp={launchApp}
      />

      {/* ARGUS Holographic Voice HUD & Autonomous Wake-Word Engine */}
      <ArgusVoiceHUD onLaunchApp={launchApp} />

      {/* Iron Man Arc-Matrix Holographic Telemetry HUD */}
      <ArcMatrixHUD onLaunchApp={launchApp} />

      {/* Irresistible Pro Upgrade Holographic Modal */}
      <ProUpgradeModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        onOpenSaaSStore={() => launchApp("saas", "SaaS Pro Store")}
      />

      {/* Clerk Sovereign Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* ARGUS Sovereign Permission Kernel & AI Governance Modal */}
      <PermissionModal />

      {/* Hyper-Advanced VisionOS Desktop Holographic Widgets */}
      <DesktopWidgets />

      {/* Universal In-OS Auto-Update Notification Banner */}
      <UpdateNotifier />

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
   Built-in App Components
   Chat → src/components/Apps/ChatApp.tsx (real Ollama streaming)
   Settings → src/components/Apps/SettingsApp.tsx (real AI config)
   File Explorer → below (simulated in-memory filesystem — DOCUMENTED)
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── File Explorer App ─── */
type FSEntry = { name: string; type: "folder" | "file"; size?: string; children?: FSEntry[] };

const DEMO_FILESYSTEM: Record<string, FSEntry[]> = {
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

const FileExplorerApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState("/home/user");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const items = DEMO_FILESYSTEM[currentPath] || [];
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
    if (DEMO_FILESYSTEM[newPath]) {
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
                transition: "all 0.1s ease"
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
