import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
console.log("[KOSMOPOLY] Initializing Firebase app with Project ID:", firebaseConfig.projectId);
// Database initialization logic
const databaseId = firebaseConfig.firestoreDatabaseId;
console.log("[KOSMOPOLY] Targeting Database:", databaseId);

// Strictly follow standard SDK initialization for (default) vs named databases
export const db = (databaseId && databaseId !== '(default)')
  ? getFirestore(app, databaseId)
  : getFirestore(app);

console.log("[KOSMOPOLY] Firestore initialized successfully for project", firebaseConfig.projectId);

// Connectivity check helper
export async function verifyFirestoreConnection() {
  try {
    console.log("[KOSMOPOLY] Testing connection to Firestore database:", firebaseConfig.firestoreDatabaseId || '(default)');
    // We try to fetch a dummy doc from server to force networking
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log("[KOSMOPOLY] Connection test passed (doc may not exist, but no error thrown).");
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('permission')) {
       console.warn("[KOSMOPOLY] Connection test permission denied (expected if rules are tight).");
       return true; // Still connected
    }
    console.error("[KOSMOPOLY] Connection test failed:", error);
    return false;
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard login popup trigger
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error logging in with Google: ', error);
    throw error;
  }
}

// Sign out trigger
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out: ', error);
    throw error;
  }
}

// Error wrapping requirements for standard diagnoses
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }

  // Preserve complex objects/Firestore sentinels like serverTimestamp() or references
  const proto = Object.getPrototypeOf(obj);
  const isPlainObject = proto === null || proto === Object.prototype;
  
  if (!isPlainObject) {
    return obj;
  }
  
  const temp: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      temp[key] = cleanUndefined(val);
    }
  }
  return temp;
}

