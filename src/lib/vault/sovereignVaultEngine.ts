/**
 * ARGUS Sovereign Vault & Cryptographic Secret Enclave
 * 
 * Zero-Knowledge Client-Side Enclave for:
 * 1. Payment Cards & Bank Accounts (Luhn Validated & Encrypted)
 * 2. Cloud API Keys (Stripe, OpenAI, GitHub, AWS, Firebase)
 * 3. Proprietary Source Code Licenses & IP Assets
 * 4. Passwords & Multi-Factor Seeds
 * 
 * Cryptographic Architecture:
 * - Key Derivation: PBKDF2 (100,000 iterations, SHA-256)
 * - Authenticated Encryption: AES-256-GCM (256-bit key, 96-bit IV)
 * - Auto-Lock: 5-minute inactivity lockdown
 * - Auto-Wipe: 30-second clipboard wipe timer
 */

import { isValidLuhn } from "../governance/codeFortress";

export type VaultCategory = "PAYMENT_CARD" | "API_KEY" | "PROPRIETARY_CODE" | "PASSWORD";

export interface VaultSecretItem {
  id: string;
  title: string;
  category: VaultCategory;
  secretValue: string;
  metadata?: Record<string, string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedVaultPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  version: number;
}

const STORAGE_KEY_VAULT = "argus_sovereign_vault_v1";
const STORAGE_KEY_VAULT_EXISTS = "argus_sovereign_vault_initialized_v1";

// ─── Cryptographic Primitives ───
async function deriveVaultKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptVaultData(items: VaultSecretItem[], passcode: string): Promise<EncryptedVaultPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passcode, salt);

  const enc = new TextEncoder();
  const plaintext = JSON.stringify(items);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    version: 1,
  };
}

async function decryptVaultData(payload: EncryptedVaultPayload, passcode: string): Promise<VaultSecretItem[]> {
  const salt = new Uint8Array(atob(payload.salt).split("").map((c) => c.charCodeAt(0)));
  const iv = new Uint8Array(atob(payload.iv).split("").map((c) => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(payload.ciphertext).split("").map((c) => c.charCodeAt(0)));

  const key = await deriveVaultKey(passcode, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}

// ─── Sovereign Vault Singleton Service ───
class SovereignVaultService {
  private unlockedItems: VaultSecretItem[] | null = null;
  private currentMasterPasscode: string | null = null;
  private lockTimeoutTimer: any = null;
  private listeners: Set<(isUnlocked: boolean, items: VaultSecretItem[]) => void> = new Set();

  public isVaultInitialized(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_VAULT_EXISTS) === "true";
  }

  public isUnlocked(): boolean {
    return this.unlockedItems !== null;
  }

  public subscribe(fn: (isUnlocked: boolean, items: VaultSecretItem[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.isUnlocked(), this.unlockedItems || []);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const unlocked = this.isUnlocked();
    const list = this.unlockedItems || [];
    this.listeners.forEach((fn) => fn(unlocked, list));
  }

  private resetInactivityTimer() {
    if (this.lockTimeoutTimer) clearTimeout(this.lockTimeoutTimer);
    // 5-minute auto-lock
    this.lockTimeoutTimer = setTimeout(() => {
      this.lockVault();
    }, 5 * 60 * 1000);
  }

  /**
   * Initialize a new vault with a master passcode
   */
  public async initializeVault(passcode: string): Promise<{ success: boolean; error?: string }> {
    if (!passcode || passcode.length < 6) {
      return { success: false, error: "Passcode must be at least 6 characters." };
    }

    try {
      const initialItems: VaultSecretItem[] = [
        {
          id: "sec_welcome_1",
          title: "Sovereign Master License Key",
          category: "PROPRIETARY_CODE",
          secretValue: "ARGUS-ENTERPRISE-SOVEREIGN-2026-ENCLAVE-ACTIVE",
          notes: "Proprietary ARGUS runtime authorization key. Stored in zero-knowledge AES-256 enclave.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const encrypted = await encryptVaultData(initialItems, passcode);
      localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(encrypted));
      localStorage.setItem(STORAGE_KEY_VAULT_EXISTS, "true");

      this.currentMasterPasscode = passcode;
      this.unlockedItems = initialItems;
      this.resetInactivityTimer();
      this.notify();

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to initialize vault." };
    }
  }

  /**
   * Unlock existing vault with master passcode
   */
  public async unlockVault(passcode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_VAULT);
      if (!raw) {
        return { success: false, error: "No vault found on this device." };
      }

      const payload: EncryptedVaultPayload = JSON.parse(raw);
      const decrypted = await decryptVaultData(payload, passcode);

      this.currentMasterPasscode = passcode;
      this.unlockedItems = decrypted;
      this.resetInactivityTimer();
      this.notify();

      return { success: true };
    } catch (err) {
      return { success: false, error: "Invalid master passcode. Decryption failed." };
    }
  }

  /**
   * Lock vault immediately
   */
  public lockVault() {
    this.unlockedItems = null;
    this.currentMasterPasscode = null;
    if (this.lockTimeoutTimer) clearTimeout(this.lockTimeoutTimer);
    this.notify();
  }

  /**
   * Add a new secret item
   */
  public async addSecret(item: Omit<VaultSecretItem, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; error?: string }> {
    if (!this.unlockedItems || !this.currentMasterPasscode) {
      return { success: false, error: "Vault is locked." };
    }

    if (item.category === "PAYMENT_CARD") {
      const clean = item.secretValue.replace(/\D/g, "");
      if (!isValidLuhn(clean)) {
        return { success: false, error: "Invalid credit card number (Failed Luhn Checksum)." };
      }
    }

    const newItem: VaultSecretItem = {
      ...item,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newItem, ...this.unlockedItems];
    const encrypted = await encryptVaultData(updatedList, this.currentMasterPasscode);
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(encrypted));

    this.unlockedItems = updatedList;
    this.resetInactivityTimer();
    this.notify();

    return { success: true };
  }

  /**
   * Delete a secret item
   */
  public async deleteSecret(id: string): Promise<{ success: boolean }> {
    if (!this.unlockedItems || !this.currentMasterPasscode) return { success: false };

    const filtered = this.unlockedItems.filter((i) => i.id !== id);
    const encrypted = await encryptVaultData(filtered, this.currentMasterPasscode);
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(encrypted));

    this.unlockedItems = filtered;
    this.resetInactivityTimer();
    this.notify();

    return { success: true };
  }

  /**
   * Copy secret to clipboard and auto-clear after 30 seconds
   */
  public async copySecretWithAutoClear(secretText: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(secretText);
      // Auto clear after 30 seconds
      setTimeout(async () => {
        try {
          const currentClip = await navigator.clipboard.readText();
          if (currentClip === secretText) {
            await navigator.clipboard.writeText("");
          }
        } catch {}
      }, 30000);
      return true;
    } catch {
      return false;
    }
  }

  public getItems(): VaultSecretItem[] {
    return this.unlockedItems || [];
  }
}

export const SovereignVault = new SovereignVaultService();
