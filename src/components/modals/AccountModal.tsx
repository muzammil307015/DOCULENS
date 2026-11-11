/**
 * DOCULENS Account & Authentication Modal
 * Integrates Firebase Auth (Email/Password & Google Sign-In) with per-user data isolation.
 */

import React from "react";
import { X, LogOut, Shield, User, Mail } from "lucide-react";
import { AuthView } from "../auth/AuthView";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { storage } from "../../services/storageAdapter";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthStateChange?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onAuthStateChange,
}) => {
  if (!isOpen) return null;

  const currentUser = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      storage.clearLocalGuestState();
      if (onAuthStateChange) onAuthStateChange();
      onClose();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0B0D12] border border-[#2B3142] p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252A38] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#182333] border border-slate-700 text-[#E5C158] font-mono font-bold text-xs">
              DL
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                {currentUser ? "Account & Cloud Sync" : "Authentication & Access"}
              </h3>
              <p className="text-[11px] text-slate-400">Firebase Auth & Zero-Trust Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#141822] border border-[#1E2838] space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-12 w-12 rounded-full border border-[#E5C158]/50 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#1F2737] border border-[#E5C158]/40 flex items-center justify-center text-[#E5C158] font-mono font-bold text-base">
                    {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white">
                    {currentUser.displayName || "Authenticated User"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail className="h-3 w-3" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    UID: {currentUser.uid.slice(0, 12)}...
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0E1119] border border-[#1E2838] space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-[#E5C158] font-semibold">
                <Shield className="h-4 w-4" />
                <span>Private Cloud Persistence Active</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Your RFP analyses, evidence vault documents, extracted requirements, and chat histories are saved to your private Firestore database collection (<code className="text-[#E5C158]">/users/{currentUser.uid}/*</code>).
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#252A38]">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-xs font-bold text-red-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn-gold-imperial px-4 py-2 rounded-xl text-xs font-bold"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <AuthView
            initialMode="signin"
            isModal={true}
            onSuccess={() => {
              if (onAuthStateChange) onAuthStateChange();
              onClose();
            }}
            onContinueAsGuest={onClose}
          />
        )}
      </div>
    </div>
  );
};
