/**
 * ARGUS Sovereign OS — Sovereign Vault & Payment Armor Application
 * 
 * Zero-Knowledge Client-Side Enclave powered by AES-256-GCM
 */

import React, { useState, useEffect } from "react";
import styles from "./SovereignVaultApp.module.css";
import {
  SovereignVault,
  VaultSecretItem,
  VaultCategory,
} from "../../lib/vault/sovereignVaultEngine";
import { playNotificationSound } from "../../lib/soundEffects";

export const SovereignVaultApp: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [items, setItems] = useState<VaultSecretItem[]>([]);
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategory, setActiveCategory] = useState<VaultCategory | "ALL">("ALL");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // New Secret Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<VaultCategory>("PAYMENT_CARD");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const unsub = SovereignVault.subscribe((unlocked, list) => {
      setIsUnlocked(unlocked);
      setItems(list);
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleUnlockOrSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!passcode) return;

    if (!SovereignVault.isVaultInitialized()) {
      const res = await SovereignVault.initializeVault(passcode);
      if (res.success) {
        playNotificationSound();
        showToast("Sovereign Vault Initialized with AES-256-GCM");
        setPasscode("");
      } else {
        setErrorMsg(res.error || "Initialization failed");
      }
    } else {
      const res = await SovereignVault.unlockVault(passcode);
      if (res.success) {
        playNotificationSound();
        showToast("Sovereign Enclave Unlocked");
        setPasscode("");
      } else {
        setErrorMsg(res.error || "Incorrect Master Passcode");
      }
    }
  };

  const handleLock = () => {
    SovereignVault.lockVault();
    showToast("Vault Locked. Memory Wiped.");
  };

  const toggleVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySecret = async (secret: string, title: string) => {
    const copied = await SovereignVault.copySecretWithAutoClear(secret);
    if (copied) {
      playNotificationSound();
      showToast(`Copied "${title}" (Auto-clearing in 30s)`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this secret from your encrypted enclave?")) {
      await SovereignVault.deleteSecret(id);
      showToast("Secret Deleted");
    }
  };

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSecretValue) return;

    const res = await SovereignVault.addSecret({
      title: newTitle,
      category: newCategory,
      secretValue: newSecretValue,
      notes: newNotes,
    });

    if (res.success) {
      playNotificationSound();
      showToast(`Added "${newTitle}" to Sovereign Vault`);
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewSecretValue("");
      setNewNotes("");
    } else {
      alert(res.error || "Failed to add secret.");
    }
  };

  const filteredItems = activeCategory === "ALL" ? items : items.filter((i) => i.category === activeCategory);

  // ─── Locked State Screen ───
  if (!isUnlocked) {
    const isFirstTime = !SovereignVault.isVaultInitialized();
    return (
      <div className={styles.lockOverlay}>
        <div className={styles.lockCard}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔐</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", margin: 0 }}>
            {isFirstTime ? "Set Up Sovereign Vault" : "Sovereign Enclave Locked"}
          </h2>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            {isFirstTime
              ? "Create a Master Passcode to initialize your zero-knowledge AES-256-GCM encrypted vault."
              : "Enter your Master Passcode to decrypt credit cards, API keys, and proprietary code assets."}
          </p>

          <form onSubmit={handleUnlockOrSetup} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <input
              type="password"
              className={styles.passcodeInput}
              placeholder="••••••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
            />

            {errorMsg && <div style={{ color: "#f87171", fontSize: "12px" }}>⚠️ {errorMsg}</div>}

            <button type="submit" className={styles.actionBtn} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              <span>{isFirstTime ? "Create Master Enclave" : "🔓 Decrypt & Access Vault"}</span>
            </button>
          </form>

          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "10px" }}>
            🔒 <strong>Zero-Cloud Guarantee:</strong> All credentials are encrypted locally with PBKDF2 (100k rounds) & AES-256-GCM.
          </div>
        </div>
      </div>
    );
  }

  // ─── Unlocked Vault Management View ───
  return (
    <div className={styles.vaultContainer}>
      {/* Top Header */}
      <div className={styles.vaultHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.vaultIconBadge}>🔐</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>ARGUS Sovereign Secret Vault</div>
            <div style={{ fontSize: "11px", color: "#34d399" }}>
              ✓ AES-256-GCM Zero-Knowledge Enclave Active • 5m Auto-Lock
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={() => setIsAddModalOpen(true)}>
            <span>+ New Secret / Card</span>
          </button>
          <button className={`${styles.actionBtn} ${styles.lockBtn}`} onClick={handleLock}>
            <span>🔒 Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className={styles.categoryBar}>
        {(["ALL", "PAYMENT_CARD", "API_KEY", "PROPRIETARY_CODE", "PASSWORD"] as const).map((cat) => {
          const labels: Record<string, string> = {
            ALL: `All Items (${items.length})`,
            PAYMENT_CARD: `💳 Cards (${items.filter((i) => i.category === "PAYMENT_CARD").length})`,
            API_KEY: `🔑 API Keys (${items.filter((i) => i.category === "API_KEY").length})`,
            PROPRIETARY_CODE: `📁 Code Licenses (${items.filter((i) => i.category === "PROPRIETARY_CODE").length})`,
            PASSWORD: `🔒 Passwords (${items.filter((i) => i.category === "PASSWORD").length})`,
          };

          return (
            <button
              key={cat}
              className={`${styles.categoryTab} ${activeCategory === cat ? styles.categoryTabActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {labels[cat]}
            </button>
          );
        })}
      </div>

      {/* Secrets Grid */}
      <div className={styles.vaultContent}>
        {toastMessage && (
          <div style={{ background: "#0071e3", color: "#fff", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            ⚡ {toastMessage}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🛡️</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>No Secrets in this Category</div>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>Click "+ New Secret / Card" above to add encrypted items.</p>
          </div>
        ) : (
          <div className={styles.secretsGrid}>
            {filteredItems.map((item) => {
              const isVisible = !!visibleSecrets[item.id];
              const tagClass =
                item.category === "PAYMENT_CARD"
                  ? styles.tagPayment
                  : item.category === "API_KEY"
                  ? styles.tagApiKey
                  : item.category === "PROPRIETARY_CODE"
                  ? styles.tagCode
                  : styles.tagPassword;

              return (
                <div key={item.id} className={styles.secretCard}>
                  <div className={styles.secretCardHeader}>
                    <strong style={{ fontSize: "14px", color: "#fff" }}>{item.title}</strong>
                    <span className={`${styles.secretCategoryTag} ${tagClass}`}>{item.category.replace("_", " ")}</span>
                  </div>

                  <div className={styles.secretValueBox}>
                    <span>
                      {isVisible
                        ? item.secretValue
                        : item.category === "PAYMENT_CARD"
                        ? `••••-••••-••••-${item.secretValue.replace(/\D/g, "").slice(-4) || "0000"}`
                        : "••••••••••••••••••••••••"}
                    </span>
                    <div className={styles.secretActions}>
                      <button className={styles.iconBtn} onClick={() => toggleVisibility(item.id)} title={isVisible ? "Mask" : "Unmask"}>
                        {isVisible ? "🙈 Hide" : "👁️ Show"}
                      </button>
                      <button className={styles.iconBtn} onClick={() => handleCopySecret(item.secretValue, item.title)} title="Copy Secret (30s wipe)">
                        📋 Copy
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(item.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>

                  {item.notes && <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>{item.notes}</div>}

                  <div style={{ fontSize: "10px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>Encrypted AES-GCM</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Secret Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "24px", maxWidth: "460px", width: "90%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Add Encrypted Secret to Enclave</h3>
              <button style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }} onClick={() => setIsAddModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSecret} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as VaultCategory)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "8px", padding: "8px 10px", marginTop: "4px" }}
                >
                  <option value="PAYMENT_CARD">💳 Payment Card (Luhn Checked)</option>
                  <option value="API_KEY">🔑 Cloud API Key (Stripe / OpenAI / AWS)</option>
                  <option value="PROPRIETARY_CODE">📁 Proprietary Code License / IP</option>
                  <option value="PASSWORD">🔒 Password / MFA Seed</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>SECRET TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Stripe Key / Visa Debit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "8px", padding: "8px 10px", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>SECRET VALUE (ENCRYPTED AT REST)</label>
                <textarea
                  rows={3}
                  placeholder={newCategory === "PAYMENT_CARD" ? "4532 0150 0000 0000" : "sec_key_••••••••••••••••"}
                  value={newSecretValue}
                  onChange={(e) => setNewSecretValue(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#38bdf8", fontFamily: "var(--font-mono, monospace)", borderRadius: "8px", padding: "8px 10px", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>NOTES & CONTEXT (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. Production billing backend"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "8px", padding: "8px 10px", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#cbd5e1", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className={styles.actionBtn}>
                  <span>🔒 Encrypt & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
