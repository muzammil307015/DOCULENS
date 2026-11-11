/**
 * DOCULENS Firebase Client Configuration
 * Provisions Firebase Authentication (Email/Password & Google Sign-In)
 * and Cloud Firestore with strict user data isolation.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App as a singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication instance with local browser persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Failed to set Firebase Auth local persistence:", err);
});

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Cloud Firestore instance configured with the applet's database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot to verify client connectivity
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client appears offline. Check network connectivity.");
    }
    return false;
  }
}
testFirestoreConnection();

/**
 * Standardized Firestore error diagnostic handler conforming to SKILL.md specification
 */
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
