/**
 * DOCULENS BYOK Encrypted Vault Service
 *
 * Implements client-side AES-GCM + PBKDF2 Web Crypto encryption.
 * Zero plaintext keys are ever stored anywhere in local storage, database, or logs.
 */

import { EncryptedVaultRecord } from "../types";

const VAULT_STORAGE_KEY = "doculens_encrypted_byok_vault";
const PBKDF2_ITERATIONS = 100000;

// Auto-lock timer management
let autoLockTimer: any = null;
let activeSessionDecryptedKey: { key: string; provider: string } | null = null;
let onLockCallbacks: (() => void)[] = [];

export function subscribeToVaultLock(cb: () => void) {
  onLockCallbacks.push(cb);
  return () => {
    onLockCallbacks = onLockCallbacks.filter(c => c !== cb);
  };
}

function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  // Auto lock after 10 minutes of inactivity
  autoLockTimer = setTimeout(() => {
    lockVault();
  }, 10 * 60 * 1000);
}

export function lockVault() {
  activeSessionDecryptedKey = null;
  if (autoLockTimer) clearTimeout(autoLockTimer);
  onLockCallbacks.forEach(cb => cb());
}

export function isVaultUnlocked(): boolean {
  return activeSessionDecryptedKey !== null;
}

export function getActiveSessionKey(): { key: string; provider: string } | null {
  resetAutoLock();
  return activeSessionDecryptedKey;
}

/**
 * Derives AES-GCM CryptoKey from user password using PBKDF2 and random salt
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts an API key with the user's master password
 */
export async function encryptAndSaveKey(
  apiKey: string,
  password: string,
  provider: "openrouter" | "gemini" = "openrouter"
): Promise<EncryptedVaultRecord> {
  if (!password || password.length < 6) {
    throw new Error("Vault password must be at least 6 characters.");
  }
  if (!apiKey || apiKey.trim().length < 8) {
    throw new Error("Invalid API key format.");
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(apiKey.trim())
  );

  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const saltBase64 = btoa(String.fromCharCode(...salt));

  // Masked key display: e.g. "sk-or-v1-••••••••4a8f"
  const cleanKey = apiKey.trim();
  const prefix = cleanKey.slice(0, 6);
  const suffix = cleanKey.slice(-4);
  const maskedKey = `${prefix}••••••••${suffix}`;

  const record: EncryptedVaultRecord = {
    ciphertextBase64,
    ivBase64,
    saltBase64,
    iterations: PBKDF2_ITERATIONS,
    updatedAt: new Date().toISOString(),
    maskedKey,
    provider,
  };

  // Save ONLY ciphertext and crypto parameters, never plaintext or password
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(record));

  // Keep in session memory briefly
  activeSessionDecryptedKey = { key: apiKey.trim(), provider };
  resetAutoLock();

  return record;
}

/**
 * Unlocks the vault using the user's password
 */
export async function unlockVault(password: string): Promise<string> {
  const stored = getEncryptedVaultRecord();
  if (!stored) {
    throw new Error("No encrypted key found in vault.");
  }

  try {
    const salt = Uint8Array.from(atob(stored.saltBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(stored.ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(stored.ciphertextBase64), c => c.charCodeAt(0));

    const key = await deriveKey(password, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const decryptedKey = new TextDecoder().decode(decryptedBuffer);
    activeSessionDecryptedKey = { key: decryptedKey, provider: stored.provider };
    resetAutoLock();
    return decryptedKey;
  } catch (err) {
    throw new Error("Incorrect vault password. Decryption failed.");
  }
}

export function getEncryptedVaultRecord(): EncryptedVaultRecord | null {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteVaultKey(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
  lockVault();
}
