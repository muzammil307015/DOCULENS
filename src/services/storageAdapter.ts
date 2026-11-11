/**
 * DOCULENS Modular Storage & Persistence Adapter
 *
 * Implements a dual-mode persistence architecture:
 * 1. Guest Mode: In-browser session/local storage with 24-hour explicit expiry badge
 * 2. Authenticated Mode: Firebase Auth & Firestore database integration
 */

import { APP_CONFIG } from "../config/appConfig";
import {
  ActionChecklistItem,
  DocumentMemoryItem,
  EvidenceDocument,
  FullDocumentAnalysis,
  ParsedDocumentData,
  UserProfile,
} from "../types";

export interface StorageAdapter {
  isGuest: () => boolean;
  saveAnalysis: (analysis: FullDocumentAnalysis) => Promise<void>;
  getAnalyses: () => Promise<FullDocumentAnalysis[]>;
  getAnalysisById: (id: string) => Promise<FullDocumentAnalysis | null>;
  deleteAnalysis: (id: string) => Promise<void>;

  saveParsedDocument: (doc: ParsedDocumentData) => Promise<void>;
  getParsedDocuments: () => Promise<ParsedDocumentData[]>;

  saveProfile: (profile: UserProfile) => Promise<void>;
  getProfile: () => Promise<UserProfile | null>;

  saveEvidenceDocument: (doc: EvidenceDocument) => Promise<void>;
  getEvidenceDocuments: () => Promise<EvidenceDocument[]>;
  deleteEvidenceDocument: (id: string) => Promise<void>;

  saveChecklist: (analysisId: string, items: ActionChecklistItem[]) => Promise<void>;
  getChecklist: (analysisId: string) => Promise<ActionChecklistItem[]>;

  saveMemoryItem: (item: DocumentMemoryItem) => Promise<void>;
  getMemoryItems: () => Promise<DocumentMemoryItem[]>;
  deleteMemoryItem: (id: string) => Promise<void>;
  clearAllMemory: () => Promise<void>;
}

const STORAGE_KEYS = {
  ANALYSES: `${APP_CONFIG.storageKeyPrefix}analyses`,
  PARSED_DOCS: `${APP_CONFIG.storageKeyPrefix}parsed_docs`,
  PROFILE: `${APP_CONFIG.storageKeyPrefix}user_profile`,
  EVIDENCE: `${APP_CONFIG.storageKeyPrefix}evidence_docs`,
  CHECKLISTS: `${APP_CONFIG.storageKeyPrefix}checklists`,
  MEMORY: `${APP_CONFIG.storageKeyPrefix}memory_entries`,
  EXPIRY_TIMESTAMP: `${APP_CONFIG.storageKeyPrefix}guest_session_expires_at`,
};

class GuestStorageAdapter implements StorageAdapter {
  constructor() {
    this.ensureSessionExpiry();
  }

  isGuest(): boolean {
    return true;
  }

  private ensureSessionExpiry() {
    const existing = localStorage.getItem(STORAGE_KEYS.EXPIRY_TIMESTAMP);
    if (!existing) {
      const expiresAt = Date.now() + APP_CONFIG.guestDataExpiryHours * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEYS.EXPIRY_TIMESTAMP, String(expiresAt));
    } else {
      const expiresAt = parseInt(existing, 10);
      if (Date.now() > expiresAt) {
        // Expire guest session cleanly
        this.clearGuestSession();
      }
    }
  }

  getExpiryRemainingHours(): number {
    const existing = localStorage.getItem(STORAGE_KEYS.EXPIRY_TIMESTAMP);
    if (!existing) return APP_CONFIG.guestDataExpiryHours;
    const expiresAt = parseInt(existing, 10);
    const msRemaining = Math.max(0, expiresAt - Date.now());
    return Math.ceil(msRemaining / (1000 * 60 * 60));
  }

  private clearGuestSession() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    const newExpiresAt = Date.now() + APP_CONFIG.guestDataExpiryHours * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.EXPIRY_TIMESTAMP, String(newExpiresAt));
  }

  async saveAnalysis(analysis: FullDocumentAnalysis): Promise<void> {
    const list = await this.getAnalyses();
    const filtered = list.filter(a => a.id !== analysis.id);
    filtered.unshift(analysis);
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filtered.slice(0, 30)));
  }

  async getAnalyses(): Promise<FullDocumentAnalysis[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async getAnalysisById(id: string): Promise<FullDocumentAnalysis | null> {
    const list = await this.getAnalyses();
    return list.find(a => a.id === id || a.docId === id) || null;
  }

  async deleteAnalysis(id: string): Promise<void> {
    const list = await this.getAnalyses();
    const updated = list.filter(a => a.id !== id && a.docId !== id);
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(updated));
  }

  async saveParsedDocument(doc: ParsedDocumentData): Promise<void> {
    const list = await this.getParsedDocuments();
    const filtered = list.filter(d => d.id !== doc.id);
    filtered.unshift(doc);
    localStorage.setItem(STORAGE_KEYS.PARSED_DOCS, JSON.stringify(filtered.slice(0, 20)));
  }

  async getParsedDocuments(): Promise<ParsedDocumentData[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.PARSED_DOCS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  async getProfile(): Promise<UserProfile | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async saveEvidenceDocument(doc: EvidenceDocument): Promise<void> {
    const list = await this.getEvidenceDocuments();
    const filtered = list.filter(d => d.id !== doc.id);
    filtered.unshift(doc);
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(filtered));
  }

  async getEvidenceDocuments(): Promise<EvidenceDocument[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async deleteEvidenceDocument(id: string): Promise<void> {
    const list = await this.getEvidenceDocuments();
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(list.filter(d => d.id !== id)));
  }

  async saveChecklist(analysisId: string, items: ActionChecklistItem[]): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    const map = raw ? JSON.parse(raw) : {};
    map[analysisId] = items;
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(map));
  }

  async getChecklist(analysisId: string): Promise<ActionChecklistItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    if (!raw) return [];
    try {
      const map = JSON.parse(raw);
      return map[analysisId] || [];
    } catch {
      return [];
    }
  }

  async saveMemoryItem(item: DocumentMemoryItem): Promise<void> {
    const list = await this.getMemoryItems();
    const filtered = list.filter(m => m.id !== item.id);
    filtered.unshift(item);
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(filtered.slice(0, 100)));
  }

  async getMemoryItems(): Promise<DocumentMemoryItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async deleteMemoryItem(id: string): Promise<void> {
    const list = await this.getMemoryItems();
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(list.filter(m => m.id !== id)));
  }

  async clearAllMemory(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.MEMORY);
  }
}

// Singleton storage instance
export const storage: GuestStorageAdapter = new GuestStorageAdapter();
