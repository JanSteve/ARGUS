import React, { useState } from "react";
import styles from "./StartMenu.module.css";

/* ─── SVG Icons for Start Menu ─── */
const Icons = {
  chat: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1.5" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="3" width="20" height="18" rx="3" />
      <polyline points="6,9 10,12 6,15" fill="none" stroke="#0a0b10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="18" y2="15" stroke="#0a0b10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  explorer: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 6C2 4.9 2.9 4 4 4h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="2" width="18" height="20" rx="3" />
      <rect x="5.5" y="4.5" width="13" height="4" rx="1" fill="#0a0b10" />
      <circle cx="7.5" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="12" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="16.5" cy="12" r="1.2" fill="#0a0b10" />
      <circle cx="7.5" cy="16" r="1.2" fill="#0a0b10" />
      <circle cx="12" cy="16" r="1.2" fill="#0a0b10" />
      <circle cx="16.5" cy="16" r="1.2" fill="#0a0b10" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <line x1="6" y1="8" x2="18" y2="8" stroke="#0a0b10" strokeWidth="1.5" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="#0a0b10" strokeWidth="1.5" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  ),
  photos: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <circle cx="8" cy="10" r="2.5" fill="#0a0b10" />
      <path d="M22 16l-5.5-6L12 15l-3-3-7 5v3a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-1z" opacity="0.7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" stroke