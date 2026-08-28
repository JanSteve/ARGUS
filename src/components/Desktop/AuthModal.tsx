import React, { useState, useEffect } from "react";
import styles from "./AuthModal.module.css";
import {
  getClerkUserState,
  openClerkSignIn,
  openClerkSignUp,
  signOutOfClerk,
  ClerkUserState,
  sendFounderLeadAlert,
  Analytics,
} from "../../lib/cloud";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [userState, setUserState] = useState<ClerkUserState>({
    isSignedIn: false,
    userId: null,
    email: null,
    fullName: "Guest User",
    imageUrl: null,
    role: "community",
  });

  useEffect(() => {
    if (isOpen) {
      getClerkUserState().then((state) => setUserState(state));
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    Analytics.trackEvent("clerk_signin_clicked");
    await openClerkSignIn();
    onClose();
  };

  const handleSignUp = async () => {
    Analytics.trackEvent("clerk_signup_clicked");
    await openClerkSignUp();
    sendFounderLeadAlert({
      action: "New Clerk Sign-Up Triggered",
      timestamp: new Date().toISOString(),
      page: window.location.href,
    });
    onClose();
  };

  const handleSignOut = async () => {
    await signOutOfClerk();
    setUserState({
      isSignedIn: false,
      userId: null,
      email: null,
      fullName: "Guest User",
      imageUrl: null,
      role: "community",
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.header}>
          <div className={styles.logoBadge}>🛡️</div>
          <div className={styles.title}>ARGUS SOVEREIGN IDENTITY</div>
          <div className={styles.desc}>
            Enterprise Authentication & Encrypted Sync powered by Clerk & Supabase.
          </div>
        </div>

        <div className={styles.clerkBox}>
          {userState.isSignedIn ? (
            <div className={styles.userCard}>
              <div className={styles.userMeta}>
                {userState.imageUrl ? (
                  <img src={userState.imageUrl} alt="Avatar" className={styles.userAvatar} />
                ) : (
                  <div className={styles.userAvatar} style={{ background: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    👤
                  </div>
                )}
                <div>
                  <div className={styles.userName}>{userState.fullName}</div>
                  <div className={styles.userEmail}>{userState.email}</div>
                </div>
              </div>
              <button
                className={styles.secondaryAuthBtn}
                style={{ width: "auto", padding: "6px 12px", color: "#ef4444" }}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button className={styles.primaryAuthBtn} onClick={handleSignIn}>
                <span>⚡ Sign In with Clerk</span>
              </button>
              <button className={styles.secondaryAuthBtn} onClick={handleSignUp}>
                <span>✨ Create Free Sovereign Account</span>
              </button>
            </>
          )}
        </div>

        <div className={styles.footerNote}>
          🔒 100% Zero Token Leakage • JWT Protected via Clerk & Cloudflare Edge
        </div>
      </div>
    </div>
  );
};
