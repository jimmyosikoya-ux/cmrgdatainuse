import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Firestore,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific firestoreDatabaseId per documentation
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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

/**
 * Validates connection to Firestore via getDocFromServer
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      connected: true,
      latencyMs: Date.now() - startTime,
      message: 'Cloud Firestore connected and live'
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
      return { connected: false, latencyMs: latency, message: 'Client offline or network unreachable' };
    }
    // If permission denied or missing document, the connection still successfully reached Firestore!
    return {
      connected: true,
      latencyMs: latency,
      message: 'Cloud Firestore reachable'
    };
  }
}

export interface CMRGUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'enumerator' | 'analyst';
  assigned_district: string;
  device_id: string;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(uid: string): Promise<CMRGUserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as CMRGUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: Partial<CMRGUserProfile> & { id: string; email: string }): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const isOwnerOrAdmin = profile.email === 'simeonjrpictures123@gmail.com' || profile.email === 'dammyblack88@gmail.com';
    const fallbackRole = isOwnerOrAdmin ? 'admin' : (profile.role || 'enumerator');
    
    await setDoc(doc(db, 'users', profile.id), {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || profile.email.split('@')[0],
      role: fallbackRole,
      assigned_district: profile.assigned_district || 'Harare Central & Manicaland',
      device_id: profile.device_id || `device-${Math.random().toString(36).substring(2, 9)}`,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      await saveUserProfile({
        id: user.uid,
        email: user.email || '',
        full_name: user.displayName || 'CMRG Research Officer',
        role: (user.email === 'simeonjrpictures123@gmail.com' || user.email === 'dammyblack88@gmail.com') ? 'admin' : 'supervisor'
      });
      profile = await getUserProfile(user.uid);
    }
    return { user, profile };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function logInWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    await saveUserProfile({
      id: cred.user.uid,
      email: cred.user.email || email,
      full_name: email.split('@')[0],
      role: email === 'simeonjrpictures123@gmail.com' ? 'admin' : 'enumerator'
    });
    profile = await getUserProfile(cred.user.uid);
  }
  return { user: cred.user, profile };
}

export async function signUpWithEmail(email: string, pass: string, fullName: string, role: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await saveUserProfile({
    id: cred.user.uid,
    email: cred.user.email || email,
    full_name: fullName,
    role: (email === 'simeonjrpictures123@gmail.com' ? 'admin' : (role.toLowerCase() as any)) || 'enumerator'
  });
  const profile = await getUserProfile(cred.user.uid);
  return { user: cred.user, profile };
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function sendEmailVerificationToUser() {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
}

export async function signOutUser() {
  return signOut(auth);
}
