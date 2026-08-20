import React, { useState, useEffect } from "react";
import styles from "./Taskbar.module.css";

/* ─── SVG Icon Library ─── */
const Icons = {
  start: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor" />
      <circle cx="8" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16" cy="11" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="18" rx="3" fill="currentColor" />
      <polyline points="6,9 10,12 6,15" fill="none" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="18" y2="15" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  explorer: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6C2 4.9 2.9 4 4 4h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z" fill="currentColor" />
      <rect x="2" y="9" width="20" height="11" rx="1" fill="currentColor" opacity="0.85" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="18" height="20" rx="3" fill="currentColor" />
      <rect x="5.5" y="4.5" width="13" height="4" rx="1" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="12" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="16" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="7.5" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="12" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
      <circle cx="16.5" cy="20" r="1.2" fill="var(--bg-desktop, #0a0b10)" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="currentColor" />
      <line x1="6" y1="8" x2="18" y2="8" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="16" x2="14" y2="16" stroke="var(--bg-desktop, #0a0b10)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  photos: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="currentColor" />
      <circle cx="8" cy="10" r="2.5" fill="var(--bg-desktop, #0a0b10)" />
      <path d="M22 16l-5.5-6L12 15l-3-3-7 5v3a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-1z" fill="currentColor" opacity="0.7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColo