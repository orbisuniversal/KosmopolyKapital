import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

export const db = (databaseId && databaseId !== '(default)')
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export async function verifyFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission')) {
      return true;
    }
    return false;
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) {
      cleaned[k] = cleanUndefined(v);
    }
  }
  return cleaned as T;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`[Firestore ${operationType}] ${path || ''}:`, error);
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

/**
 * Cross-subdomain SSO: exchanges the shared .kosmovizion.app __session cookie
 * for a Firebase Custom Token when running under kosmovizion.app subdomains.
 */
export async function attemptEcosystemSSO(): Promise<boolean> {
  if (typeof window === 'undefined' || auth.currentUser) return false;
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith('kosmovizion.app') && host !== 'localhost') return false;

  const ssoUrl = host === 'localhost'
    ? 'http://localhost:3000/api/auth/sso'
    : 'https://kosmovizion.app/api/auth/sso';

  try {
    const res = await fetch(ssoUrl, { credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.authenticated && data.customToken) {
      await signInWithCustomToken(auth, data.customToken);
      return true;
    }
  } catch {
    // Non-blocking SSO fallback
  }
  return false;
}

export async function logoutUser() {
  await signOut(auth);
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('kosmovizion.app')) {
      fetch('https://kosmovizion.app/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    }
  }
}
