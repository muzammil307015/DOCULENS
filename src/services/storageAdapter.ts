/**
 * DOCULENS Modular Storage & Persistence Adapter
 *
 * Implements a dual-mode persistence architecture:
 * 1. Authenticated Mode: Firebase Auth & Cloud Firestore with strict per-user UID isolation
 * 2. Guest Mode: In-browser local storage with explicit 24-hour expiry lifecycle
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
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

export interface ChatSessionRecord {
  id: string;
  userId: string;
  docId?: string;
  docTitle?: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StorageAdapter {
  isGuest: () => boolean;
  getCurrentUserId: () => string | null;
  getExpiryRemainingHours: () => number;

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

  saveChatSession: (session: ChatSessionRecord) => Promise<void>;
  getChatSessions: (docId?: string) => Promise<ChatSessionRecord[]>;
  deleteChatSession: (id: string) => Promise<void>;

  migrateGuestDataToUser: (uid: string) => Promise<void>;
  clearLocalGuestState: () => void;
}

const STORAGE_KEYS = {
  ANALYSES: `${APP_CONFIG.storageKeyPrefix}analyses`,
  PARSED_DOCS: `${APP_CONFIG.storageKeyPrefix}parsed_docs`,
  PROFILE: `${APP_CONFIG.storageKeyPrefix}user_profile`,
  EVIDENCE: `${APP_CONFIG.storageKeyPrefix}evidence_docs`,
  CHECKLISTS: `${APP_CONFIG.storageKeyPrefix}checklists`,
  MEMORY: `${APP_CONFIG.storageKeyPrefix}memory_entries`,
  CHAT_SESSIONS: `${APP_CONFIG.storageKeyPrefix}chat_sessions`,
  EXPIRY_TIMESTAMP: `${APP_CONFIG.storageKeyPrefix}guest_session_expires_at`,
};

class UnifiedStorageAdapter implements StorageAdapter {
  constructor() {
    this.ensureSessionExpiry();
  }

  isGuest(): boolean {
    return !auth.currentUser;
  }

  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  private ensureSessionExpiry() {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.EXPIRY_TIMESTAMP);
      if (!existing) {
        const expiresAt = Date.now() + APP_CONFIG.guestDataExpiryHours * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEYS.EXPIRY_TIMESTAMP, String(expiresAt));
      } else {
        const expiresAt = parseInt(existing, 10);
        if (Date.now() > expiresAt && !auth.currentUser) {
          this.clearLocalGuestState();
        }
      }
    } catch {
      // Storage unavailable fallback
    }
  }

  getExpiryRemainingHours(): number {
    if (auth.currentUser) return 999;
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.EXPIRY_TIMESTAMP);
      if (!existing) return APP_CONFIG.guestDataExpiryHours;
      const expiresAt = parseInt(existing, 10);
      const msRemaining = Math.max(0, expiresAt - Date.now());
      return Math.ceil(msRemaining / (1000 * 60 * 60));
    } catch {
      return APP_CONFIG.guestDataExpiryHours;
    }
  }

  clearLocalGuestState() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      const newExpiresAt = Date.now() + APP_CONFIG.guestDataExpiryHours * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEYS.EXPIRY_TIMESTAMP, String(newExpiresAt));
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // ANALYSES
  // -------------------------------------------------------------
  async saveAnalysis(analysis: FullDocumentAnalysis): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/analyses/${analysis.id}`;
      try {
        const record = {
          ...analysis,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid, "analyses", analysis.id), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    // Guest Mode
    const list = await this.getAnalyses();
    const filtered = list.filter(a => a.id !== analysis.id);
    filtered.unshift(analysis);
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filtered.slice(0, 30)));
    } catch {
      // Quota fallback
    }
  }

  async getAnalyses(): Promise<FullDocumentAnalysis[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/analyses`;
      try {
        const colRef = collection(db, "users", user.uid, "analyses");
        const snap = await getDocs(colRef);
        const list: FullDocumentAnalysis[] = [];
        snap.forEach(d => {
          list.push(d.data() as FullDocumentAnalysis);
        });
        // Sort descending by analyzedAt
        return list.sort((a, b) => (b.analyzedAt || "").localeCompare(a.analyzedAt || ""));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async getAnalysisById(id: string): Promise<FullDocumentAnalysis | null> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/analyses/${id}`;
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "analyses", id));
        if (snap.exists()) {
          return snap.data() as FullDocumentAnalysis;
        }
        // Fallback search by docId
        const all = await this.getAnalyses();
        return all.find(a => a.id === id || a.docId === id) || null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }

    const list = await this.getAnalyses();
    return list.find(a => a.id === id || a.docId === id) || null;
  }

  async deleteAnalysis(id: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/analyses/${id}`;
      try {
        await deleteDoc(doc(db, "users", user.uid, "analyses", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      return;
    }

    const list = await this.getAnalyses();
    const updated = list.filter(a => a.id !== id && a.docId !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // PARSED DOCUMENTS
  // -------------------------------------------------------------
  async saveParsedDocument(docData: ParsedDocumentData): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/documents/${docData.id}`;
      try {
        // Exclude huge raw buffer representations if any, store clean text & tables
        const record = {
          ...docData,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid, "documents", docData.id), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    const list = await this.getParsedDocuments();
    const filtered = list.filter(d => d.id !== docData.id);
    filtered.unshift(docData);
    try {
      localStorage.setItem(STORAGE_KEYS.PARSED_DOCS, JSON.stringify(filtered.slice(0, 20)));
    } catch {
      // ignore
    }
  }

  async getParsedDocuments(): Promise<ParsedDocumentData[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/documents`;
      try {
        const colRef = collection(db, "users", user.uid, "documents");
        const snap = await getDocs(colRef);
        const list: ParsedDocumentData[] = [];
        snap.forEach(d => {
          list.push(d.data() as ParsedDocumentData);
        });
        return list.sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PARSED_DOCS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // USER PROFILE
  // -------------------------------------------------------------
  async saveProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}`;
      try {
        const record = {
          ...profile,
          userId: user.uid,
          email: user.email || "",
          displayName: profile.displayName || user.displayName || "User",
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), record, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}`;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          return snap.data() as UserProfile;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------
  // EVIDENCE DOCUMENTS
  // -------------------------------------------------------------
  async saveEvidenceDocument(evidenceDoc: EvidenceDocument): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/evidence/${evidenceDoc.id}`;
      try {
        const record = {
          ...evidenceDoc,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid, "evidence", evidenceDoc.id), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    const list = await this.getEvidenceDocuments();
    const filtered = list.filter(d => d.id !== evidenceDoc.id);
    filtered.unshift(evidenceDoc);
    try {
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  async getEvidenceDocuments(): Promise<EvidenceDocument[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/evidence`;
      try {
        const colRef = collection(db, "users", user.uid, "evidence");
        const snap = await getDocs(colRef);
        const list: EvidenceDocument[] = [];
        snap.forEach(d => {
          list.push(d.data() as EvidenceDocument);
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async deleteEvidenceDocument(id: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/evidence/${id}`;
      try {
        await deleteDoc(doc(db, "users", user.uid, "evidence", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      return;
    }

    const list = await this.getEvidenceDocuments();
    try {
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(list.filter(d => d.id !== id)));
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // CHECKLISTS
  // -------------------------------------------------------------
  async saveChecklist(analysisId: string, items: ActionChecklistItem[]): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/checklists/${analysisId}`;
      try {
        await setDoc(doc(db, "users", user.uid, "checklists", analysisId), {
          analysisId,
          userId: user.uid,
          items,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
      const map = raw ? JSON.parse(raw) : {};
      map[analysisId] = items;
      localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  async getChecklist(analysisId: string): Promise<ActionChecklistItem[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/checklists/${analysisId}`;
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "checklists", analysisId));
        if (snap.exists()) {
          return snap.data().items || [];
        }
        return [];
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
      if (!raw) return [];
      const map = JSON.parse(raw);
      return map[analysisId] || [];
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // DOCUMENT MEMORY
  // -------------------------------------------------------------
  async saveMemoryItem(item: DocumentMemoryItem): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/memory/${item.id}`;
      try {
        await setDoc(doc(db, "users", user.uid, "memory", item.id), {
          ...item,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    const list = await this.getMemoryItems();
    const filtered = list.filter(m => m.id !== item.id);
    filtered.unshift(item);
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(filtered.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  async getMemoryItems(): Promise<DocumentMemoryItem[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/memory`;
      try {
        const colRef = collection(db, "users", user.uid, "memory");
        const snap = await getDocs(colRef);
        const list: DocumentMemoryItem[] = [];
        snap.forEach(d => {
          list.push(d.data() as DocumentMemoryItem);
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEMORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async deleteMemoryItem(id: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/memory/${id}`;
      try {
        await deleteDoc(doc(db, "users", user.uid, "memory", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      return;
    }

    const list = await this.getMemoryItems();
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(list.filter(m => m.id !== id)));
    } catch {
      // ignore
    }
  }

  async clearAllMemory(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const items = await this.getMemoryItems();
      for (const item of items) {
        await this.deleteMemoryItem(item.id);
      }
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.MEMORY);
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // CHAT & Q&A SESSIONS
  // -------------------------------------------------------------
  async saveChatSession(session: ChatSessionRecord): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/chat_sessions/${session.id}`;
      try {
        await setDoc(doc(db, "users", user.uid, "chat_sessions", session.id), {
          ...session,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      const list: ChatSessionRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [session, ...list.filter(s => s.id !== session.id)];
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(updated.slice(0, 30)));
    } catch {
      // ignore
    }
  }

  async getChatSessions(docId?: string): Promise<ChatSessionRecord[]> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/chat_sessions`;
      try {
        const colRef = collection(db, "users", user.uid, "chat_sessions");
        const snap = await getDocs(colRef);
        const list: ChatSessionRecord[] = [];
        snap.forEach(d => {
          const item = d.data() as ChatSessionRecord;
          if (!docId || item.docId === docId) {
            list.push(item);
          }
        });
        return list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      const list: ChatSessionRecord[] = raw ? JSON.parse(raw) : [];
      return docId ? list.filter(s => s.docId === docId) : list;
    } catch {
      return [];
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/chat_sessions/${id}`;
      try {
        await deleteDoc(doc(db, "users", user.uid, "chat_sessions", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (!raw) return;
      const list: ChatSessionRecord[] = JSON.parse(raw);
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(list.filter(s => s.id !== id)));
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------
  // GUEST DATA MIGRATION UPON SIGN IN
  // -------------------------------------------------------------
  async migrateGuestDataToUser(uid: string): Promise<void> {
    try {
      const rawAnalyses = localStorage.getItem(STORAGE_KEYS.ANALYSES);
      if (rawAnalyses) {
        const guestAnalyses: FullDocumentAnalysis[] = JSON.parse(rawAnalyses);
        for (const item of guestAnalyses) {
          await setDoc(doc(db, "users", uid, "analyses", item.id), {
            ...item,
            userId: uid,
          });
        }
      }

      const rawDocs = localStorage.getItem(STORAGE_KEYS.PARSED_DOCS);
      if (rawDocs) {
        const guestDocs: ParsedDocumentData[] = JSON.parse(rawDocs);
        for (const item of guestDocs) {
          await setDoc(doc(db, "users", uid, "documents", item.id), {
            ...item,
            userId: uid,
          });
        }
      }

      const rawEvidence = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
      if (rawEvidence) {
        const guestEvidence: EvidenceDocument[] = JSON.parse(rawEvidence);
        for (const item of guestEvidence) {
          await setDoc(doc(db, "users", uid, "evidence", item.id), {
            ...item,
            userId: uid,
          });
        }
      }

      // Clear local storage after successful cloud sync
      this.clearLocalGuestState();
    } catch (err) {
      console.warn("Guest data migration notice:", err);
    }
  }
}

// Singleton storage instance
export const storage: UnifiedStorageAdapter = new UnifiedStorageAdapter();
