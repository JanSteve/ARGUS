/**
 * ARGUS Sovereign OS — Firebase Backend Integration
 * 
 * Project ID: argus-ai-2e7ba
 * Services: Firebase Authentication (Google Sign-In, Email/Password) & Cloud Firestore
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";

// Firebase Web App Configuration for Project argus-ai-2e7ba
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyArgusSovereignDefaultPlaceholderKey2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "argus-ai-2e7ba.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "argus-ai-2e7ba",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "argus-ai-2e7ba.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "367303031024",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:367303031024:web:argus_sovereign_os",
};

// Safe Singleton Initializer
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export interface ArgusUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "founder" | "pro_member" | "community";
  lastLoginAt: any;
  createdAt?: any;
}

export interface LeadDocument {
  fullName: string;
  officialEmail: string;
  organization: string;
  details: string;
  createdAt: any;
  status: "NEW" | "CONTACTED" | "QUALIFIED";
}

/**
 * 1. Google 1-Click Sign-In
 */
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await recordUserLogin(user);
    return { user };
  } catch (err: any) {
    console.warn("Google Sign-In fallback/notice:", err);
    return { user: null, error: err?.message || "Google authentication failed" };
  }
}

/**
 * 2. Email & Password Sign-In
 */
export async function signInWithEmail(email: string, pass: string): Promise<{ user: User | null; error?: string }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    await recordUserLogin(user);
    return { user };
  } catch (err: any) {
    return { user: null, error: err?.message || "Email authentication failed" };
  }
}

/**
 * 3. Email & Password Registration
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ user: User | null; error?: string }> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    await recordUserLogin(user, displayName);
    return { user };
  } catch (err: any) {
    return { user: null, error: err?.message || "Account creation failed" };
  }
}

/**
 * 4. Sign Out
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * 5. Auth State Listener
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Record/Update User Profile in Firestore
 */
async function recordUserLogin(user: User, customName?: string): Promise<void> {
  try {
    const userRef = doc(db, "users", user.uid);
    const isFounder =
      user.email === "stevedaniel2004@gmail.com" || user.email === "contact.stevedaniel@gmail.com";

    const profileData: Partial<ArgusUserProfile> = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || customName || "Sovereign User",
      photoURL: user.photoURL,
      role: isFounder ? "founder" : "pro_member",
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(userRef, profileData, { merge: true });
  } catch (e) {
    console.warn("Could not sync user profile to Firestore (may be offline):", e);
  }
}

/**
 * 6. Save Enterprise/Investor Lead to Firestore
 */
export async function saveLeadToFirestore(data: {
  fullName: string;
  officialEmail: string;
  organization: string;
  details: string;
}): Promise<{ id: string; success: boolean }> {
  try {
    const leadsCollection = collection(db, "leads");
    const docRef = await addDoc(leadsCollection, {
      ...data,
      createdAt: serverTimestamp(),
      status: "NEW",
    });
    return { id: docRef.id, success: true };
  } catch (err) {
    console.warn("Could not save lead to Firestore:", err);
    return { id: "local_cache_" + Date.now(), success: false };
  }
}

/**
 * 7. Save Autonomous Mission / Task Outcome to Firestore
 */
export async function saveMissionToFirestore(missionData: {
  missionId: string;
  title: string;
  status: "COMPLETED" | "BLOCKED" | "IN_PROGRESS";
  actionsInspected: number;
  highRiskIntercepted: number;
  evidenceCount: number;
  summary: string;
}): Promise<{ success: boolean }> {
  try {
    const missionRef = doc(db, "missions", missionData.missionId);
    await setDoc(
      missionRef,
      {
        ...missionData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err) {
    console.warn("Could not save mission to Firestore:", err);
    return { success: false };
  }
}

/**
 * 8. Log Runtime Telemetry Event to Firestore
 */
export async function logTelemetryToFirestore(event: {
  eventType: string;
  agentId?: string;
  actionType?: string;
  status?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const telemetryCol = collection(db, "telemetry");
    await addDoc(telemetryCol, {
      ...event,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    // Graceful silent fallback
  }
}
